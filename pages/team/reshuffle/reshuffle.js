// pages/team/reshuffle/reshuffle.js
const app = getApp();
const teamAPI = require('../../../api/team.js');

Page({
  data: {
    sessionId: '',
    currentUserId: '1', // 当前用户ID
    isAdmin: false, // 是否是管理员（可以启动Draft）

    // Draft 状态
    draftStatus: 'not_started', // not_started, in_progress, completed
    currentRound: 1, // 当前轮次
    currentTurn: 'captain1', // captain1 或 captain2
    totalRounds: 0, // 总轮数（根据球员数量计算）

    // 队长信息
    captain1: null,
    captain2: null,

    // 球员列表
    availablePlayers: [], // 可选球员
    team1Players: [], // 队伍1已选球员
    team2Players: [], // 队伍2已选球员

    // 队伍信息（Draft完成后设置）
    team1Name: '',
    team2Name: '',
    team1MemberNames: '', // 队员名字列表（用于显示）
    team2MemberNames: '', // 队员名字列表（用于显示）

    // UI 状态
    selectedPlayerId: null, // 当前选中的球员ID
    isMyTurn: false, // 是否轮到我选人

    // WebSocket连接（暂时用Mock替代）
    socketConnected: false
  },

  onLoad(options) {
    if (options.sessionId) {
      this.setData({ sessionId: options.sessionId });
    }

    this.checkAdminRole();
    this.loadDraftSession();
  },

  onUnload() {
    // 断开WebSocket连接
    this.disconnectSocket();
  },

  // 检查管理员权限
  checkAdminRole() {
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo');
    this.setData({
      isAdmin: userInfo && userInfo.role === 'super_admin'
    });
  },

  // 加载Draft会话信息
  loadDraftSession() {
    // 使用Mock数据
    const mockAvailablePlayers = [
      { id: '3', name: '张三', avatar: '/static/images/default-avatar.png', number: 7, position: '前锋', goals: 15, assists: 8, attendance: 0.92, rating: 8.5 },
      { id: '4', name: '李四', avatar: '/static/images/default-avatar.png', number: 10, position: '中场', goals: 12, assists: 15, attendance: 0.88, rating: 8.3 },
      { id: '5', name: '王五', avatar: '/static/images/default-avatar.png', number: 5, position: '后卫', goals: 3, assists: 5, attendance: 0.95, rating: 8.0 },
      { id: '6', name: '赵六', avatar: '/static/images/default-avatar.png', number: 1, position: '守门员', goals: 0, assists: 0, attendance: 0.90, rating: 7.8 },
      { id: '7', name: '孙七', avatar: '/static/images/default-avatar.png', number: 9, position: '前锋', goals: 18, assists: 6, attendance: 0.85, rating: 8.7 },
      { id: '8', name: '周八', avatar: '/static/images/default-avatar.png', number: 8, position: '中场', goals: 10, assists: 12, attendance: 0.89, rating: 8.2 },
      { id: '9', name: '吴九', avatar: '/static/images/default-avatar.png', number: 4, position: '后卫', goals: 2, assists: 4, attendance: 0.93, rating: 7.9 },
      { id: '10', name: '郑十', avatar: '/static/images/default-avatar.png', number: 11, position: '前锋', goals: 14, assists: 9, attendance: 0.87, rating: 8.4 },
      { id: '11', name: '冯十一', avatar: '/static/images/default-avatar.png', number: 6, position: '中场', goals: 8, assists: 10, attendance: 0.91, rating: 8.1 },
      { id: '12', name: '陈十二', avatar: '/static/images/default-avatar.png', number: 3, position: '后卫', goals: 1, assists: 3, attendance: 0.94, rating: 7.7 }
    ];

    const mockCaptain1 = { id: '1', name: '队长A', avatar: '/static/images/default-avatar.png', number: 99 };
    const mockCaptain2 = { id: '2', name: '队长B', avatar: '/static/images/default-avatar.png', number: 98 };

    const totalRounds = Math.ceil(mockAvailablePlayers.length / 2);

    this.setData({
      availablePlayers: mockAvailablePlayers,
      captain1: mockCaptain1,
      captain2: mockCaptain2,
      team1Players: [mockCaptain1],
      team2Players: [mockCaptain2],
      team1MemberNames: mockCaptain1.name,
      team2MemberNames: mockCaptain2.name,
      totalRounds: totalRounds,
      draftStatus: 'in_progress',
      currentTurn: 'captain1',
      isMyTurn: this.data.currentUserId === mockCaptain1.id
    });

    // 真实API调用（暂时注释）
    // teamAPI.getDraftSession(this.data.sessionId).then(res => {
    //   const data = res.data;
    //   this.setData({
    //     captain1: data.captain1,
    //     captain2: data.captain2,
    //     availablePlayers: data.availablePlayers,
    //     team1Players: data.team1Players,
    //     team2Players: data.team2Players,
    //     currentRound: data.currentRound,
    //     currentTurn: data.currentTurn,
    //     draftStatus: data.status,
    //     totalRounds: data.totalRounds
    //   });
    //   this.connectSocket();
    // }).catch(err => {
    //   wx.showToast({
    //     title: err.message || '加载失败',
    //     icon: 'none'
    //   });
    // });
  },

  // 连接WebSocket
  connectSocket() {
    // Mock实现
    this.setData({ socketConnected: true });

    // 真实WebSocket连接（暂时注释）
    // wx.connectSocket({
    //   url: `wss://your-domain.com/draft/${this.data.sessionId}`
    // });

    // wx.onSocketOpen(() => {
    //   console.log('WebSocket连接已打开');
    //   this.setData({ socketConnected: true });
    // });

    // wx.onSocketMessage((res) => {
    //   const data = JSON.parse(res.data);
    //   this.handleSocketMessage(data);
    // });

    // wx.onSocketError((err) => {
    //   console.error('WebSocket错误', err);
    //   this.setData({ socketConnected: false });
    // });

    // wx.onSocketClose(() => {
    //   console.log('WebSocket连接已关闭');
    //   this.setData({ socketConnected: false });
    // });
  },

  // 断开WebSocket
  disconnectSocket() {
    if (this.data.socketConnected) {
      wx.closeSocket();
    }
  },

  // 处理WebSocket消息
  handleSocketMessage(data) {
    switch (data.type) {
      case 'player_picked':
        this.onPlayerPicked(data.payload);
        break;
      case 'turn_changed':
        this.onTurnChanged(data.payload);
        break;
      case 'draft_completed':
        this.onDraftCompleted(data.payload);
        break;
    }
  },

  // 选择球员
  onSelectPlayer(e) {
    const playerId = e.currentTarget.dataset.playerId;

    if (!this.data.isMyTurn) {
      wx.showToast({
        title: '还未轮到你选人',
        icon: 'none'
      });
      return;
    }

    this.setData({ selectedPlayerId: playerId });
  },

  // 确认选择球员
  onConfirmPick() {
    if (!this.data.selectedPlayerId) {
      wx.showToast({
        title: '请先选择一名球员',
        icon: 'none'
      });
      return;
    }

    const player = this.data.availablePlayers.find(p => p.id === this.data.selectedPlayerId);
    if (!player) {
      return;
    }

    // Mock实现
    this.pickPlayer(player);

    // 真实API调用（暂时注释）
    // teamAPI.pickPlayer({
    //   sessionId: this.data.sessionId,
    //   playerId: this.data.selectedPlayerId
    // }).then(() => {
    //   // WebSocket会推送更新
    // }).catch(err => {
    //   wx.showToast({
    //     title: err.message || '选择失败',
    //     icon: 'none'
    //   });
    // });
  },

  // 选择球员（本地更新）
  pickPlayer(player) {
    const availablePlayers = this.data.availablePlayers.filter(p => p.id !== player.id);
    const currentTurn = this.data.currentTurn;
    let team1Players = this.data.team1Players;
    let team2Players = this.data.team2Players;

    if (currentTurn === 'captain1') {
      team1Players = [...team1Players, player];
    } else {
      team2Players = [...team2Players, player];
    }

    // 切换回合
    let nextTurn = currentTurn === 'captain1' ? 'captain2' : 'captain1';
    let nextRound = this.data.currentRound;

    // 如果两队都选完一人，进入下一轮
    if (currentTurn === 'captain2') {
      nextRound += 1;
    }

    // 检查是否完成
    const completed = availablePlayers.length === 0;
    const draftStatus = completed ? 'completed' : 'in_progress';

    // 更新队员名字列表
    const team1MemberNames = team1Players.map(p => p.name).join('、');
    const team2MemberNames = team2Players.map(p => p.name).join('、');

    this.setData({
      availablePlayers,
      team1Players,
      team2Players,
      team1MemberNames,
      team2MemberNames,
      currentTurn: nextTurn,
      currentRound: nextRound,
      selectedPlayerId: null,
      draftStatus,
      isMyTurn: !completed && (
        (nextTurn === 'captain1' && this.data.currentUserId === this.data.captain1.id) ||
        (nextTurn === 'captain2' && this.data.currentUserId === this.data.captain2.id)
      )
    });

    wx.showToast({
      title: `已选择 ${player.name}`,
      icon: 'success'
    });

    if (completed) {
      this.showTeamNameDialog();
    }
  },

  // 显示设置队名对话框
  showTeamNameDialog() {
    wx.showModal({
      title: '选人完成',
      content: '请两位队长设置队伍名称',
      showCancel: false,
      success: () => {
        // 跳转到设置队名页面或显示输入框
      }
    });
  },

  // 球员被选中（WebSocket推送）
  onPlayerPicked(payload) {
    const player = payload.player;
    this.pickPlayer(player);
  },

  // 回合变更（WebSocket推送）
  onTurnChanged(payload) {
    this.setData({
      currentTurn: payload.currentTurn,
      currentRound: payload.currentRound,
      isMyTurn: (
        (payload.currentTurn === 'captain1' && this.data.currentUserId === this.data.captain1.id) ||
        (payload.currentTurn === 'captain2' && this.data.currentUserId === this.data.captain2.id)
      )
    });
  },

  // Draft完成（WebSocket推送）
  onDraftCompleted(payload) {
    this.setData({
      draftStatus: 'completed'
    });
    this.showTeamNameDialog();
  },

  // 设置队名
  onTeam1NameInput(e) {
    this.setData({ team1Name: e.detail.value });
  },

  onTeam2NameInput(e) {
    this.setData({ team2Name: e.detail.value });
  },

  // 确认发布队伍
  onPublishTeams() {
    if (!this.data.team1Name || !this.data.team2Name) {
      wx.showToast({
        title: '请输入队伍名称',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({ title: '发布中...' });

    // Mock实现
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({
        title: '队伍创建成功',
        icon: 'success',
        duration: 1500
      });

      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }, 1000);

    // 真实API调用（暂时注释）
    // teamAPI.publishDraftTeams({
    //   sessionId: this.data.sessionId,
    //   team1Name: this.data.team1Name,
    //   team2Name: this.data.team2Name
    // }).then(() => {
    //   wx.hideLoading();
    //   wx.showToast({
    //     title: '队伍创建成功',
    //     icon: 'success',
    //     duration: 1500
    //   });
    //   setTimeout(() => {
    //     wx.navigateBack();
    //   }, 1500);
    // }).catch(err => {
    //   wx.hideLoading();
    //   wx.showToast({
    //     title: err.message || '发布失败',
    //     icon: 'none'
    //   });
    // });
  }
});
