// components/filter-bar/filter-bar.js
Component({
  properties: {
    // 筛选选项
    options: {
      type: Array,
      value: []
    },
    // 当前选中的选项
    current: {
      type: String,
      value: ''
    }
  },

  methods: {
    // 切换选项
    onOptionChange(e) {
      const { id } = e.currentTarget.dataset;
      if (id === this.data.current) return;

      this.triggerEvent('change', { optionId: id });
    }
  }
});
