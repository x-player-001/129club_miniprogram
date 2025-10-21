// components/tab-bar/tab-bar.js
Component({
  properties: {
    // 标签列表
    tabs: {
      type: Array,
      value: []
    },
    // 当前选中的tab id
    current: {
      type: String,
      value: ''
    },
    // 是否可滚动
    scrollable: {
      type: Boolean,
      value: false
    }
  },

  methods: {
    // 切换tab
    onTabChange(e) {
      const { id } = e.currentTarget.dataset;
      if (id === this.data.current) return;

      this.triggerEvent('change', { tabId: id });
    }
  }
});
