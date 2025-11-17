// components/team-card/team-card.js
const config = require('../../utils/config.js');

Component({
  properties: {
    // 队伍数据
    teamData: {
      type: Object,
      value: {}
    },
    // 显示模式：current（当前队伍）| history（历史队伍）| compact（紧凑版）
    mode: {
      type: String,
      value: 'current'
    }
  },

  data: {
    icons: {
      crown: config.getIconUrl('crown.png'),
      users: config.getIconUrl('users.png')
    }
  },

  methods: {
    // 点击卡片 - 防止重复触发
    onCardTap() {
      // 防抖：防止短时间内重复点击
      if (this._tapping) {
        console.log('[team-card] 防抖：忽略重复点击');
        return;
      }
      this._tapping = true;
      setTimeout(() => {
        this._tapping = false;
      }, 500); // 500ms 内不响应重复点击

      const { teamData } = this.data;
      console.log('[team-card] onCardTap 触发，teamId:', teamData.id);
      this.triggerEvent('tap', { teamId: teamData.id, teamData });
    }
  }
});
