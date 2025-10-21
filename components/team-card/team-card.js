// components/team-card/team-card.js
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

  methods: {
    // 点击卡片
    onCardTap() {
      const { teamData } = this.data;
      this.triggerEvent('tap', { teamId: teamData.id, teamData });
    }
  }
});
