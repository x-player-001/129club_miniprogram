// components/player-card/player-card.js
const config = require('../../utils/config.js');
const app = getApp();

Component({
  properties: {
    // 球员数据
    playerData: {
      type: Object,
      value: {},
      observer(newVal) {
        // 确保惯用脚数据为数字类型
        if (newVal && Object.keys(newVal).length > 0) {
          const leftFootSkill = Number(newVal.leftFootSkill || 0);
          const rightFootSkill = Number(newVal.rightFootSkill || 0);

          // 获取队伍颜色
          const teamColor = newVal.teamColor || '';

          this.setData({
            _processedPlayerData: {
              ...newVal,
              leftFootSkill: leftFootSkill,
              rightFootSkill: rightFootSkill,
              teamColor: teamColor || ''
            }
          });
        }
      }
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

  data: {
    _processedPlayerData: {
      leftFootSkill: 0,
      rightFootSkill: 0
    },
    icons: {
      crownSmall: config.getIconUrl('crown-small.png')
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

      const { _processedPlayerData, playerData, selected } = this.data;
      const data = _processedPlayerData.id ? _processedPlayerData : playerData;

      this.triggerEvent('tap', {
        playerId: data.id,
        playerData: data,
        selected
      });
    }
  }
});
