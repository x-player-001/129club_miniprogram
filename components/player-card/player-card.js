// components/player-card/player-card.js
Component({
  properties: {
    // 球员数据
    playerData: {
      type: Object,
      value: {}
    },
    // 显示模式：full（完整版）| compact（紧凑版）| draft（Draft模式）
    mode: {
      type: String,
      value: 'full'
    },
    // 是否选中（Draft模式使用）
    selected: {
      type: Boolean,
      value: false
    },
    // 是否禁用
    disabled: {
      type: Boolean,
      value: false
    }
  },

  methods: {
    // 点击卡片
    onCardTap() {
      if (this.data.disabled) return;

      const { playerData, selected } = this.data;
      this.triggerEvent('tap', {
        playerId: playerData.id,
        playerData,
        selected
      });
    }
  }
});
