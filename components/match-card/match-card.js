// components/match-card/match-card.js
Component({
  properties: {
    // 比赛数据
    matchData: {
      type: Object,
      value: {}
    },
    // 显示模式：full（完整版）| compact（紧凑版）
    mode: {
      type: String,
      value: 'full'
    },
    // 是否显示操作按钮
    showActions: {
      type: Boolean,
      value: true
    }
  },

  methods: {
    // 点击卡片
    onCardTap() {
      const { matchData } = this.data;
      this.triggerEvent('tap', { matchId: matchData.id, matchData });
    },

    // 报名/取消报名
    onRegister(e) {
      const { matchData } = this.data;
      this.triggerEvent('register', {
        matchId: matchData.id,
        isRegistered: matchData.isRegistered
      });
      // 不需要 stopPropagation，在 WXML 中使用 catchtap 阻止冒泡
    }
  }
});
