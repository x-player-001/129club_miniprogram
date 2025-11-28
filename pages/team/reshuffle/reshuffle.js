// pages/team/reshuffle/reshuffle.js
const app = getApp();
const teamAPI = require('../../../api/team.js');
const config = require('../../../utils/config.js');

Page({
  data: {
    sessionId: '',
    team1Id: '', // 队伍1 ID（用于创建Draft）
    team2Id: '', // 队伍2 ID（用于创建Draft）
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
    team1Color: '#b51316', // 默认红色
    team2Color: '#924ab0', // 默认紫色
    team1MemberNames: '', // 队员名字列表（用于显示）
    team2MemberNames: '', // 队员名字列表（用于显示）

    // 颜色列表
    colorList: [
      '#b51316', '#8742a3', '#0a7ea3', '#e67e22', '#27ae60',
      '#f39c12', '#e74c3c', '#3498db', '#2ecc71',
      '#00bcd4', '#34495e', '#f1c40f'
    ],

    // UI 状态
    selectedPlayerId: null, // 当前选中的球员ID
    isMyTurn: false, // 是否轮到我选人

    // WebSocket连接（暂时用Mock替代）
    socketConnected: false
  },

  onLoad(options) {
    console.log('[Reshuffle] ========== onLoad 被调用 ==========');
    console.log('[Reshuffle] onLoad options:', options);
    console.log('[Reshuffle] 当前页面栈:', getCurrentPages().map(p => p.route));

    // 防止页面被多次加载
    if (this._hasLoaded) {
      console.log('[Reshuffle] 页面已加载过，跳过');
      return;
    }
    this._hasLoaded = true;

    // 保存所有参数到 data
    const updateData = {};
    if (options.sessionId) {
      updateData.sessionId = options.sessionId;
    }
    if (options.team1Id) {
      updateData.team1Id = options.team1Id;
    }
    if (options.team2Id) {
      updateData.team2Id = options.team2Id;
    }

    this.setData(updateData, () => {
      console.log('[Reshuffle] team1Id:', this.data.team1Id, 'team2Id:', this.data.team2Id);

      this.checkAdminRole();
      this.loadDraftSession();
    });
  },

  onUnload() {
    // 断开WebSocket连接
    this.disconnectSocket();
    // 重置实例变量，防止页面复用时出问题
    this._hasLoaded = false;
    this._isCreatingDraft = false;
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
    console.log('[Reshuffle] loadDraftSession called, sessionId:', this.data.sessionId, '_isCreatingDraft:', this._isCreatingDraft);

    if (!this.data.sessionId) {
      // 如果没有sessionId，说明是第一次进入，需要创建新的Draft会话
      // 但如果正在创建中，则跳过
      if (this._isCreatingDraft) {
        console.log('[Reshuffle] loadDraftSession 正在创建中，跳过');
        return;
      }
      this.startNewDraft();
      return;
    }

    wx.showLoading({ title: '加载中...' });

    // 真实API调用
    teamAPI.getDraftSession(this.data.sessionId).then(res => {
      const data = res.data;

      // 计算队员名字列表
      const team1MemberNames = (data.team1Players || []).map(p => p.name || p.realName).join('、');
      const team2MemberNames = (data.team2Players || []).map(p => p.name || p.realName).join('、');

      // 判断是否轮到当前用户
      const currentUserId = app.globalData.userInfo?.id || wx.getStorageSync('userInfo')?.id;
      const isMyTurn = (
        (data.currentTurn === 'captain1' && currentUserId === data.captain1?.id) ||
        (data.currentTurn === 'captain2' && currentUserId === data.captain2?.id)
      );

      this.setData({
        captain1: data.captain1,
        captain2: data.captain2,
        availablePlayers: data.availablePlayers || [],
        team1Players: data.team1Players || [],
        team2Players: data.team2Players || [],
        team1MemberNames,
        team2MemberNames,
        currentRound: data.currentRound || 1,
        currentTurn: data.currentTurn || 'captain1',
        draftStatus: data.status || 'in_progress',
        totalRounds: data.totalRounds || 0,
        isMyTurn,
        currentUserId
      });

      wx.hideLoading();

      // 可选：连接WebSocket接收实时更新
      // this.connectSocket();
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({
        title: err.message || '加载失败',
        icon: 'none'
      });
    });
  },

  // 发起新的Draft会话
  startNewDraft() {
    // 防止重复调用 - 立即设置标志，防止并发调用
    if (this._isCreatingDraft) {
      console.log('[Reshuffle] startNewDraft 正在创建中，跳过重复调用');
      return;
    }
    this._isCreatingDraft = true;

    console.log('[Reshuffle] startNewDraft called, team1Id:', this.data.team1Id, 'team2Id:', this.data.team2Id);

    const currentSeason = app.getCurrentSeason();
    if (!currentSeason || !currentSeason.id) {
      this._isCreatingDraft = false; // 重置标志
      wx.showModal({
        title: '提示',
        content: '请先创建赛季',
        showCancel: false,
        success: () => {
          wx.navigateBack();
        }
      });
      return;
    }

    // 检查是否有队伍ID
    if (!this.data.team1Id || !this.data.team2Id) {
      console.log('[Reshuffle] 缺少队伍ID, team1Id:', this.data.team1Id, 'team2Id:', this.data.team2Id);
      this._isCreatingDraft = false; // 重置标志
      wx.showModal({
        title: '提示',
        content: '缺少队伍信息，请从队伍页面发起选人',
        showCancel: false,
        success: () => {
          wx.navigateBack();
        }
      });
      return;
    }

    wx.showLoading({ title: '加载队伍信息...' });

    // 先获取两个队伍的详情（包含队长信息）
    Promise.all([
      teamAPI.getTeamDetail(this.data.team1Id),
      teamAPI.getTeamDetail(this.data.team2Id)
    ]).then(([team1Res, team2Res]) => {
      console.log('[Reshuffle] team1详情:', team1Res.data);
      console.log('[Reshuffle] team2详情:', team2Res.data);

      const team1 = team1Res.data;
      const team2 = team2Res.data;

      // 检查队长信息
      const captain1Id = team1.captainId || team1.captain?.id;
      const captain2Id = team2.captainId || team2.captain?.id;
      console.log('[Reshuffle] captain1Id:', captain1Id, 'captain2Id:', captain2Id);

      if (!captain1Id) {
        wx.hideLoading();
        this._isCreatingDraft = false; // 重置标志
        wx.showToast({ title: '队伍1缺少队长', icon: 'none' });
        return;
      }
      if (!captain2Id) {
        wx.hideLoading();
        this._isCreatingDraft = false; // 重置标志
        wx.showToast({ title: '队伍2缺少队长', icon: 'none' });
        return;
      }

      wx.showLoading({ title: '创建中...' });

      // 调用API创建Draft会话
      const reshuffleData = {
        seasonId: currentSeason.id,
        team1Id: this.data.team1Id,
        team2Id: this.data.team2Id,
        captain1Id: captain1Id,
        captain2Id: captain2Id
      };
      console.log('[Reshuffle] 发起选人请求参数:', JSON.stringify(reshuffleData));

      // 最终校验：确保所有必要参数都有值
      if (!reshuffleData.seasonId || !reshuffleData.team1Id || !reshuffleData.team2Id ||
          !reshuffleData.captain1Id || !reshuffleData.captain2Id) {
        wx.hideLoading();
        this._isCreatingDraft = false;
        console.error('[Reshuffle] 参数不完整:', reshuffleData);
        wx.showToast({ title: '参数不完整，请重试', icon: 'none' });
        return;
      }

      teamAPI.startReshuffle(reshuffleData).then(res => {
        wx.hideLoading();

        const sessionId = res.data.sessionId || res.data.id;
        console.log('[Reshuffle] startReshuffle 成功, sessionId:', sessionId);

        // 先设置 sessionId，再重置标志，最后加载
        this.setData({ sessionId }, () => {
          this._isCreatingDraft = false; // 重置标志
          // 重新加载Draft信息
          this.loadDraftSession();
        });
      }).catch(err => {
        console.error('[Reshuffle] startReshuffle 失败:', err);
        wx.hideLoading();
        this._isCreatingDraft = false; // 重置标志
        wx.showToast({
          title: err.message || '创建失败',
          icon: 'none'
        });
      });
    }).catch(err => {
      console.error('[Reshuffle] 获取队伍详情失败:', err);
      wx.hideLoading();
      this._isCreatingDraft = false; // 重置标志
      wx.showToast({
        title: err.message || '获取队伍信息失败',
        icon: 'none'
      });
    });
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

    wx.showLoading({ title: '选择中...' });

    // 真实API调用
    teamAPI.pickPlayer({
      sessionId: this.data.sessionId,
      playerId: this.data.selectedPlayerId
    }).then(res => {
      wx.hideLoading();

      // 更新本地状态（也可以重新加载整个会话）
      if (res.data) {
        this.updateDraftState(res.data);
      } else {
        // 如果后端没有返回完整状态，则重新加载
        this.loadDraftSession();
      }

      wx.showToast({
        title: `已选择 ${player.name || player.realName}`,
        icon: 'success'
      });
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({
        title: err.message || '选择失败',
        icon: 'none'
      });
    });
  },

  // 更新Draft状态
  updateDraftState(data) {
    const team1MemberNames = (data.team1Players || []).map(p => p.name || p.realName).join('、');
    const team2MemberNames = (data.team2Players || []).map(p => p.name || p.realName).join('、');

    const currentUserId = this.data.currentUserId;
    const isMyTurn = (
      (data.currentTurn === 'captain1' && currentUserId === data.captain1?.id) ||
      (data.currentTurn === 'captain2' && currentUserId === data.captain2?.id)
    );

    this.setData({
      availablePlayers: data.availablePlayers || [],
      team1Players: data.team1Players || [],
      team2Players: data.team2Players || [],
      team1MemberNames,
      team2MemberNames,
      currentRound: data.currentRound || this.data.currentRound,
      currentTurn: data.currentTurn || this.data.currentTurn,
      draftStatus: data.status || this.data.draftStatus,
      selectedPlayerId: null,
      isMyTurn
    });

    // 如果Draft完成，显示设置队名界面
    if (data.status === 'completed') {
      // 不需要弹窗，WXML会自动切换到队名输入界面
    }
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

  // 选择队伍1颜色
  onSelectTeam1Color(e) {
    const color = e.currentTarget.dataset.color;
    this.setData({ team1Color: color });
  },

  // 选择队伍2颜色
  onSelectTeam2Color(e) {
    const color = e.currentTarget.dataset.color;
    this.setData({ team2Color: color });
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

    // 真实API调用
    teamAPI.publishDraftTeams({
      sessionId: this.data.sessionId,
      team1Name: this.data.team1Name,
      team2Name: this.data.team2Name,
      // 可选：添加颜色信息
      team1Color: this.data.team1Color,
      team2Color: this.data.team2Color
    }).then(() => {
      wx.hideLoading();
      wx.showToast({
        title: '队伍创建成功',
        icon: 'success',
        duration: 1500
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({
        title: err.message || '发布失败',
        icon: 'none'
      });
    });
  }
});
