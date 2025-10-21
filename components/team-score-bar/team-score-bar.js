// components/team-score-bar/team-score-bar.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    team1: {
      type: Object,
      value: {
        name: '队伍1',
        logo: '/static/images/logoa.png',
        wins: 0
      }
    },
    team2: {
      type: Object,
      value: {
        name: '队伍2',
        logo: '/static/images/logob.png',
        wins: 0
      }
    },
    showProgress: {
      type: Boolean,
      value: true
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    team1Percent: 50,
    team2Percent: 50
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 计算进度条百分比
    calculatePercent() {
      const team1Wins = this.data.team1.wins || 0;
      const team2Wins = this.data.team2.wins || 0;
      const total = team1Wins + team2Wins;

      if (total === 0) {
        this.setData({
          team1Percent: 50,
          team2Percent: 50
        });
        return;
      }

      this.setData({
        team1Percent: Math.round((team1Wins / total) * 100),
        team2Percent: Math.round((team2Wins / total) * 100)
      });
    }
  },

  /**
   * 生命周期函数
   */
  lifetimes: {
    attached() {
      this.calculatePercent();
    }
  },

  /**
   * 监听属性变化
   */
  observers: {
    'team1.wins, team2.wins': function() {
      this.calculatePercent();
    }
  }
});
