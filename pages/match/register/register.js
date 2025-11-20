// pages/match/register/register.js
const app = getApp();
const matchAPI = require('../../../api/match.js');
const config = require('../../../utils/config.js');
const { getTeamLogoUrl } = require('../../../utils/dataFormatter.js');

Page({
  data: {
    matchId: '',
    matchInfo: {},
    myTeamId: '',
    registeredPlayers: [],
    notes: '',
    isRegistered: false, // 是否已报名
    isOnLeave: false, // 是否已请假
    currentTeamView: 'team1', // 当前查看的队伍（team1 或 team2）
    team1Players: [], // 队伍1的报名人员
    team2Players: [], // 队伍2的报名人员
    team1LeavePlayers: [], // 队伍1的请假人员
    team2LeavePlayers: [], // 队伍2的请假人员
    hasTeam: false, // 用户是否有队伍
    showTeamSelector: false, // 是否显示队伍选择弹窗
    selectedTeamId: '', // 无队伍球员选择的队伍ID
    isOpponentTeam: false, // 是否正在查看对手队伍
    // 图片URL
    images: {
      defaultAvatar: config.getImageUrl('default-avatar.png')
    }
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
          logo: getTeamLogoUrl(match.team1?.logo || match.team1Logo),
          color: match.team1?.color || '#f20810'
        },
        team2: {
          id: match.team2?.id || match.team2Id,
          name: match.team2?.name || match.team2Name,
          logo: getTeamLogoUrl(match.team2?.logo || match.team2Logo),
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

      // 判断用户是否有队伍
      const myTeamId = userInfo.currentTeamId || userInfo.teamId || match.myTeamId || '';
      const hasTeam = !!myTeamId;

      this.setData({
        matchInfo: matchInfo,
        myTeamId: myTeamId,
        hasTeam: hasTeam
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
        position: Array.isArray(reg.user?.position) ? reg.user.position.join(', ') : reg.user?.position,
        memberType: reg.user?.memberType || reg.memberType || 'regular',
        notes: reg.notes || ''
      }));

      // 转换队伍2的数据格式
      const team2Players = (data.team2 || []).map(reg => ({
        id: reg.userId,
        avatar: reg.user?.avatar,
        realName: reg.user?.realName,
        nickname: reg.user?.nickname,
        jerseyNumber: reg.user?.jerseyNumber,
        position: Array.isArray(reg.user?.position) ? reg.user.position.join(', ') : reg.user?.position,
        memberType: reg.user?.memberType || reg.memberType || 'regular',
        notes: reg.notes || ''
      }));

      // 转换队伍1的请假人员数据格式
      const team1LeavePlayers = (data.team1Leave || []).map(leave => ({
        id: leave.userId,
        avatar: leave.user?.avatar,
        realName: leave.user?.realName,
        nickname: leave.user?.nickname,
        jerseyNumber: leave.user?.jerseyNumber,
        memberType: leave.user?.memberType || 'regular',
        reason: leave.notes || leave.reason || '', // 请假原因在 notes 字段
        leaveTime: leave.createdAt
      }));

      // 转换队伍2的请假人员数据格式
      const team2LeavePlayers = (data.team2Leave || []).map(leave => ({
        id: leave.userId,
        avatar: leave.user?.avatar,
        realName: leave.user?.realName,
        nickname: leave.user?.nickname,
        jerseyNumber: leave.user?.jerseyNumber,
        memberType: leave.user?.memberType || 'regular',
        reason: leave.notes || leave.reason || '', // 请假原因在 notes 字段
        leaveTime: leave.createdAt
      }));

      // 检查当前用户是否已报名
      const isRegistered = [...(data.team1 || []), ...(data.team2 || [])].some(reg => reg.userId === currentUserId);

      // 检查当前用户是否已请假
      const isOnLeave = [...(data.team1Leave || []), ...(data.team2Leave || [])].some(leave => leave.userId === currentUserId);

      // 根据当前队伍ID，默认显示对应队伍的人员
      const team1Id = this.data.matchInfo.team1.id;
      const team2Id = this.data.matchInfo.team2.id;
      const currentTeamView = myTeamId === team1Id ? 'team1' : 'team2';
      const registeredPlayers = currentTeamView === 'team1' ? team1Players : team2Players;

      // 判断初始显示的是否为对手队伍
      const viewingTeamId = currentTeamView === 'team1' ? team1Id : team2Id;
      const isOpponentTeam = myTeamId && viewingTeamId !== myTeamId;

      // 更新数据
      this.setData({
        team1Players,
        team2Players,
        team1LeavePlayers,
        team2LeavePlayers,
        registeredPlayers,
        currentTeamView,
        isRegistered,
        isOnLeave,
        isOpponentTeam,
        'matchInfo.team1RegisteredCount': data.team1Count || 0,
        'matchInfo.team2RegisteredCount': data.team2Count || 0,
        'matchInfo.team1LeaveCount': data.team1LeaveCount || 0,
        'matchInfo.team2LeaveCount': data.team2LeaveCount || 0
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

    // 判断是否为对手队伍
    const myTeamId = this.data.myTeamId;
    const team1Id = this.data.matchInfo.team1.id;
    const team2Id = this.data.matchInfo.team2.id;
    const viewingTeamId = team === 'team1' ? team1Id : team2Id;
    const isOpponentTeam = myTeamId && viewingTeamId !== myTeamId;

    this.setData({
      currentTeamView: team,
      registeredPlayers,
      isOpponentTeam
    });
  },

  // 输入备注
  onRemarkInput(e) {
    this.setData({
      notes: e.detail.value
    });
  },

  // 提交报名
  onSubmit() {
    if (!this.validateForm()) {
      return;
    }

    // 判断用户是否有队伍
    if (this.data.hasTeam) {
      // 有队伍：直接报名
      this.confirmAndSubmit();
    } else {
      // 无队伍：显示队伍选择器
      this.setData({
        showTeamSelector: true
      });
    }
  },

  // 确认并提交报名
  confirmAndSubmit(teamId) {
    wx.showModal({
      title: '确认报名',
      content: `确定要报名参加"${this.data.matchInfo.title}"吗？`,
      success: (res) => {
        if (res.confirm) {
          this.submitRegistration(teamId);
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
  submitRegistration(teamId) {
    wx.showLoading({ title: '报名中...' });

    const registrationData = {
      notes: this.data.notes
    };

    // 如果传入了 teamId（无队伍球员），添加到请求数据中
    if (teamId) {
      registrationData.teamId = teamId;
    }

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
        this.setData({ notes: '' }); // 清空备注

        // 标记比赛详情页需要刷新
        const pages = getCurrentPages();
        if (pages.length >= 2) {
          const prevPage = pages[pages.length - 2];
          if (prevPage.loadMatchDetail) {
            prevPage.setData({ needRefresh: true });
          }
        }
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

        // 标记比赛详情页需要刷新
        const pages = getCurrentPages();
        if (pages.length >= 2) {
          const prevPage = pages[pages.length - 2];
          if (prevPage.loadMatchDetail) {
            prevPage.setData({ needRefresh: true });
          }
        }
      }, 1500);
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({
        title: err.message || '取消失败',
        icon: 'none'
      });
    });
  },

  // 请假
  onRequestLeave() {
    // 检查备注是否为空
    const notes = this.data.notes.trim();
    if (!notes) {
      wx.showToast({
        title: '请假需要填写备注说明',
        icon: 'none'
      });
      return;
    }

    wx.showModal({
      title: '确认请假',
      content: `确定要请假吗？\n请假原因：${notes}`,
      success: (res) => {
        if (res.confirm) {
          this.submitLeave(notes);
        }
      }
    });
  },

  // 提交请假
  submitLeave(reason) {
    wx.showLoading({ title: '提交中...' });

    matchAPI.requestLeave(this.data.matchId, { reason }).then(() => {
      wx.hideLoading();
      wx.showToast({
        title: '请假成功',
        icon: 'success',
        duration: 1500
      });

      // 刷新页面数据
      setTimeout(() => {
        this.loadMatchInfo();
        this.setData({ notes: '' }); // 清空备注

        // 标记比赛详情页需要刷新
        const pages = getCurrentPages();
        if (pages.length >= 2) {
          const prevPage = pages[pages.length - 2];
          if (prevPage.loadMatchDetail) {
            prevPage.setData({ needRefresh: true });
          }
        }
      }, 1500);
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({
        title: err.message || '请假失败',
        icon: 'none'
      });
    });
  },

  // 取消请假
  onCancelLeave() {
    wx.showModal({
      title: '确认取消请假',
      content: '确定要取消请假吗？',
      success: (res) => {
        if (res.confirm) {
          this.cancelLeaveRequest();
        }
      }
    });
  },

  // 执行取消请假
  cancelLeaveRequest() {
    wx.showLoading({ title: '取消中...' });

    matchAPI.cancelLeave(this.data.matchId).then(() => {
      wx.hideLoading();
      wx.showToast({
        title: '取消成功',
        icon: 'success',
        duration: 1500
      });

      // 刷新页面数据
      setTimeout(() => {
        this.loadMatchInfo();

        // 标记比赛详情页需要刷新
        const pages = getCurrentPages();
        if (pages.length >= 2) {
          const prevPage = pages[pages.length - 2];
          if (prevPage.loadMatchDetail) {
            prevPage.setData({ needRefresh: true });
          }
        }
      }, 1500);
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({
        title: err.message || '取消失败',
        icon: 'none'
      });
    });
  },

  // 选择支援队伍
  onSelectTeam(e) {
    const teamId = e.currentTarget.dataset.teamId;
    const teamName = e.currentTarget.dataset.teamName;

    this.setData({
      selectedTeamId: teamId,
      showTeamSelector: false
    });

    // 显示确认弹窗
    wx.showModal({
      title: '确认报名',
      content: `确定要支援 ${teamName} 参加比赛吗？`,
      success: (res) => {
        if (res.confirm) {
          this.submitRegistration(teamId);
        }
      }
    });
  },

  // 取消队伍选择
  onCancelTeamSelect() {
    this.setData({
      showTeamSelector: false
    });
  },

  // 获取分享图片URL
  getShareImageUrl(status, shareImage) {
    // 如果有自定义分享图，使用自定义的
    if (shareImage) {
      return config.getStaticUrl(shareImage, 'shareImages');
    }

    // 否则根据比赛状态返回默认图
    const imageMap = {
      'upcoming': config.getStaticUrl('/share_images/registration.png', 'shareImages'),
      'ongoing': config.getStaticUrl('/share_images/ongoing.png', 'shareImages'),
      'finished': config.getStaticUrl('/share_images/finished.png', 'shareImages')
    };

    return imageMap[status] || config.getStaticUrl('/share_images/registration.png', 'shareImages');
  },

  // 分享比赛
  onShareAppMessage() {
    const matchInfo = this.data.matchInfo;

    // 报名页面分享标题
    const team1Count = matchInfo.team1RegisteredCount || 0;
    const team2Count = matchInfo.team2RegisteredCount || 0;
    const totalRegistered = team1Count + team2Count;
    const maxTotal = (matchInfo.maxPlayersPerTeam || 11) * 2;

    let title = '';
    if (totalRegistered >= maxTotal) {
      title = `⚽ ${matchInfo.title} | 报名已满，等你来战！`;
    } else {
      title = `⚽ ${matchInfo.title} | 已集结${totalRegistered}人，快来报名！`;
    }

    return {
      title: title,
      path: `/pages/match/register/register?id=${this.data.matchId}`,
      imageUrl: this.getShareImageUrl('upcoming', matchInfo.shareImage)
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    const matchInfo = this.data.matchInfo;

    return {
      title: `${matchInfo.title} | 129俱乐部`,
      query: `id=${this.data.matchId}`,
      imageUrl: this.getShareImageUrl('upcoming', matchInfo.shareImage)
    };
  }
});
