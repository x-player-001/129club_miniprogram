// pages/match/detail/detail.js
const app = getApp();
const matchAPI = require('../../../api/match.js');

Page({
  data: {
    matchId: '',
    matchInfo: {},
    team1Players: [],
    team2Players: [],
    currentTeam: 'team1', // 当前显示的队伍
    currentPlayers: [], // 当前显示的球员列表
    currentQuarter: 1, // 当前显示的节次
    myTeamId: '',
    isRegistered: false,
    canRegister: true,
    isAdmin: true // 管理员权限（测试用）
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ matchId: options.id });
      this.loadMatchDetail();
    }
  },

  onShow() {
    // 每次显示时刷新数据
    if (this.data.matchId) {
      this.loadMatchDetail();
    }
  },

  onPullDownRefresh() {
    this.loadMatchDetail().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 加载比赛详情
  loadMatchDetail() {
    wx.showLoading({ title: '加载中...' });

    // 调用真实 API
    return matchAPI.getMatchDetail(this.data.matchId).then(res => {
      const match = res.data;
      const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo');

      // 检查管理员权限
      const isAdmin = userInfo?.role === 'super_admin' || userInfo?.role === 'captain';

      // 格式化比赛信息
      const date = new Date(match.matchDate || match.datetime);
      const matchInfo = {
        id: match.id,
        title: match.title,
        datetime: match.matchDate || match.datetime,
        dateDay: date.getDate(),
        dateMonth: `${date.getMonth() + 1}月`,
        time: `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`,
        location: match.location,
        address: match.address,
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
        hasRecord: match.hasRecord,
        maxPlayersPerTeam: match.maxPlayersPerTeam || 11,
        maxPlayers: match.maxPlayersPerTeam || 11,
        fee: match.fee || 0,
        registrationDeadline: match.registrationDeadline,
        description: match.description,
        creator: {
          name: match.creator?.nickname || match.creator?.realName || '管理员',
          avatar: match.creator?.avatar || '/static/images/default-avatar.png'
        },
        createdAt: match.createdAt,
        // 比赛结果数据（已完成的比赛）
        result: match.result || null,
        // 比赛事件（已完成的比赛）
        events: match.events || []
      };

      // 更新标题
      wx.setNavigationBarTitle({
        title: matchInfo.title || '比赛详情'
      });

      this.setData({
        matchInfo,
        isAdmin
      });

      // 如果比赛是进行中或已完成，加载比赛数据（节次、事件、MVP等）
      if (matchInfo.status === 'ongoing' || matchInfo.status === 'finished') {
        this.loadMatchData(matchInfo);
      }

      // 加载报名列表
      return this.loadRegistrations(matchInfo, userInfo);
    }).catch(err => {
      console.error('加载比赛详情失败:', err);
      wx.hideLoading();
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    });
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

  // 加载比赛数据（节次、事件、MVP等）
  loadMatchData(matchInfo) {
    matchAPI.getQuarterDetail(this.data.matchId).then(res => {
      const data = res.data || {};

      console.log('比赛数据详情:', data);

      // 格式化比赛事件数据 - 将后端数据格式转换为组件需要的格式
      const events = (data.events || []).map(event => ({
        id: event.id,
        matchId: event.matchId,
        teamId: event.teamId,
        userId: event.userId,
        eventType: event.eventType,
        eventSubtype: event.eventSubtype,
        minute: event.minute,
        quarterNumber: event.quarterNumber,
        // 格式化球员名称
        playerName: event.user?.realName || event.user?.nickname || '未知球员',
        // 格式化助攻球员名称
        assistName: event.assistUser?.realName || event.assistUser?.nickname || null,
        assistUserId: event.assistUserId,
        // 其他字段
        notes: event.notes || '',
        isOwnGoal: event.eventSubtype === 'own_goal',
        recordedAt: event.recordedAt,
        recordedBy: event.recordedBy
      }));

      // 按节次分组事件
      const quarterGroups = {};
      events.forEach(event => {
        const quarter = event.quarterNumber || 1;
        if (!quarterGroups[quarter]) {
          quarterGroups[quarter] = [];
        }
        quarterGroups[quarter].push(event);
      });

      // 转换为数组格式，方便渲染
      const quarterEvents = Object.keys(quarterGroups)
        .sort((a, b) => a - b)
        .map(quarter => ({
          quarterNumber: parseInt(quarter),
          quarterLabel: `第${quarter}节`,
          events: quarterGroups[quarter],
          team1Score: 0, // 这个节次的比分需要从后端数据计算
          team2Score: 0
        }));

      // 格式化比赛结果数据
      const result = data.result || {
        quarters: data.quarters || [],
        mvp: data.mvp || null,
        mvpUserIds: data.mvpUserIds || [],
        attendance: data.attendance || null
      };

      // 如果有quarters数据，更新每节的比分
      if (data.quarters && data.quarters.length > 0) {
        data.quarters.forEach(q => {
          const quarterData = quarterEvents.find(qe => qe.quarterNumber === q.quarterNumber);
          if (quarterData) {
            // 后端返回的字段是 team1Goals/team2Goals 或 team1Points/team2Points
            quarterData.team1Score = q.team1Goals || q.team1Points || 0;
            quarterData.team2Score = q.team2Goals || q.team2Points || 0;
          }
        });
      }

      // 计算总进球数（如果后端没有返回totalGoals，则从quarters累加）
      let totalTeam1Goals = 0;
      let totalTeam2Goals = 0;

      if (data.quarters && data.quarters.length > 0) {
        data.quarters.forEach(q => {
          totalTeam1Goals += (q.team1Goals || 0);
          totalTeam2Goals += (q.team2Goals || 0);
        });
      }

      // 更新比赛信息，默认显示第一节
      this.setData({
        'matchInfo.events': events,
        'matchInfo.quarterEvents': quarterEvents, // 按节次分组的事件
        'matchInfo.result': result,
        'matchInfo.team1Score': totalTeam1Goals || matchInfo.team1Score || 0,
        'matchInfo.team2Score': totalTeam2Goals || matchInfo.team2Score || 0,
        currentQuarter: quarterEvents.length > 0 ? quarterEvents[0].quarterNumber : 1
      });

      console.log('按节次分组的事件:', quarterEvents);
    }).catch(err => {
      console.error('加载比赛数据失败:', err);
    });
  },

  // 加载报名列表
  loadRegistrations(matchInfo, userInfo) {
    // 如果比赛已完成,需要额外获取实际到场人员
    const participantsPromise = matchInfo.status === 'finished'
      ? matchAPI.getParticipants(this.data.matchId)
      : Promise.resolve(null);

    return Promise.all([
      matchAPI.getRegistrationList(this.data.matchId),
      participantsPromise
    ]).then(([registrationRes, participantsRes]) => {
      // API返回的数据结构是 {team1: [], team2: [], team1Count: 7, team2Count: 6}
      const data = registrationRes.data || {};
      const team1Players = data.team1 || [];
      const team2Players = data.team2 || [];

      // 获取实际到场人员ID列表
      const attendanceIds = [];
      if (matchInfo.status === 'finished' && participantsRes) {
        const participantsData = participantsRes.data || {};
        const team1Participants = participantsData.team1 || [];
        const team2Participants = participantsData.team2 || [];

        // 收集所有到场球员的ID
        team1Participants.forEach(p => {
          attendanceIds.push(p.userId || p.user?.id);
        });
        team2Participants.forEach(p => {
          attendanceIds.push(p.userId || p.user?.id);
        });

        console.log('[Match Detail] 到场人员ID列表:', attendanceIds);
      }

      // 获取MVP球员ID列表（从比赛结果中）
      const mvpIds = [];
      if (matchInfo.status === 'finished' && matchInfo.result && matchInfo.result.mvpUserIds) {
        mvpIds.push(...matchInfo.result.mvpUserIds);
        console.log('[Match Detail] MVP球员ID列表:', mvpIds);
      }

      // 格式化球员数据,添加isAttended和isMvp标记
      const team1PlayersData = team1Players.map(player => {
        const playerId = player.userId || player.user?.id;
        return {
          id: playerId,
          realName: player.user?.realName || player.realName,
          nickname: player.user?.nickname || player.nickname,
          name: player.user?.realName || player.user?.nickname || player.name,
          avatar: player.user?.avatar || '/static/images/default-avatar.png',
          jerseyNumber: player.user?.jerseyNumber || player.jerseyNumber,
          position: player.user?.position || player.position,
          isCaptain: player.isCaptain || false,
          teamName: matchInfo.team1.name,
          teamColor: matchInfo.team1.color,
          isAttended: matchInfo.status === 'finished' ? attendanceIds.includes(playerId) : true,
          isMvp: matchInfo.status === 'finished' ? mvpIds.includes(playerId) : false
        };
      });

      const team2PlayersData = team2Players.map(player => {
        const playerId = player.userId || player.user?.id;
        return {
          id: playerId,
          realName: player.user?.realName || player.realName,
          nickname: player.user?.nickname || player.nickname,
          name: player.user?.realName || player.user?.nickname || player.name,
          avatar: player.user?.avatar || '/static/images/default-avatar.png',
          jerseyNumber: player.user?.jerseyNumber || player.jerseyNumber,
          position: player.user?.position || player.position,
          isCaptain: player.isCaptain || false,
          teamName: matchInfo.team2.name,
          teamColor: matchInfo.team2.color,
          isAttended: matchInfo.status === 'finished' ? attendanceIds.includes(playerId) : true,
          isMvp: matchInfo.status === 'finished' ? mvpIds.includes(playerId) : false
        };
      });

      // 判断当前用户所属队伍
      const myTeamId = userInfo.teamId || app.globalData.currentTeam?.id;

      // 判断是否已报名（检查两个队伍的数据）
      const allPlayers = [...team1Players, ...team2Players];
      const isRegistered = allPlayers.some(reg =>
        (reg.userId || reg.user?.id) === userInfo.id
      );

      // 判断是否可以报名
      const myTeamPlayers = myTeamId === matchInfo.team1.id ? team1Players : team2Players;
      const canRegister = matchInfo.status === 'upcoming' &&
                         !isRegistered &&
                         myTeamPlayers.length < matchInfo.maxPlayers;

      // 更新比赛信息中的报名人数
      this.setData({
        'matchInfo.team1RegisteredCount': data.team1Count || team1Players.length,
        'matchInfo.team2RegisteredCount': data.team2Count || team2Players.length
      });

      // 确定默认显示的队伍（优先显示用户所在队伍）
      let currentTeam = 'team1';
      if (myTeamId === matchInfo.team2.id) {
        currentTeam = 'team2';
      }

      // 计算当前显示的球员列表
      const currentPlayers = currentTeam === 'team1' ? team1PlayersData : team2PlayersData;

      this.setData({
        team1Players: team1PlayersData,
        team2Players: team2PlayersData,
        currentTeam: currentTeam,
        currentPlayers: currentPlayers,
        myTeamId: myTeamId,
        isRegistered: isRegistered,
        canRegister: canRegister
      });

      wx.hideLoading();
    }).catch(err => {
      console.error('加载报名列表失败:', err);
      wx.hideLoading();
    });
  },

  // 跳转到报名页面
  onGoToRegister() {
    wx.navigateTo({
      url: `/pages/match/register/register?id=${this.data.matchId}`
    });
  },

  // 切换队伍
  onSwitchTeam(e) {
    const team = e.currentTarget.dataset.team;
    if (team === this.data.currentTeam) {
      return;
    }

    const currentPlayers = team === 'team1' ? this.data.team1Players : this.data.team2Players;
    this.setData({
      currentTeam: team,
      currentPlayers: currentPlayers
    });
  },

  // 切换节次
  onSwitchQuarter(e) {
    const quarter = parseInt(e.currentTarget.dataset.quarter);
    if (quarter === this.data.currentQuarter) {
      return;
    }

    this.setData({
      currentQuarter: quarter
    });
  },

  // 分享按钮
  onShare() {
    // 触发页面的分享功能
    // 微信小程序会自动调用 onShareAppMessage
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  // 查看地图
  onViewMap() {
    // 模拟地址坐标
    const latitude = 29.65;
    const longitude = 106.55;

    wx.openLocation({
      latitude: latitude,
      longitude: longitude,
      name: this.data.matchInfo.location,
      address: this.data.matchInfo.address,
      scale: 15
    });
  },

  // 查看球员详情
  onViewPlayer(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/user/stats/stats?userId=${id}`
    });
  },

  // player-card 组件点击事件
  onPlayerCardTap(e) {
    const { playerId } = e.detail;
    wx.navigateTo({
      url: `/pages/user/stats/stats?userId=${playerId}`
    });
  },

  // 逐节录入（直接进入）
  onManualRecord() {
    wx.navigateTo({
      url: `/pages/match/record/record?id=${this.data.matchId}`
    });
  },

  // 分享比赛
  onShareAppMessage() {
    return {
      title: this.data.matchInfo.title || '比赛邀请',
      path: `/pages/match/detail/detail?id=${this.data.matchId}`,
      imageUrl: '/static/images/logo.png'
    };
  }
});
