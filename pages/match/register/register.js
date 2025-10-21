// pages/match/register/register.js
const app = getApp();
const matchAPI = require('../../../api/match.js');

Page({
  data: {
    matchId: '',
    matchInfo: {},
    myTeamId: '',
    registeredPlayers: [],
    remark: '',
    isRegistered: false, // 是否已报名
    currentTeamView: 'team1', // 当前查看的队伍（team1 或 team2）
    team1Players: [], // 队伍1的报名人员
    team2Players: [] // 队伍2的报名人员
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ matchId: options.id });
      this.loadMatchInfo();
    }
  },

  // 加载比赛信息
  loadMatchInfo() {
    wx.showLoading({ title: '加载中...' });

    matchAPI.getMatchDetail(this.data.matchId).then(res => {
      const match = res.data;
      const date = new Date(match.matchDate || match.datetime);
      const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo');

      const matchInfo = {
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
          color: match.team1?.color || '#f20810'
        },
        team2: {
          id: match.team2?.id || match.team2Id,
          name: match.team2?.name || match.team2Name,
          logo: match.team2?.logo || match.team2Logo || '/static/images/default-team.png',
          color: match.team2?.color || '#924ab0'
        },
        maxPlayers: match.maxPlayersPerTeam || 11,
        maxPlayersPerTeam: match.maxPlayersPerTeam || 11,
        team1RegisteredCount: match.team1RegisteredCount || 0,
        team2RegisteredCount: match.team2RegisteredCount || 0,
        fee: match.fee || 0,
        registrationDeadline: match.registrationDeadline,
        description: match.description || ''
      };

      this.setData({
        matchInfo: matchInfo,
        myTeamId: userInfo.currentTeamId || match.myTeamId
      });

      // 加载已报名人员列表
      this.loadRegisteredPlayers();

      wx.setNavigationBarTitle({
        title: '报名比赛'
      });
      wx.hideLoading();
    }).catch(err => {
      console.error('加载比赛信息失败:', err);
      wx.hideLoading();
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    });
  },

  // 加载已报名人员列表
  loadRegisteredPlayers() {
    matchAPI.getRegistrationList(this.data.matchId).then(res => {
      const data = res.data;
      const myTeamId = this.data.myTeamId;
      const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo');
      const currentUserId = userInfo.id;

      // 转换队伍1的数据格式
      const team1Players = (data.team1 || []).map(reg => ({
        id: reg.userId,
        avatar: reg.user?.avatar,
        realName: reg.user?.realName,
        nickname: reg.user?.nickname,
        jerseyNumber: reg.user?.jerseyNumber,
        position: Array.isArray(reg.user?.position) ? reg.user.position.join(', ') : reg.user?.position
      }));

      // 转换队伍2的数据格式
      const team2Players = (data.team2 || []).map(reg => ({
        id: reg.userId,
        avatar: reg.user?.avatar,
        realName: reg.user?.realName,
        nickname: reg.user?.nickname,
        jerseyNumber: reg.user?.jerseyNumber,
        position: Array.isArray(reg.user?.position) ? reg.user.position.join(', ') : reg.user?.position
      }));

      // 检查当前用户是否已报名
      const isRegistered = [...(data.team1 || []), ...(data.team2 || [])].some(reg => reg.userId === currentUserId);

      // 根据当前队伍ID，默认显示对应队伍的人员
      const team1Id = this.data.matchInfo.team1.id;
      const currentTeamView = myTeamId === team1Id ? 'team1' : 'team2';
      const registeredPlayers = currentTeamView === 'team1' ? team1Players : team2Players;

      // 更新数据
      this.setData({
        team1Players,
        team2Players,
        registeredPlayers,
        currentTeamView,
        isRegistered,
        'matchInfo.team1RegisteredCount': data.team1Count || 0,
        'matchInfo.team2RegisteredCount': data.team2Count || 0
      });
    }).catch(err => {
      console.error('加载报名列表失败:', err);
    });
  },

  // 切换查看的队伍
  onSwitchTeam(e) {
    const team = e.currentTarget.dataset.team;
    if (team === this.data.currentTeamView) {
      return; // 如果点击的是当前队伍，不做任何操作
    }

    const registeredPlayers = team === 'team1' ? this.data.team1Players : this.data.team2Players;
    this.setData({
      currentTeamView: team,
      registeredPlayers
    });
  },

  // 输入备注
  onRemarkInput(e) {
    this.setData({
      remark: e.detail.value
    });
  },

  // 提交报名
  onSubmit() {
    if (!this.validateForm()) {
      return;
    }

    wx.showModal({
      title: '确认报名',
      content: `确定要报名参加"${this.data.matchInfo.title}"吗？`,
      success: (res) => {
        if (res.confirm) {
          this.submitRegistration();
        }
      }
    });
  },

  // 验证表单
  validateForm() {
    // 不再需要验证位置
    return true;
  },

  // 提交报名
  submitRegistration() {
    wx.showLoading({ title: '报名中...' });

    const registrationData = {
      remark: this.data.remark
    };

    matchAPI.registerMatch(this.data.matchId, registrationData).then(() => {
      wx.hideLoading();
      wx.showToast({
        title: '报名成功',
        icon: 'success',
        duration: 1500
      });

      // 刷新页面数据
      setTimeout(() => {
        this.loadMatchInfo();
        this.setData({ remark: '' }); // 清空备注
      }, 1500);
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({
        title: err.message || '报名失败',
        icon: 'none'
      });
    });
  },

  // 取消报名
  onCancel() {
    wx.showModal({
      title: '确认取消报名',
      content: '确定要取消报名吗？',
      success: (res) => {
        if (res.confirm) {
          this.cancelRegistration();
        }
      }
    });
  },

  // 执行取消报名
  cancelRegistration() {
    wx.showLoading({ title: '取消中...' });

    matchAPI.cancelRegister(this.data.matchId).then(() => {
      wx.hideLoading();
      wx.showToast({
        title: '取消成功',
        icon: 'success',
        duration: 1500
      });

      // 刷新页面数据
      setTimeout(() => {
        this.loadMatchInfo();
      }, 1500);
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({
        title: err.message || '取消失败',
        icon: 'none'
      });
    });
  }
});
