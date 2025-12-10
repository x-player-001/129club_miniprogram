// pages/match/detail/detail.js
const app = getApp();
const matchAPI = require('../../../api/match.js');
const { getTeamLogoUrl } = require('../../../utils/dataFormatter.js');
const config = require('../../../utils/config.js');

Page({
  data: {
    matchId: '',
    matchInfo: {},
    team1Players: [],
    team2Players: [],
    team1LeavePlayers: [], // 队伍1请假人员
    team2LeavePlayers: [], // 队伍2请假人员
    currentTeam: 'team1', // 当前显示的队伍
    currentPlayers: [], // 当前显示的球员列表
    currentQuarter: 1, // 当前显示的节次
    myTeamId: '',
    isRegistered: false,
    canRegister: true,
    isAdmin: true, // 管理员权限（测试用）
    isLogin: false, // 是否登录
    isOpponentTeam: false, // 是否正在查看对手队伍
    _isFirstLoad: true, // 标记是否首次加载
    needRefresh: false, // 标记是否需要刷新
    // 图片URL
    images: {
      defaultAvatar: config.getImageUrl('default-avatar.png')
    }
  },

  onLoad(options) {
    console.log('[Match Detail] onLoad 被调用, options:', options);

    // 检查登录状态
    const isLogin = app.globalData.isLogin;
    this.setData({ isLogin });
    console.log('[Match Detail] 登录状态:', isLogin);

    if (options.id) {
      // 直接使用 this.data.matchId 赋值，不用 setData（避免异步问题）
      this.data.matchId = options.id;
      this.setData({ matchId: options.id });

      // 确保 app 初始化完成后再加载数据
      this.ensureAppReady().then(() => {
        console.log('[Match Detail] App ready, 准备加载数据');
        this.data._isFirstLoad = false;
        this.loadMatchDetail();
      });
    } else {
      console.error('[Match Detail] onLoad 没有收到 id 参数!');
    }
  },

  onShow() {
    // 防止首次加载时重复调用
    // onLoad 已经调用了 loadMatchDetail，不需要在这里再调用
    if (this.data._isFirstLoad) {
      console.log('[Match Detail] onShow: 首次加载，跳过');
      return;
    }

    // 检查是否需要刷新（从录入比赛记录页面返回）
    if (this.data.needRefresh) {
      console.log('[Match Detail] onShow: 检测到需要刷新，重新加载数据');
      this.setData({ needRefresh: false });
      this.loadMatchDetail();
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
          console.warn('[Match Detail] App 初始化超时，继续加载');
          resolve();
        }
      }, 100);
    });
  },

  onPullDownRefresh() {
    this.loadMatchDetail().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 加载比赛详情
  loadMatchDetail() {
    console.log('[Match Detail] 开始加载比赛详情, matchId:', this.data.matchId);
    wx.showLoading({ title: '加载中...' });

    // 调用真实 API
    return matchAPI.getMatchDetail(this.data.matchId).then(res => {
      console.log('[Match Detail] API 返回成功:', res);
      const match = res.data;

      // 获取用户信息 - 增加容错处理
      let userInfo = null;
      try {
        userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo') || {};
      } catch (err) {
        console.warn('[Match Detail] 获取用户信息失败:', err);
        userInfo = {};
      }

      // 检查管理员权限
      const isAdmin = userInfo?.role === 'super_admin' || userInfo?.role === 'captain';

      // 检查是否可以录入比赛记录（仅超级管理员）
      const canRecordMatch = userInfo?.role === 'super_admin';

      // 处理点球大战数据
      let penaltyShootout = {
        enabled: false,
        team1Score: 0,
        team2Score: 0,
        winner: ''
      };

      if (match.result && match.result.penaltyShootout) {
        // 将 penaltyWinnerTeamId 转换为 'team1' 或 'team2'
        let winner = '';
        if (match.result.penaltyWinnerTeamId) {
          const team1Id = match.team1?.id || match.team1Id;
          const team2Id = match.team2?.id || match.team2Id;

          if (match.result.penaltyWinnerTeamId === team1Id) {
            winner = 'team1';
          } else if (match.result.penaltyWinnerTeamId === team2Id) {
            winner = 'team2';
          }
        }

        penaltyShootout = {
          enabled: true,
          team1Score: match.result.team1PenaltyScore || 0,
          team2Score: match.result.team2PenaltyScore || 0,
          winner: winner
        };
      }

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
          logo: getTeamLogoUrl(match.team1?.logo || match.team1Logo),
          color: match.team1?.color || match.team1Color || '#ff6b6b',
          jerseyImage: this.getJerseyImageUrl(match.team1?.jerseyImage)
        },
        team2: {
          id: match.team2?.id || match.team2Id,
          name: match.team2?.name || match.team2Name,
          logo: getTeamLogoUrl(match.team2?.logo || match.team2Logo),
          color: match.team2?.color || match.team2Color || '#3498db',
          jerseyImage: this.getJerseyImageUrl(match.team2?.jerseyImage)
        },
        status: this.convertStatus(match.status),
        team1Score: match.team1Score || 0,
        team2Score: match.team2Score || 0,
        team1FinalScore: match.result?.team1FinalScore,
        team2FinalScore: match.result?.team2FinalScore,
        team1TotalGoals: match.result?.team1TotalGoals,
        team2TotalGoals: match.result?.team2TotalGoals,
        hasRecord: match.hasRecord,
        maxPlayersPerTeam: match.maxPlayersPerTeam || 11,
        maxPlayers: match.maxPlayersPerTeam || 11,
        fee: match.fee || 0,
        registrationDeadline: match.registrationDeadline,
        description: match.description,
        creator: {
          name: match.creator?.nickname || match.creator?.realName || '管理员',
          avatar: match.creator?.avatar ? config.getStaticUrl(match.creator.avatar, 'avatars') : config.getImageUrl('default-avatar.png')
        },
        createdAt: match.createdAt,
        // 比赛结果数据（已完成的比赛）
        result: match.result || null,
        // 比赛事件（已完成的比赛）
        events: match.events || [],
        // 点球大战数据
        penaltyShootout: penaltyShootout
      };

      // 更新标题
      wx.setNavigationBarTitle({
        title: matchInfo.title || '比赛详情'
      });

      this.setData({
        matchInfo,
        isAdmin,
        canRecordMatch
      });

      // 如果比赛是进行中或已完成，加载比赛数据（节次、事件、MVP等）
      if (matchInfo.status === 'ongoing' || matchInfo.status === 'finished') {
        this.loadMatchData(matchInfo);
      }

      // 加载报名列表
      return this.loadRegistrations(matchInfo, userInfo);
    }).catch(err => {
      console.error('[Match Detail] 加载比赛详情失败:', err);
      console.error('[Match Detail] 错误详情:', JSON.stringify(err));
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

  // 获取球衣图片完整URL
  getJerseyImageUrl(jerseyImage) {
    if (!jerseyImage) return '';
    if (jerseyImage.startsWith('http')) return jerseyImage;
    return config.getStaticUrl(jerseyImage, 'images');
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

      // 格式化比赛结果数据
      const result = data.result || {
        quarters: data.quarters || [],
        mvp: data.mvp ? {
          ...data.mvp,
          avatar: data.mvp.avatar ? config.getStaticUrl(data.mvp.avatar, 'avatars') : config.getImageUrl('default-avatar.png')
        } : null,
        mvpUserIds: data.mvpUserIds || [],
        attendance: data.attendance || null,
        photos: [] // 默认空数组
      };

      // 处理比赛照片URL
      if (data.result && data.result.photos && data.result.photos.length > 0) {
        result.photos = data.result.photos.map(photoUrl =>
          config.getStaticUrl(photoUrl, 'matchPhotos')
        );
      } else {
        result.photos = [];
      }

      // 保留其他 result 字段
      if (data.result) {
        result.summary = data.result.summary || '';
      }

      // 基于 quarters 数据创建 quarterEvents（即使没有事件也要显示节次）
      const quarterEvents = [];
      if (data.quarters && data.quarters.length > 0) {
        data.quarters.forEach(q => {
          quarterEvents.push({
            quarterNumber: q.quarterNumber,
            quarterLabel: `第${q.quarterNumber}节`,
            events: quarterGroups[q.quarterNumber] || [], // 该节次的事件（可能为空）
            team1Score: q.team1Goals || q.team1Points || 0,
            team2Score: q.team2Goals || q.team2Points || 0,
            // 裁判和守门员信息
            mainReferee: q.mainReferee || null,
            assistantReferee1: q.assistantReferee1 || null,
            assistantReferee2: q.assistantReferee2 || null,
            team1Goalkeeper: q.team1Goalkeeper || null,
            team2Goalkeeper: q.team2Goalkeeper || null
          });
        });
      } else {
        // 如果没有 quarters 数据，但有事件，则根据事件创建（兼容旧数据）
        Object.keys(quarterGroups)
          .sort((a, b) => a - b)
          .forEach(quarter => {
            quarterEvents.push({
              quarterNumber: parseInt(quarter),
              quarterLabel: `第${quarter}节`,
              events: quarterGroups[quarter],
              team1Score: 0,
              team2Score: 0
            });
          });
      }

      // 计算累计积分和总进球数
      let totalTeam1Score = 0; // 累计积分
      let totalTeam2Score = 0;
      let totalTeam1Goals = 0; // 总进球数
      let totalTeam2Goals = 0;

      if (data.quarters && data.quarters.length > 0) {
        data.quarters.forEach(q => {
          // 累加进球数
          totalTeam1Goals += (q.team1Goals || 0);
          totalTeam2Goals += (q.team2Goals || 0);
          // 累加积分（每节：胜3分，平1分，负0分）
          totalTeam1Score += (q.team1Points || 0);
          totalTeam2Score += (q.team2Points || 0);
        });
      }

      // 更新比赛信息，默认显示第一节
      // team1Score/team2Score 显示累计积分，team1TotalGoals/team2TotalGoals 显示总进球数
      this.setData({
        'matchInfo.events': events,
        'matchInfo.quarterEvents': quarterEvents, // 按节次分组的事件
        'matchInfo.result': result,
        'matchInfo.team1Score': totalTeam1Score || matchInfo.team1Score || 0,
        'matchInfo.team2Score': totalTeam2Score || matchInfo.team2Score || 0,
        'matchInfo.team1TotalGoals': totalTeam1Goals,
        'matchInfo.team2TotalGoals': totalTeam2Goals,
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
      // API返回的数据结构是 {team1: [], team2: [], team1Leave: [], team2Leave: [], team1Count: 7, team2Count: 6}
      const data = registrationRes.data || {};
      const team1Registrations = data.team1 || [];
      const team2Registrations = data.team2 || [];

      // 获取请假人员数据
      const team1Leave = data.team1Leave || [];
      const team2Leave = data.team2Leave || [];

      // 获取实际到场人员列表
      let team1Participants = [];
      let team2Participants = [];
      const attendanceIds = [];

      if (matchInfo.status === 'finished' && participantsRes) {
        const participantsData = participantsRes.data || {};
        team1Participants = participantsData.team1 || [];
        team2Participants = participantsData.team2 || [];

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

      // 使用 Map 合并报名和到场数据（方案1：显示所有报名+临时参加的球员）
      const team1PlayersMap = new Map();
      const team2PlayersMap = new Map();

      // 1. 先添加所有报名球员
      team1Registrations.forEach(player => {
        const playerId = player.userId || player.user?.id;
        const avatarPath = player.user?.avatar || player.avatar;
        team1PlayersMap.set(playerId, {
          id: playerId,
          realName: player.user?.realName || player.realName,
          nickname: player.user?.nickname || player.nickname,
          name: player.user?.realName || player.user?.nickname || player.name,
          avatar: avatarPath ? config.getStaticUrl(avatarPath, 'avatars') : config.getImageUrl('default-avatar.png'),
          jerseyNumber: player.user?.jerseyNumber || player.jerseyNumber,
          position: player.user?.position || player.position,
          isCaptain: player.isCaptain || false,
          teamName: matchInfo.team1.name,
          teamColor: matchInfo.team1.color,
          isAttended: matchInfo.status === 'finished' ? attendanceIds.includes(playerId) : true,
          isMvp: matchInfo.status === 'finished' ? mvpIds.includes(playerId) : false,
          isWalkIn: false, // 报名球员，非临时参加
          memberType: player.user?.memberType || player.memberType || 'regular', // 添加 memberType 字段
          leftFootSkill: Number(player.user?.leftFootSkill || player.leftFootSkill || 0),
          rightFootSkill: Number(player.user?.rightFootSkill || player.rightFootSkill || 0)
        });
      });

      team2Registrations.forEach(player => {
        const playerId = player.userId || player.user?.id;
        const avatarPath = player.user?.avatar || player.avatar;
        team2PlayersMap.set(playerId, {
          id: playerId,
          realName: player.user?.realName || player.realName,
          nickname: player.user?.nickname || player.nickname,
          name: player.user?.realName || player.user?.nickname || player.name,
          avatar: avatarPath ? config.getStaticUrl(avatarPath, 'avatars') : config.getImageUrl('default-avatar.png'),
          jerseyNumber: player.user?.jerseyNumber || player.jerseyNumber,
          position: player.user?.position || player.position,
          isCaptain: player.isCaptain || false,
          teamName: matchInfo.team2.name,
          teamColor: matchInfo.team2.color,
          isAttended: matchInfo.status === 'finished' ? attendanceIds.includes(playerId) : true,
          isMvp: matchInfo.status === 'finished' ? mvpIds.includes(playerId) : false,
          isWalkIn: false, // 报名球员，非临时参加
          memberType: player.user?.memberType || player.memberType || 'regular', // 添加 memberType 字段
          leftFootSkill: Number(player.user?.leftFootSkill || player.leftFootSkill || 0),
          rightFootSkill: Number(player.user?.rightFootSkill || player.rightFootSkill || 0)
        });
      });

      // 2. 添加临时参加的球员（到场但未报名）
      if (matchInfo.status === 'finished') {
        team1Participants.forEach(participant => {
          const playerId = participant.userId || participant.user?.id;
          // 如果这个球员没有报名，添加为临时参加
          if (!team1PlayersMap.has(playerId)) {
            const avatarPath = participant.user?.avatar || participant.avatar;
            team1PlayersMap.set(playerId, {
              id: playerId,
              realName: participant.user?.realName || participant.realName,
              nickname: participant.user?.nickname || participant.nickname,
              name: participant.user?.realName || participant.user?.nickname || participant.name,
              avatar: avatarPath ? config.getStaticUrl(avatarPath, 'avatars') : config.getImageUrl('default-avatar.png'),
              jerseyNumber: participant.user?.jerseyNumber || participant.jerseyNumber,
              position: participant.user?.position || participant.position,
              isCaptain: false,
              teamName: matchInfo.team1.name,
              teamColor: matchInfo.team1.color,
              isAttended: true, // 临时参加的球员一定是到场的
              isMvp: mvpIds.includes(playerId),
              isWalkIn: true, // 标记为临时参加
              memberType: participant.user?.memberType || participant.memberType || 'regular', // 添加 memberType 字段
              leftFootSkill: Number(participant.user?.leftFootSkill || participant.leftFootSkill || 0),
              rightFootSkill: Number(participant.user?.rightFootSkill || participant.rightFootSkill || 0)
            });
          }
        });

        team2Participants.forEach(participant => {
          const playerId = participant.userId || participant.user?.id;
          // 如果这个球员没有报名，添加为临时参加
          if (!team2PlayersMap.has(playerId)) {
            const avatarPath = participant.user?.avatar || participant.avatar;
            team2PlayersMap.set(playerId, {
              id: playerId,
              realName: participant.user?.realName || participant.realName,
              nickname: participant.user?.nickname || participant.nickname,
              name: participant.user?.realName || participant.user?.nickname || participant.name,
              avatar: avatarPath ? config.getStaticUrl(avatarPath, 'avatars') : config.getImageUrl('default-avatar.png'),
              jerseyNumber: participant.user?.jerseyNumber || participant.jerseyNumber,
              position: participant.user?.position || participant.position,
              isCaptain: false,
              teamName: matchInfo.team2.name,
              teamColor: matchInfo.team2.color,
              isAttended: true, // 临时参加的球员一定是到场的
              isMvp: mvpIds.includes(playerId),
              isWalkIn: true, // 标记为临时参加
              memberType: participant.user?.memberType || participant.memberType || 'regular', // 添加 memberType 字段
              leftFootSkill: Number(participant.user?.leftFootSkill || participant.leftFootSkill || 0),
              rightFootSkill: Number(participant.user?.rightFootSkill || participant.rightFootSkill || 0)
            });
          }
        });
      }

      // 3. 转换 Map 为数组，并将MVP排到最前面
      const team1PlayersData = Array.from(team1PlayersMap.values()).sort((a, b) => {
        // MVP优先
        if (a.isMvp && !b.isMvp) return -1;
        if (!a.isMvp && b.isMvp) return 1;
        // 其他按原顺序
        return 0;
      });
      const team2PlayersData = Array.from(team2PlayersMap.values()).sort((a, b) => {
        // MVP优先
        if (a.isMvp && !b.isMvp) return -1;
        if (!a.isMvp && b.isMvp) return 1;
        // 其他按原顺序
        return 0;
      });

      // 判断当前用户所属队伍 - 增加安全检查
      const myTeamId = userInfo?.teamId || userInfo?.currentTeam?.id || app.globalData.currentTeam?.id || '';

      // 判断是否已报名（检查两个队伍的报名数据） - 增加安全检查
      const allRegistrations = [...team1Registrations, ...team2Registrations];
      const userId = userInfo?.id || '';
      const isRegistered = userId ? allRegistrations.some(reg =>
        (reg.userId || reg.user?.id) === userId
      ) : false;

      // 判断是否可以报名 - 增加安全检查（基于报名人数，不包括临时参加）
      const myTeamRegistrations = myTeamId === matchInfo.team1.id ? team1Registrations : team2Registrations;
      const canRegister = matchInfo.status === 'upcoming' &&
                         !isRegistered &&
                         userId &&
                         myTeamRegistrations.length < matchInfo.maxPlayers;

      // 更新比赛信息中的报名人数（仅报名球员，不包括临时参加）
      this.setData({
        'matchInfo.team1RegisteredCount': data.team1Count || team1Registrations.length,
        'matchInfo.team2RegisteredCount': data.team2Count || team2Registrations.length
      });

      // 确定默认显示的队伍（优先显示用户所在队伍）
      let currentTeam = 'team1';
      if (myTeamId === matchInfo.team2.id) {
        currentTeam = 'team2';
      }

      // 计算当前显示的球员列表
      const currentPlayers = currentTeam === 'team1' ? team1PlayersData : team2PlayersData;

      // 判断默认显示的队伍是否为对手队伍（仅未开始的比赛需要判断）
      const team1Id = matchInfo.team1.id;
      const team2Id = matchInfo.team2.id;
      const viewingTeamId = currentTeam === 'team1' ? team1Id : team2Id;
      const isOpponentTeam = myTeamId && viewingTeamId !== myTeamId && matchInfo.status === 'upcoming';

      // 转换请假人员数据
      const team1LeavePlayers = team1Leave.map(leave => ({
        id: leave.userId,
        avatar: leave.user?.avatar ? config.getStaticUrl(leave.user.avatar, 'avatars') : config.getImageUrl('default-avatar.png'),
        realName: leave.user?.realName,
        nickname: leave.user?.nickname,
        jerseyNumber: leave.user?.jerseyNumber,
        memberType: leave.user?.memberType || 'regular',
        reason: leave.notes || leave.reason || '',
        isOnLeave: true
      }));

      const team2LeavePlayers = team2Leave.map(leave => ({
        id: leave.userId,
        avatar: leave.user?.avatar ? config.getStaticUrl(leave.user.avatar, 'avatars') : config.getImageUrl('default-avatar.png'),
        realName: leave.user?.realName,
        nickname: leave.user?.nickname,
        jerseyNumber: leave.user?.jerseyNumber,
        memberType: leave.user?.memberType || 'regular',
        reason: leave.notes || leave.reason || '',
        isOnLeave: true
      }));

      // 计算实际到场人数（仅已完成的比赛）
      let team1AttendedCount = team1PlayersData.length;
      let team2AttendedCount = team2PlayersData.length;
      let totalAttendedCount = team1PlayersData.length + team2PlayersData.length;

      if (matchInfo.status === 'finished') {
        team1AttendedCount = team1PlayersData.filter(p => p.isAttended).length;
        team2AttendedCount = team2PlayersData.filter(p => p.isAttended).length;
        totalAttendedCount = team1AttendedCount + team2AttendedCount;
      }

      this.setData({
        team1Players: team1PlayersData,
        team2Players: team2PlayersData,
        team1LeavePlayers: team1LeavePlayers,
        team2LeavePlayers: team2LeavePlayers,
        currentTeam: currentTeam,
        currentPlayers: currentPlayers,
        myTeamId: myTeamId,
        isRegistered: isRegistered,
        canRegister: canRegister,
        isOpponentTeam: isOpponentTeam,
        // 添加到场人数统计
        team1AttendedCount: team1AttendedCount,
        team2AttendedCount: team2AttendedCount,
        totalAttendedCount: totalAttendedCount
      });

      wx.hideLoading();
    }).catch(err => {
      console.error('加载报名列表失败:', err);
      wx.hideLoading();
    });
  },

  // 跳转到报名页面
  onGoToRegister() {
    // 游客模式，提示登录
    if (!this.data.isLogin) {
      app.showLoginGuide('报名比赛需要先登录');
      return;
    }

    wx.navigateTo({
      url: `/pages/match/register/register?id=${this.data.matchId}`
    });
  },

  // 取消报名
  onCancelRegister() {
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
    const matchAPI = require('../../../api/match.js');
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
        this.loadMatchDetail();
      }, 1500);
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({
        title: err.message || '取消失败',
        icon: 'none'
      });
    });
  },

  // 切换队伍
  onSwitchTeam(e) {
    const team = e.currentTarget.dataset.team;
    if (team === this.data.currentTeam) {
      return;
    }

    const currentPlayers = team === 'team1' ? this.data.team1Players : this.data.team2Players;

    // 判断是否为对手队伍（仅未开始的比赛需要判断）
    const myTeamId = this.data.myTeamId;
    const team1Id = this.data.matchInfo.team1.id;
    const team2Id = this.data.matchInfo.team2.id;
    const viewingTeamId = team === 'team1' ? team1Id : team2Id;
    const isOpponentTeam = myTeamId && viewingTeamId !== myTeamId && this.data.matchInfo.status === 'upcoming';

    this.setData({
      currentTeam: team,
      currentPlayers: currentPlayers,
      isOpponentTeam: isOpponentTeam
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
      url: `/pages/user/stats/stats?id=${id}`  // 使用 id 而不是 userId
    });
  },

  // 预览比赛照片
  onPreviewPhoto(e) {
    const index = e.currentTarget.dataset.index;
    const photos = this.data.matchInfo.result?.photos || [];

    if (photos.length > 0) {
      wx.previewImage({
        urls: photos,
        current: photos[index]
      });
    }
  },

  // player-card 组件点击事件 - 防止重复跳转
  onPlayerCardTap(e) {
    const { playerId } = e.detail;
    console.log('[Match Detail] onPlayerCardTap 被调用, playerId:', playerId);

    // 防御性检查：确保 playerId 存在且有效
    if (!playerId || playerId === 'undefined' || typeof playerId === 'undefined') {
      console.error('[Match Detail] playerId 无效，取消导航');
      return;
    }

    // 防止重复跳转（真机上可能因为性能问题导致重复触发）
    if (this._navigating) {
      console.log('[Match Detail] 防抖：忽略重复跳转');
      return;
    }
    this._navigating = true;

    console.log('[Match Detail] 正在跳转到球员统计:', playerId);
    wx.navigateTo({
      url: `/pages/user/stats/stats?id=${playerId}`,  // 使用 id 而不是 userId
      success: () => {
        console.log('[Match Detail] 跳转成功');
        setTimeout(() => {
          this._navigating = false;
        }, 500);
      },
      fail: (err) => {
        console.error('[Match Detail] 跳转失败:', err);
        this._navigating = false;
      }
    });
  },

  // 逐节录入（直接进入）
  onManualRecord() {
    // 游客模式，提示登录
    if (!this.data.isLogin) {
      app.showLoginGuide('录入比赛记录需要先登录');
      return;
    }

    wx.navigateTo({
      url: `/pages/match/record/record?id=${this.data.matchId}`
    });
  },

  // 获取分享图片URL（根据比赛状态）
  getShareImageUrl(status, customImage) {
    // 优先使用自定义图片
    if (customImage) {
      return config.getStaticUrl(customImage, 'shareImages');
    }

    // 根据比赛状态返回对应图片
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

    // 根据比赛状态生成不同的分享标题
    let title = '';

    if (matchInfo.status === 'upcoming') {
      // 未开始的比赛
      const team1Count = matchInfo.team1RegisteredCount || 0;
      const team2Count = matchInfo.team2RegisteredCount || 0;
      const totalRegistered = team1Count + team2Count;
      const maxTotal = (matchInfo.maxPlayersPerTeam || 11) * 2;

      if (totalRegistered >= maxTotal) {
        title = `⚽ ${matchInfo.title} | 报名已满，等你来战！`;
      } else {
        title = `⚽ ${matchInfo.title} | 已集结${totalRegistered}人，快来报名！`;
      }
    } else if (matchInfo.status === 'ongoing') {
      // 进行中的比赛
      title = `🔥 ${matchInfo.title} 正在激烈进行中！`;
    } else if (matchInfo.status === 'finished') {
      // 已结束的比赛
      const score1 = matchInfo.team1FinalScore || matchInfo.team1Score || 0;
      const score2 = matchInfo.team2FinalScore || matchInfo.team2Score || 0;
      title = `📊 ${matchInfo.title} | 比分 ${score1}:${score2}`;
    } else {
      title = `⚽ ${matchInfo.title} | 129俱乐部`;
    }

    return {
      title: title,
      path: `/pages/match/detail/detail?id=${this.data.matchId}`,
      imageUrl: this.getShareImageUrl(matchInfo.status, matchInfo.shareImage)
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    const matchInfo = this.data.matchInfo;

    return {
      title: `${matchInfo.title} | 129俱乐部`,
      query: `id=${this.data.matchId}`,
      imageUrl: this.getShareImageUrl(matchInfo.status, matchInfo.shareImage)
    };
  }
});
