// pages/user/stats/stats.js
const app = getApp();
const statsAPI = require('../../../api/stats.js');
const userAPI = require('../../../api/user.js');

Page({
  data: {
    // 用户ID（从参数或全局获取）
    userId: '',
    isMyself: true, // 是否是自己

    // 用户基本信息
    userInfo: {
      realName: '',
      nickname: '',
      avatar: '',
      jerseyNumber: 0,
      leftFootSkill: 0,
      rightFootSkill: 0,
      teamName: ''
    },

    // 用户位置代码数组
    userPositionCodes: [],

    // 核心数据（4宫格）
    coreStats: [],

    // 次要数据（2列网格）
    secondaryStats: [],

    // 排名荣誉
    rankings: [],

    // 成就列表
    achievements: [],
    unlockedCount: 0, // 已解锁成就数量

    // 加载状态
    loading: false
  },

  onLoad(options) {
    // 获取用户ID
    const userId = options.id || app.globalData.userInfo?.id || '1';
    const myUserId = app.globalData.userInfo?.id || '1';

    this.setData({
      userId: userId,
      isMyself: userId === myUserId
    });

    this.loadUserStats();
  },

  onPullDownRefresh() {
    this.loadUserStats();
    wx.stopPullDownRefresh();
  },

  // 加载用户统计数据
  loadUserStats() {
    this.setData({ loading: true });
    wx.showLoading({ title: '加载中...' });

    // 调用真实 API
    return statsAPI.getPlayerStats(this.data.userId).then(res => {
      const data = res.data;

      // 处理用户信息
      const userInfo = {
        id: data.user?.id || this.data.userId,
        realName: data.user?.realName || '',
        nickname: data.user?.nickname || '',
        avatar: data.user?.avatar || '/static/images/default-avatar.png',
        jerseyNumber: data.user?.jerseyNumber || 0,
        leftFootSkill: data.user?.leftFootSkill || 0,
        rightFootSkill: data.user?.rightFootSkill || 0,
        teamName: data.user?.currentTeam?.name || ''
      };

      // 处理用户位置代码数组（后端直接返回数组）
      let userPositionCodes = data.user?.position || [];

      // 处理总体统计（数据在 stats 对象下）
      const stats = data.stats || {};
      const totalStats = {
        matches: stats.totalMatches || 0,
        goals: stats.totalGoals || 0,
        assists: stats.totalAssists || 0,
        mvp: stats.totalMVP || 0,
        wins: stats.totalWins || 0,
        draws: stats.totalDraws || 0,
        losses: stats.totalLosses || 0,
        winRate: stats.winRate || 0,
        attendance: stats.attendance || 0,
        yellowCards: stats.yellowCards || 0,
        redCards: stats.redCards || 0
      };

      // 核心数据（4宫格）
      const coreStats = [
        { icon: '/static/icons/match.png', value: totalStats.matches, label: '参赛', type: 'matches' },
        { icon: '/static/icons/goal.png', value: totalStats.goals, label: '进球', type: 'goals' },
        { icon: '/static/icons/assist.png', value: totalStats.assists, label: '助攻', type: 'assists' },
        { icon: '/static/icons/star.png', value: totalStats.mvp, label: 'MVP', type: 'mvp' }
      ];

      // 次要数据（2列网格，带进度条）
      const avgGoals = totalStats.matches > 0 ? (totalStats.goals / totalStats.matches).toFixed(1) : '0.0';
      const avgAssists = totalStats.matches > 0 ? (totalStats.assists / totalStats.matches).toFixed(1) : '0.0';

      const secondaryStats = [
        {
          label: '胜率',
          value: totalStats.winRate,
          unit: '%',
          percent: totalStats.winRate,
          color: '#27ae60',
          showProgress: true
        },
        {
          label: '出勤率',
          value: totalStats.attendance,
          unit: '%',
          percent: totalStats.attendance,
          color: '#3498db',
          showProgress: true
        },
        {
          label: '场均进球',
          value: avgGoals,
          unit: '',
          showProgress: false
        },
        {
          label: '场均助攻',
          value: avgAssists,
          unit: '',
          showProgress: false
        }
      ];

      // 处理排名荣誉
      const rankings = [];
      const myRankings = data.rankings || {};

      // 根据排名添加对应图标和奖牌类型
      if (myRankings.goals) {
        rankings.push({
          type: '射手榜',
          rank: myRankings.goals,
          icon: '⚽',
          medal: myRankings.goals <= 3 ? ['gold', 'silver', 'bronze'][myRankings.goals - 1] : ''
        });
      }

      if (myRankings.assists) {
        rankings.push({
          type: '助攻榜',
          rank: myRankings.assists,
          icon: '🎯',
          medal: myRankings.assists <= 3 ? ['gold', 'silver', 'bronze'][myRankings.assists - 1] : ''
        });
      }

      if (myRankings.mvp) {
        rankings.push({
          type: 'MVP榜',
          rank: myRankings.mvp,
          icon: '⭐',
          medal: myRankings.mvp <= 3 ? ['gold', 'silver', 'bronze'][myRankings.mvp - 1] : ''
        });
      }

      if (myRankings.attendance) {
        rankings.push({
          type: '出勤榜',
          rank: myRankings.attendance,
          icon: '📅',
          medal: myRankings.attendance <= 3 ? ['gold', 'silver', 'bronze'][myRankings.attendance - 1] : ''
        });
      }

      // 处理成就（复用数据总览页的emoji映射逻辑）
      const achievementsData = data.achievements || [];
      const achievements = achievementsData.map(ach => {
        const icon = ach.icon || this.getAchievementEmoji(ach.code);
        const isImageIcon = icon && (icon.includes('/') || icon.startsWith('http'));
        return {
          id: ach.code || ach.id,
          icon: icon,
          isImageIcon: isImageIcon,
          name: ach.name || '',
          unlocked: ach.unlocked || false
        };
      });
      const unlockedCount = achievements.filter(item => item.unlocked).length;

      console.log('准备设置数据:', {
        userInfo,
        userPositionCodes,
        coreStatsCount: coreStats.length,
        secondaryStatsCount: secondaryStats.length,
        rankingsCount: rankings.length,
        achievementsCount: achievements.length
      });

      this.setData({
        userInfo: userInfo,
        userPositionCodes: userPositionCodes,
        coreStats: coreStats,
        secondaryStats: secondaryStats,
        rankings: rankings,
        achievements: achievements,
        unlockedCount: unlockedCount,
        loading: false
      });

      wx.hideLoading();
    }).catch(err => {
      console.error('加载用户统计失败:', err);
      wx.hideLoading();
      this.setData({ loading: false });
      wx.showToast({
        title: err.message || '加载失败',
        icon: 'none'
      });
    });
  },

  // 获取成就emoji图标（复用数据总览页的映射逻辑）
  getAchievementEmoji(code) {
    const emojiMap = {
      'hat_trick': '🎩',
      'goal_scorer': '⚽',
      'goal_machine': '🔥',
      'sharp_shooter': '🎯',
      'assist_king': '👑',
      'playmaker': '🎨',
      'mvp_master': '⭐',
      'super_sub': '💪',
      'iron_man': '🛡️',
      'warrior': '⚔️',
      'clean_sheet': '🧤',
      'defender': '🛡️',
      'team_player': '🤝',
      'captain': '👑',
      'veteran': '🎖️',
      'newcomer': '🌟',
      'debut': '🎊',
      'century': '💯',
      'legend': '🏆',
      'champion': '🥇',
      'record_breaker': '📈',
      'speedster': '⚡',
      'dribbler': '🌪️',
      'passer': '🎯',
      'tackler': '💥'
    };
    return emojiMap[code] || '🏅';
  },

  // 位置标记点击事件
  onPositionMarkerTap(e) {
    const { position } = e.detail;
    wx.showToast({
      title: `位置: ${position.label}`,
      icon: 'none',
      duration: 1500
    });
  },

  // 统计项点击事件
  onStatTap(e) {
    const type = e.currentTarget.dataset.type;
    // 可以根据type跳转到对应详情页
    console.log('点击统计项:', type);
  }
});
