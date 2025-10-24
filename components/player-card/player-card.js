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
    // 点击卡片 - 防止重复触发
    onCardTap() {
      if (this.data.disabled) return;

      // 防抖：防止短时间内重复点击
      if (this._tapping) {
        console.log('[player-card] 防抖：忽略重复点击');
        return;
      }
      this._tapping = true;
      setTimeout(() => {
        this._tapping = false;
      }, 500); // 500ms 内不响应重复点击

      const { playerData, selected } = this.data;
      console.log('[player-card] onCardTap 触发，playerId:', playerData.id);
      this.triggerEvent('tap', {
        playerId: playerData.id,
        playerData,
        selected
      });
    }
  }
});
