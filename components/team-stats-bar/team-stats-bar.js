// components/team-stats-bar/team-stats-bar.js
Component({
  properties: {
    // 战绩数据
    stats: {
      type: Object,
      value: {}
    },
    // 显示模式：full（完整版）| compact（紧凑版）
    mode: {
      type: String,
      value: 'full'
    },
    // 自定义样式类名
    customClass: {
      type: String,
      value: ''
    }
  },

  methods: {
    // 点击统计项
    onStatTap(e) {
      const type = e.currentTarget.dataset.type; // win, draw, loss
      console.log('[team-stats-bar] 点击统计项:', type);
      this.triggerEvent('stattap', { type });
    }
  }
});
