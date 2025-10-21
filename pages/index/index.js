// pages/index/index.js
const app = getApp();
const userAPI = require('../../api/user.js');
const matchAPI = require('../../api/match.js');
const statsAPI = require('../../api/stats.js');
const seasonAPI = require('../../api/season.js');

Page({
  data: {
    userInfo: {},
    currentTeam: null,
    teamStats: {},
    matchList: [],
    personalStats: {},
    unreadCount: 0,
    isLoading: false,
    hasLoaded: false,
    currentSeason: null  // 当前赛季
  },

  onLoad() {
    console.log('首页 onLoad 执行');
    // 启动页已经完成了登录和信息完整性检查，这里直接加载数据
    this.loadPageData();
  },

  onShow() {
    // 只在首次加载或需要刷新时加载数据
    // 避免每次切换Tab都重新加载，防止无限重试
    if (!this.data.hasLoaded && !this.data.isLoading) {
      this.loadPageData();
    }
  },

  onPullDownRefresh() {
    // 下拉刷新时，重置状态允许重新加载
    this.setData({
      isLoading: false,
      hasLoaded: false
    });
    this.loadPageData().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  loadPageData() {
    console.log('首页 loadPageData 开始执行');

    // 防止重复加载
    if (this.data.isLoading) {
      console.log('正在加载中，跳过重复请求');
      return Promise.resolve();
    }

    this.setData({ isLoading: true });

    // 尝试加载真实API数据
    return Promise.all([
      this.loadUserInfo(), // loadUserInfo 会自动设置 currentTeam 并加载队伍统计
      this.loadCurrentSeason(),
      this.loadRecentMatches(),
      this.loadUnreadCount()
    ]).then(() => {
      this.setData({
        isLoading: false,
        hasLoaded: true
      });
    }).catch(err => {
      console.error('加载API数据失败:', err);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
      this.setData({
        isLoading: false,
        hasLoaded: true
      });
    });
  },

  loadUserInfo() {
    // 先尝试从缓存获取
    const cachedUserInfo = app.globalData.userInfo || wx.getStorageSync('userInfo');
    if (cachedUserInfo) {
      this.setData({ userInfo: cachedUserInfo });
    }

    // 调用API获取最新用户信息（包含统计数据和队伍信息）
    return userAPI.getUserInfo().then(res => {
      if (res.data) {
        const userInfo = res.data;
        this.setData({ userInfo });
        app.globalData.userInfo = userInfo;
        wx.setStorageSync('userInfo', userInfo);

        // 设置当前队伍信息（从 userInfo.currentTeam）
        if (userInfo.currentTeam) {
          this.setData({ currentTeam: userInfo.currentTeam });
          // 加载队伍统计数据
          if (userInfo.currentTeam.id) {
            this.loadTeamStats(userInfo.currentTeam.id);
          }
        }

        // 如果返回了统计数据，同时设置 personalStats
        if (userInfo.stats || userInfo.statistics) {
          const stats = userInfo.stats || userInfo.statistics;
          const personalStats = {
            goals: stats.goals || 0,
            assists: stats.assists || 0,
            matches: stats.matchesPlayed || stats.matches || 0,
            mvpCount: stats.mvpCount || 0
          };

          // 格式化为 stats-grid 组件数据
          const statsGridData = [
            {
              icon: '/static/icons/goal.png',
              iconClass: 'goal-icon',
              value: personalStats.goals,
              label: '进球'
            },
            {
              icon: '/static/icons/assist.png',
              iconClass: 'assist-icon',
              value: personalStats.assists,
              label: '助攻'
            },
            {
              icon: '/static/icons/match.png',
              iconClass: 'match-icon',
              value: personalStats.matches,
              label: '出场'
            },
            {
              icon: '/static/icons/star.png',
              iconClass: 'mvp-icon',
              value: personalStats.mvpCount,
              label: 'MVP'
            }
          ];

          this.setData({
            personalStats,
            statsGridData
          });
        }
      }
    }).catch(err => {
      console.error('加载用户信息失败:', err);
      // 如果没有缓存数据，则使用fallback
      if (!cachedUserInfo) {
        throw err;
      }
    });
  },

  loadTeamStats(teamId) {
    return statsAPI.getTeamStats(teamId).then(res => {
      // API返回的数据结构: { team: {...}, stats: {...} }
      const data = res.data || {};
      const teamInfo = data.team || {};
      const statsInfo = data.stats || {};

      // 合并队伍基本信息和统计数据
      const teamStats = {
        name: teamInfo.name,
        logo: teamInfo.logo,
        wins: statsInfo.wins || 0,
        draws: statsInfo.draws || 0,
        losses: statsInfo.losses || 0,
        totalMatches: statsInfo.totalMatches || 0,
        winRate: statsInfo.winRate || 0,
        goalsFor: statsInfo.goalsFor || 0,
        goalsAgainst: statsInfo.goalsAgainst || 0
      };

      this.setData({ teamStats });
    }).catch(err => {
      console.error('加载队伍统计失败:', err);
    });
  },

  loadCurrentSeason() {
    // 先尝试从app获取缓存的当前赛季
    const cachedSeason = app.getCurrentSeason();
    if (cachedSeason) {
      this.setData({ currentSeason: cachedSeason });
      return Promise.resolve();
    }

    // 如果没有缓存，从API加载
    return seasonAPI.getList({ status: 'active', limit: 1 })
      .then(res => {
        const seasons = res.data.list || [];
        if (seasons.length > 0) {
          this.setData({ currentSeason: seasons[0] });
        }
      })
      .catch(err => {
        console.error('加载当前赛季失败:', err);
      });
  },

  loadRecentMatches() {
    return matchAPI.getMatchList({
      page: 1,
      pageSize: 3
    }).then(res => {
      const matches = res.data?.list || res.data || [];
      const matchList = matches.map(match => {
        const date = new Date(match.matchDate || match.datetime);
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');

        // 状态映射：后端 -> 前端
        const statusMap = {
          'registration': 'upcoming',  // 报名中 -> 未开始
          'in_progress': 'ongoing',    // 进行中 -> 进行中
          'completed': 'finished',     // 已完成 -> 已结束
          'cancelled': 'finished'      // 已取消 -> 已结束
        };

        // 格式化为match-card组件需要的数据格式
        return {
          id: match.id,
          dateDay: day,
          dateMonth: month + '月',
          time: `${hours}:${minutes}`,
          location: match.location,
          status: statusMap[match.status] || match.status,
          team1: match.team1 || { name: match.team1Name, logo: match.team1Logo },
          team2: match.team2 || { name: match.team2Name, logo: match.team2Logo },
          team1Score: match.team1Score,
          team2Score: match.team2Score,
          team1RegisteredCount: match.team1RegisterCount || 0,
          team2RegisteredCount: match.team2RegisterCount || 0,
          maxPlayersPerTeam: match.maxPlayersPerTeam || 11,
          mvpPlayer: match.mvpPlayer
        };
      });

      this.setData({ matchList });
    }).catch(err => {
      console.error('加载比赛列表失败:', err);
      throw err;
    });
  },

  loadUnreadCount() {
    this.setData({ unreadCount: 0 });
    return Promise.resolve();
  },

  onGoToMessage() {
    wx.navigateTo({
      url: '/pages/user/message/message'
    });
  },

  onGoToTeamDetail() {
    if (!this.data.currentTeam) return;
    wx.navigateTo({
      url: `/pages/team/detail/detail?id=${this.data.currentTeam.id}`
    });
  },

  onQuickAction(e) {
    const type = e.currentTarget.dataset.type;
    switch (type) {
      case 'match':
        wx.switchTab({ url: '/pages/match/list/list' });
        break;
      case 'stats':
        wx.switchTab({ url: '/pages/stats/overview/overview' });
        break;
      case 'ranking':
        wx.navigateTo({ url: '/pages/stats/ranking/ranking' });
        break;
      case 'team':
        wx.switchTab({ url: '/pages/team/list/list' });
        break;
    }
  },

  onViewAllMatches() {
    wx.switchTab({ url: '/pages/match/list/list' });
  },

  onViewPersonalStats() {
    wx.navigateTo({ url: '/pages/user/stats/stats' });
  },

  onGoToMatchDetail(e) {
    const id = e.currentTarget.dataset.id || e.detail.matchId;
    wx.navigateTo({
      url: `/pages/match/detail/detail?id=${id}`
    });
  },

  // match-card组件事件处理
  onMatchCardTap(e) {
    const { matchId } = e.detail;
    wx.navigateTo({
      url: `/pages/match/detail/detail?id=${matchId}`
    });
  },

  // stats-grid组件事件处理
  onStatTap(e) {
    // 点击数据卡片跳转到个人数据页
    wx.navigateTo({ url: '/pages/user/stats/stats' });
  },

  // 跳转到赛季详情
  onGoToSeasonDetail() {
    if (!this.data.currentSeason) return;
    wx.navigateTo({
      url: `/pages/season/detail/detail?id=${this.data.currentSeason.id}`
    });
  },

  // 跳转到赛季管理
  onGoToSeasonList() {
    wx.navigateTo({
      url: '/pages/season/list/list'
    });
  }
});
