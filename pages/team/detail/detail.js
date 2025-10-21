// pages/team/detail/detail.js
const app = getApp();
const teamAPI = require('../../../api/team.js');
const statsAPI = require('../../../api/stats.js');

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
      this.loadTeamData();
    }
  },

  onPullDownRefresh() {
    this.loadTeamData().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 加载队伍数据
  loadTeamData() {
    wx.showLoading({ title: '加载中...' });

    // 调用真实 API
    return Promise.all([
      this.loadTeamInfo(),
      this.loadTeamStats(),
      this.loadMembers()
    ]).then(() => {
      wx.hideLoading();
    }).catch(err => {
      console.error('加载队伍数据失败:', err);
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
      const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo');

      // 判断是否是队长
      const isCaptain = userInfo && userInfo.id === teamInfo.captainId;
      // 判断是否是管理员
      const isAdmin = userInfo && userInfo.role === 'super_admin';
      // 队长或管理员都可以编辑
      const canEdit = isCaptain || isAdmin;

      this.setData({
        teamInfo: {
          ...teamInfo,
          captainName: teamInfo.captain?.realName || teamInfo.captain?.nickname || '未设置',
          colorDark: this.darkenColor(teamInfo.color || '#667eea')
        },
        isCaptain: isCaptain,
        canEdit: canEdit
      });

      // 更新导航栏标题
      wx.setNavigationBarTitle({
        title: teamInfo.name || '队伍详情'
      });
    });
  },

  // 加载队伍统计
  loadTeamStats() {
    return statsAPI.getTeamStats(this.data.teamId).then(res => {
      const stats = res.data || {};

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

      this.setData({
        teamStats: stats,
        teamStatsBarData: teamStatsBarData
      });
    });
  },

  // 加载成员列表
  loadMembers() {
    return teamAPI.getTeamMembers(this.data.teamId).then(res => {
      const members = res.data || [];
      const teamInfo = this.data.teamInfo;

      // 格式化队员数据给 player-card 组件
      const membersCardData = members.map(member => {
        // 处理位置数据，兼容字符串和数组格式
        let position = member.user?.position || member.position || '';

        // 如果是数组，转换为字符串
        if (Array.isArray(position)) {
          position = position.filter(p => p && /^[A-Z]{2,3}$/.test(p)).join(',');
        } else if (typeof position === 'string') {
          // 如果是字符串，过滤无效位置代码
          const validPositions = position.split(',')
            .map(p => p.trim())
            .filter(p => /^[A-Z]{2,3}$/.test(p));
          position = validPositions.join(',');
        } else {
          // 其他类型转为空字符串
          position = '';
        }

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
          totalMatches: member.user?.stats?.matchesPlayed || 0
        };
      });

      this.setData({
        members: members,
        membersCardData: membersCardData
      });

      // 加载队内排行榜（从队员数据中提取）
      this.updateRanking(members, this.data.rankType);
    });
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

  // player-card 组件点击事件
  onPlayerCardTap(e) {
    // 兼容组件事件和直接点击事件
    const playerId = e.detail?.playerId || e.currentTarget?.dataset?.playerId;
    if (playerId) {
      wx.navigateTo({
        url: `/pages/user/stats/stats?userId=${playerId}`
      });
    }
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
  }
});
