// pages/stats/ranking/ranking.js
const app = getApp();
const statsAPI = require('../../../api/stats.js');
const seasonAPI = require('../../../api/season.js');
const config = require('../../../utils/config.js');

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
      { id: 'all', name: '全部赛季' }
    ],

    // 排行榜数据
    rankingList: [],  // 完整排行榜
    topThree: [],     // 前三名（领奖台展示）
    remainingList: [], // 第4名及以后（列表展示）

    // 当前用户ID
    myUserId: null,

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
    if (userInfo && userInfo.id) {
      this.setData({ myUserId: userInfo.id });
    }

    // 加载赛季列表
    this.loadSeasons();

    this.loadRankingData();
  },

  // 加载赛季列表
  loadSeasons() {
    seasonAPI.getList({ limit: 100 }).then(res => {
      const seasons = res.data?.list || [];

      // 构建赛季选项列表
      const seasonOptions = [
        { id: 'all', name: '全部赛季' }
      ];

      // 查找当前活跃赛季
      let activeSeasonIndex = 0;
      let activeSeason = null;

      seasons.forEach((season, index) => {
        seasonOptions.push({
          id: season.id,
          name: season.name
        });

        // 记录活跃赛季的索引（在seasonOptions中的位置是index+1，因为第0项是"全部赛季"）
        if (season.status === 'active') {
          activeSeason = season;
          activeSeasonIndex = index + 1;
        }
      });

      // 如果找到活跃赛季，设置为默认选中
      if (activeSeason) {
        this.setData({
          seasonOptions,
          season: activeSeason.id,
          seasonIndex: activeSeasonIndex
        });
        // 重新加载排行榜数据（使用当前赛季筛选）
        this.loadRankingData();
      } else {
        this.setData({ seasonOptions });
      }
    }).catch(err => {
      console.error('加载赛季列表失败:', err);
    });
  },

  onPullDownRefresh() {
    this.loadRankingData();
    wx.stopPullDownRefresh();
  },

  // 加载排行榜数据
  loadRankingData() {
    this.setData({ loading: true });

    // 构建请求参数
    const params = {
      scope: this.data.scope,
      page: 1,
      pageSize: 50
    };

    // 如果是队内排名，需要传 teamId
    if (this.data.scope === 'team') {
      const userInfo = app.globalData.userInfo;
      if (userInfo && userInfo.currentTeamId) {
        params.teamId = userInfo.currentTeamId;
      } else {
        wx.showToast({
          title: '请先加入队伍',
          icon: 'none'
        });
        this.setData({ loading: false });
        return;
      }
    }

    // 赛季筛选（预留，后端暂未实现）
    if (this.data.season !== 'all') {
      params.season = this.data.season;
    }

    // 调用API
    statsAPI.getRanking(this.data.rankType, params).then(res => {
      // 响应格式: { code, success, data: { list: [] }, message }
      const data = res.data?.list || res.data || [];
      const rankingList = data.map((item, index) => {
        // 根据排行榜类型获取对应的值
        let value = 0;
        if (this.data.rankType === 'goals') {
          value = item.goals || 0;
        } else if (this.data.rankType === 'assists') {
          value = item.assists || 0;
        } else if (this.data.rankType === 'mvp') {
          value = item.mvpCount || 0;
        } else if (this.data.rankType === 'attendance') {
          value = item.attendanceRate || 0;
        }

        return {
          rank: item.rank || index + 1,
          id: item.userId || item.user?.id,
          name: item.user?.realName || item.user?.nickname || '未知',
          avatar: config.getStaticUrl(item.user?.avatar, 'avatar') || config.getImageUrl('default-avatar.png'),
          team: item.user?.teams?.[0]?.team?.name || item.user?.currentTeam?.name || '无队伍',
          teamColor: item.user?.teams?.[0]?.team?.color || item.user?.currentTeam?.color || '#667eea',
          value: value,
          matches: item.matchesPlayed || 0
        };
      });

      this.processRankingData(rankingList);
      this.setData({ loading: false });
    }).catch(err => {
      console.error('加载排行榜失败:', err);
      wx.showToast({
        title: err.message || '加载失败',
        icon: 'none'
      });
      this.setData({ loading: false, rankingList: [], topThree: [], remainingList: [] });
    });
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
