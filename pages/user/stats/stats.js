// pages/user/stats/stats.js
const app = getApp();
const statsAPI = require('../../../api/stats.js');
const userAPI = require('../../../api/user.js');

Page({
  data: {
    // 用户ID（从参数或全局获取）
    userId: '',
    isMyself: true, // 是否是自己

    // 用户基本信息
    userInfo: null,

    // 总体统计
    totalStats: {
      matches: 0,
      goals: 0,
      assists: 0,
      mvp: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      winRate: 0,
      attendance: 0,
      yellowCards: 0,
      redCards: 0
    },

    // 当前队伍统计
    currentTeamStats: null,

    // 历史队伍统计
    teamHistory: [],

    // 成就列表
    achievements: [],
    unlockedCount: 0, // 已解锁成就数量

    // 近期比赛记录
    recentMatches: [],

    // 加载状态
    loading: false
  },

  onLoad(options) {
    // 获取用户ID
    const userId = options.id || app.globalData.userInfo?.id || '1';
    const myUserId = app.globalData.userInfo?.id || '1';

    this.setData({
      userId: userId,
      isMyself: userId === myUserId
    });

    this.loadUserStats();
  },

  onPullDownRefresh() {
    this.loadUserStats();
    wx.stopPullDownRefresh();
  },

  // 加载用户统计数据
  loadUserStats() {
    this.setData({ loading: true });
    wx.showLoading({ title: '加载中...' });

    // 调用真实 API
    return statsAPI.getPlayerStats(this.data.userId).then(res => {
      const data = res.data;

      // 处理用户信息
      const userInfo = {
        id: data.user?.id || this.data.userId,
        name: data.user?.realName || data.user?.nickname,
        avatar: data.user?.avatar || '/static/images/default-avatar.png',
        jerseyNumber: data.user?.jerseyNumber,
        position: data.user?.position,
        team: data.currentTeam?.name,
        teamColor: data.currentTeam?.color || '#667eea'
      };

      // 处理总体统计
      const totalStats = {
        matches: data.totalMatches || 0,
        goals: data.totalGoals || 0,
        assists: data.totalAssists || 0,
        mvp: data.totalMVP || 0,
        wins: data.totalWins || 0,
        draws: data.totalDraws || 0,
        losses: data.totalLosses || 0,
        winRate: data.winRate || 0,
        attendance: data.attendance || 0,
        yellowCards: data.yellowCards || 0,
        redCards: data.redCards || 0
      };

      // 格式化数据给 stats-grid 组件
      const statsGridData = [
        { icon: '/static/icons/match.png', iconClass: 'match-icon', value: totalStats.matches, label: '参赛场次' },
        { icon: '/static/icons/goal.png', iconClass: 'goal-icon', value: totalStats.goals, label: '进球' },
        { icon: '/static/icons/assist.png', iconClass: 'assist-icon', value: totalStats.assists, label: '助攻' },
        { icon: '/static/icons/star.png', iconClass: 'mvp-icon', value: totalStats.mvp, label: 'MVP' },
        { icon: '/static/icons/win-rate.png', iconClass: 'rate-icon', value: totalStats.winRate + '%', label: '胜率' },
        { icon: '/static/icons/attendance.png', iconClass: 'attendance-icon', value: totalStats.attendance + '%', label: '出勤率' }
      ];

      // 格式化战绩给 team-stats-bar 组件
      const recordStats = {
        wins: totalStats.wins,
        draws: totalStats.draws,
        losses: totalStats.losses,
        totalMatches: totalStats.wins + totalStats.draws + totalStats.losses,
        yellowCards: totalStats.yellowCards,
        redCards: totalStats.redCards
      };

      // 处理当前队伍统计
      const currentTeamData = data.currentTeamStats || {};
      const currentTeamStats = {
        teamName: data.currentTeam?.name,
        teamLogo: data.currentTeam?.logo || '/static/images/default-team.png',
        teamColor: data.currentTeam?.color || '#667eea',
        matches: currentTeamData.matches || 0,
        goals: currentTeamData.goals || 0,
        assists: currentTeamData.assists || 0,
        mvp: currentTeamData.mvp || 0,
        wins: currentTeamData.wins || 0,
        draws: currentTeamData.draws || 0,
        losses: currentTeamData.losses || 0,
        winRate: currentTeamData.winRate || 0
      };

      const currentTeamStatsGrid = [
        { icon: '/static/icons/match.png', iconClass: 'match-icon', value: currentTeamStats.matches, label: '出场' },
        { icon: '/static/icons/goal.png', iconClass: 'goal-icon', value: currentTeamStats.goals, label: '进球' },
        { icon: '/static/icons/assist.png', iconClass: 'assist-icon', value: currentTeamStats.assists, label: '助攻' },
        { icon: '/static/icons/star.png', iconClass: 'mvp-icon', value: currentTeamStats.mvp, label: 'MVP' }
      ];

      const currentTeamStatsBar = {
        wins: currentTeamStats.wins,
        draws: currentTeamStats.draws,
        losses: currentTeamStats.losses,
        totalMatches: currentTeamStats.matches,
        winRate: currentTeamStats.winRate
      };

      // 处理历史队伍
      const teamHistory = (data.teamHistory || []).map(history => ({
        id: history.teamId,
        teamName: history.teamName,
        teamLogo: history.teamLogo || '/static/images/default-team.png',
        teamColor: history.teamColor || '#667eea',
        season: history.season,
        matches: history.matches || 0,
        goals: history.goals || 0,
        assists: history.assists || 0
      }));

      // 处理成就
      const achievements = data.achievements || [];
      const unlockedCount = achievements.filter(item => item.unlocked).length;

      // 处理近期比赛
      const recentMatches = data.recentMatches || [];
      const recentMatchesData = recentMatches.map(match => {
        const userTeamName = userInfo.team;
        return {
          id: match.matchId,
          date: match.date,
          time: match.time || '',
          location: match.location || '',
          team1: {
            id: match.team1Id,
            name: match.team1Name || userTeamName,
            logo: match.team1Logo || currentTeamStats.teamLogo,
            score: match.team1Score
          },
          team2: {
            id: match.team2Id,
            name: match.team2Name,
            logo: match.team2Logo || '/static/images/default-team.png',
            score: match.team2Score
          },
          status: 'finished',
          result: match.result,
          mvp: match.isMVP ? { id: userInfo.id, name: userInfo.name } : null,
          personalGoals: match.goals || 0,
          personalAssists: match.assists || 0
        };
      });

      this.setData({
        userInfo: userInfo,
        totalStats: totalStats,
        statsGridData: statsGridData,
        recordStats: recordStats,
        currentTeamStats: currentTeamStats,
        currentTeamStatsGrid: currentTeamStatsGrid,
        currentTeamStatsBar: currentTeamStatsBar,
        teamHistory: teamHistory,
        achievements: achievements,
        unlockedCount: unlockedCount,
        recentMatches: recentMatches,
        recentMatchesData: recentMatchesData,
        loading: false
      });

      wx.hideLoading();
    }).catch(err => {
      console.error('加载用户统计失败:', err);
      wx.hideLoading();
      this.setData({ loading: false });
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    });
  },

  // 查看比赛详情
  onMatchTap(e) {
    const matchId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/match/detail/detail?id=${matchId}`
    });
  },

  // match-card 组件点击事件
  onMatchCardTap(e) {
    const { matchId } = e.detail;
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
  },

  // 查看当前队伍详情
  onCurrentTeamTap() {
    wx.navigateTo({
      url: '/pages/team/detail/detail?id=1'
    });
  }
});
