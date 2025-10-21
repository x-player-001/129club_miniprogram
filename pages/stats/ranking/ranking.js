// pages/stats/ranking/ranking.js
const app = getApp();
const statsAPI = require('../../../api/stats.js');

Page({
  data: {
    // Tab类型
    rankType: 'goals', // goals, assists, mvp, attendance
    rankTabs: [
      { id: 'goals', name: '射手榜', icon: '⚽' },
      { id: 'assists', name: '助攻榜', icon: '🎯' },
      { id: 'mvp', name: 'MVP榜', icon: '⭐' },
      { id: 'attendance', name: '出勤榜', icon: '📅' }
    ],

    // 筛选条件
    scope: 'all', // all: 全局, team: 队内
    season: 'all', // all, 2025, 2024
    seasonIndex: 0, // picker选中的索引
    scopeOptions: [
      { id: 'all', name: '全局排名' },
      { id: 'team', name: '队内排名' }
    ],
    seasonOptions: [
      { id: 'all', name: '全部' },
      { id: '2025', name: '2025赛季' },
      { id: '2024', name: '2024赛季' }
    ],

    // 排行榜数据
    rankingList: [],  // 完整排行榜
    topThree: [],     // 前三名（领奖台展示）
    remainingList: [], // 第4名及以后（列表展示）

    // 当前用户ID
    myUserId: '3', // 模拟当前用户ID为3

    // 加载状态
    loading: false
  },

  onLoad(options) {
    // 从参数获取排行榜类型
    if (options.type) {
      this.setData({ rankType: options.type });
    }

    // 获取当前用户ID（从全局数据）
    const userInfo = app.globalData.userInfo;
    if (userInfo) {
      this.setData({ myUserId: userInfo.id });
    }

    this.loadRankingData();
  },

  onPullDownRefresh() {
    this.loadRankingData();
    wx.stopPullDownRefresh();
  },

  // 加载排行榜数据
  loadRankingData() {
    this.setData({ loading: true });

    // 使用模拟数据
    const mockData = this.getMockRankingData();
    this.processRankingData(mockData);
    this.setData({ loading: false });

    // 真实API调用（待后端接口完成后启用）
    // const params = {
    //   scope: this.data.scope,
    //   season: this.data.season !== 'all' ? this.data.season : undefined
    // };
    //
    // statsAPI.getRanking(this.data.rankType, params).then(res => {
    //   const data = res.data;
    //   const rankingList = (data.list || data || []).map((item, index) => ({
    //     rank: item.rank || index + 1,
    //     id: item.userId || item.user?.id,
    //     name: item.user?.realName || item.user?.nickname || item.name,
    //     avatar: item.user?.avatar || '/static/images/default-avatar.png',
    //     team: item.user?.team?.name || item.teamName,
    //     teamColor: item.user?.team?.color || item.teamColor || '#667eea',
    //     value: item.goals || item.assists || item.mvpCount || item.attendance || 0,
    //     matches: item.matches || item.matchesPlayed || 0
    //   }));
    //
    //   this.processRankingData(rankingList);
    //   this.setData({ loading: false });
    // }).catch(err => {
    //   console.error('加载排行榜失败:', err);
    //   this.setData({ loading: false });
    // });
  },

  // 处理排行榜数据（拆分前三名和剩余）
  processRankingData(rankingList) {
    // 标记当前用户
    const myUserId = this.data.myUserId;
    const processedList = rankingList.map(item => ({
      ...item,
      isCurrentUser: item.id === myUserId
    }));

    // 拆分前三名和剩余
    const topThree = processedList.slice(0, 3);
    const remainingList = processedList.slice(3);

    this.setData({
      rankingList: processedList,
      topThree,
      remainingList
    });
  },

  // 获取模拟数据
  getMockRankingData() {
    const { rankType } = this.data;

    // 模拟球员数据
    const mockPlayers = [
      {
        rank: 1,
        id: '1',
        name: '张三',
        avatar: '/static/images/default-avatar.png',
        team: '嘉陵摩托',
        teamColor: '#f20810',
        goals: 25,
        assists: 18,
        mvpCount: 12,
        attendance: 95,
        matches: 20
      },
      {
        rank: 2,
        id: '2',
        name: '李四',
        avatar: '/static/images/default-avatar.png',
        team: '长江黄河',
        teamColor: '#924ab0',
        goals: 22,
        assists: 15,
        mvpCount: 10,
        attendance: 92,
        matches: 19
      },
      {
        rank: 3,
        id: '3',
        name: '王五',
        avatar: '/static/images/default-avatar.png',
        team: '嘉陵摩托',
        teamColor: '#f20810',
        goals: 20,
        assists: 20,
        mvpCount: 8,
        attendance: 88,
        matches: 18
      },
      {
        rank: 4,
        id: '4',
        name: '赵六',
        avatar: '/static/images/default-avatar.png',
        team: '长江黄河',
        teamColor: '#924ab0',
        goals: 18,
        assists: 12,
        mvpCount: 7,
        attendance: 85,
        matches: 17
      },
      {
        rank: 5,
        id: '5',
        name: '钱七',
        avatar: '/static/images/default-avatar.png',
        team: '嘉陵摩托',
        teamColor: '#f20810',
        goals: 16,
        assists: 14,
        mvpCount: 6,
        attendance: 82,
        matches: 16
      },
      {
        rank: 6,
        id: '6',
        name: '孙八',
        avatar: '/static/images/default-avatar.png',
        team: '长江黄河',
        teamColor: '#924ab0',
        goals: 15,
        assists: 10,
        mvpCount: 5,
        attendance: 80,
        matches: 15
      },
      {
        rank: 7,
        id: '7',
        name: '周九',
        avatar: '/static/images/default-avatar.png',
        team: '嘉陵摩托',
        teamColor: '#f20810',
        goals: 14,
        assists: 11,
        mvpCount: 5,
        attendance: 78,
        matches: 14
      },
      {
        rank: 8,
        id: '8',
        name: '吴十',
        avatar: '/static/images/default-avatar.png',
        team: '长江黄河',
        teamColor: '#924ab0',
        goals: 12,
        assists: 9,
        mvpCount: 4,
        attendance: 75,
        matches: 13
      },
      {
        rank: 9,
        id: '9',
        name: '郑十一',
        avatar: '/static/images/default-avatar.png',
        team: '嘉陵摩托',
        teamColor: '#f20810',
        goals: 10,
        assists: 8,
        mvpCount: 3,
        attendance: 72,
        matches: 12
      },
      {
        rank: 10,
        id: '10',
        name: '冯十二',
        avatar: '/static/images/default-avatar.png',
        team: '长江黄河',
        teamColor: '#924ab0',
        goals: 8,
        assists: 7,
        mvpCount: 2,
        attendance: 70,
        matches: 11
      }
    ];

    // 根据排行榜类型返回对应数据
    return mockPlayers.map(player => ({
      ...player,
      value: player[rankType === 'goals' ? 'goals' :
                    rankType === 'assists' ? 'assists' :
                    rankType === 'mvp' ? 'mvpCount' : 'attendance']
    })).sort((a, b) => b.value - a.value);
  },

  // 切换排行榜类型
  onTabChange(e) {
    const rankType = e.currentTarget.dataset.type || e.detail.tabId;
    this.setData({ rankType });
    this.loadRankingData();
  },

  // 切换范围（全局/队内）
  onScopeChange(e) {
    const scope = e.currentTarget.dataset.scope || e.detail.optionId;
    this.setData({ scope });
    this.loadRankingData();
  },

  // 切换赛季
  onSeasonChange(e) {
    const value = e.detail.value;
    const season = this.data.seasonOptions[value].id;
    this.setData({
      season,
      seasonIndex: value
    });
    this.loadRankingData();
  },

  // 点击排行项查看球员详情
  onPlayerTap(e) {
    const playerId = e.currentTarget.dataset.id || e.detail.playerId;
    wx.navigateTo({
      url: `/pages/user/stats/stats?id=${playerId}`,
      fail: () => {
        wx.showToast({
          title: '功能开发中',
          icon: 'none'
        });
      }
    });
  },

  // 获取排行榜标签文字
  getRankLabel() {
    const labels = {
      goals: '进球',
      assists: '助攻',
      mvp: '次',
      attendance: '出勤'
    };
    return labels[this.data.rankType] || '数据';
  }
});
