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

    // 队伍信息
    team1Info: null,
    team2Info: null,

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
    loading: true,
    selectedPlayerId: null,
    isMyTurn: false,
    searchKeyword: '',
    filteredPlayers: [], // 搜索+排序后的展示列表
    danmakuList: [], // 弹幕消息列表
    danmakuInput: '', // 弹幕输入框

    // WebSocket连接（暂时用Mock替代）
    socketConnected: false
  },

  onLoad(options) {
    const updateData = {};
    if (options.sessionId) updateData.sessionId = options.sessionId;
    if (options.team1Id) updateData.team1Id = options.team1Id;
    if (options.team2Id) updateData.team2Id = options.team2Id;

    this.setData(updateData, () => {
      this.checkAdminRole();
      this.loadDraftSession();
    });
  },

  onShow() {
    if (this.data.sessionId && !this._socketTask) {
      this.connectSocket();
    }
  },

  onHide() {
    // 切后台时主动断开，节省资源
    this.disconnectSocket();
  },

  onShareAppMessage() {
    const { sessionId, team1Info, team2Info } = this.data;
    const title = `${team1Info?.name || '队伍1'} vs ${team2Info?.name || '队伍2'} 正在选人，点击围观！`;
    return {
      title,
      path: `/pages/team/reshuffle/reshuffle?sessionId=${sessionId}`
    };
  },

  onUnload() {
    this._clearReconnectTimer();
    if (this._viewerTimer) clearTimeout(this._viewerTimer);
    this.disconnectSocket();
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

    // 并行获取会话状态和可选球员
    Promise.all([
      teamAPI.getDraftSession(this.data.sessionId),
      teamAPI.getAvailablePlayers(this.data.sessionId)
    ]).then(([sessionRes, availableRes]) => {
      const { reshuffle, currentPickOrder, currentCaptain, team1PickedCount, team2PickedCount } = sessionRes.data;
      const availablePlayers = (availableRes.data || []).map(p => ({
        id: p.id,
        name: p.realName || p.nickname,
        avatar: p.avatar,
        number: p.jerseyNumber,
        position: p.position,
        goals: p.stats?.goals || 0,
        assists: p.stats?.assists || 0,
        winRate: p.stats?.winRate || '0',
        matchesPlayed: p.stats?.matchesPlayed || 0
      }));

      // 从 picks 中拆分两队已选球员，按 pickOrder 升序排列
      const picks = (reshuffle.picks || []).slice().sort((a, b) => a.pickOrder - b.pickOrder);
      const formatPick = p => ({
        id: p.pickedUser.id,
        name: p.pickedUser.realName || p.pickedUser.nickname,
        avatar: p.pickedUser.avatar,
        number: p.pickedUser.jerseyNumber,
        position: p.pickedUser.position
      });
      const team1Players = picks.filter(p => p.teamId === reshuffle.team1Id).map(formatPick);
      const team2Players = picks.filter(p => p.teamId === reshuffle.team2Id).map(formatPick);
      const team1MemberNames = team1Players.map(p => p.name).join('、');
      const team2MemberNames = team2Players.map(p => p.name).join('、');

      // 判断是否轮到当前用户
      const currentUserId = app.globalData.userInfo?.id || wx.getStorageSync('userInfo')?.id;
      const isMyTurn = currentCaptain?.id === currentUserId;

      this.setData({
        captain1: reshuffle.captain1,
        captain2: reshuffle.captain2,
        team1Info: reshuffle.team1,
        team2Info: reshuffle.team2,
        availablePlayers,
        team1Players,
        team2Players,
        team1MemberNames,
        team2MemberNames,
        currentRound: currentPickOrder || 1,
        currentTurn: currentCaptain?.id === reshuffle.captain1Id ? 'captain1' : 'captain2',
        draftStatus: reshuffle.status === 'draft_in_progress' ? 'in_progress' : reshuffle.status,
        isMyTurn,
        currentUserId
      });
      this.applyFilter();
      this.setData({ loading: false });

      wx.hideLoading();
      this.connectSocket();
    }).catch(err => {
      wx.hideLoading();
      this.setData({ loading: false });
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

        this.setData({ sessionId }, () => {
          this._isCreatingDraft = false;
          this.loadDraftSession();
        });
      }).catch(err => {
        console.error('[Reshuffle] startReshuffle 失败:', err);
        wx.hideLoading();
        this._isCreatingDraft = false;

        // 已有进行中的重组，从 message 中提取 ID 并跳转
        const match = err.message && err.message.match(/ID:\s*([a-f0-9-]{36})/);
        if (match) {
          this.setData({ sessionId: match[1] }, () => {
            this.loadDraftSession();
          });
        } else {
          wx.showToast({ title: err.message || '创建失败', icon: 'none' });
        }
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
    if (this._socketTask) return;

    const token = wx.getStorageSync('token') || '';
    const reshuffleId = this.data.sessionId;

    this._socketTask = wx.connectSocket({
      url: 'wss://api.129club.cloud/ws/reshuffle',
      fail: () => {
        this._socketTask = null;
      }
    });

    this._socketTask.onOpen(() => {
      this.setData({ socketConnected: true });
      // 加入房间
      this._socketTask.send({
        data: JSON.stringify({ type: 'join', reshuffleId, token })
      });
      // 静默补齐断线期间遗漏的状态（不显示 loading）
      if (!this.data.loading) {
        this._silentRefresh();
      }
    });

    this._socketTask.onMessage((res) => {
      try {
        const msg = JSON.parse(res.data);
        this.handleSocketMessage(msg);
      } catch (e) {
        console.error('[WS] 消息解析失败', e);
      }
    });

    this._socketTask.onError(() => {
      this.setData({ socketConnected: false });
      this._socketTask = null;
      this._scheduleReconnect();
    });

    this._socketTask.onClose(() => {
      this.setData({ socketConnected: false });
      this._socketTask = null;
      // 主动断开时 _manualClose 为 true，不重连
      if (!this._manualClose) {
        this._scheduleReconnect();
      }
      this._manualClose = false;
    });
  },

  // 断开WebSocket
  disconnectSocket() {
    this._manualClose = true;
    this._clearReconnectTimer();
    if (this._socketTask) {
      this._socketTask.close();
      this._socketTask = null;
    }
    this.setData({ socketConnected: false });
  },

  // 静默刷新状态（不显示 loading，用于重连后补齐遗漏）
  _silentRefresh() {
    Promise.all([
      teamAPI.getDraftSession(this.data.sessionId),
      teamAPI.getAvailablePlayers(this.data.sessionId)
    ]).then(([sessionRes, availableRes]) => {
      const { reshuffle, currentPickOrder, currentCaptain } = sessionRes.data;
      const availablePlayers = (availableRes.data || []).map(p => ({
        id: p.id,
        name: p.realName || p.nickname,
        avatar: p.avatar,
        number: p.jerseyNumber,
        position: p.position,
        goals: p.stats?.goals || 0,
        assists: p.stats?.assists || 0,
        winRate: p.stats?.winRate || '0',
        matchesPlayed: p.stats?.matchesPlayed || 0
      }));

      const picks = (reshuffle.picks || []).slice().sort((a, b) => a.pickOrder - b.pickOrder);
      const formatPick = p => ({
        id: p.pickedUser.id,
        name: p.pickedUser.realName || p.pickedUser.nickname,
        avatar: p.pickedUser.avatar,
        number: p.pickedUser.jerseyNumber,
        position: p.pickedUser.position
      });
      const team1Players = picks.filter(p => p.teamId === reshuffle.team1Id).map(formatPick);
      const team2Players = picks.filter(p => p.teamId === reshuffle.team2Id).map(formatPick);
      const currentUserId = this.data.currentUserId;
      const isMyTurn = currentCaptain?.id === currentUserId;

      this.setData({
        availablePlayers,
        team1Players,
        team2Players,
        team1MemberNames: team1Players.map(p => p.name).join('、'),
        team2MemberNames: team2Players.map(p => p.name).join('、'),
        currentRound: currentPickOrder || 1,
        currentTurn: currentCaptain?.id === reshuffle.captain1Id ? 'captain1' : 'captain2',
        draftStatus: reshuffle.status === 'draft_in_progress' ? 'in_progress' : reshuffle.status,
        isMyTurn
      });
      this.applyFilter();
    }).catch(() => {}); // 静默失败，不打扰用户
  },

  // 延迟重连（只重建 ws，不重新请求接口）
  _scheduleReconnect() {
    this._clearReconnectTimer();
    if (!this.data.sessionId) return;
    this._reconnectTimer = setTimeout(() => {
      if (!this._socketTask && this.data.sessionId) {
        this.connectSocket();
      }
    }, 2000);
  },

  // 清除重连定时器
  _clearReconnectTimer() {
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer);
      this._reconnectTimer = null;
    }
  },

  // 处理WebSocket消息
  handleSocketMessage(msg) {
    switch (msg.type) {
      case 'joined':
        console.log('[WS] 加入房间成功');
        break;
      case 'pick':
        this.onWsPick(msg);
        break;
      case 'danmaku':
        this.onWsDanmaku(msg);
        break;
      case 'danmaku_history':
        this.onWsDanmakuHistory(msg);
        break;
      case 'viewer_joined':
        this.onWsViewerJoined(msg);
        break;
      case 'complete':
        this.onWsComplete();
        break;
    }
  },

  // 收到选人推送
  onWsPick(msg) {
    const { pick, nextCaptain, currentPickOrder } = msg;
    const { pickedUserId, teamId, pickedUser } = pick;

    // 从可选列表移除已选球员
    const availablePlayers = this.data.availablePlayers.filter(p => p.id !== pickedUserId);

    // 追加到对应队伍
    const pickedPlayer = {
      id: pickedUser?.id || pickedUserId,
      name: pickedUser?.realName || pickedUser?.nickname || '',
      avatar: pickedUser?.avatar || '',
      number: pickedUser?.jerseyNumber || ''
    };
    const isTeam1 = teamId === this.data.team1Info?.id;
    const team1Players = isTeam1 ? [...this.data.team1Players, pickedPlayer] : this.data.team1Players;
    const team2Players = !isTeam1 ? [...this.data.team2Players, pickedPlayer] : this.data.team2Players;

    // 用 nextCaptain 决定下一个该谁选人
    const currentUserId = this.data.currentUserId;
    const nextTurn = nextCaptain?.id === this.data.captain1?.id ? 'captain1' : 'captain2';
    const isMyTurn = nextCaptain?.id === currentUserId;

    // 追加选人消息
    const captainName = pick.captain?.nickname || '';
    const pickedName = pickedUser?.realName || pickedUser?.nickname || '';
    this.appendDanmaku({
      id: msg.time || Date.now(),
      nickname: captainName,
      text: `选了 ${pickedName}`,
      isSystem: true
    });

    this.setData({
      availablePlayers,
      team1Players,
      team2Players,
      team1MemberNames: team1Players.map(p => p.name).join('、'),
      team2MemberNames: team2Players.map(p => p.name).join('、'),
      currentTurn: nextTurn,
      currentRound: currentPickOrder,
      isMyTurn,
      selectedPlayerId: null
    });
    this.applyFilter();
  },

  // 收到弹幕
  onWsDanmaku(msg) {
    this.appendDanmaku({
      id: msg.time,
      nickname: msg.nickname || '游客',
      text: msg.text
    });
  },

  // 收到历史弹幕（刚加入房间时）
  onWsDanmakuHistory(msg) {
    const history = (msg.list || msg.history || []).map(d => ({
      id: d.time || d.id,
      nickname: d.nickname || '游客',
      text: d.text
    }));
    // 合并历史记录和现有消息，按 id 去重，取最后 6 条
    const existing = this.data.danmakuList;
    const existingIds = new Set(existing.map(d => d.id));
    const merged = [...history.filter(d => !existingIds.has(d.id)), ...existing];
    this.setData({ danmakuList: merged.slice(-6) });
  },

  // 有人进入房间（2秒后自动消失，2秒内复用同一条消息）
  onWsViewerJoined(msg) {
    const VIEWER_ID = 'viewer-joined';
    const nickname = msg.nickname || '游客';

    // 更新或插入消息
    const list = this.data.danmakuList;
    const idx = list.findIndex(d => d.id === VIEWER_ID);
    if (idx >= 0) {
      // 已存在，更新名字
      const newList = list.slice();
      newList[idx] = { ...newList[idx], nickname };
      this.setData({ danmakuList: newList });
    } else {
      this.appendDanmaku({
        id: VIEWER_ID,
        nickname,
        text: '来了',
        isSystem: true
      });
    }

    // 重置2秒定时器
    if (this._viewerTimer) clearTimeout(this._viewerTimer);
    this._viewerTimer = setTimeout(() => {
      const l = this.data.danmakuList.filter(d => d.id !== VIEWER_ID);
      this.setData({ danmakuList: l });
      this._viewerTimer = null;
    }, 2000);
  },


  // 追加一条弹幕
  appendDanmaku(item) {
    const danmakuList = [...this.data.danmakuList, item].slice(-6);
    this.setData({ danmakuList });
  },

  // 弹幕输入
  onDanmakuInput(e) {
    this.setData({ danmakuInput: e.detail.value });
  },

  // 发送弹幕
  onSendDanmaku() {
    const text = this.data.danmakuInput.trim();
    if (!text || !this._socketTask) return;
    this._socketTask.send({
      data: JSON.stringify({ type: 'danmaku', text })
    });
    this.setData({ danmakuInput: '' });
  },

  // 重组结束
  onWsComplete() {
    this.setData({ draftStatus: 'completed' });
    this.disconnectSocket();
  },

  // 搜索关键词变化
  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value });
    this.applyFilter();
  },

  // 清空搜索
  onSearchClear() {
    this.setData({ searchKeyword: '' });
    this.applyFilter();
  },

  // 按场次倒序 + 关键词过滤
  applyFilter() {
    const { availablePlayers, searchKeyword } = this.data;
    const keyword = searchKeyword.trim();
    let list = availablePlayers.slice();

    if (keyword) {
      list = list.filter(p => p.name && p.name.includes(keyword));
    }

    list.sort((a, b) => b.matchesPlayed - a.matchesPlayed);
    this.setData({ filteredPlayers: list });
  },

  // 选择球员
  onSelectPlayer(e) {
    const { currentUserId, captain1, captain2 } = this.data;
    const isCaptain = currentUserId === captain1?.id || currentUserId === captain2?.id;

    // 非队长静默忽略，不响应点击
    if (!isCaptain) return;

    if (!this.data.isMyTurn) {
      wx.showToast({ title: '还未轮到你选人', icon: 'none' });
      return;
    }

    this.setData({ selectedPlayerId: e.currentTarget.dataset.playerId });
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
    }).then(() => {
      wx.hideLoading();
      // 状态更新由 ws pick 消息驱动，这里只清除选中状态
      this.setData({ selectedPlayerId: null });
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

  // 管理员重置重组
  onResetReshuffle() {
    wx.showModal({
      title: '确认重置',
      content: '重置后所有已选人员清空，重新开始选人',
      confirmColor: '#e74c3c',
      success: (res) => {
        if (!res.confirm) return;
        wx.showLoading({ title: '重置中...' });
        teamAPI.resetReshuffle(this.data.sessionId).then(() => {
          wx.hideLoading();
          wx.showToast({ title: '已重置', icon: 'success' });
          this.loadDraftSession();
        }).catch(err => {
          wx.hideLoading();
          wx.showToast({ title: err.message || '重置失败', icon: 'none' });
        });
      }
    });
  },

  // 管理员结束重组
  onCompleteReshuffle() {
    wx.showModal({
      title: '确认结束重组',
      content: '结束后将正式生成队员关系，无法撤销',
      success: (res) => {
        if (!res.confirm) return;

        wx.showLoading({ title: '处理中...' });

        teamAPI.completeReshuffle(this.data.sessionId).then(() => {
          wx.hideLoading();
          wx.showToast({
            title: '重组完成',
            icon: 'success',
            duration: 1500
          });
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        }).catch(err => {
          wx.hideLoading();
          wx.showToast({
            title: err.message || '操作失败',
            icon: 'none'
          });
        });
      }
    });
  }
});
