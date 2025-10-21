// components/achievement-badge/achievement-badge.js
Component({
  properties: {
    // 成就数据
    achievementData: {
      type: Object,
      value: {}
    }
  },

  methods: {
    // 点击成就徽章
    onBadgeTap() {
      const { achievementData } = this.data;
      this.triggerEvent('tap', { achievementId: achievementData.id, achievementData });
    }
  }
});
