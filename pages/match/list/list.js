// pages/match/list/list.js
const app = getApp();
const matchAPI = require('../../../api/match.js');

Page({
  data: {
    currentTab: '0', // '0': 未开始, '1': 进行中, '2': 已结束
    tabs: [
      { id: '0', name: '未开始' },
      { id: '1', name: '进行中' },
      { id: '2', name: '已结束' }
    ],
    matchList: [],
    loading: false,
    isAdmin: true
  },

  onLoad(options) {
    // this.checkAdminRole(); // 临时注释，方便测试
    this.loadMatchData();
  },

  onShow() {
    // 每次显示时刷新数据
    this.loadMatchData();
  },

  onPullDownRefresh() {
    this.loadMatchData().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 检查管理员权限
  checkAdminRole() {
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo');
    this.setData({
      isAdmin: userInfo && userInfo.role === 'super_admin'
    });
  },

  // 加载比赛数据
  loadMatchData() {
    this.setData({ loading: true });

    // 根据当前 Tab 确定状态
    const statusMap = {
      '0': 'registration',    // 未开始（报名中）
      '1': 'in_progress',     // 进行中
      '2': 'completed'        // 已结束
    };

    const status = statusMap[this.data.currentTab];

    // 调用真实 API
    return matchAPI.getMatchList({ status }).then(res => {
      const matchList = res.data?.list || res.data || [];
      const matches = matchList.map(match => this.formatMatchData(match));
      this.setData({
        matchList: matches,
        loading: false
      });
    }).catch(err => {
      console.error('加载比赛列表失败:', err);
      this.setData({ loading: false });
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    });
  },

  // 格式化比赛数据
  formatMatchData(match) {
    const date = new Date(match.matchDate || match.datetime);
    return {
      id: match.id,
      title: match.title,
      datetime: match.matchDate || match.datetime,
      dateDay: date.getDate(),
      dateMonth: `${date.getMonth() + 1}月`,
      time: `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`,
      location: match.location,
      team1: {
        id: match.team1?.id || match.team1Id,
        name: match.team1?.name || match.team1Name,
        logo: match.team1?.logo || match.team1Logo || '/static/images/default-team.png',
        color: match.team1?.color || match.team1Color || '#ff6b6b'
      },
      team2: {
        id: match.team2?.id || match.team2Id,
        name: match.team2?.name || match.team2Name,
        logo: match.team2?.logo || match.team2Logo || '/static/images/default-team.png',
        color: match.team2?.color || match.team2Color || '#3498db'
      },
      status: this.convertStatus(match.status),
      team1Score: match.team1Score || 0,
      team2Score: match.team2Score || 0,
      team1RegisteredCount: match.team1RegisterCount || 0,
      team2RegisteredCount: match.team2RegisterCount || 0,
      maxPlayersPerTeam: match.maxPlayersPerTeam || 11,
      registrationDeadline: match.registrationDeadline,
      fee: match.fee || 0,
      isRegistered: match.isRegistered || false,
      myTeamId: match.myTeamId,
      currentMinute: match.currentMinute,
      mvp: match.mvp
    };
  },

  // 转换状态
  convertStatus(status) {
    const statusMap = {
      'registration': 'upcoming',
      'in_progress': 'ongoing',
      'completed': 'finished',
      'cancelled': 'cancelled'
    };
    return statusMap[status] || status;
  },


  // Tab切换
  onSwitchTab(e) {
    const tab = e.currentTarget.dataset.tab || e.detail.tabId;
    this.setData({ currentTab: tab });
    this.loadMatchData();
  },

  // tab-bar组件事件
  onTabChange(e) {
    const { tabId } = e.detail;
    this.setData({ currentTab: tabId });
    this.loadMatchData();
  },

  // 跳转到比赛详情
  onGoToMatchDetail(e) {
    const id = e.currentTarget.dataset.id || e.detail.matchId;
    wx.navigateTo({
      url: `/pages/match/detail/detail?id=${id}`
    });
  },

  // match-card组件事件
  onMatchCardTap(e) {
    const { matchId } = e.detail;
    wx.navigateTo({
      url: `/pages/match/detail/detail?id=${matchId}`
    });
  },

  onMatchRegister(e) {
    const { matchId, isRegistered } = e.detail;
    this.onRegisterMatch({
      currentTarget: {
        dataset: { id: matchId, registered: isRegistered }
      }
    });
  },

  // 创建比赛
  onCreateMatch() {
    wx.navigateTo({
      url: '/pages/match/create/create'
    });
  },

  // 报名/取消报名
  onRegisterMatch(e) {
    const id = e.currentTarget.dataset.id;
    const isRegistered = e.currentTarget.dataset.registered;

    if (isRegistered) {
      // 取消报名
      wx.showModal({
        title: '确认取消',
        content: '确定要取消报名吗？',
        success: (res) => {
          if (res.confirm) {
            this.cancelRegistration(id);
          }
        }
      });
    } else {
      // 报名
      wx.navigateTo({
        url: `/pages/match/register/register?id=${id}`
      });
    }
  },

  // 取消报名
  cancelRegistration(matchId) {
    wx.showLoading({ title: '处理中...' });

    matchAPI.cancelRegister(matchId).then(() => {
      wx.hideLoading();
      wx.showToast({
        title: '取消成功',
        icon: 'success'
      });
      this.loadMatchData();
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({
        title: err.message || '取消失败',
        icon: 'none'
      });
    });
  }
});
