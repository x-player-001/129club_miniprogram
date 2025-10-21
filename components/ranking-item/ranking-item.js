// components/ranking-item/ranking-item.js
Component({
  properties: {
    // 排名数据
    rankData: {
      type: Object,
      value: {}
    },
    // 排名类型：goals | assists | mvp | attendance
    rankType: {
      type: String,
      value: 'goals'
    },
    // 是否当前用户
    isCurrentUser: {
      type: Boolean,
      value: false
    }
  },

  methods: {
    // 点击排名项
    onItemTap() {
      const { rankData } = this.data;
      this.triggerEvent('tap', { playerId: rankData.id, rankData });
    },

    // 获取排名标签文字
    getRankLabel() {
      const { rankType } = this.data;
      const labels = {
        goals: '进球',
        assists: '助攻',
        mvp: '次MVP',
        attendance: '出勤率'
      };
      return labels[rankType] || '';
    }
  }
});
