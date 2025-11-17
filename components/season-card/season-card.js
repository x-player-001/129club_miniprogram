// components/season-card/season-card.js
const config = require('../../utils/config.js');

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

      // 处理排名数据
      if (season.rankings && Array.isArray(season.rankings) && season.rankings.length >= 2) {
        // 从 rankings 数组中获取前两名队伍
        const rank1 = season.rankings[0];
        const rank2 = season.rankings[1];

        this.setData({
          team1Data: {
            name: rank1.teamName || '队伍1',
            logo: config.getStaticUrl(rank1.teamLogo, 'teamLogos') || config.getImageUrl('default-team.png'),
            wins: rank1.winCount || 0
          },
          team2Data: {
            name: rank2.teamName || '队伍2',
            logo: config.getStaticUrl(rank2.teamLogo, 'teamLogos') || config.getImageUrl('default-team.png'),
            wins: rank2.winCount || 0
          }
        });
      }
      // 兼容旧数据格式（如果有统计数据，设置队伍比分）
      else if (season.team1Wins !== undefined && season.team2Wins !== undefined) {
        this.setData({
          team1Data: {
            name: season.team1Name || '红队',
            logo: config.getStaticUrl(season.team1Logo, 'teamLogos') || config.getImageUrl('logoa.png'),
            wins: season.team1Wins || 0
          },
          team2Data: {
            name: season.team2Name || '蓝队',
            logo: config.getStaticUrl(season.team2Logo, 'teamLogos') || config.getImageUrl('logob.png'),
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
