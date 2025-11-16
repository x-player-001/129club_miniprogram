// pages/match/record/record.js
const app = getApp();
const matchAPI = require('../../../api/match.js');
const uploadAPI = require('../../../api/upload.js');

Page({
  data: {
    matchId: '',
    matchInfo: null,

    // 当前步骤 (1-7)
    currentStep: 1,
    steps: [
      { id: 1, name: '基本信息' },
      { id: 2, name: '第1节' },
      { id: 3, name: '第2节' },
      { id: 4, name: '第3节' },
      { id: 5, name: '第4节' },
      { id: 6, name: '到场人员' },
      { id: 7, name: 'MVP' }
    ],

    // 4节制开关
    quarterSystem: true,

    // 4节数据
    quarters: [
      { quarterNumber: 1, team1Goals: 0, team2Goals: 0, team1Points: 0, team2Points: 0, summary: '', events: [] },
      { quarterNumber: 2, team1Goals: 0, team2Goals: 0, team1Points: 0, team2Points: 0, summary: '', events: [] },
      { quarterNumber: 3, team1Goals: 0, team2Goals: 0, team1Points: 0, team2Points: 0, summary: '', events: [] },
      { quarterNumber: 4, team1Goals: 0, team2Goals: 0, team1Points: 0, team2Points: 0, summary: '', events: [] }
    ],

    // 累计得分和进球
    totalTeam1Score: 0,
    totalTeam2Score: 0,
    totalTeam1Goals: 0,
    totalTeam2Goals: 0,

    // 点球大战
    penaltyShootout: {
      enabled: false,        // 是否进行了点球大战
      team1Score: 0,         // 队伍1点球比分
      team2Score: 0,         // 队伍2点球比分
      winner: ''             // 获胜方 ('team1' 或 'team2')
    },
    needPenalty: false,      // 是否需要点球大战（平局标志）

    // 到场人员
    participants: {
      team1: [],
      team2: []
    },
    participantIds: {
      team1: [],
      team2: []
    },
    showParticipantPicker: false,
    currentPickerTeam: null,

    // 球员列表
    team1Players: [],
    team2Players: [],
    allPlayers: [],
    playerNames: [],
    team1RegisteredIds: [], // 队伍1报名球员ID
    team2RegisteredIds: [], // 队伍2报名球员ID

    // MVP
    mvpUserIds: [],
    mvpPlayers: [], // MVP球员完整信息（包含头像、姓名、号码）
    mvpPlayerNames: '',
    showMvpPicker: false,

    // 比赛简报
    summary: '',

    // 照片
    photos: [],
    maxPhotos: 9,

    // UI状态
    isSubmitting: false,
    showScorePreview: false
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

    // 获取比赛详情、报名列表、全局球员列表、已录入的节次数据、到场人员数据
    Promise.all([
      matchAPI.getMatchDetail(this.data.matchId),
      matchAPI.getRegistrationList(this.data.matchId),
      app.loadAllPlayers(), // 从全局缓存加载球员列表
      matchAPI.getQuarterDetail(this.data.matchId), // 获取已录入的节次数据
      matchAPI.getParticipants(this.data.matchId) // 获取已保存的到场人员
    ]).then(([matchRes, registrationRes, allPlayersList, quarterRes, participantsRes]) => {
      const match = matchRes.data;
      const registration = registrationRes.data;
      const quarterData = quarterRes.data;

      // 构建比赛信息
      const matchInfo = {
        id: match.id,
        title: match.title,
        date: match.matchDate ? match.matchDate.split('T')[0] : '',
        time: match.matchDate ? match.matchDate.split('T')[1].substring(0, 5) : '',
        location: match.location,
        status: match.status,
        quarterSystem: true, // 默认使用节次系统
        team1: {
          id: match.team1.id,
          name: match.team1.name,
          logo: match.team1.logo || '/static/images/logoa.png',
          color: match.team1.color || '#f20810'
        },
        team2: {
          id: match.team2.id,
          name: match.team2.name,
          logo: match.team2.logo || '/static/images/logob.png',
          color: match.team2.color || '#924ab0'
        }
      };

      // 处理球员数据：使用全局球员列表，添加 teamId
      const allPlayers = allPlayersList.map(player => ({
        id: player.id,
        teamId: player.currentTeamId, // 使用球员的当前队伍ID
        name: player.realName || player.nickname,
        nickname: player.nickname,
        number: player.jerseyNumber || 0,
        jerseyNumber: player.jerseyNumber || 0,
        position: player.position ? player.position.join('/') : '',
        avatar: player.avatar || '/static/images/avatar-default.png'
      }));

      // 按队伍分组球员
      const team1Players = allPlayers.filter(p => p.teamId === match.team1.id);
      const team2Players = allPlayers.filter(p => p.teamId === match.team2.id);

      // 获取报名的球员ID和完整信息，用于后续筛选参赛人员
      const team1RegisteredIds = (registration.team1 || []).map(reg => reg.user.id);
      const team2RegisteredIds = (registration.team2 || []).map(reg => reg.user.id);

      // 默认将报名球员设置为到场人员
      const team1Participants = (registration.team1 || []).map(reg => ({
        id: reg.user.id,
        name: reg.user.realName || reg.user.nickname,
        avatar: reg.user.avatar || '/static/images/avatar-default.png',
        jerseyNumber: reg.user.jerseyNumber || 0
      }));

      const team2Participants = (registration.team2 || []).map(reg => ({
        id: reg.user.id,
        name: reg.user.realName || reg.user.nickname,
        avatar: reg.user.avatar || '/static/images/avatar-default.png',
        jerseyNumber: reg.user.jerseyNumber || 0
      }));

      console.log(`[Record] 加载完成 - 队伍1: ${team1Players.length}人, 队伍2: ${team2Players.length}人`);
      console.log(`[Record] 默认到场人员 - 队伍1: ${team1Participants.length}人, 队伍2: ${team2Participants.length}人`);

      // 处理已保存的到场人员（如果有）
      let finalTeam1Participants = team1Participants;
      let finalTeam2Participants = team2Participants;
      let finalTeam1ParticipantIds = team1RegisteredIds;
      let finalTeam2ParticipantIds = team2RegisteredIds;
      let hasParticipants = false;

      if (participantsRes && participantsRes.data) {
        const participantsData = participantsRes.data;
        if ((participantsData.team1 && participantsData.team1.length > 0) ||
            (participantsData.team2 && participantsData.team2.length > 0)) {
          hasParticipants = true;

          // 队伍1到场人员
          finalTeam1Participants = (participantsData.team1 || []).map(p => ({
            id: p.userId || p.user?.id,
            name: p.user?.realName || p.user?.nickname || p.name,
            avatar: p.user?.avatar || '/static/images/avatar-default.png',
            jerseyNumber: p.user?.jerseyNumber || 0
          }));
          finalTeam1ParticipantIds = finalTeam1Participants.map(p => p.id);

          // 队伍2到场人员
          finalTeam2Participants = (participantsData.team2 || []).map(p => ({
            id: p.userId || p.user?.id,
            name: p.user?.realName || p.user?.nickname || p.name,
            avatar: p.user?.avatar || '/static/images/avatar-default.png',
            jerseyNumber: p.user?.jerseyNumber || 0
          }));
          finalTeam2ParticipantIds = finalTeam2Participants.map(p => p.id);

          console.log(`[Record] 已加载到场人员 - 队伍1: ${finalTeam1Participants.length}人, 队伍2: ${finalTeam2Participants.length}人`);
        }
      }

      // 处理已保存的MVP数据
      let mvpPlayers = [];
      let mvpUserIds = [];
      let mvpPlayerNames = '';

      if (match.result && match.result.mvpUserIds && match.result.mvpUserIds.length > 0) {
        mvpUserIds = match.result.mvpUserIds;

        // 根据MVP ID从球员列表中查找完整信息
        mvpPlayers = mvpUserIds.map(mvpId => {
          const player = allPlayers.find(p => p.id === mvpId);
          if (player) {
            return {
              id: player.id,
              name: player.name,
              nickname: player.nickname,
              avatar: player.avatar || '/static/images/default-avatar.png',
              jerseyNumber: player.jerseyNumber || player.number
            };
          }
          return null;
        }).filter(p => p !== null);

        mvpPlayerNames = mvpPlayers.map(p => p.name).join('、');
        console.log(`[Record] 已加载MVP球员: ${mvpPlayerNames}`);
      }

      // 处理已保存的照片数据
      let savedPhotos = [];
      if (match.result && match.result.photos && match.result.photos.length > 0) {
        savedPhotos = match.result.photos.map((photoUrl, index) => {
          // 拼接完整URL（照片是静态资源，去掉 /api 前缀）
          let fullUrl;
          if (photoUrl.startsWith('http')) {
            fullUrl = photoUrl;
          } else {
            // 从 apiBaseUrl 中提取基础URL（去掉 /api）
            const baseUrl = app.globalData.apiBaseUrl.replace('/api', '');
            fullUrl = `${baseUrl}${photoUrl}`;
          }

          return {
            url: fullUrl, // 完整URL用于显示
            serverUrl: photoUrl, // 原始相对URL用于提交
            type: 'uploaded',
            uploading: false,
            id: `saved_photo_${index}`
          };
        });
        console.log(`[Record] 已加载 ${savedPhotos.length} 张照片`);
      }

      // 处理已保存的简报数据
      let savedSummary = '';
      if (match.result && match.result.summary) {
        savedSummary = match.result.summary;
        console.log(`[Record] 已加载比赛简报`);
      }

      // 处理已保存的点球大战数据
      let savedPenaltyData = {
        enabled: false,
        team1Score: 0,
        team2Score: 0,
        winner: ''
      };
      if (match.result && match.result.penaltyShootout) {
        savedPenaltyData = {
          enabled: true,
          team1Score: match.result.penaltyShootout.team1Score || 0,
          team2Score: match.result.penaltyShootout.team2Score || 0,
          winner: match.result.penaltyShootout.winner || ''
        };
        console.log(`[Record] 已加载点球大战数据:`, savedPenaltyData);
      }

      // 处理已录入的节次数据，并决定当前步骤
      const { quarters: savedQuarters, currentStep } = this.processQuarterData(quarterData, allPlayers, matchInfo, hasParticipants);

      this.setData({
        matchInfo,
        quarterSystem: true,
        team1Players,
        team2Players,
        allPlayers,
        team1RegisteredIds, // 保存报名ID，用于参赛人员选择
        team2RegisteredIds,
        quarters: savedQuarters,
        currentStep: currentStep,
        // 设置到场人员（已保存的或默认的）
        'participants.team1': finalTeam1Participants,
        'participants.team2': finalTeam2Participants,
        'participantIds.team1': finalTeam1ParticipantIds,
        'participantIds.team2': finalTeam2ParticipantIds,
        // 设置MVP数据
        mvpPlayers: mvpPlayers,
        mvpUserIds: mvpUserIds,
        mvpPlayerNames: mvpPlayerNames,
        // 设置简报数据
        summary: savedSummary,
        // 设置照片数据
        photos: savedPhotos,
        // 设置点球大战数据
        penaltyShootout: savedPenaltyData
      }, () => {
        // 重新计算累计得分
        this.calculateTotalScore();

        // 检查是否需要点球大战（4节全部完成且比分相同）
        this.checkAndUpdatePenaltyState();
      });

      console.log(`[Record] 已加载节次数据，自动跳转到步骤${currentStep}`);
      wx.hideLoading();
    }).catch(err => {
      console.error('加载比赛信息失败:', err);
      wx.hideLoading();
      wx.showToast({
        title: err.message || '加载失败',
        icon: 'none'
      });
    });
  },

  // 切换4节制
  onToggleQuarterSystem(e) {
    const quarterSystem = e.detail.value;
    this.setData({ quarterSystem });

    if (!quarterSystem) {
      wx.showModal({
        title: '提示',
        content: '切换为传统全场制后，将无法使用节次录入功能',
        showCancel: false
      });
    }
  },

  // 下一步
  async onNextStep() {
    const { currentStep, quarterSystem } = this.data;

    // 如果是节次录入步骤（步骤2-5），先保存当前节次数据
    if (currentStep >= 2 && currentStep <= 5) {
      const quarterIndex = currentStep - 2;
      const quarter = this.data.quarters[quarterIndex];

      // 检查节次数据是否为空
      const isEmpty = quarter.team1Goals === 0 && quarter.team2Goals === 0 && quarter.events.length === 0;

      if (isEmpty) {
        // 即使是0:0也要保存，确保后端有完整的4个节次记录
        wx.showModal({
          title: '提示',
          content: '当前节次没有录入任何数据，确定继续吗？',
          success: async (res) => {
            if (res.confirm) {
              // 保存0:0的节次到后端（确保有4个节次记录）
              const saved = await this.saveCurrentQuarter(quarterIndex + 1, quarter);
              if (saved) {
                this.goNextStep();
              }
            }
          }
        });
        return;
      }

      // 保存当前节次到后端
      const saved = await this.saveCurrentQuarter(quarterIndex + 1, quarter);
      if (!saved) {
        // 保存失败，不跳转
        return;
      }
    }

    // 如果是到场人员选择步骤，保存到场人员
    // 步骤7（有点球大战）或步骤7（无点球大战，从5跳到7）
    const { needPenalty } = this.data;
    const isParticipantStep = (needPenalty && currentStep === 7) || (!needPenalty && currentStep === 7);

    if (isParticipantStep) {
      const saved = await this.saveParticipants();
      if (!saved) {
        // 保存失败，不跳转
        return;
      }
    }

    // 如果是点球大战步骤（步骤6且needPenalty为true），验证点球数据
    if (currentStep === 6 && needPenalty) {
      if (!this.validatePenaltyData()) {
        return;
      }
    }

    this.goNextStep();
  },

  goNextStep() {
    const { currentStep, totalTeam1Score, totalTeam2Score, needPenalty } = this.data;

    // 如果刚完成第4节（currentStep === 5），检查是否需要点球大战
    if (currentStep === 5 && !needPenalty) {
      // 检查是否平局
      if (totalTeam1Score === totalTeam2Score) {
        // 平局，需要点球大战
        console.log('比分相同，需要点球大战');

        // 动态插入点球大战步骤
        const newSteps = [
          { id: 1, name: '基本信息' },
          { id: 2, name: '第1节' },
          { id: 3, name: '第2节' },
          { id: 4, name: '第3节' },
          { id: 5, name: '第4节' },
          { id: 6, name: '点球大战' },  // 新增
          { id: 7, name: '到场人员' },
          { id: 8, name: 'MVP' }
        ];

        this.setData({
          needPenalty: true,
          currentStep: 6,  // 跳转到点球大战步骤
          steps: newSteps   // 更新步骤显示
        });

        // 滚动到顶部
        wx.pageScrollTo({
          scrollTop: 0,
          duration: 300
        });
        return;
      }
    }

    // 如果当前在点球大战步骤（currentStep === 6 且 needPenalty === true），跳到步骤7
    // 如果不需要点球大战，从步骤5直接跳到步骤7（原来的步骤6）
    let nextStep;
    if (currentStep === 5 && !needPenalty) {
      // 不需要点球大战，跳过步骤6
      nextStep = 7;
    } else {
      nextStep = currentStep + 1;
    }

    if (nextStep <= 8) {
      this.setData({ currentStep: nextStep });

      // 滚动到顶部
      wx.pageScrollTo({
        scrollTop: 0,
        duration: 300
      });
    }
  },

  // 上一步
  onPrevStep() {
    const prevStep = this.data.currentStep - 1;
    if (prevStep >= 1) {
      this.setData({ currentStep: prevStep });

      wx.pageScrollTo({
        scrollTop: 0,
        duration: 300
      });
    }
  },

  // 节次数据变化
  onQuarterChange(e) {
    const { quarterNumber, data } = e.detail;
    const quarterIndex = quarterNumber - 1;

    // 计算节次得分
    const points = this.calculateQuarterPoints(
      quarterNumber,
      data.team1Goals,
      data.team2Goals
    );

    const updatedQuarter = {
      quarterNumber,
      team1Goals: data.team1Goals,
      team2Goals: data.team2Goals,
      team1Points: points.team1Points,
      team2Points: points.team2Points,
      summary: data.summary,
      events: data.events
    };

    const quarters = [...this.data.quarters];
    quarters[quarterIndex] = updatedQuarter;

    this.setData({ quarters }, () => {
      this.calculateTotalScore();
    });
  },

  // 保存当前节次数据（点击"下一步"时调用）
  async saveCurrentQuarter(quarterNumber, quarter) {
    const { matchId } = this.data;

    if (!matchId) {
      console.log('[Record] 无matchId，跳过保存');
      return true;
    }

    try {
      wx.showLoading({ title: '保存中...' });

      // 点击"下一步"时，使用auto模式：
      // - 只更新比分和总结
      // - 不传events数组，避免覆盖已保存的碎片化数据
      // - 标记节次为已完成（isCompleted: true）
      // - 后端会根据已有的events自动计算比分
      const res = await matchAPI.saveQuarter(matchId, {
        quarterNumber: quarterNumber,
        mode: 'auto',  // 自动模式 - 根据已有事件自动计算比分，不会覆盖事件
        team1Goals: quarter.team1Goals,
        team2Goals: quarter.team2Goals,
        summary: quarter.summary || '',
        isCompleted: true  // 标记该节次为已完成
        // 不传 events，保留后端已有的碎片化录入的事件
      });

      console.log(`[Record] 第${quarterNumber}节保存成功`, res.data);

      // 重新加载该节次的最新数据（包含后端返回的真实事件ID）
      await this.reloadQuarterData(quarterNumber);

      wx.hideLoading();
      wx.showToast({
        title: '保存成功',
        icon: 'success',
        duration: 1000
      });

      return true;
    } catch (err) {
      console.error(`[Record] 第${quarterNumber}节保存失败:`, err);
      wx.hideLoading();
      wx.showToast({
        title: '保存失败，请稍后重试',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
  },

  // 重新加载节次数据
  async reloadQuarterData(quarterNumber) {
    try {
      // 获取最新的节次数据
      const res = await matchAPI.getQuarterDetail(this.data.matchId);
      const quarterData = res.data;

      if (quarterData && quarterData.quarters) {
        const savedQuarter = quarterData.quarters.find(q => q.quarterNumber === quarterNumber);

        if (savedQuarter) {
          const quarterIndex = quarterNumber - 1;
          const quarters = [...this.data.quarters];

          // 转换事件数据格式
          const events = (quarterData.events || [])
            .filter(event => event.quarterNumber === quarterNumber)
            .map(event => {
              // 查找球员信息
              const player = this.data.allPlayers.find(p => p.id === event.userId);
              const assistPlayer = event.assistUserId ? this.data.allPlayers.find(p => p.id === event.assistUserId) : null;

              const isOwnGoal = event.eventSubtype === 'own_goal';

              return {
                id: event.id,  // 使用后端返回的真实ID
                teamId: event.teamId,  // 得分队伍（也是显示队伍）
                userId: event.userId,
                playerName: player ? (player.name || player.nickname) : '未知球员',
                eventType: event.eventType,
                eventSubtype: event.eventSubtype,
                isOwnGoal: isOwnGoal,
                minute: event.minute,
                assistUserId: event.assistUserId,
                assistName: assistPlayer ? (assistPlayer.name || assistPlayer.nickname) : '',
                notes: event.notes || ''
              };
            });

          // 更新该节次的数据
          quarters[quarterIndex] = {
            quarterNumber: savedQuarter.quarterNumber,
            team1Goals: savedQuarter.team1Goals,
            team2Goals: savedQuarter.team2Goals,
            team1Points: savedQuarter.team1Points,
            team2Points: savedQuarter.team2Points,
            summary: savedQuarter.summary || '',
            events: events
          };

          this.setData({ quarters }, () => {
            this.calculateTotalScore();
          });

          console.log(`[Record] 第${quarterNumber}节数据已更新`);
        }
      }
    } catch (err) {
      console.error(`[Record] 重新加载第${quarterNumber}节数据失败:`, err);
      // 不阻塞流程，只是打印错误
    }
  },

  // 处理已录入的节次数据
  processQuarterData(quarterData, allPlayers, matchInfo, hasParticipants) {
    const quarters = [
      { quarterNumber: 1, team1Goals: 0, team2Goals: 0, team1Points: 0, team2Points: 0, summary: '', events: [] },
      { quarterNumber: 2, team1Goals: 0, team2Goals: 0, team1Points: 0, team2Points: 0, summary: '', events: [] },
      { quarterNumber: 3, team1Goals: 0, team2Goals: 0, team1Points: 0, team2Points: 0, summary: '', events: [] },
      { quarterNumber: 4, team1Goals: 0, team2Goals: 0, team1Points: 0, team2Points: 0, summary: '', events: [] }
    ];

    let currentStep = 1; // 默认从第一步开始
    let hasAnyData = false;

    // 如果有已保存的节次数据，填充到quarters数组
    if (quarterData && quarterData.quarters && quarterData.quarters.length > 0) {
      hasAnyData = true;

      quarterData.quarters.forEach(savedQuarter => {
        const index = savedQuarter.quarterNumber - 1;
        if (index >= 0 && index < 4) {
          // 转换事件数据格式
          const events = (quarterData.events || [])
            .filter(event => event.quarterNumber === savedQuarter.quarterNumber)
            .map(event => {
              // 查找球员信息
              const player = allPlayers.find(p => p.id === event.userId);
              const assistPlayer = event.assistUserId ? allPlayers.find(p => p.id === event.assistUserId) : null;

              const isOwnGoal = event.eventSubtype === 'own_goal';

              return {
                id: event.id,
                teamId: event.teamId,  // 得分队伍（也是显示队伍）
                userId: event.userId,
                playerName: player ? (player.name || player.nickname) : '未知球员',
                eventType: event.eventType,
                eventSubtype: event.eventSubtype,
                isOwnGoal: isOwnGoal,
                minute: event.minute,
                assistUserId: event.assistUserId,
                assistName: assistPlayer ? (assistPlayer.name || assistPlayer.nickname) : '',
                notes: event.notes || ''
              };
            });

          quarters[index] = {
            quarterNumber: savedQuarter.quarterNumber,
            team1Goals: savedQuarter.team1Goals,
            team2Goals: savedQuarter.team2Goals,
            team1Points: savedQuarter.team1Points,
            team2Points: savedQuarter.team2Points,
            summary: savedQuarter.summary || '',
            events: events
          };
        }
      });

      // 根据 quartersCompleted 判断跳转位置
      // quartersCompleted 在最外层，不在 currentScore 里
      const quartersCompleted = quarterData.quartersCompleted || 0;

      if (quartersCompleted >= 4 && hasParticipants) {
        // 4个节次都已完成，且已保存到场人员，跳转到MVP与照片（步骤7）
        currentStep = 7;
      } else if (quartersCompleted >= 4) {
        // 4个节次都已完成，但未保存到场人员，跳转到到场人员选择（步骤6）
        currentStep = 6;
      } else if (quartersCompleted > 0) {
        // 已完成部分节次，跳转到下一个未完成的节次
        // quartersCompleted = 1 时，跳转到第2节（步骤3）
        // quartersCompleted = 2 时，跳转到第3节（步骤4）
        // quartersCompleted = 3 时，跳转到第4节（步骤5）
        currentStep = quartersCompleted + 2;
      } else {
        // quartersCompleted = 0，说明没有完成任何节次
        // 但可能第1节有部分数据（碎片化录入中），继续停留在第1节
        if (quarters[0].events.length > 0 || quarters[0].team1Goals > 0 || quarters[0].team2Goals > 0) {
          currentStep = 2; // 第1节（步骤2）
        } else {
          currentStep = 1; // 基本信息（步骤1）
        }
      }
    }

    // 如果没有任何数据，从步骤1（基本信息）开始
    if (!hasAnyData) {
      currentStep = 1;
    }

    return { quarters, currentStep };
  },

  // 节次数据保存成功（碎片化录入）
  onQuarterSaved(e) {
    const { quarterNumber, data } = e.detail;
    console.log(`[Record] 第${quarterNumber}节保存成功`, data);

    // 不显示保存成功提示（已在子组件中显示）

    // 重新加载该节次的最新数据
    this.reloadQuarterData(quarterNumber);
  },

  // 计算单节得分
  calculateQuarterPoints(quarterNumber, team1Goals, team2Goals) {
    const pointsRule = {
      1: { win: 1, draw: 0 },
      2: { win: 1, draw: 0 },
      3: { win: 1, draw: 0 },
      4: { win: 2, draw: 0 }
    };

    const rule = pointsRule[quarterNumber];

    if (team1Goals > team2Goals) {
      return { team1Points: rule.win, team2Points: 0 };
    } else if (team2Goals > team1Goals) {
      return { team1Points: 0, team2Points: rule.win };
    } else {
      return { team1Points: rule.draw, team2Points: rule.draw };
    }
  },

  // 计算总得分和总进球
  calculateTotalScore() {
    let totalTeam1Score = 0;
    let totalTeam2Score = 0;
    let totalTeam1Goals = 0;
    let totalTeam2Goals = 0;

    this.data.quarters.forEach(q => {
      totalTeam1Score += q.team1Points;
      totalTeam2Score += q.team2Points;
      totalTeam1Goals += q.team1Goals;
      totalTeam2Goals += q.team2Goals;
    });

    this.setData({
      totalTeam1Score,
      totalTeam2Score,
      totalTeam1Goals,
      totalTeam2Goals
    });
  },

  // 检查并更新点球大战状态（用于页面加载时恢复状态）
  checkAndUpdatePenaltyState() {
    const { totalTeam1Score, totalTeam2Score, currentStep, penaltyShootout } = this.data;

    // 如果已经有点球大战数据（从后端加载），说明需要点球大战
    if (penaltyShootout.enabled) {
      console.log('[Record] 检测到已保存的点球大战数据，更新状态');

      // 更新步骤数组，包含点球大战步骤
      const newSteps = [
        { id: 1, name: '基本信息' },
        { id: 2, name: '第1节' },
        { id: 3, name: '第2节' },
        { id: 4, name: '第3节' },
        { id: 5, name: '第4节' },
        { id: 6, name: '点球大战' },
        { id: 7, name: '到场人员' },
        { id: 8, name: 'MVP' }
      ];

      // 调整当前步骤（如果在步骤6或7，需要向后移一位）
      let adjustedStep = currentStep;
      if (currentStep === 6) {
        // 原本在"到场人员"（老的步骤6），插入点球大战后应该跳转到新的"到场人员"（步骤7）
        adjustedStep = 7;
      } else if (currentStep === 7) {
        // 原本在"MVP"（老的步骤7），插入点球大战后应该跳转到新的"MVP"（步骤8）
        adjustedStep = 8;
      }

      this.setData({
        needPenalty: true,
        steps: newSteps,
        currentStep: adjustedStep
      });

      return;
    }

    // 如果当前在步骤6或7（4节已完成），检查是否需要点球大战
    if (currentStep >= 6) {
      // 检查4节是否都已录入（判断 team1Points 是否已计算）
      const allQuartersCompleted = this.data.quarters.every(q =>
        q.team1Points !== undefined || q.team2Points !== undefined || q.team1Goals > 0 || q.team2Goals > 0
      );

      if (allQuartersCompleted && totalTeam1Score === totalTeam2Score) {
        console.log('[Record] 检测到平局，需要点球大战');

        // 更新步骤数组，包含点球大战步骤
        const newSteps = [
          { id: 1, name: '基本信息' },
          { id: 2, name: '第1节' },
          { id: 3, name: '第2节' },
          { id: 4, name: '第3节' },
          { id: 5, name: '第4节' },
          { id: 6, name: '点球大战' },
          { id: 7, name: '到场人员' },
          { id: 8, name: 'MVP' }
        ];

        // 根据当前步骤调整
        // 由于插入了点球大战步骤，原来的步骤6（到场人员）变成步骤7，步骤7（MVP）变成步骤8
        let adjustedStep = currentStep;
        if (currentStep === 6) {
          // 原本在"到场人员"（老的步骤6），插入点球大战后应该跳转到新的"到场人员"（步骤7）
          adjustedStep = 7;
        } else if (currentStep === 7) {
          // 原本在"MVP"（老的步骤7），插入点球大战后应该跳转到新的"MVP"（步骤8）
          adjustedStep = 8;
        }

        this.setData({
          needPenalty: true,
          steps: newSteps,
          currentStep: adjustedStep
        });
      }
    }
  },

  // 显示到场人员选择器
  onShowParticipantPicker(e) {
    const team = e.currentTarget.dataset.team;
    this.setData({
      showParticipantPicker: true,
      currentPickerTeam: team
    });
  },

  // 确认选择到场人员
  onConfirmParticipants(e) {
    const { value, items } = e.detail;
    const team = this.data.currentPickerTeam;

    if (team === 'team1') {
      this.setData({
        'participants.team1': items,
        'participantIds.team1': value
      });
    } else if (team === 'team2') {
      this.setData({
        'participants.team2': items,
        'participantIds.team2': value
      });
    }
  },

  // 关闭到场人员选择器
  onCloseParticipantPicker() {
    this.setData({ showParticipantPicker: false });
  },

  // 移除到场人员
  onRemoveParticipant(e) {
    const { team, id } = e.currentTarget.dataset;

    if (team === 'team1') {
      const participants = this.data.participants.team1.filter(p => p.id !== id);
      const participantIds = this.data.participantIds.team1.filter(pId => pId !== id);
      this.setData({
        'participants.team1': participants,
        'participantIds.team1': participantIds
      });
    } else if (team === 'team2') {
      const participants = this.data.participants.team2.filter(p => p.id !== id);
      const participantIds = this.data.participantIds.team2.filter(pId => pId !== id);
      this.setData({
        'participants.team2': participants,
        'participantIds.team2': participantIds
      });
    }
  },

  // 保存到场人员
  async saveParticipants() {
    const { matchId, participantIds } = this.data;

    if (!matchId) {
      console.log('[Record] 无matchId，跳过保存到场人员');
      return true;
    }

    // 验证是否至少有一个队伍有到场人员
    if (participantIds.team1.length === 0 && participantIds.team2.length === 0) {
      wx.showModal({
        title: '提示',
        content: '请至少选择一名到场球员',
        showCancel: false
      });
      return false;
    }

    try {
      wx.showLoading({ title: '保存到场人员...' });

      // 调用设置参赛球员接口
      const res = await matchAPI.setParticipants(matchId, {
        team1: participantIds.team1,
        team2: participantIds.team2
      });

      console.log('[Record] 到场人员保存成功', res.data);

      wx.hideLoading();
      wx.showToast({
        title: '保存成功',
        icon: 'success',
        duration: 1000
      });

      return true;
    } catch (err) {
      console.error('[Record] 保存到场人员失败:', err);
      wx.hideLoading();
      wx.showToast({
        title: err.message || '保存失败，请稍后重试',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
  },

  // 显示MVP选择器
  onShowMvpPicker() {
    this.setData({ showMvpPicker: true });
  },

  // 确认选择MVP
  onConfirmMvp(e) {
    const { value, items, text } = e.detail;

    // 构建完整的MVP球员数据（包含头像、姓名、号码）
    const mvpPlayers = items.map(player => ({
      id: player.id,
      name: player.name || player.nickname,
      nickname: player.nickname,
      avatar: player.avatar || '/static/images/default-avatar.png',
      jerseyNumber: player.jerseyNumber || player.number
    }));

    this.setData({
      mvpUserIds: value,
      mvpPlayers: mvpPlayers,
      mvpPlayerNames: text
    });
  },

  // 移除MVP
  onRemoveMvp(e) {
    const id = e.currentTarget.dataset.id;
    const mvpPlayers = this.data.mvpPlayers.filter(p => p.id !== id);
    const mvpUserIds = this.data.mvpUserIds.filter(userId => userId !== id);
    const mvpPlayerNames = mvpPlayers.map(p => p.name).join('、');

    this.setData({
      mvpPlayers,
      mvpUserIds,
      mvpPlayerNames
    });
  },

  // 关闭MVP选择器
  onCloseMvpPicker() {
    this.setData({ showMvpPicker: false });
  },

  // 简报输入
  onSummaryInput(e) {
    this.setData({ summary: e.detail.value });
  },

  // 选择照片
  onChoosePhoto() {
    const remainCount = this.data.maxPhotos - this.data.photos.length;
    if (remainCount <= 0) {
      wx.showToast({
        title: `最多上传${this.data.maxPhotos}张照片`,
        icon: 'none'
      });
      return;
    }

    wx.chooseImage({
      count: remainCount,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        // 先将本地路径添加到photos数组（用于预览）
        const tempPhotos = [...this.data.photos];
        const newPhotos = res.tempFilePaths.map(path => ({
          url: path,
          type: 'local',
          uploading: true,
          id: `photo_${Date.now()}_${Math.random()}`
        }));
        tempPhotos.push(...newPhotos);
        this.setData({ photos: tempPhotos });

        // 上传照片到服务器
        this.uploadPhotos(res.tempFilePaths);
      }
    });
  },

  // 上传照片到服务器（使用新的关联接口）
  async uploadPhotos(filePaths) {
    wx.showLoading({ title: '上传中...', mask: true });

    try {
      // 逐个上传照片并自动关联到比赛
      const uploadPromises = filePaths.map(async (filePath, index) => {
        try {
          // 使用新接口：上传并自动关联到比赛
          const res = await uploadAPI.uploadMatchPhoto(this.data.matchId, filePath);

          // 新接口返回格式：data.upload.success[0]
          const uploadedPhoto = res.data.upload.success[0];

          // 拼接完整URL（照片是静态资源，去掉 /api 前缀）
          let fullUrl;
          if (uploadedPhoto.url.startsWith('http')) {
            fullUrl = uploadedPhoto.url;
          } else {
            // 从 apiBaseUrl 中提取基础URL（去掉 /api）
            const baseUrl = app.globalData.apiBaseUrl.replace('/api', '');
            fullUrl = `${baseUrl}${uploadedPhoto.url}`;
          }

          console.log('[Upload] 照片上传成功:', {
            原始URL: uploadedPhoto.url,
            完整URL: fullUrl,
            apiBaseUrl: app.globalData.apiBaseUrl,
            文件名: uploadedPhoto.filename
          });

          // 上传成功，更新照片信息
          const photoIndex = this.data.photos.findIndex(p => p.url === filePath && p.uploading);
          if (photoIndex !== -1) {
            const photos = [...this.data.photos];
            photos[photoIndex] = {
              url: fullUrl, // 使用完整的服务器URL
              serverUrl: uploadedPhoto.url, // 保存原始相对URL
              filename: uploadedPhoto.filename,
              originalName: uploadedPhoto.originalName,
              type: 'uploaded',
              uploading: false,
              id: uploadedPhoto.filename
            };
            this.setData({ photos });
            console.log('[Upload] 更新照片数据:', photos[photoIndex]);
          } else {
            console.error('[Upload] 未找到待更新的照片:', filePath);
          }

          return uploadedPhoto;
        } catch (err) {
          console.error('照片上传失败:', err);

          // 上传失败，移除该照片
          const photos = this.data.photos.filter(p => !(p.url === filePath && p.uploading));
          this.setData({ photos });

          throw err;
        }
      });

      // 等待所有照片上传完成
      await Promise.all(uploadPromises);

      wx.hideLoading();
      wx.showToast({
        title: '上传成功',
        icon: 'success',
        duration: 1500
      });

      console.log('[Record] 照片上传并关联成功:', this.data.photos);
    } catch (err) {
      wx.hideLoading();
      wx.showToast({
        title: '部分照片上传失败',
        icon: 'none',
        duration: 2000
      });
    }
  },

  // 预览照片
  onPreviewPhoto(e) {
    const index = e.currentTarget.dataset.index;
    const urls = this.data.photos.map(p => p.url);
    wx.previewImage({
      urls: urls,
      current: urls[index]
    });
  },

  // 删除照片
  onDeletePhoto(e) {
    const index = e.currentTarget.dataset.index;
    const photo = this.data.photos[index];

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这张照片吗？',
      success: async (res) => {
        if (res.confirm) {
          // 如果是已上传的照片，需要调用删除API
          if (photo.type === 'uploaded' && photo.url) {
            try {
              wx.showLoading({ title: '删除中...' });
              await uploadAPI.deletePhoto(photo.url);
              wx.hideLoading();
            } catch (err) {
              console.error('删除照片失败:', err);
              wx.hideLoading();
              wx.showToast({
                title: '删除失败',
                icon: 'none'
              });
              return;
            }
          }

          // 从列表中移除
          const photos = [...this.data.photos];
          photos.splice(index, 1);
          this.setData({ photos });
        }
      }
    });
  },

  // 显示/隐藏得分预览
  onToggleScorePreview() {
    this.setData({
      showScorePreview: !this.data.showScorePreview
    });
  },

  // 提交比赛记录
  onSubmit() {
    if (this.data.isSubmitting) return;

    // 验证
    const hasAnyGoals = this.data.quarters.some(q => q.team1Goals > 0 || q.team2Goals > 0);
    if (!hasAnyGoals) {
      wx.showModal({
        title: '提示',
        content: '所有节次比分都是0:0，确定要提交吗？',
        success: (res) => {
          if (res.confirm) {
            this.submitRecord();
          }
        }
      });
      return;
    }

    this.submitRecord();
  },

  // 提交记录
  submitRecord() {
    this.setData({ isSubmitting: true });
    wx.showLoading({ title: '提交中...' });

    // 构建提交数据（使用新的supplementResult接口）
    // 注意：photos 字段已移除，照片通过上传接口自动关联
    const supplementData = {
      mvpUserIds: this.data.mvpUserIds, // MVP球员ID数组（支持多个）
      summary: this.data.summary || this.buildMatchSummary() // 优先使用用户输入的简报，否则使用自动生成的
    };

    // 如果有点球大战数据，包含进去
    if (this.data.penaltyShootout.enabled) {
      supplementData.penaltyShootout = {
        team1Score: this.data.penaltyShootout.team1Score,
        team2Score: this.data.penaltyShootout.team2Score,
        winner: this.data.penaltyShootout.winner
      };
      console.log('[Record] 包含点球大战数据:', supplementData.penaltyShootout);
    }

    console.log('[Record] 提交补充信息:', supplementData);

    // 调用补充比赛结果接口
    matchAPI.supplementResult(this.data.matchId, supplementData)
      .then((res) => {
        console.log('[Record] 补充信息提交成功', res.data);

        this.setData({ isSubmitting: false });
        wx.hideLoading();
        wx.showToast({
          title: '提交成功',
          icon: 'success',
          duration: 1500
        });

        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      })
      .catch(err => {
        console.error('[Record] 提交失败:', err);
        this.setData({ isSubmitting: false });
        wx.hideLoading();
        wx.showToast({
          title: err.message || '提交失败',
          icon: 'none'
        });
      });
  },

  // 构建比赛总结（包含4节制信息）
  buildMatchSummary() {
    const { matchInfo, quarters, totalTeam1Score, totalTeam2Score, totalTeam1Goals, totalTeam2Goals, penaltyShootout } = this.data;

    let summary = `【4节制比赛】\n`;
    summary += `最终得分：${matchInfo.team1.name} ${totalTeam1Score}-${totalTeam2Score} ${matchInfo.team2.name}\n`;
    summary += `总进球：${totalTeam1Goals}-${totalTeam2Goals}\n`;

    // 如果有点球大战，添加到总结中
    if (penaltyShootout.enabled) {
      summary += `\n【点球大战】\n`;
      summary += `点球比分：${matchInfo.team1.name} ${penaltyShootout.team1Score}-${penaltyShootout.team2Score} ${matchInfo.team2.name}\n`;
      const winnerName = penaltyShootout.winner === 'team1' ? matchInfo.team1.name : matchInfo.team2.name;
      summary += `获胜方：${winnerName}\n`;
    }

    summary += `\n`;

    quarters.forEach((q, index) => {
      if (q.team1Goals > 0 || q.team2Goals > 0 || q.events.length > 0) {
        summary += `第${index + 1}节：${q.team1Goals}-${q.team2Goals}（得分：${q.team1Points}-${q.team2Points}）\n`;
        if (q.summary) {
          summary += `${q.summary}\n`;
        }
        if (q.events.length > 0) {
          q.events.forEach(event => {
            summary += `  ${event.minute}' ${this.getEventTypeText(event.eventType)} ${event.playerName}`;
            if (event.isOwnGoal) {
              summary += '（乌龙）';
            }
            if (event.assistName) {
              summary += ` (${event.assistName}助)`;
            }
            summary += '\n';
          });
        }
        summary += '\n';
      }
    });

    return summary;
  },

  // 获取事件类型文本
  getEventTypeText(eventType) {
    const typeMap = {
      'goal': '⚽进球',
      'save': '🧤扑救',
      'yellow_card': '🟨黄牌',
      'red_card': '🟥红牌',
      'substitution': '🔄换人'
    };
    return typeMap[eventType] || eventType;
  },

  // ========== 点球大战相关方法 ==========

  // 点球比分输入（队伍1）
  onPenaltyTeam1Input(e) {
    const value = parseInt(e.detail.value) || 0;
    this.setData({
      'penaltyShootout.team1Score': value
    }, () => {
      this.updatePenaltyWinner();
    });
  },

  // 点球比分输入（队伍2）
  onPenaltyTeam2Input(e) {
    const value = parseInt(e.detail.value) || 0;
    this.setData({
      'penaltyShootout.team2Score': value
    }, () => {
      this.updatePenaltyWinner();
    });
  },

  // 更新点球大战获胜方
  updatePenaltyWinner() {
    const { team1Score, team2Score } = this.data.penaltyShootout;
    let winner = '';

    if (team1Score > team2Score) {
      winner = 'team1';
    } else if (team2Score > team1Score) {
      winner = 'team2';
    }

    this.setData({
      'penaltyShootout.winner': winner,
      'penaltyShootout.enabled': true
    });
  },

  // 验证点球大战数据
  validatePenaltyData() {
    const { team1Score, team2Score, winner } = this.data.penaltyShootout;

    // 检查是否有获胜方
    if (!winner) {
      wx.showToast({
        title: '点球比分不能相同',
        icon: 'none'
      });
      return false;
    }

    // 检查比分是否合理（不能为负数）
    if (team1Score < 0 || team2Score < 0) {
      wx.showToast({
        title: '点球比分不能为负数',
        icon: 'none'
      });
      return false;
    }

    return true;
  },

  // 提交所有比赛事件
  submitAllEvents() {
    const allEvents = [];

    // 收集所有节次的事件
    this.data.quarters.forEach((quarter, index) => {
      quarter.events.forEach(event => {
        // 转换事件数据格式，符合API要求
        const eventData = {
          teamId: event.teamId,
          userId: event.userId,
          eventType: event.eventType,
          eventSubtype: event.isOwnGoal ? 'own_goal' : null,
          minute: event.minute,
          assistUserId: event.assistUserId || null,
          notes: event.notes || ''
        };

        allEvents.push(eventData);
      });
    });

    // 逐个提交事件
    const promises = allEvents.map(eventData =>
      matchAPI.recordEvent(this.data.matchId, eventData)
    );

    return Promise.all(promises);
  }
});
