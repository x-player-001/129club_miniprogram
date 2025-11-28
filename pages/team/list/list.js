// pages/team/list/list.js
const app = getApp();
const teamAPI = require('../../../api/team.js');
const seasonAPI = require('../../../api/season.js');
const { getTeamLogoUrl } = require('../../../utils/dataFormatter.js');
const config = require('../../../utils/config.js');

Page({
  data: {
    currentTab: '0',
    tabs: [
      { id: '0', name: '当前队伍' },
      { id: '1', name: '历史队伍' }
    ],
    activeTeams: [],
    historyTeams: [],
    isAdmin: true, // 临时启用管理员模式，方便测试
    currentSeason: null, // 当前赛季
    showCreateUI: false, // 是否显示创建队伍入口
    // 历史队伍相关
    allSeasons: [], // 所有赛季列表
    selectedSeasonId: '', // 选中的赛季ID
    selectedSeasonName: '请选择赛季', // 选中的赛季名称
    showSeasonPicker: false, // 是否显示赛季选择器

    // 图标URL
    icons: {
      arrowDown: config.getIconUrl('arrow-down.png'),
      close: config.getIconUrl('close.png'),
      check: config.getIconUrl('check.png')
    },
    // 图片URL
    images: {
      emptyTeam: config.getImageUrl('empty-team.png')
    }
  },

  onLoad(options) {
    this.checkAdminRole();
    this.loadCurrentSeason();
    this.loadTeamData();
    this.loadAllSeasons(); // 加载所有赛季供历史队伍筛选
  },

  onShow() {
    this.loadCurrentSeason();
    this.loadTeamData();
  },

  onPullDownRefresh() {
    Promise.all([
      this.loadCurrentSeason(),
      this.loadTeamData()
    ]).then(() => {
      wx.stopPullDownRefresh();
    });
  },

  checkAdminRole() {
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo');
    const isAdmin = userInfo && (userInfo.role === 'admin' || userInfo.role === 'super_admin');

    console.log('[Team List] 用户权限:', {
      role: userInfo?.role,
      isAdmin: isAdmin
    });

    this.setData({ isAdmin });
  },

  /**
   * 加载当前赛季信息
   */
  loadCurrentSeason() {
    // 尝试从缓存获取
    const cachedSeason = app.getCurrentSeason();
    if (cachedSeason) {
      this.setData({ currentSeason: cachedSeason });
      return Promise.resolve();
    }

    // 从API加载
    return seasonAPI.getList({ status: 'active', limit: 1 })
      .then(res => {
        const seasons = res.data.list || [];
        if (seasons.length > 0) {
          this.setData({ currentSeason: seasons[0] });
        } else {
          this.setData({ currentSeason: null });
        }
      })
      .catch(err => {
        console.error('加载赛季信息失败:', err);
        this.setData({ currentSeason: null });
      });
  },

  loadTeamData() {
    return Promise.all([
      this.loadActiveTeams(),
      this.loadHistoryTeams()
    ]).then(() => {
      // 判断是否显示创建队伍入口
      this.updateCreateUIVisibility();
    }).catch(err => {
      console.error('加载队伍数据失败:', err);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    });
  },

  /**
   * 判断是否显示创建队伍入口
   * 规则：有进行中的赛季且没有队伍时，显示创建入口（仅管理员可见）
   */
  updateCreateUIVisibility() {
    const hasNoTeams = this.data.activeTeams.length === 0;
    const hasActiveSeason = this.data.currentSeason && this.data.currentSeason.status === 'active';

    this.setData({
      showCreateUI: hasNoTeams && hasActiveSeason && this.data.isAdmin
    });
  },

  loadActiveTeams() {
    return teamAPI.getTeamList({ status: 'active' }).then(res => {
      const teamList = res.data?.list || res.data || [];
      const teams = teamList.map(team => {
        // 处理统计数据，兼容不同字段名（后端可能返回 matchesPlayed 或 totalMatches）
        const rawStats = team.stats || {};
        const stats = {
          totalMatches: rawStats.totalMatches || rawStats.matchesPlayed || 0,
          wins: rawStats.wins || 0,
          draws: rawStats.draws || 0,
          losses: rawStats.losses || 0,
          winRate: rawStats.winRate || 0
        };

        return {
          id: team.id,
          name: team.name,
          logo: getTeamLogoUrl(team.logo),
          color: team.color || '#ff6b6b',
          colorDark: this.darkenColor(team.color || '#ff6b6b'),
          captainName: team.captain?.realName || team.captain?.nickname || team.captainName || '未设置',
          season: team.season,
          memberCount: team.memberCount || 0,
          stats
        };
      });
      this.setData({ activeTeams: teams });
    });
  },

  loadHistoryTeams() {
    // 根据选中的赛季筛选历史队伍（归档状态）
    const params = { status: 'archived' };
    if (this.data.selectedSeasonId) {
      params.seasonId = this.data.selectedSeasonId;
    }

    return teamAPI.getTeamList(params).then(res => {
      const teamList = res.data?.list || res.data || [];
      const teams = teamList.map(team => {
        // 处理统计数据，兼容不同字段名
        const rawStats = team.stats || {};
        const stats = {
          totalMatches: rawStats.totalMatches || rawStats.matchesPlayed || 0,
          wins: rawStats.wins || 0,
          draws: rawStats.draws || 0,
          losses: rawStats.losses || 0,
          winRate: rawStats.winRate || 0
        };

        return {
          id: team.id,
          name: team.name,
          logo: getTeamLogoUrl(team.logo),
          color: team.color || '#95a5a6',
          colorDark: this.darkenColor(team.color || '#95a5a6'),
          season: team.season,
          period: this.formatPeriod(team.createdAt, team.disbandedAt),
          stats
        };
      });
      this.setData({ historyTeams: teams });
    });
  },

  /**
   * 加载所有赛季列表（仅已完成的赛季用于历史队伍筛选）
   */
  loadAllSeasons() {
    return seasonAPI.getList({ status: 'completed', limit: 100 })
      .then(res => {
        const seasons = res.data.list || [];
        this.setData({ allSeasons: seasons });

        // 如果还没有选中赛季，自动选中第一个已完成的赛季
        if (!this.data.selectedSeasonId && seasons.length > 0) {
          this.setData({
            selectedSeasonId: seasons[0].id,
            selectedSeasonName: seasons[0].name
          });
          // 加载该赛季的历史队伍
          this.loadHistoryTeams();
        }
      })
      .catch(err => {
        console.error('加载赛季列表失败:', err);
      });
  },

  darkenColor(color) {
    const hex = color.replace('#', '');
    const r = Math.max(0, parseInt(hex.substring(0, 2), 16) - 30);
    const g = Math.max(0, parseInt(hex.substring(2, 4), 16) - 30);
    const b = Math.max(0, parseInt(hex.substring(4, 6), 16) - 30);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  },

  formatPeriod(start, end) {
    if (!start || !end) return '';
    const startDate = new Date(start);
    const endDate = new Date(end);
    const startStr = `${startDate.getFullYear()}.${startDate.getMonth() + 1}`;
    const endStr = `${endDate.getFullYear()}.${endDate.getMonth() + 1}`;
    return `${startStr} - ${endStr}`;
  },

  onSwitchTab(e) {
    const tab = e.currentTarget.dataset.tab || e.detail.tabId;
    this.setData({ currentTab: tab });
  },

  // tab-bar组件事件处理
  onTabChange(e) {
    const { tabId } = e.detail;
    this.setData({ currentTab: tabId });
  },

  // team-card组件事件处理 - 防止重复跳转
  onTeamCardTap(e) {
    const { teamId } = e.detail;
    console.log('[Team List] onTeamCardTap 被调用, teamId:', teamId);

    // 防御性检查：确保 teamId 存在且有效
    if (!teamId || teamId === 'undefined' || typeof teamId === 'undefined') {
      console.error('[Team List] teamId 无效，取消导航');
      return;
    }

    // 防止重复跳转（真机上可能因为性能问题导致重复触发）
    if (this._navigating) {
      console.log('[Team List] 防抖：忽略重复跳转');
      return;
    }
    this._navigating = true;

    console.log('[Team List] 正在跳转到队伍详情:', teamId);
    wx.navigateTo({
      url: `/pages/team/detail/detail?id=${teamId}`,
      success: () => {
        console.log('[Team List] 跳转成功');
        setTimeout(() => {
          this._navigating = false;
        }, 500);
      },
      fail: (err) => {
        console.error('[Team List] 跳转失败:', err);
        this._navigating = false;
      }
    });
  },

  /**
   * 跳转到赛季详情
   */
  onGoToSeasonDetail() {
    if (this.data.currentSeason) {
      wx.navigateTo({
        url: `/pages/season/detail/detail?id=${this.data.currentSeason.id}`
      });
    }
  },

  /**
   * 跳转到赛季管理
   */
  onGoToSeasonList() {
    wx.navigateTo({
      url: '/pages/season/list/list'
    });
  },

  /**
   * 批量创建队伍（仅在特定条件下显示）
   */
  onBatchCreateTeam() {
    wx.navigateTo({
      url: '/pages/team/batch-create/batch-create'
    });
  },

  /**
   * 创建队伍（仅在特定条件下显示）- 保留用于其他入口
   */
  onCreateTeam() {
    wx.navigateTo({
      url: '/pages/team/create/create'
    });
  },

  /**
   * 发起重组（仅在特定条件下显示）
   */
  onReshuffle() {
    // 防止重复点击
    if (this._reshuffleNavigating) {
      return;
    }

    // 需要两个队伍才能发起选人
    if (this.data.activeTeams.length < 2) {
      wx.showToast({
        title: '需要两个队伍才能发起选人',
        icon: 'none'
      });
      return;
    }

    this._reshuffleNavigating = true;

    const team1 = this.data.activeTeams[0];
    const team2 = this.data.activeTeams[1];

    // 传递队伍信息到重组页面
    wx.navigateTo({
      url: `/pages/team/reshuffle/reshuffle?team1Id=${team1.id}&team2Id=${team2.id}`,
      complete: () => {
        setTimeout(() => {
          this._reshuffleNavigating = false;
        }, 500);
      }
    });
  },

  onGoToTeamDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/team/detail/detail?id=${id}`
    });
  },

  /**
   * 显示赛季选择器
   */
  onShowSeasonPicker() {
    this.setData({ showSeasonPicker: true });
  },

  /**
   * 关闭赛季选择器
   */
  onCloseSeasonPicker() {
    this.setData({ showSeasonPicker: false });
  },

  /**
   * 选择赛季
   */
  onSelectSeason(e) {
    const seasonId = e.currentTarget.dataset.id;
    const seasonName = e.currentTarget.dataset.name;
    this.setData({
      selectedSeasonId: seasonId,
      selectedSeasonName: seasonName,
      showSeasonPicker: false
    });
    // 重新加载历史队伍
    this.loadHistoryTeams();
  }
});
