// components/quarter-input/quarter-input.js
const matchAPI = require('../../api/match');

Component({
  properties: {
    // 比赛ID
    matchId: {
      type: String,
      value: ''
    },
    // 节次编号 (1-4)
    quarterNumber: {
      type: Number,
      value: 1
    },
    // 队伍1信息
    team1: {
      type: Object,
      value: null
    },
    // 队伍2信息
    team2: {
      type: Object,
      value: null
    },
    // 节次数据
    quarterData: {
      type: Object,
      value: null
    },
    // 所有球员列表（用于选择器）
    allPlayers: {
      type: Array,
      value: []
    }
  },

  data: {
    // 节次表单数据
    form: {
      team1Goals: 0,
      team2Goals: 0,
      summary: '',
      events: []
    },

    // 事件类型
    eventTypes: [
      { id: 'goal', name: '进球', icon: '⚽', color: '#27ae60' },
      { id: 'save', name: '扑救', icon: '🧤', color: '#3498db' },
      { id: 'yellow_card', name: '黄牌', icon: '🟨', color: '#f39c12' },
      { id: 'red_card', name: '红牌', icon: '🟥', color: '#e74c3c' },
      { id: 'substitution', name: '换人', icon: '🔄', color: '#9b59b6' }
    ],

    // 事件编辑弹窗
    showEventDialog: false,
    editingEvent: null,
    currentEventType: null,

    // 事件表单
    eventForm: {
      type: '',
      minute: '',
      teamId: '',
      isOwnGoal: false,  // 是否乌龙球
      userId: '',
      playerName: '',
      assistUserId: '',
      assistName: '',
      playerOutId: '',
      playerOutName: '',
      playerInId: '',
      playerInName: '',
      notes: ''
    },

    // 球员选择器状态
    showPlayerPicker: false,
    showAssistPicker: false,
    showPlayerOutPicker: false,
    showPlayerInPicker: false,
    currentPickerType: '', // 'player', 'assist', 'playerOut', 'playerIn'
    filteredPlayers: []  // 过滤后的球员列表
  },

  lifetimes: {
    attached() {
      this.initData();
    }
  },

  observers: {
    'quarterData': function(newData) {
      if (newData) {
        this.setData({
          form: {
            team1Goals: newData.team1Goals || 0,
            team2Goals: newData.team2Goals || 0,
            summary: newData.summary || '',
            events: newData.events || []
          }
        });
      }
    },
    'allPlayers': function(players) {
      // allPlayers 变化时不需要额外处理
    }
  },

  methods: {
    // 初始化数据
    initData() {
      const { quarterData, allPlayers } = this.properties;

      if (quarterData) {
        this.setData({
          form: {
            team1Goals: quarterData.team1Goals || 0,
            team2Goals: quarterData.team2Goals || 0,
            summary: quarterData.summary || '',
            events: quarterData.events || []
          }
        });
      }

      // 初始化时不需要处理 allPlayers
    },

    // 进球数输入
    onTeam1GoalsInput(e) {
      const value = parseInt(e.detail.value) || 0;
      this.setData({
        'form.team1Goals': Math.max(0, value)
      });
      this.triggerChange();
    },

    onTeam2GoalsInput(e) {
      const value = parseInt(e.detail.value) || 0;
      this.setData({
        'form.team2Goals': Math.max(0, value)
      });
      this.triggerChange();
    },

    // 总结输入
    onSummaryInput(e) {
      this.setData({
        'form.summary': e.detail.value
      });
      this.triggerChange();
    },

    // 显示添加事件对话框
    onAddEvent(e) {
      const eventType = e.currentTarget.dataset.type;
      const eventTypeInfo = this.data.eventTypes.find(t => t.id === eventType);

      this.setData({
        showEventDialog: true,
        currentEventType: eventTypeInfo,
        editingEvent: null,
        eventForm: {
          type: eventType,
          minute: '',
          teamId: '',
          isOwnGoal: false,
          userId: '',
          playerName: '',
          assistUserId: '',
          assistName: '',
          playerOutId: '',
          playerOutName: '',
          playerInId: '',
          playerInName: '',
          notes: ''
        }
      });
    },

    // 编辑事件
    onEditEvent(e) {
      // 支持从组件事件或直接点击事件获取eventId
      const eventId = e.detail?.eventId || e.currentTarget?.dataset?.id;
      const event = this.data.form.events.find(ev => ev.id === eventId);
      if (!event) return;

      const eventTypeInfo = this.data.eventTypes.find(t => t.id === event.eventType);

      this.setData({
        showEventDialog: true,
        currentEventType: eventTypeInfo,
        editingEvent: event,
        eventForm: {
          type: event.eventType,
          minute: event.minute,
          teamId: event.teamId,
          isOwnGoal: event.isOwnGoal || false,
          userId: event.userId || '',
          playerName: event.playerName || '',
          assistUserId: event.assistUserId || '',
          assistName: event.assistName || '',
          playerOutId: event.playerOutId || '',
          playerOutName: event.playerOutName || '',
          playerInId: event.playerInId || '',
          playerInName: event.playerInName || '',
          notes: event.notes || ''
        }
      });
    },

    // 删除事件
    onDeleteEvent(e) {
      // 支持从组件事件或直接点击事件获取eventId
      const eventId = e.detail?.eventId || e.currentTarget?.dataset?.id;
      const that = this;

      wx.showModal({
        title: '确认删除',
        content: '确定要删除这条记录吗？',
        success: async (res) => {
          if (res.confirm) {
            const deletedEvent = that.data.form.events.find(ev => ev.id === eventId);
            const events = that.data.form.events.filter(ev => ev.id !== eventId);

            // 如果删除的是进球事件，重新计算比分
            if (deletedEvent && deletedEvent.eventType === 'goal') {
              that.updateGoalsFromEvents(events);
            }

            that.setData({
              'form.events': events
            });

            // 调用后端API删除事件（使用deleteEventIds）
            await that.deleteEventFromAPI(eventId);

            that.triggerChange();
            wx.showToast({
              title: '已删除',
              icon: 'success'
            });
          }
        }
      });
    },

    // 事件分钟输入
    onEventMinuteInput(e) {
      this.setData({
        'eventForm.minute': e.detail.value
      });
    },

    // 备注输入
    onEventNotesInput(e) {
      this.setData({
        'eventForm.notes': e.detail.value
      });
    },

    // 选择队伍
    onSelectTeam(e) {
      const teamId = e.currentTarget.dataset.teamId;
      this.setData({
        'eventForm.teamId': teamId,
        // 切换队伍时清空已选择的球员
        'eventForm.userId': '',
        'eventForm.playerName': '',
        'eventForm.assistUserId': '',
        'eventForm.assistName': ''
      });
    },

    // 切换是否乌龙球
    onToggleOwnGoal() {
      const isOwnGoal = !this.data.eventForm.isOwnGoal;
      this.setData({
        'eventForm.isOwnGoal': isOwnGoal,
        // 切换乌龙球状态时清空已选择的球员
        'eventForm.userId': '',
        'eventForm.playerName': '',
        'eventForm.assistUserId': '',
        'eventForm.assistName': ''
      });
    },

    // 过滤球员列表
    filterPlayers(teamId) {
      const { allPlayers } = this.properties;
      if (!allPlayers || allPlayers.length === 0) return [];

      // 根据 teamId 过滤球员
      return allPlayers.filter(player => player.teamId === teamId);
    },

    // 显示球员选择器
    onShowPlayerPicker() {
      const { teamId, isOwnGoal } = this.data.eventForm;
      const { team1, team2 } = this.properties;

      // 验证是否已选择队伍
      if (!teamId) {
        wx.showToast({
          title: '请先选择队伍',
          icon: 'none'
        });
        return;
      }

      // 确定显示哪个队伍的球员
      // teamId 代表得分的队伍
      // 正常进球：从得分队伍中选球员
      // 乌龙球：从对方队伍中选球员（踢进乌龙球的球员）
      let targetTeamId = teamId;
      if (this.data.eventForm.type === 'goal' && isOwnGoal) {
        // 乌龙球：选择对方队伍的球员
        targetTeamId = teamId === team1.id ? team2.id : team1.id;
      }

      const filteredPlayers = this.filterPlayers(targetTeamId);

      this.setData({
        filteredPlayers,
        showPlayerPicker: true,
        currentPickerType: 'player'
      });
    },

    // 显示助攻球员选择器
    onShowAssistPicker() {
      const { teamId } = this.data.eventForm;

      // 验证是否已选择队伍
      if (!teamId) {
        wx.showToast({
          title: '请先选择队伍',
          icon: 'none'
        });
        return;
      }

      // 助攻球员总是从进球队伍中选择
      const filteredPlayers = this.filterPlayers(teamId);

      this.setData({
        filteredPlayers,
        showAssistPicker: true,
        currentPickerType: 'assist'
      });
    },

    // 显示下场球员选择器
    onShowPlayerOutPicker() {
      const { teamId } = this.data.eventForm;

      // 验证是否已选择队伍
      if (!teamId) {
        wx.showToast({
          title: '请先选择队伍',
          icon: 'none'
        });
        return;
      }

      const filteredPlayers = this.filterPlayers(teamId);

      this.setData({
        filteredPlayers,
        showPlayerOutPicker: true,
        currentPickerType: 'playerOut'
      });
    },

    // 显示上场球员选择器
    onShowPlayerInPicker() {
      const { teamId } = this.data.eventForm;

      // 验证是否已选择队伍
      if (!teamId) {
        wx.showToast({
          title: '请先选择队伍',
          icon: 'none'
        });
        return;
      }

      const filteredPlayers = this.filterPlayers(teamId);

      this.setData({
        filteredPlayers,
        showPlayerInPicker: true,
        currentPickerType: 'playerIn'
      });
    },

    // 确认选择球员
    onConfirmPlayerSelect(e) {
      const { value, items } = e.detail;
      const pickerType = this.data.currentPickerType;

      if (pickerType === 'player') {
        this.setData({
          'eventForm.userId': items?.id || '',
          'eventForm.playerName': items?.name || items?.nickname || ''
        });
      } else if (pickerType === 'assist') {
        this.setData({
          'eventForm.assistUserId': items?.id || '',
          'eventForm.assistName': items?.name || items?.nickname || ''
        });
      } else if (pickerType === 'playerOut') {
        this.setData({
          'eventForm.playerOutId': items?.id || '',
          'eventForm.playerOutName': items?.name || items?.nickname || ''
        });
      } else if (pickerType === 'playerIn') {
        this.setData({
          'eventForm.playerInId': items?.id || '',
          'eventForm.playerInName': items?.name || items?.nickname || ''
        });
      }

      // 关闭选择器
      this.onClosePlayerPicker();
    },

    // 关闭球员选择器
    onClosePlayerPicker() {
      this.setData({
        showPlayerPicker: false,
        showAssistPicker: false,
        showPlayerOutPicker: false,
        showPlayerInPicker: false
      });
    },

    // 取消事件编辑
    onCancelEvent() {
      this.setData({ showEventDialog: false });
    },

    // 保存事件
    onSaveEvent() {
      const form = this.data.eventForm;

      // 验证
      if (!form.minute) {
        wx.showToast({ title: '请输入时间', icon: 'none' });
        return;
      }

      if (!form.teamId) {
        wx.showToast({ title: '请选择队伍', icon: 'none' });
        return;
      }

      if (['goal', 'save', 'yellow_card', 'red_card'].includes(form.type) && !form.userId) {
        wx.showToast({ title: '请选择球员', icon: 'none' });
        return;
      }

      if (form.type === 'substitution' && (!form.playerOutId || !form.playerInId)) {
        wx.showToast({ title: '请选择换人球员', icon: 'none' });
        return;
      }

      // 构建事件对象
      // teamId 代表得分的队伍（用于计算比分和显示位置）
      const event = {
        id: this.data.editingEvent ? this.data.editingEvent.id : `event_${Date.now()}`,
        eventType: form.type,
        minute: parseInt(form.minute),
        teamId: form.teamId,  // 得分队伍（也是显示队伍）
        isOwnGoal: form.isOwnGoal || false,
        userId: form.userId,
        playerName: form.playerName,
        assistUserId: form.assistUserId,
        assistName: form.assistName,
        playerOutId: form.playerOutId,
        playerOutName: form.playerOutName,
        playerInId: form.playerInId,
        playerInName: form.playerInName,
        notes: form.notes,
        eventSubtype: form.isOwnGoal ? 'own_goal' : null
      };

      let events = [...this.data.form.events];
      let isNewEvent = false;

      if (this.data.editingEvent) {
        // 编辑已有事件
        const index = events.findIndex(e => e.id === this.data.editingEvent.id);
        if (index !== -1) {
          events[index] = event;
        }
      } else {
        // 添加新事件
        events.push(event);
        isNewEvent = true;
      }

      // 按时间排序
      events.sort((a, b) => a.minute - b.minute);

      // 如果是进球事件，自动更新比分
      if (form.type === 'goal') {
        this.updateGoalsFromEvents(events);
      }

      this.setData({
        'form.events': events,
        showEventDialog: false
      });

      // 保存到后端API - 只传递新增或修改的事件
      if (isNewEvent) {
        // 新增事件：只传递这一个新事件
        this.saveQuarterToAPI([event]);
      } else {
        // 编辑事件：使用更新逻辑（先删除旧的，再添加新的）
        this.updateEventToAPI(this.data.editingEvent.id, event);
      }

      wx.showToast({
        title: this.data.editingEvent ? '已更新' : '已添加',
        icon: 'success'
      });
    },

    // 根据进球事件自动计算比分
    updateGoalsFromEvents(events) {
      const { team1, team2 } = this.properties;
      let team1Goals = 0;
      let team2Goals = 0;

      // 统计进球事件
      events.forEach(event => {
        if (event.eventType === 'goal') {
          // teamId 代表获得进球的队伍（无论是否乌龙球）
          // 乌龙球情况：选择的队伍是获得进球的队伍，而不是犯错的队伍
          if (event.teamId === team1.id) {
            team1Goals++;
          } else if (event.teamId === team2.id) {
            team2Goals++;
          }
        }
      });

      // 更新比分
      this.setData({
        'form.team1Goals': team1Goals,
        'form.team2Goals': team2Goals
      });
    },

    // 触发change事件
    triggerChange() {
      const { quarterNumber } = this.properties;
      const { form } = this.data;

      this.triggerEvent('change', {
        quarterNumber,
        data: form
      });
    },

    // 获取事件类型显示名称
    getEventTypeName(eventType) {
      const type = this.data.eventTypes.find(t => t.id === eventType);
      return type ? type.name : eventType;
    },

    // 获取队伍名称
    getTeamName(teamId) {
      const { team1, team2 } = this.properties;
      if (teamId === team1?.id) return team1.name;
      if (teamId === team2?.id) return team2.name;
      return '';
    },

    // 保存节次数据到API（碎片化录入）
    async saveQuarterToAPI(events) {
      const { matchId, quarterNumber } = this.properties;
      const { form } = this.data;

      // 如果没有matchId,说明是预览模式,不调用API
      if (!matchId) {
        console.log('[quarter-input] 无matchId,跳过API保存');
        return;
      }

      // 记录临时ID，用于后续更新为真实ID
      const tempIds = events.map(e => e.id);

      try {
        // 转换事件格式为API需要的格式
        const apiEvents = events.map(event => ({
          teamId: event.teamId,
          userId: event.userId,
          eventType: event.eventType,
          eventSubtype: event.eventSubtype,
          minute: event.minute,
          assistUserId: event.assistUserId || null,
          notes: event.notes || ''
        }));

        // 调用API - 使用append模式追加保存
        const res = await matchAPI.saveQuarter(matchId, {
          quarterNumber: quarterNumber,
          mode: 'append',  // 追加模式 - 保留旧事件,添加新事件
          team1Goals: form.team1Goals,
          team2Goals: form.team2Goals,
          summary: form.summary || '',
          events: apiEvents
        });

        console.log('[quarter-input] 保存成功:', res.data);

        // 更新本地事件的ID为后端返回的真实ID
        if (res.data.events && res.data.events.length > 0) {
          const updatedEvents = [...form.events];

          // 后端返回的新事件（按创建时间排序）
          const newEventsFromAPI = res.data.events;

          // 更新临时ID为真实ID
          tempIds.forEach((tempId, index) => {
            const localEventIndex = updatedEvents.findIndex(e => e.id === tempId);
            if (localEventIndex !== -1 && newEventsFromAPI[index]) {
              // 用后端返回的真实ID替换临时ID
              updatedEvents[localEventIndex].id = newEventsFromAPI[index].id;
            }
          });

          this.setData({
            'form.events': updatedEvents
          });
        }

        // 触发保存成功事件,通知父组件更新数据
        this.triggerEvent('saved', {
          quarterNumber,
          data: res.data
        });

      } catch (err) {
        console.error('[quarter-input] 保存失败:', err);
        wx.showToast({
          title: '保存失败,请稍后重试',
          icon: 'none',
          duration: 2000
        });
      }
    },

    // 更新事件（调用API）
    async updateEventToAPI(oldEventId, newEvent) {
      const { matchId, quarterNumber } = this.properties;
      const { form } = this.data;

      // 如果没有matchId,说明是预览模式,不调用API
      if (!matchId) {
        console.log('[quarter-input] 无matchId,跳过API更新');
        return;
      }

      try {
        // 转换事件格式为API需要的格式
        const apiEvent = {
          teamId: newEvent.teamId,
          userId: newEvent.userId,
          eventType: newEvent.eventType,
          eventSubtype: newEvent.eventSubtype,
          minute: newEvent.minute,
          assistUserId: newEvent.assistUserId || null,
          notes: newEvent.notes || ''
        };

        // 调用API - 使用append模式，同时删除旧事件并添加新事件
        const res = await matchAPI.saveQuarter(matchId, {
          quarterNumber: quarterNumber,
          mode: 'append',  // 追加模式
          team1Goals: form.team1Goals,
          team2Goals: form.team2Goals,
          summary: form.summary || '',
          deleteEventIds: [oldEventId],  // 删除旧事件
          events: [apiEvent]  // 添加新事件
        });

        console.log('[quarter-input] 更新成功:', res.data);

        // 触发保存成功事件,通知父组件更新数据
        this.triggerEvent('saved', {
          quarterNumber,
          data: res.data
        });

      } catch (err) {
        console.error('[quarter-input] 更新失败:', err);
        wx.showToast({
          title: '更新失败,请稍后重试',
          icon: 'none',
          duration: 2000
        });
      }
    },

    // 删除事件（调用API）
    async deleteEventFromAPI(eventId) {
      const { matchId, quarterNumber } = this.properties;
      const { form } = this.data;

      // 如果没有matchId,说明是预览模式,不调用API
      if (!matchId) {
        console.log('[quarter-input] 无matchId,跳过API删除');
        return;
      }

      try {
        // 调用API - 使用auto模式，传入deleteEventIds参数
        const res = await matchAPI.saveQuarter(matchId, {
          quarterNumber: quarterNumber,
          mode: 'auto',  // 自动模式
          team1Goals: form.team1Goals,
          team2Goals: form.team2Goals,
          summary: form.summary || '',
          deleteEventIds: [eventId]  // 要删除的事件ID列表
        });

        console.log('[quarter-input] 删除成功:', res.data);

        // 触发保存成功事件,通知父组件更新数据
        this.triggerEvent('saved', {
          quarterNumber,
          data: res.data
        });

      } catch (err) {
        console.error('[quarter-input] 删除失败:', err);
        wx.showToast({
          title: '删除失败,请稍后重试',
          icon: 'none',
          duration: 2000
        });
      }
    }
  }
});
