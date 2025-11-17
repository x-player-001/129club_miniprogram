// pages/index/index.js
const app = getApp();
const userAPI = require('../../api/user.js');
const matchAPI = require('../../api/match.js');
const statsAPI = require('../../api/stats.js');
const seasonAPI = require('../../api/season.js');
const { getTeamLogoUrl } = require('../../utils/dataFormatter.js');
const config = require('../../utils/config.js');

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
    currentSeason: null,  // 当前赛季
    // 图标URL
    icons: {
      bell: config.getIconUrl('bell.png'),
      crown: config.getIconUrl('crown.png'),
      arrowRight: config.getIconUrl('arrow-right.png'),
      footballWhite: config.getIconUrl('football-white.png'),
      chartWhite: config.getIconUrl('chart-white.png'),
      trophyWhite: config.getIconUrl('trophy-white.png'),
      teamWhite: config.getIconUrl('team-white.png')
    },
    // 图片URL
    images: {
      defaultAvatar: config.getImageUrl('default-avatar.png'),
      defaultTeam: config.getImageUrl('default-team.png'),
      emptyTeam: config.getImageUrl('empty-team.png'),
      emptyMatch: config.getImageUrl('empty-match.png')
    }
  },

  onLoad() {
    console.log('首页 onLoad 执行');
    // 加载数据（游客或登录用户）
    this.loadPageData();
  },

  onShow() {
    // 每次onShow都刷新数据（确保数据实时性）
    if (!this.data.isLoading) {
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

    // 检查是否登录
    const isLogin = app.globalData.isLogin;
    console.log('[Index] 登录状态:', isLogin);

    // 游客模式：只加载公开数据
    if (!isLogin) {
      return Promise.all([
        this.loadCurrentSeason(),
        this.loadRecentMatches().catch(err => {
          console.log('[Index] 游客模式加载比赛失败（正常）:', err);
          return Promise.resolve();
        })
      ]).then(() => {
        this.setData({
          isLoading: false,
          hasLoaded: true
        });
      }).catch(err => {
        console.error('[Index] 游客模式加载失败:', err);
        this.setData({
          isLoading: false,
          hasLoaded: true
        });
      });
    }

    // 登录模式：加载完整数据
    return Promise.all([
      this.loadUserInfo(),
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
          // 处理队长信息和logo，使用 realName
          const currentTeam = {
            ...userInfo.currentTeam,
            logo: getTeamLogoUrl(userInfo.currentTeam.logo),
            captainName: userInfo.currentTeam.captain?.realName || userInfo.currentTeam.captain?.nickname || '未知'
          };
          this.setData({ currentTeam });
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
              icon: config.getIconUrl('goal.png'),
              iconClass: 'goal-icon',
              value: personalStats.goals,
              label: '进球'
            },
            {
              icon: config.getIconUrl('assist.png'),
              iconClass: 'assist-icon',
              value: personalStats.assists,
              label: '助攻'
            },
            {
              icon: config.getIconUrl('match.png'),
              iconClass: 'match-icon',
              value: personalStats.matches,
              label: '出场'
            },
            {
              icon: config.getIconUrl('star.png'),
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
        logo: getTeamLogoUrl(teamInfo.logo),
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

        // 处理点球大战数据
        let penaltyShootout = {
          enabled: false,
          team1Score: 0,
          team2Score: 0,
          winner: ''
        };

        if (match.result && match.result.penaltyShootout) {
          // 将 penaltyWinnerTeamId 转换为 'team1' 或 'team2'
          let winner = '';
          if (match.result.penaltyWinnerTeamId) {
            const team1Id = match.team1?.id || match.team1Id;
            const team2Id = match.team2?.id || match.team2Id;

            if (match.result.penaltyWinnerTeamId === team1Id) {
              winner = 'team1';
            } else if (match.result.penaltyWinnerTeamId === team2Id) {
              winner = 'team2';
            }
          }

          penaltyShootout = {
            enabled: true,
            team1Score: match.result.team1PenaltyScore || 0,
            team2Score: match.result.team2PenaltyScore || 0,
            winner: winner
          };
        }

        // 格式化为match-card组件需要的数据格式
        return {
          id: match.id,
          dateDay: day,
          dateMonth: month + '月',
          time: `${hours}:${minutes}`,
          location: match.location,
          status: statusMap[match.status] || match.status,
          team1: match.team1 ? { ...match.team1, logo: getTeamLogoUrl(match.team1.logo) } : { name: match.team1Name, logo: getTeamLogoUrl(match.team1Logo) },
          team2: match.team2 ? { ...match.team2, logo: getTeamLogoUrl(match.team2.logo) } : { name: match.team2Name, logo: getTeamLogoUrl(match.team2Logo) },
          team1Score: match.team1Score,
          team2Score: match.team2Score,
          team1FinalScore: match.result?.team1FinalScore || match.team1Score,
          team2FinalScore: match.result?.team2FinalScore || match.team2Score,
          team1TotalGoals: match.result?.team1TotalGoals,
          team2TotalGoals: match.result?.team2TotalGoals,
          team1RegisteredCount: match.team1RegisterCount || 0,
          team2RegisteredCount: match.team2RegisterCount || 0,
          maxPlayersPerTeam: match.maxPlayersPerTeam || 11,
          mvpPlayer: match.mvpPlayer,
          penaltyShootout: penaltyShootout
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

  // 跳转到队伍详情 - 防止重复跳转
  onGoToTeamDetail() {
    if (!this.data.currentTeam) return;

    const teamId = this.data.currentTeam.id;
    console.log('[Index] onGoToTeamDetail 被调用, teamId:', teamId);

    // 防御性检查：确保 teamId 存在且有效
    if (!teamId || teamId === 'undefined' || typeof teamId === 'undefined') {
      console.error('[Index] teamId 无效，取消导航');
      return;
    }

    // 防止重复跳转（真机上可能因为性能问题导致重复触发）
    if (this._navigatingToTeam) {
      console.log('[Index] 防抖：忽略重复跳转到队伍详情');
      return;
    }
    this._navigatingToTeam = true;

    console.log('[Index] 正在跳转到队伍详情:', teamId);
    wx.navigateTo({
      url: `/pages/team/detail/detail?id=${teamId}`,
      success: () => {
        console.log('[Index] 跳转成功');
        setTimeout(() => {
          this._navigatingToTeam = false;
        }, 500);
      },
      fail: (err) => {
        console.error('[Index] 跳转失败:', err);
        this._navigatingToTeam = false;
      }
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

  // match-card组件事件处理 - 防止重复跳转
  onMatchCardTap(e) {
    const { matchId } = e.detail;
    console.log('[Index] onMatchCardTap 被调用, matchId:', matchId);

    // 防御性检查：确保 matchId 存在且有效
    if (!matchId || matchId === 'undefined' || typeof matchId === 'undefined') {
      console.error('[Index] matchId 无效，取消导航');
      return;
    }

    // 防止重复跳转（真机上可能因为性能问题导致重复触发）
    if (this._navigating) {
      console.log('[Index] 防抖：忽略重复跳转');
      return;
    }
    this._navigating = true;

    console.log('[Index] 正在跳转到比赛详情:', matchId);
    wx.navigateTo({
      url: `/pages/match/detail/detail?id=${matchId}`,
      success: () => {
        console.log('[Index] 跳转成功');
        setTimeout(() => {
          this._navigating = false;
        }, 500);
      },
      fail: (err) => {
        console.error('[Index] 跳转失败:', err);
        this._navigating = false;
      }
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
