// pages/team/detail/detail.js
const app = getApp();
const teamAPI = require('../../../api/team.js');

Page({
  data: {
    teamId: '',
    teamInfo: {},
    teamStats: {},
    members: [],
    rankType: 'goals', // goals, assists, mvp
    rankingList: [],
    isCaptain: false,
    canEdit: false // 是否可以编辑（队长或管理员）
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ teamId: options.id });
      // 确保 app 初始化完成后再加载数据
      this.ensureAppReady().then(() => {
        this.loadTeamData();
      });
    }
  },

  // 确保 App 初始化完成
  ensureAppReady() {
    return new Promise((resolve) => {
      // 如果 app 已经初始化，直接resolve
      if (app.globalData && app.globalData.userInfo) {
        resolve();
        return;
      }

      // 否则等待一小段时间让 app.onLaunch 完成
      let checkCount = 0;
      const checkInterval = setInterval(() => {
        checkCount++;
        if (app.globalData && app.globalData.userInfo) {
          clearInterval(checkInterval);
          resolve();
        } else if (checkCount > 10) {
          // 最多等待 1 秒（10 * 100ms）
          clearInterval(checkInterval);
          console.warn('[Team Detail] App 初始化超时，继续加载');
          resolve();
        }
      }, 100);
    });
  },

  onPullDownRefresh() {
    this.loadTeamData().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 加载队伍数据
  loadTeamData() {
    wx.showLoading({ title: '加载中...' });

    // 只需要调用一个接口，teamInfo已经包含stats和members数据
    return this.loadTeamInfo().then(() => {
      wx.hideLoading();
    }).catch(err => {
      console.error('[Team Detail] 加载队伍数据失败:', err);
      console.error('[Team Detail] 错误详情:', JSON.stringify(err));
      wx.hideLoading();
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    });
  },

  // 加载队伍信息
  loadTeamInfo() {
    return teamAPI.getTeamDetail(this.data.teamId).then(res => {
      const teamInfo = res.data || {};

      // 获取用户信息 - 增加容错处理
      let userInfo = null;
      try {
        userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo') || {};
      } catch (err) {
        console.warn('[Team Detail] 获取用户信息失败:', err);
        userInfo = {};
      }

      // 判断是否是队长 - 增加安全检查
      const isCaptain = userInfo?.id && userInfo.id === teamInfo.captainId;
      // 判断是否是管理员 - 增加安全检查
      const isAdmin = userInfo?.role === 'super_admin';
      // 队长或管理员都可以编辑
      const canEdit = isCaptain || isAdmin;

      // 从teamInfo中提取stats数据（不再需要单独调用stats接口）
      const stats = teamInfo.stats || {};

      // 格式化战绩数据给 team-stats-bar 组件
      const teamStatsBarData = {
        wins: stats.wins || 0,
        draws: stats.draws || 0,
        losses: stats.losses || 0,
        totalMatches: stats.matchesPlayed || 0,
        winRate: stats.winRate || 0,
        goalsFor: stats.goalsFor || 0,
        goalsAgainst: stats.goalsAgainst || 0,
        goalDifference: (stats.goalsFor || 0) - (stats.goalsAgainst || 0)
      };

      // 处理队员数据（从 teamInfo.members 中提取）
      const members = teamInfo.members || [];
      const membersCardData = this.formatMembersData(members);

      this.setData({
        teamInfo: {
          ...teamInfo,
          captainName: teamInfo.captain?.realName || teamInfo.captain?.nickname || '未设置',
          colorDark: this.darkenColor(teamInfo.color || '#667eea')
        },
        teamStats: stats,
        teamStatsBarData: teamStatsBarData,
        members: members,
        membersCardData: membersCardData,
        isCaptain: isCaptain,
        canEdit: canEdit
      });

      // 加载队内排行榜（从队员数据中提取）
      this.updateRanking(members, this.data.rankType);

      // 更新导航栏标题
      wx.setNavigationBarTitle({
        title: teamInfo.name || '队伍详情'
      });
    });
  },

  // 格式化队员数据给 player-card 组件
  formatMembersData(members) {
    return members.map(member => {
      // 处理位置数据，兼容字符串和数组格式
      let position = member.user?.position || member.position || '';

      // 将位置数据统一转换为字符串数组
      let positionArray = [];

      if (Array.isArray(position)) {
        // 数组：["中场", "前锋"] 或 ["LB,RB,LW,RW"] 或 ["CM", "ST"]
        positionArray = position.flatMap(p => {
          // 如果数组元素包含逗号，先分割
          if (typeof p === 'string' && p.includes(',')) {
            return p.split(',').map(item => item.trim());
          }
          return [p];
        });
      } else if (typeof position === 'string') {
        // 字符串："中场,前锋" 或 "LB,RB,LW,RW"
        positionArray = position.split(',').map(p => p.trim());
      }

      // 转换为英文代码并过滤空值
      position = positionArray
        .map(p => this.convertPositionToCode(p))
        .filter(p => p)
        .join(',');

      return {
        id: member.userId || member.user?.id,
        realName: member.user?.realName,
        nickname: member.user?.nickname,
        avatar: member.user?.avatar || '/static/images/default-avatar.png',
        jerseyNumber: member.user?.jerseyNumber,
        position: position,
        isCaptain: member.role === 'captain',
        totalGoals: member.user?.stats?.goals || 0,
        totalAssists: member.user?.stats?.assists || 0,
        totalMatches: member.user?.stats?.matchesPlayed || 0,
        leftFootSkill: Number(member.user?.leftFootSkill || 0),
        rightFootSkill: Number(member.user?.rightFootSkill || 0)
      };
    });
  },

  // 转换位置为代码（支持中文和英文）
  convertPositionToCode(position) {
    if (!position) return '';

    // 如果已经是英文代码（2-3个大写字母），直接返回
    if (/^[A-Z]{2,3}$/.test(position)) {
      return position;
    }

    // 中文到英文代码的映射
    const positionMap = {
      // 守门员
      '门将': 'GK',
      '守门员': 'GK',
      // 后卫
      '后卫': 'DF',
      '中后卫': 'CB',
      '左后卫': 'LB',
      '右后卫': 'RB',
      '左边后卫': 'LB',
      '右边后卫': 'RB',
      '边后卫': 'DF',
      '清道夫': 'SW',
      // 中场
      '中场': 'MF',
      '后腰': 'CDM',
      '中前卫': 'CM',
      '前腰': 'CAM',
      '左前卫': 'LM',
      '右前卫': 'RM',
      '边前卫': 'MF',
      // 前锋
      '前锋': 'FW',
      '中锋': 'ST',
      '左边锋': 'LW',
      '右边锋': 'RW',
      '影锋': 'SS',
      '边锋': 'FW'
    };

    return positionMap[position] || '';
  },

  // 更新排行榜
  updateRanking(members, type) {
    let rankingList = [];

    switch (type) {
      case 'goals':
        rankingList = members
          .map(m => ({
            id: m.userId || m.user?.id,
            realName: m.user?.realName || m.user?.nickname,
            avatar: m.user?.avatar || '/static/images/default-avatar.png',
            value: m.user?.stats?.goals || 0
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10);
        break;
      case 'assists':
        rankingList = members
          .map(m => ({
            id: m.userId || m.user?.id,
            realName: m.user?.realName || m.user?.nickname,
            avatar: m.user?.avatar || '/static/images/default-avatar.png',
            value: m.user?.stats?.assists || 0
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10);
        break;
      case 'mvp':
        rankingList = members
          .map(m => ({
            id: m.userId || m.user?.id,
            realName: m.user?.realName || m.user?.nickname,
            avatar: m.user?.avatar || '/static/images/default-avatar.png',
            value: m.user?.stats?.mvpCount || 0
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10);
        break;
    }

    this.setData({ rankingList });
  },

  // 颜色加深
  darkenColor(color) {
    const hex = color.replace('#', '');
    const r = Math.max(0, parseInt(hex.substring(0, 2), 16) - 30);
    const g = Math.max(0, parseInt(hex.substring(2, 4), 16) - 30);
    const b = Math.max(0, parseInt(hex.substring(4, 6), 16) - 30);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  },

  // 切换排行榜类型
  onSwitchRankType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ rankType: type });
    this.updateRanking(this.data.members, type);
  },

  // 编辑队伍
  onEditTeam() {
    wx.navigateTo({
      url: `/pages/team/create/create?id=${this.data.teamId}`
    });
  },

  // 编辑队名
  onEditTeamName() {
    wx.showModal({
      title: '编辑队名',
      editable: true,
      placeholderText: this.data.teamInfo.name,
      success: (res) => {
        if (res.confirm && res.content) {
          this.updateTeamName(res.content);
        }
      }
    });
  },

  // 更新队名
  updateTeamName(newName) {
    wx.showLoading({ title: '更新中...' });

    teamAPI.updateTeam(this.data.teamId, { name: newName }).then(() => {
      wx.hideLoading();
      wx.showToast({
        title: '更新成功',
        icon: 'success'
      });
      this.setData({
        'teamInfo.name': newName
      });
      wx.setNavigationBarTitle({
        title: newName
      });
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({
        title: err.message || '更新失败',
        icon: 'none'
      });
    });
  },

  // 查看全部成员
  onViewAllMembers() {
    wx.navigateTo({
      url: `/pages/user/members/members?teamId=${this.data.teamId}`
    });
  },

  // 查看成员统计
  onViewMemberStats(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/user/stats/stats?userId=${id}`
    });
  },

  // player-card 组件点击事件 - 防止重复跳转
  onPlayerCardTap(e) {
    // 兼容组件事件和直接点击事件
    const playerId = e.detail?.playerId || e.currentTarget?.dataset?.playerId;

    // 防御性检查：确保 playerId 存在且有效
    if (!playerId || playerId === 'undefined' || typeof playerId === 'undefined') {
      console.error('[Team Detail] playerId 无效，取消导航');
      return;
    }

    // 防止重复跳转（真机上可能因为性能问题导致重复触发）
    if (this._navigating) {
      return;
    }
    this._navigating = true;

    wx.navigateTo({
      url: `/pages/user/stats/stats?userId=${playerId}`,
      success: () => {
        setTimeout(() => {
          this._navigating = false;
        }, 500);
      },
      fail: (err) => {
        console.error('[Team Detail] 跳转失败:', err);
        this._navigating = false;
      }
    });
  },

  // 查看比赛记录
  onViewMatches() {
    wx.navigateTo({
      url: `/pages/match/list/list?teamId=${this.data.teamId}`
    });
  },

  // 查看对战历史
  onViewVsHistory() {
    wx.navigateTo({
      url: `/pages/team/vs/vs?team1Id=${this.data.teamId}&team2Id=${this.data.teamInfo.opponentId}`
    });
  },

  // 点击战绩统计项（胜/平/负）
  onStatTap(e) {
    const { type } = e.detail; // win, draw, loss
    const teamId = this.data.teamId;
    const teamName = this.data.teamInfo.name;
    const teamColor = this.data.teamInfo.color || '#f20810';

    // 赛季名称优先级：stats.season > teamInfo.season.name > teamInfo.seasonName > 缓存 > 默认值
    const seasonName = this.data.teamStats?.season
      || this.data.teamInfo.season?.name
      || this.data.teamInfo.seasonName
      || app.getCurrentSeason()?.name
      || '2024-2025赛季';

    // 防止重复跳转
    if (this._navigatingToMatches) {
      return;
    }
    this._navigatingToMatches = true;

    wx.navigateTo({
      url: `/pages/team/matches/matches?teamId=${teamId}&teamName=${encodeURIComponent(teamName)}&seasonName=${encodeURIComponent(seasonName)}&teamColor=${encodeURIComponent(teamColor)}&filterType=${type}`,
      success: () => {
        setTimeout(() => {
          this._navigatingToMatches = false;
        }, 500);
      },
      fail: (err) => {
        console.error('[Team Detail] 跳转失败:', err);
        this._navigatingToMatches = false;
      }
    });
  }
});
