/**
 * 事件时间轴组件
 * 用于展示足球比赛事件（进球、黄牌、红牌、扑救、换人等）
 */
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 事件列表
    events: {
      type: Array,
      value: []
    },
    // 左队信息
    team1: {
      type: Object,
      value: null
    },
    // 右队信息
    team2: {
      type: Object,
      value: null
    },
    // 是否显示操作按钮（编辑、删除）
    showActions: {
      type: Boolean,
      value: true
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    timelineRows: [] // 时间轴行数据，每行包含 leftEvent 和 rightEvent
  },

  /**
   * 数据监听器
   */
  observers: {
    'events, team1, team2': function(events, team1, team2) {
      if (!events || events.length === 0 || !team1 || !team2) {
        this.setData({ timelineRows: [] });
        return;
      }

      // 按照 minute 字段升序排列
      const sortedEvents = [...events].sort((a, b) => a.minute - b.minute);

      // 构建时间轴行数据
      const timelineRows = sortedEvents.map(event => {
        return {
          id: event.id,
          minute: event.minute,
          leftEvent: event.teamId === team1.id ? event : null,
          rightEvent: event.teamId === team2.id ? event : null
        };
      });

      this.setData({ timelineRows });
    }
  },


  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 编辑事件
     */
    onEditEvent(e) {
      const eventId = e.currentTarget.dataset.id;
      this.triggerEvent('edit', { eventId });
    },

    /**
     * 删除事件
     */
    onDeleteEvent(e) {
      const eventId = e.currentTarget.dataset.id;
      this.triggerEvent('delete', { eventId });
    },

    /**
     * 点击事件项
     */
    onEventClick(e) {
      const eventId = e.currentTarget.dataset.id;
      this.triggerEvent('click', { eventId });
    }
  }
});
