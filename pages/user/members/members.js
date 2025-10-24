// pages/user/members/members.js
const app = getApp();
const userAPI = require('../../../api/user.js');
const teamAPI = require('../../../api/team.js');

Page({
  data: {
    searchKeyword: '',
    currentTeam: 'all',
    teams: [],
    filterOptions: [],
    members: [],
    filteredMembers: []
  },

  onLoad(options) {
    console.log('成员列表页面加载，参数:', options);
    // 如果有传入 teamId，则默认筛选该队伍
    if (options.teamId) {
      this.setData({ currentTeam: options.teamId });
    }
    this.loadData();
  },

  onPullDownRefresh() {
    this.loadData().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 加载数据
  loadData() {
    wx.showLoading({ title: '加载中...' });

    return Promise.all([
      this.loadTeams(),
      this.loadMembers()
    ]).then(() => {
      this.filterMembers();
    }).catch(err => {
      console.error('加载数据失败:', err);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }).finally(() => {
      wx.hideLoading();
    });
  },

  // 加载队伍列表
  loadTeams() {
    return teamAPI.getTeamList({ status: 'active' }).then(res => {
      const teams = res.data?.list || res.data || [];

      // 格式化为 filter-bar 组件数据
      const filterOptions = [
        { id: 'all', name: '全部' },
        ...teams.map(team => ({
          id: team.id,
          name: team.name,
          color: team.color
        }))
      ];

      this.setData({
        teams: teams,
        filterOptions: filterOptions
      });
    }).catch(err => {
      console.error('加载队伍列表失败:', err);
      this.setData({
        teams: [],
        filterOptions: [{ id: 'all', name: '全部' }]
      });
    });
  },

  // 加载成员列表
  loadMembers() {
    return userAPI.getMemberList().then(res => {
      const memberList = res.data?.list || res.data || [];

      // 格式化成员数据
      const members = memberList.map(member => {
        // 处理位置数据，兼容字符串和数组格式
        let position = member.user?.position || member.position || '';

        // 如果是数组，转换为字符串
        if (Array.isArray(position)) {
          position = position.filter(p => p && /^[A-Z]{2,3}$/.test(p)).join(',');
        } else if (typeof position === 'string') {
          // 如果是字符串，过滤无效位置代码
          const validPositions = position.split(',')
            .map(p => p.trim())
            .filter(p => /^[A-Z]{2,3}$/.test(p));
          position = validPositions.join(',');
        } else {
          // 其他类型转为空字符串
          position = '';
        }

        return {
          id: member.user?.id || member.id,
          realName: member.user?.realName || member.realName,
          nickname: member.user?.nickname || member.nickname,
          avatar: member.user?.avatar || member.avatar || '/static/images/default-avatar.png',
          jerseyNumber: member.user?.jerseyNumber || member.jerseyNumber,
          position: position,
          teamId: member.teamId,
          teamName: member.team?.name || member.teamName,
          teamColor: member.team?.color || member.teamColor,
          isCaptain: member.role === 'captain' || member.isCaptain || false,
          totalGoals: member.user?.stats?.goals || member.stats?.goals || 0,
          totalAssists: member.user?.stats?.assists || member.stats?.assists || 0,
          totalMatches: member.user?.stats?.matchesPlayed || member.stats?.matchesPlayed || 0
        };
      });

      this.setData({ members });
    }).catch(err => {
      console.error('加载成员列表失败:', err);
      this.setData({ members: [] });
    });
  },

  // 筛选成员
  filterMembers() {
    let filtered = this.data.members;

    // 按队伍筛选
    if (this.data.currentTeam !== 'all') {
      filtered = filtered.filter(member => member.teamId === this.data.currentTeam);
    }

    // 按关键词搜索
    if (this.data.searchKeyword) {
      const keyword = this.data.searchKeyword.toLowerCase();
      filtered = filtered.filter(member => {
        const name = (member.realName || member.nickname || '').toLowerCase();
        const number = String(member.jerseyNumber || '');
        return name.includes(keyword) || number.includes(keyword);
      });
    }

    this.setData({
      filteredMembers: filtered
    });

    console.log(`筛选结果: ${filtered.length} 名队员`);
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
  },

  // 搜索确认
  onSearch() {
    this.filterMembers();
  },

  // 清除搜索
  onClearSearch() {
    this.setData({
      searchKeyword: ''
    }, () => {
      this.filterMembers();
    });
  },

  // 筛选队伍
  onFilterTeam(e) {
    const team = e.currentTarget.dataset.team;
    this.setData({
      currentTeam: team
    }, () => {
      this.filterMembers();
    });
  },

  // filter-bar组件事件
  onFilterChange(e) {
    const { optionId } = e.detail;
    this.setData({
      currentTeam: optionId
    }, () => {
      this.filterMembers();
    });
  },

  // 查看成员详情
  onViewMemberDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/user/stats/stats?userId=${id}`
    });
  },

  // player-card组件事件 - 防止重复跳转
  onPlayerCardTap(e) {
    const { playerId } = e.detail;
    console.log('[Members] onPlayerCardTap 被调用, playerId:', playerId);

    // 防御性检查：确保 playerId 存在且有效
    if (!playerId || playerId === 'undefined' || typeof playerId === 'undefined') {
      console.error('[Members] playerId 无效，取消导航');
      return;
    }

    // 防止重复跳转（真机上可能因为性能问题导致重复触发）
    if (this._navigating) {
      console.log('[Members] 防抖：忽略重复跳转');
      return;
    }
    this._navigating = true;

    console.log('[Members] 正在跳转到球员统计:', playerId);
    wx.navigateTo({
      url: `/pages/user/stats/stats?userId=${playerId}`,
      success: () => {
        console.log('[Members] 跳转成功');
        setTimeout(() => {
          this._navigating = false;
        }, 500);
      },
      fail: (err) => {
        console.error('[Members] 跳转失败:', err);
        this._navigating = false;
      }
    });
  }
});
