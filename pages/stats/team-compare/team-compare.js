// pages/stats/team-compare/team-compare.js
const app = getApp();
const teamAPI = require('../../../api/team.js');
const statsAPI = require('../../../api/stats.js');

Page({
  data: {
    // 两支队伍信息
    team1: null,
    team2: null,

    // 对比数据
    compareData: {
      team1Stats: null,
      team2Stats: null,
      vsHistory: []
    },

    // 可选择的队伍列表（包括历史队伍）
    teamOptions: [],

    // 加载状态
    loading: false
  },

  onLoad(options) {
    // 默认选择两支队伍（嘉陵摩托 vs 长江黄河）
    this.setData({
      team1: {
        id: '1',
        name: '嘉陵摩托',
        logo: '/static/images/logoa.png',
        color: '#f20810'
      },
      team2: {
        id: '2',
        name: '长江黄河',
        logo: '/static/images/logob.png',
        color: '#924ab0'
      }
    });

    this.loadTeamOptions();
    this.loadCompareData();
  },

  onPullDownRefresh() {
    this.loadCompareData();
    wx.stopPullDownRefresh();
  },

  // 加载队伍选项列表
  loadTeamOptions() {
    // 调用真实 API 获取队伍列表
    teamAPI.getTeamList().then(res => {
      const teams = res.data?.list || res.data || [];
      const teamOptions = teams.map(team => ({
        id: team.id,
        name: team.name,
        logo: team.logo || '/static/images/default-team.png',
        color: team.color || '#667eea',
        season: team.season || '2025'
      }));
      this.setData({ teamOptions: teamOptions });
    }).catch(err => {
      console.error('加载队伍列表失败:', err);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    });
  },

  // 加载对比数据
  loadCompareData() {
    if (!this.data.team1 || !this.data.team2) {
      return;
    }

    this.setData({ loading: true });
    wx.showLoading({ title: '加载中...' });

    // 调用真实 API
    return statsAPI.getTeamCompare(this.data.team1.id, this.data.team2.id).then(res => {
      const data = res.data;

      // 处理队伍1统计
      const team1Stats = {
        matches: data.team1Stats?.matchesPlayed || 0,
        wins: data.team1Stats?.wins || 0,
        draws: data.team1Stats?.draws || 0,
        losses: data.team1Stats?.losses || 0,
        winRate: data.team1Stats?.winRate || 0,
        goalsFor: data.team1Stats?.goalsFor || 0,
        goalsAgainst: data.team1Stats?.goalsAgainst || 0,
        goalDifference: (data.team1Stats?.goalsFor || 0) - (data.team1Stats?.goalsAgainst || 0),
        avgGoalsFor: data.team1Stats?.avgGoalsFor || 0,
        avgGoalsAgainst: data.team1Stats?.avgGoalsAgainst || 0,
        cleanSheets: data.team1Stats?.cleanSheets || 0,
        topScorer: data.team1Stats?.topScorer || { name: '-', goals: 0 },
        topAssister: data.team1Stats?.topAssister || { name: '-', assists: 0 }
      };

      // 处理队伍2统计
      const team2Stats = {
        matches: data.team2Stats?.matchesPlayed || 0,
        wins: data.team2Stats?.wins || 0,
        draws: data.team2Stats?.draws || 0,
        losses: data.team2Stats?.losses || 0,
        winRate: data.team2Stats?.winRate || 0,
        goalsFor: data.team2Stats?.goalsFor || 0,
        goalsAgainst: data.team2Stats?.goalsAgainst || 0,
        goalDifference: (data.team2Stats?.goalsFor || 0) - (data.team2Stats?.goalsAgainst || 0),
        avgGoalsFor: data.team2Stats?.avgGoalsFor || 0,
        avgGoalsAgainst: data.team2Stats?.avgGoalsAgainst || 0,
        cleanSheets: data.team2Stats?.cleanSheets || 0,
        topScorer: data.team2Stats?.topScorer || { name: '-', goals: 0 },
        topAssister: data.team2Stats?.topAssister || { name: '-', assists: 0 }
      };

      // 处理对战历史
      const vsHistory = (data.vsHistory || []).map(match => ({
        id: match.matchId || match.id,
        date: match.matchDate || match.date,
        team1Score: match.team1Score || 0,
        team2Score: match.team2Score || 0,
        winner: match.winnerId || match.winner
      }));

      // 格式化数据给 team-stats-bar 组件
      const team1StatsBar = {
        wins: team1Stats.wins,
        draws: team1Stats.draws,
        losses: team1Stats.losses,
        totalMatches: team1Stats.matches,
        winRate: team1Stats.winRate
      };

      const team2StatsBar = {
        wins: team2Stats.wins,
        draws: team2Stats.draws,
        losses: team2Stats.losses,
        totalMatches: team2Stats.matches,
        winRate: team2Stats.winRate
      };

      this.setData({
        compareData: {
          team1Stats: team1Stats,
          team2Stats: team2Stats,
          vsHistory: vsHistory
        },
        team1StatsBar: team1StatsBar,
        team2StatsBar: team2StatsBar,
        loading: false
      });

      wx.hideLoading();
    }).catch(err => {
      console.error('加载对比数据失败:', err);
      wx.hideLoading();
      this.setData({ loading: false });
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    });
  },

  // 切换队伍（team1 或 team2）
  onSelectTeam(e) {
    const position = e.currentTarget.dataset.position; // 'team1' or 'team2'
    const teamOptions = this.data.teamOptions;

    wx.showActionSheet({
      itemList: teamOptions.map(t => `${t.name} (${t.season})`),
      success: (res) => {
        const selectedTeam = teamOptions[res.tapIndex];
        this.setData({
          [position]: selectedTeam
        });
        this.loadCompareData();
      }
    });
  },

  // 交换两队
  onSwapTeams() {
    const temp = this.data.team1;
    this.setData({
      team1: this.data.team2,
      team2: temp
    });
    this.loadCompareData();
  },

  // 查看比赛详情
  onMatchTap(e) {
    const matchId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/match/detail/detail?id=${matchId}`
    });
  },

  // 查看队伍详情
  onTeamTap(e) {
    const teamId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/team/detail/detail?id=${teamId}`
    });
  }
});
