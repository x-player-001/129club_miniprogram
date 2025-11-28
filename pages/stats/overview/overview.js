// pages/stats/overview/overview.js
const app = getApp();
const statsAPI = require('../../../api/stats.js');
const seasonAPI = require('../../../api/season.js');
const achievementAPI = require('../../../api/achievement.js');
const config = require('../../../utils/config.js');

Page({
  data: {
    // 赛季选择相关
    showSeasonPicker: false,
    seasonOptions: [],
    selectedSeasonId: null, // null 表示"全部"，默认会设置为当前赛季
    currentSeasonName: '加载中...',

    // 用户信息
    userInfo: {},

    // 个人排名
    myRankings: {
      goals: null,      // 射手榜排名
      assists: null,    // 助攻榜排名
      attendance: null  // 出勤榜排名
    },

    // 整体数据
    overallStats: {
      totalMatches: 0,
      totalGoals: 0,
      totalAssists: 0,
      totalMVP: 0
    },

    // 我的数据
    myStats: {
      matches: 0,
      goals: 0,
      assists: 0,
      mvp: 0,
      winRate: 0,
      attendance: 0
    },

    // 队伍数据
    teamStats: {
      name: '',
      logo: '',
      color: '',
      matches: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      winRate: 0,
      goals: 0,
      goalsAgainst: 0
    },

    // 趋势数据（最近5场）
    recentMatches: [],

    // 数据趋势图
    trendData: [],

    // 成就徽章
    achievements: [],
    unlockedAchievementCount: 0, // 已解锁成就数量

    // 队内贡献
    contribution: {
      myGoals: 0,
      teamGoals: 0,
      goalsPercent: 0,
      myAssists: 0,
      teamAssists: 0,
      assistsPercent: 0
    },

    // 场均数据
    averageStats: {
      goalsPerMatch: '0.0',
      assistsPerMatch: '0.0',
      contributionPerMatch: '0.0'
    },

    // 图标URL
    icons: {
      dropdown: config.getIconUrl('dropdown.png'),
      check: config.getIconUrl('check.png'),
      arrowRight: config.getIconUrl('arrow-right.png'),
      match: config.getIconUrl('match.png'),
      goal: config.getIconUrl('goal.png'),
      assist: config.getIconUrl('assist.png'),
      star: config.getIconUrl('star.png')
    },
    // 图片URL
    images: {
      defaultAvatar: config.getImageUrl('default-avatar.png')
    }
  },

  onLoad(options) {
    // 加载用户信息
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo') || {
      id: '1',
      avatar: config.getImageUrl('default-avatar.png'),
      nickname: '张三',
      teamId: '1'
    };
    this.setData({ userInfo });

    // 加载赛季列表（会自动加载数据）
    this.loadAllSeasons();

    // 注意：loadOverviewData() 已经在 loadAllSeasons() 成功后调用
    // this.loadMockData(); // Mock数据已注释
  },

  onShow() {
    // 每次显示时刷新数据
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo') || {
      id: '1',
      avatar: config.getImageUrl('default-avatar.png'),
      nickname: '张三',
      teamId: '1'
    };
    this.setData({ userInfo });

    // 只有在赛季列表已加载完成后才刷新数据（避免首次进入时重复调用）
    if (this.data.seasonOptions.length > 0) {
      // 同步筛选框显示名称与选中的赛季ID
      const selectedOption = this.data.seasonOptions.find(s => s.id === this.data.selectedSeasonId);
      if (selectedOption && this.data.currentSeasonName !== selectedOption.name) {
        this.setData({ currentSeasonName: selectedOption.name });
      }
      this.loadOverviewData();
    }

    // 启动成就滚动
    this.startAchievementScroll();
  },

  onHide() {
    // 停止成就滚动
    this.stopAchievementScroll();
  },

  onUnload() {
    // 停止成就滚动
    this.stopAchievementScroll();
  },

  // 启动成就自动滚动
  startAchievementScroll() {
    this.stopAchievementScroll(); // 先清除旧的定时器

    this.scrollTimer = setInterval(() => {
      const query = wx.createSelectorQuery();
      query.select('.achievements-scroll').scrollOffset();
      query.select('.achievements-list').boundingClientRect();
      query.exec((res) => {
        if (res && res[0] && res[1]) {
          const scrollLeft = res[0].scrollLeft;
          const listWidth = res[1].width;
          const halfWidth = listWidth / 2;

          // 如果滚动到一半，重置到开始位置（无缝循环）
          if (scrollLeft >= halfWidth) {
            this.setData({ scrollLeft: 0 });
          } else {
            this.setData({ scrollLeft: scrollLeft + 2 });
          }
        }
      });
    }, 20); // 每20ms滚动2px，更快更流畅
  },

  // 停止成就自动滚动
  stopAchievementScroll() {
    if (this.scrollTimer) {
      clearInterval(this.scrollTimer);
      this.scrollTimer = null;
    }
  },

  // 触摸开始 - 暂停滚动
  onAchievementTouchStart() {
    this.stopAchievementScroll();
  },

  // 触摸结束 - 恢复滚动
  onAchievementTouchEnd() {
    setTimeout(() => {
      this.startAchievementScroll();
    }, 2000); // 2秒后恢复滚动
  },

  onPullDownRefresh() {
    this.loadOverviewData();
    wx.stopPullDownRefresh();
  },

  /**
   * 加载模拟数据
   */
  loadMockData() {
    // 模拟个人数据
    const myStats = {
      matches: 15,
      goals: 12,
      assists: 8,
      mvp: 3,
      winRate: 66.7,
      attendance: 93.3
    };

    const myStatsGrid = [
      { icon: config.getIconUrl('match.png'), iconClass: 'match-icon', value: 15, label: '参赛场次' },
      { icon: config.getIconUrl('goal.png'), iconClass: 'goal-icon', value: 12, label: '进球' },
      { icon: config.getIconUrl('assist.png'), iconClass: 'assist-icon', value: 8, label: '助攻' },
      { icon: config.getIconUrl('star.png'), iconClass: 'mvp-icon', value: 3, label: 'MVP' }
    ];

    // 模拟个人排名
    const myRankings = {
      goals: 2,
      assists: 3,
      attendance: 1
    };

    // 模拟整体数据
    const overallStatsGrid = [
      { icon: config.getIconUrl('match.png'), iconClass: 'match-icon', value: 18, label: '总比赛场次' },
      { icon: config.getIconUrl('goal.png'), iconClass: 'goal-icon', value: 95, label: '总进球数' },
      { icon: config.getIconUrl('assist.png'), iconClass: 'assist-icon', value: 95, label: '总助攻数' }
    ];

    // 模拟队伍数据
    const teamStats = {
      name: '嘉陵摩托',
      logo: config.getImageUrl('logoa.png'),
      color: '#f20810',
      matches: 18,
      wins: 12,
      draws: 3,
      losses: 3,
      winRate: 66.7,
      goals: 48,
      goalsAgainst: 32
    };

    const teamStatsBar = {
      wins: 12,
      draws: 3,
      losses: 3,
      totalMatches: 18,
      winRate: 66.7,
      goalsFor: 48,
      goalsAgainst: 32
    };

    // 模拟近期战绩(5场)
    const recentMatches = [
      { id: '5', date: '10/20', result: 'win', score: '5:3', opponent: '长江黄河', myGoals: 2, myAssists: 1, isMVP: true },
      { id: '4', date: '10/13', result: 'win', score: '4:2', opponent: '长江黄河', myGoals: 1, myAssists: 2, isMVP: false },
      { id: '3', date: '10/06', result: 'loss', score: '2:4', opponent: '长江黄河', myGoals: 0, myAssists: 1, isMVP: false },
      { id: '2', date: '9/29', result: 'win', score: '6:3', opponent: '长江黄河', myGoals: 3, myAssists: 0, isMVP: true },
      { id: '1', date: '9/22', result: 'draw', score: '3:3', opponent: '长江黄河', myGoals: 1, myAssists: 1, isMVP: false }
    ];

    // 计算成就
    const achievements = this.calculateAchievements(myStats, recentMatches);

    // 雷达图数据（6个维度，0-100分）
    const radarIndicators = ['进球', '助攻', '出勤', '胜率', 'MVP', '场次'];
    const radarData = [
      80,  // 进球能力：12球，假设满分15球
      75,  // 助攻能力：8助攻，假设满分10助攻
      93,  // 出勤率：93.3%
      67,  // 胜率：66.7%
      60,  // MVP：3次，假设满分5次
      83   // 场次：15场，假设满分18场
    ];

    this.setData({
      overallStatsGrid,
      myStats,
      myStatsGrid,
      myRankings,
      teamStats,
      teamStatsBar,
      recentMatches,
      achievements,
      radarIndicators,
      radarData
    });
  },

  // 加载总览数据
  loadOverviewData() {
    wx.showLoading({ title: '加载中...' });

    // 获取当前用户信息
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo') || this.data.userInfo;

    // 调用真实 API (传递赛季ID参数)
    const params = {};

    // 如果 selectedSeasonId 为 null，表示选择了"全部"
    if (this.data.selectedSeasonId === null) {
      // 查询全部数据
      params.filterType = 'all';
    } else if (this.data.selectedSeasonId) {
      // 查询特定赛季
      params.seasonId = this.data.selectedSeasonId;
      params.filterType = 'season';
    }
    // 如果 selectedSeasonId 是 undefined（初始状态），不传参数，后端会使用默认值（当前活跃赛季）

    console.log('Stats Overview API 请求参数:', params);

    return statsAPI.getOverview(params).then(res => {
      const data = res.data || {};

      // 处理整体统计
      const summary = data.summary || {};
      const overallStatsGrid = [
        { icon: config.getIconUrl('match.png'), iconClass: 'match-icon', value: summary.totalMatches || 0, label: '总比赛场次' },
        { icon: config.getIconUrl('goal.png'), iconClass: 'goal-icon', value: summary.totalGoals || 0, label: '总进球数' },
        { icon: config.getIconUrl('assist.png'), iconClass: 'assist-icon', value: summary.totalAssists || 0, label: '总助攻数' }
      ];

      // 处理个人数据（从API返回）
      const myStatsData = data.myStats || {};
      const myStats = {
        matches: myStatsData.matches || 0,
        goals: myStatsData.goals || 0,
        assists: myStatsData.assists || 0,
        mvp: myStatsData.mvp || 0,
        winRate: myStatsData.winRate || 0,
        attendance: myStatsData.attendance || 0
      };

      const myStatsGrid = [
        { icon: config.getIconUrl('match.png'), iconClass: 'match-icon', value: myStats.matches, label: '参赛场次' },
        { icon: config.getIconUrl('goal.png'), iconClass: 'goal-icon', value: myStats.goals, label: '进球' },
        { icon: config.getIconUrl('assist.png'), iconClass: 'assist-icon', value: myStats.assists, label: '助攻' },
        { icon: config.getIconUrl('star.png'), iconClass: 'mvp-icon', value: myStats.mvp, label: 'MVP' }
      ];

      // 处理队伍数据（从API返回统计，从userInfo获取基本信息）
      const teamStatsData = data.teamStats || {};
      const currentTeam = userInfo.currentTeam || {};

      const teamStats = {
        name: currentTeam.name || teamStatsData.name || '我的队伍',
        logo: config.getStaticUrl(currentTeam.logo || teamStatsData.logo, 'teamLogos') || config.getImageUrl('logoa.png'),
        color: currentTeam.color || teamStatsData.color || '#f20810',
        matches: teamStatsData.matchesPlayed || teamStatsData.matches || 0,
        wins: teamStatsData.wins || 0,
        draws: teamStatsData.draws || 0,
        losses: teamStatsData.losses || 0,
        winRate: teamStatsData.winRate || 0,
        goals: teamStatsData.goalsFor || teamStatsData.goals || 0,
        goalsAgainst: teamStatsData.goalsAgainst || 0
      };

      const teamStatsBar = {
        wins: teamStats.wins,
        draws: teamStats.draws,
        losses: teamStats.losses,
        totalMatches: teamStats.matches,
        winRate: teamStats.winRate,
        goalsFor: teamStats.goals,
        goalsAgainst: teamStats.goalsAgainst
      };

      // 处理个人排名数据
      const myRankings = {
        goals: data.myRanking?.goalsRank || null,
        assists: data.myRanking?.assistsRank || null,
        attendance: data.myRanking?.attendanceRank || null
      };

      // 处理近期战绩(增加个人表现)
      const recentMatches = (data.recentMatches || []).map(match => {
        // 优先使用 result 对象中的 finalScore，其次使用顶层的 team1Score/team2Score
        const team1Score = match.result?.team1FinalScore !== undefined
          ? match.result.team1FinalScore
          : (match.team1Score !== undefined ? match.team1Score : 0);
        const team2Score = match.result?.team2FinalScore !== undefined
          ? match.result.team2FinalScore
          : (match.team2Score !== undefined ? match.team2Score : 0);

        return {
          id: match.id,
          date: this.formatDate(match.matchDate || match.date),
          result: this.getMatchResult(match, userInfo.id),
          score: `${team1Score}:${team2Score}`,
          opponent: this.getOpponentName(match, userInfo.teamId),
          myGoals: match.myStats?.goals || 0,
          myAssists: match.myStats?.assists || 0,
          isMVP: (match.mvpUserIds || []).includes(userInfo.id)
        };
      });

      // 计算队内贡献
      const contribution = this.calculateContribution(myStats, teamStats);

      // 计算场均数据
      const averageStats = this.calculateAverageStats(myStats);

      // 加载成就数据（从API）
      this.loadAchievements();

      this.setData({
        overallStats: {
          totalMatches: summary.totalMatches || 0,
          totalGoals: summary.totalGoals || 0,
          totalAssists: summary.totalAssists || 0,
          totalMVP: 0
        },
        overallStatsGrid,
        myStats,
        myStatsGrid,
        myRankings,
        teamStats,
        teamStatsBar,
        recentMatches,
        contribution,
        averageStats
      });

      wx.hideLoading();
    }).catch(err => {
      console.error('加载数据总览失败:', err);
      wx.hideLoading();
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    });
  },

  // 切换筛选条件
  onFilterChange(e) {
    const filterType = e.currentTarget.dataset.type;
    this.setData({ filterType });
    this.loadOverviewData();
  },

  // filter-bar 组件变化事件
  onFilterBarChange(e) {
    const { optionId } = e.detail;
    this.setData({ filterType: optionId });
    this.loadOverviewData();
  },

  // 查看我的统计
  onViewMyStats() {
    wx.navigateTo({
      url: '/pages/user/stats/stats'
    });
  },

  // 查看队伍详情
  onViewTeamDetail() {
    wx.navigateTo({
      url: '/pages/team/detail/detail?id=1'
    });
  },

  /**
   * 点击比赛跳转详情
   */
  onMatchTap(e) {
    const matchId = e.currentTarget.dataset.id;
    if (matchId) {
      wx.navigateTo({
        url: `/pages/match/detail/detail?id=${matchId}`
      });
    }
  },

  /**
   * 格式化日期
   */
  formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
  },

  /**
   * 获取比赛结果
   */
  getMatchResult(match, userId) {
    // 根据用户所在队伍判断胜负
    const userTeamId = app.globalData.userInfo?.teamId;
    if (!match.result || !userTeamId) return 'draw';

    const team1Score = match.result.team1FinalScore !== undefined
      ? match.result.team1FinalScore
      : match.result.team1Goals || 0;
    const team2Score = match.result.team2FinalScore !== undefined
      ? match.result.team2FinalScore
      : match.result.team2Goals || 0;

    if (team1Score === team2Score) return 'draw';

    const isTeam1 = match.team1Id === userTeamId;
    const team1Win = team1Score > team2Score;

    if ((isTeam1 && team1Win) || (!isTeam1 && !team1Win)) {
      return 'win';
    } else {
      return 'loss';
    }
  },

  /**
   * 获取对手名称
   */
  getOpponentName(match, userTeamId) {
    if (!match.team1 || !match.team2) return '未知队伍';

    if (match.team1Id === userTeamId || match.team1.id === userTeamId) {
      return match.team2.name || match.team2Name || '队伍2';
    } else {
      return match.team1.name || match.team1Name || '队伍1';
    }
  },

  /**
   * 计算数据趋势
   */
  calculateTrend(recentMatches) {
    if (!recentMatches || recentMatches.length === 0) return [];

    // 找出最大值用于百分比计算
    const maxGoals = Math.max(...recentMatches.map(m => m.myGoals || 0), 1);
    const maxAssists = Math.max(...recentMatches.map(m => m.myAssists || 0), 1);
    const maxValue = Math.max(maxGoals, maxAssists, 3); // 最小为3

    return recentMatches.reverse().map((match, index) => ({
      label: `第${index + 1}场`,
      goals: match.myGoals || 0,
      assists: match.myAssists || 0,
      goalsPercent: Math.max((match.myGoals || 0) / maxValue * 100, 5), // 最小5%显示
      assistsPercent: Math.max((match.myAssists || 0) / maxValue * 100, 5)
    }));
  },

  /**
   * 根据成就代码获取 emoji 图标
   */
  getAchievementEmoji(code) {
    const emojiMap = {
      // 进球相关
      'FIRST_GOAL': '⚽',
      'HAT_TRICK': '🎩',
      'GOAL_MACHINE': '🔥',
      'SHARPSHOOTER': '🎯',
      'GOLDEN_BOOT': '👢',

      // 助攻相关
      'FIRST_ASSIST': '🤝',
      'ASSIST_KING': '👑',
      'PLAYMAKER': '🎨',

      // MVP相关
      'FIRST_MVP': '⭐',
      'MVP_COLLECTOR': '🌟',
      'SUPERSTAR': '💫',

      // 出勤相关
      'IRON_MAN': '💪',
      'FULL_ATTENDANCE': '📅',
      'DEDICATION': '🎖️',

      // 胜利相关
      'FIRST_WIN': '🎉',
      'WIN_STREAK': '🔥',
      'CHAMPION': '🏆',

      // 特殊成就
      'VERSATILE': '🌈',
      'TEAM_PLAYER': '👥',
      'LEGEND': '👑'
    };

    return emojiMap[code] || '🏆';
  },

  /**
   * 加载成就徽章（从API）
   */
  loadAchievements() {
    // 调用真实API获取成就进度
    const params = {};
    if (this.data.selectedSeasonId) {
      params.seasonId = this.data.selectedSeasonId;
    }

    achievementAPI.getMyProgress(params).then(res => {
      const achievementsData = res.data || [];

      // 转换成页面需要的格式（使用后端返回的图片路径）
      const achievements = achievementsData.map(ach => {
        // 优先使用后端返回的 icon，如果无效则使用 emoji 作为降级方案
        let icon = ach.icon || this.getAchievementEmoji(ach.code);

        // 判断是否为图片路径
        const isImageIcon = icon && (icon.includes('/') || icon.startsWith('http'));

        // 如果是相对路径（/static/images/xxx.png），转换为动态路径
        if (isImageIcon && icon.startsWith('/static/')) {
          // 提取文件名（如 hat-trick.png）
          const filename = icon.split('/').pop();
          icon = config.getImageUrl(filename);
        }

        return {
          id: ach.code || ach.id,
          icon: icon,
          isImageIcon: isImageIcon, // 添加图片标识
          name: ach.name || '',
          description: ach.unlockCount > 0
            ? `已解锁${ach.unlockCount}次`
            : (ach.description || '未解锁'),
          unlocked: ach.unlocked || false,
          unlockCount: ach.unlockCount || 0
        };
      });

      // 计算已解锁成就数量
      const unlockedAchievementCount = achievements.filter(ach => ach.unlocked).length;

      this.setData({
        achievements,
        unlockedAchievementCount
      });
    }).catch(err => {
      console.error('加载成就数据失败:', err);
      // 失败时使用空数组
      this.setData({
        achievements: [],
        unlockedAchievementCount: 0
      });
    });
  },

  /**
   * 计算队内贡献
   */
  calculateContribution(myStats, teamStats) {
    const myGoals = myStats.goals || 0;
    const myAssists = myStats.assists || 0;
    const teamGoals = teamStats.goalsFor || teamStats.goals || 0;
    const teamAssists = teamStats.assists || teamGoals; // 假设助攻数=进球数

    const goalsPercent = teamGoals > 0 ? Math.round((myGoals / teamGoals) * 100) : 0;
    const assistsPercent = teamAssists > 0 ? Math.round((myAssists / teamAssists) * 100) : 0;

    return {
      myGoals,
      teamGoals,
      goalsPercent: Math.min(goalsPercent, 100), // 最大100%
      myAssists,
      teamAssists,
      assistsPercent: Math.min(assistsPercent, 100)
    };
  },

  /**
   * 计算场均数据
   */
  calculateAverageStats(myStats) {
    const matches = myStats.matches || 0;
    if (matches === 0) {
      return {
        goalsPerMatch: '0.0',
        assistsPerMatch: '0.0',
        contributionPerMatch: '0.0'
      };
    }

    const goalsPerMatch = (myStats.goals / matches).toFixed(1);
    const assistsPerMatch = (myStats.assists / matches).toFixed(1);
    const contributionPerMatch = ((myStats.goals + myStats.assists) / matches).toFixed(1);

    return {
      goalsPerMatch,
      assistsPerMatch,
      contributionPerMatch
    };
  },

  /**
   * 加载所有赛季列表
   */
  loadAllSeasons() {
    seasonAPI.getList().then(res => {
      console.log('赛季列表API返回:', res);

      // 处理不同的数据结构
      let seasons = [];
      if (Array.isArray(res.data)) {
        seasons = res.data;
      } else if (res.data && Array.isArray(res.data.list)) {
        seasons = res.data.list;
      } else if (res.data && Array.isArray(res.data.seasons)) {
        seasons = res.data.seasons;
      }

      console.log('处理后的赛季列表:', seasons);

      // 找到当前活跃的赛季（status === 'active'）
      const activeSeason = seasons.find(s => s.status === 'active');

      // 添加"全部"选项
      const seasonOptions = [
        { id: null, name: '全部' },
        ...seasons.map(s => ({ id: s.id, name: s.name }))
      ];

      // 默认选中当前赛季
      const defaultSeasonId = activeSeason ? activeSeason.id : null;
      const defaultSeasonName = activeSeason ? activeSeason.name : '全部';

      console.log('默认赛季:', defaultSeasonName, defaultSeasonId);

      this.setData({
        seasonOptions,
        selectedSeasonId: defaultSeasonId,
        currentSeasonName: defaultSeasonName
      });

      // 加载默认赛季的数据
      this.loadOverviewData();
    }).catch(err => {
      console.error('加载赛季列表失败:', err);
      // 如果失败，设置为"全部"
      this.setData({
        seasonOptions: [{ id: null, name: '全部' }],
        selectedSeasonId: null,
        currentSeasonName: '全部'
      });
      // 仍然加载数据（全部）
      this.loadOverviewData();
    });
  },

  /**
   * 显示赛季选择器
   */
  onShowSeasonPicker() {
    this.setData({
      showSeasonPicker: true
    });
  },

  /**
   * 隐藏赛季选择器
   */
  onHideSeasonPicker() {
    this.setData({
      showSeasonPicker: false
    });
  },

  /**
   * 阻止弹窗内部点击冒泡
   */
  onPickerModalTap() {
    // 阻止事件冒泡，防止点击弹窗内部关闭弹窗
  },

  /**
   * 选择赛季
   */
  onSelectSeason(e) {
    const { id, name } = e.currentTarget.dataset;

    this.setData({
      selectedSeasonId: id,
      currentSeasonName: name,
      showSeasonPicker: false
    });

    // 重新加载数据
    this.loadOverviewData();
  }
});
