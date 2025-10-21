// pages/team/vs/vs.js
const app = getApp();
const matchAPI = require('../../../api/match.js');
const teamAPI = require('../../../api/team.js');

Page({
  data: {
    team1Id: '',
    team2Id: '',
    team1Info: {},
    team2Info: {},
    vsStats: {},
    matchList: []
  },

  onLoad(options) {
    console.log('对战记录页面加载，参数:', options);
    if (options.team1Id && options.team2Id) {
      this.setData({
        team1Id: options.team1Id,
        team2Id: options.team2Id
      });
      this.loadData();
    } else {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      });
    }
  },

  onPullDownRefresh() {
    this.loadData().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 加载所有数据
  loadData() {
    console.log('开始加载对战数据');

    // 使用测试数据
    const mockTeam1 = {
      id: this.data.team1Id,
      name: '嘉陵摩托',
      logo: '/static/images/logoa.png',
      color: '#f20810'
    };

    const mockTeam2 = {
      id: this.data.team2Id,
      name: '长江黄河',
      logo: '/static/images/logob.png',
      color: '#924ab0'
    };

    const mockVsStats = {
      totalMatches: 5,
      team1Wins: 3,
      team2Wins: 1,
      draws: 1,
      team1GoalsFor: 12,
      team1GoalsAgainst: 8,
      team2GoalsFor: 8,
      team2GoalsAgainst: 12,
      team1AvgGoals: 2.4,
      team2AvgGoals: 1.6
    };

    const mockMatches = [
      {
        id: '1',
        datetime: '2024-10-10 14:00',
        dateText: '2024-10-10',
        time: '14:00',
        location: '城市体育场',
        team1Id: this.data.team1Id,
        team1Name: '嘉陵摩托',
        team1Logo: '/static/images/logoa.png',
        team1Score: 3,
        team2Id: this.data.team2Id,
        team2Name: '长江黄河',
        team2Logo: '/static/images/logob.png',
        team2Score: 2,
        scorers: [
          { name: '张三', teamId: this.data.team1Id },
          { name: '张三', teamId: this.data.team1Id },
          { name: '李四', teamId: this.data.team1Id },
          { name: '王五', teamId: this.data.team2Id },
          { name: '赵六', teamId: this.data.team2Id }
        ]
      },
      {
        id: '2',
        datetime: '2024-09-15 15:00',
        dateText: '2024-09-15',
        time: '15:00',
        location: '足球公园',
        team1Id: this.data.team1Id,
        team1Name: '嘉陵摩托',
        team1Logo: '/static/images/logoa.png',
        team1Score: 2,
        team2Id: this.data.team2Id,
        team2Name: '长江黄河',
        team2Logo: '/static/images/logob.png',
        team2Score: 2,
        scorers: [
          { name: '张三', teamId: this.data.team1Id },
          { name: '李四', teamId: this.data.team1Id },
          { name: '王五', teamId: this.data.team2Id },
          { name: '赵六', teamId: this.data.team2Id }
        ]
      },
      {
        id: '3',
        datetime: '2024-08-20 14:30',
        dateText: '2024-08-20',
        time: '14:30',
        location: '体育中心',
        team1Id: this.data.team1Id,
        team1Name: '嘉陵摩托',
        team1Logo: '/static/images/logoa.png',
        team1Score: 1,
        team2Id: this.data.team2Id,
        team2Name: '长江黄河',
        team2Logo: '/static/images/logob.png',
        team2Score: 0,
        scorers: [
          { name: '张三', teamId: this.data.team1Id }
        ]
      }
    ];

    this.setData({
      team1Info: mockTeam1,
      team2Info: mockTeam2,
      vsStats: mockVsStats,
      matchList: mockMatches
    });

    wx.setNavigationBarTitle({
      title: `${mockTeam1.name} VS ${mockTeam2.name}`
    });

    console.log('对战数据加载完成');
    return Promise.resolve();

    // 真实API调用（暂时注释）
    /*
    wx.showLoading({ title: '加载中...' });

    return Promise.all([
      this.loadTeamInfo(),
      this.loadVsStats(),
      this.loadMatchList()
    ]).finally(() => {
      wx.hideLoading();
    });
    */
  },

  // 加载队伍信息
  loadTeamInfo() {
    return Promise.all([
      teamAPI.getTeamDetail(this.data.team1Id),
      teamAPI.getTeamDetail(this.data.team2Id)
    ]).then(([res1, res2]) => {
      this.setData({
        team1Info: res1.data || {},
        team2Info: res2.data || {}
      });

      wx.setNavigationBarTitle({
        title: `${res1.data.name} VS ${res2.data.name}`
      });
    }).catch(err => {
      console.error('加载队伍信息失败:', err);
    });
  },

  // 加载对战统计
  loadVsStats() {
    return matchAPI.getVsStats(this.data.team1Id, this.data.team2Id).then(res => {
      this.setData({
        vsStats: res.data || {}
      });
    }).catch(err => {
      console.error('加载对战统计失败:', err);
    });
  },

  // 加载对战列表
  loadMatchList() {
    return matchAPI.getMatchList({
      team1Id: this.data.team1Id,
      team2Id: this.data.team2Id,
      status: 'finished'
    }).then(res => {
      const matches = (res.data || []).map(match => {
        const date = new Date(match.datetime);
        return {
          ...match,
          dateText: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
          time: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
        };
      });

      this.setData({
        matchList: matches
      });
    }).catch(err => {
      console.error('加载对战列表失败:', err);
      this.setData({ matchList: [] });
    });
  },

  // 查看比赛详情
  onViewMatchDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/match/detail/detail?id=${id}`
    });
  }
});
