// components/stats-grid/stats-grid.js
Component({
  properties: {
    // 数据列表
    stats: {
      type: Array,
      value: []
    },
    // 列数：2 | 3 | 4
    columns: {
      type: Number,
      value: 4
    }
  },

  methods: {
    // 点击数据卡片
    onStatTap(e) {
      const { index } = e.currentTarget.dataset;
      const stat = this.data.stats[index];
      this.triggerEvent('tap', { index, stat });
    }
  }
});
