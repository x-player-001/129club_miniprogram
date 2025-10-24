// components/achievement-badge/achievement-badge.js
Component({
  properties: {
    // 成就数据
    achievementData: {
      type: Object,
      value: {},
      observer(newVal, oldVal) {
        // 当数据变化时，判断 icon 是图片路径还是 emoji
        if (newVal && newVal.icon) {
          this.checkIconType(newVal.icon);
        }
      }
    }
  },

  data: {
    isImageIcon: false // 是否为图片图标
  },

  lifetimes: {
    attached() {
      // 组件初始化时检查图标类型
      this.checkIconType(this.data.achievementData.icon);
    }
  },

  methods: {
    // 检查图标类型（图片路径或 emoji）
    checkIconType(icon) {
      if (!icon) {
        this.setData({ isImageIcon: false });
        return;
      }

      // 判断是否为图片路径（包含 / 或 http）
      const isImage = icon.includes('/') || icon.startsWith('http');
      this.setData({ isImageIcon: isImage });
    },

    // 点击成就徽章
    onBadgeTap() {
      const { achievementData } = this.data;
      this.triggerEvent('tap', { achievementId: achievementData.id, achievementData });
    }
  }
});
