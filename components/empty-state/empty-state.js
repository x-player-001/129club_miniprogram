// components/empty-state/empty-state.js
Component({
  properties: {
    // 图标（URL或emoji）
    icon: {
      type: String,
      value: ''
    },
    // 主提示文字
    text: {
      type: String,
      value: '暂无数据'
    },
    // 辅助说明文字
    hint: {
      type: String,
      value: ''
    },
    // 按钮文字
    buttonText: {
      type: String,
      value: ''
    }
  },

  methods: {
    // 点击按钮
    onButtonTap() {
      this.triggerEvent('action');
    }
  }
});
