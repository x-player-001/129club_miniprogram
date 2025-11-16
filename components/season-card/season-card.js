// components/season-card/season-card.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    season: {
      type: Object,
      value: {}
    },
    showActions: {
      type: Boolean,
      value: false
    },
    showScore: {
      type: Boolean,
      value: true
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    formattedStartDate: '',
    team1Data: {},
    team2Data: {}
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 格式化日期
    formatDate(dateStr) {
      if (!dateStr) return '未设置';
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },

    // 初始化数据
    initData() {
      const season = this.data.season;

      // 格式化日期
      this.setData({
        formattedStartDate: this.formatDate(season.startDate)
      });

      // 如果有统计数据，设置队伍比分
      if (season.team1Wins !== undefined && season.team2Wins !== undefined) {
        this.setData({
          team1Data: {
            name: season.team1Name || '红队',
            logo: season.team1Logo || '/static/images/logoa.png',
            wins: season.team1Wins || 0
          },
          team2Data: {
            name: season.team2Name || '蓝队',
            logo: season.team2Logo || '/static/images/logob.png',
            wins: season.team2Wins || 0
          }
        });
      }
    },

    // 点击卡片
    onCardTap() {
      const season = this.properties.season || this.data.season;

      // 防御性检查
      if (!season || !season.id) {
        console.error('[Season Card] 无效的赛季数据:', season);
        return;
      }

      this.triggerEvent('cardtap', { season: season });
    },

    // 阻止冒泡
    onActionsTap(e) {
      // 阻止事件冒泡到卡片点击
    },

    // 编辑
    onEdit(e) {
      const id = e.currentTarget.dataset.id;
      this.triggerEvent('edit', { seasonId: id });
    },

    // 完成赛季
    onComplete(e) {
      const id = e.currentTarget.dataset.id;
      this.triggerEvent('complete', { seasonId: id });
    },

    // 删除
    onDelete(e) {
      const id = e.currentTarget.dataset.id;
      this.triggerEvent('delete', { seasonId: id });
    }
  },

  /**
   * 生命周期函数
   */
  lifetimes: {
    attached() {
      this.initData();
    }
  },

  /**
   * 监听属性变化
   */
  observers: {
    'season': function() {
      this.initData();
    }
  }
});
