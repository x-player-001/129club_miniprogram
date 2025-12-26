// 身价明细页面
const app = getApp();
const valueAPI = require('../../../api/value.js');
const config = require('../../../utils/config.js');

Page({
  data: {
    // 用户ID（查看他人时传入，查看自己时为空）
    userId: null,
    isSelf: true, // 是否查看自己的身价

    // 用户基本信息
    userInfo: {},

    // 身价概览
    valueOverview: {
      totalValue: 0,
      rank: 0,
      matchValue: 0,
      serviceValue: 0,
      specialValue: 0
    },

    // 身价明细列表
    records: [],
    page: 1,
    pageSize: 20,
    hasMore: true,

    // 加载状态
    loading: false,
    loadingMore: false,

    // 图片URL
    images: {
      defaultAvatar: config.getImageUrl('default-avatar.png')
    }
  },

  onLoad(options) {
    // 判断是查看自己还是他人
    if (options.userId) {
      const currentUserId = app.globalData.userInfo?.id;
      const isSelf = options.userId === currentUserId;
      this.setData({
        userId: options.userId,
        isSelf
      });
    }

    this.loadValueData();
  },

  onPullDownRefresh() {
    this.setData({
      records: [],
      page: 1,
      hasMore: true
    });
    this.loadValueData().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loadingMore) {
      this.loadMoreRecords();
    }
  },

  // 加载身价数据
  loadValueData() {
    this.setData({ loading: true });

    const loadPromise = this.data.isSelf && !this.data.userId
      ? this.loadMyValue()
      : this.loadPlayerValue();

    return loadPromise.then(() => {
      return this.loadRecords();
    }).finally(() => {
      this.setData({ loading: false });
    });
  },

  // 加载我的身价
  loadMyValue() {
    return valueAPI.getMyValue().then(res => {
      const data = res.data || {};
      const breakdown = data.breakdown || {};

      this.setData({
        userInfo: {
          id: data.userId || app.globalData.userInfo?.id,
          realName: data.user?.realName || app.globalData.userInfo?.realName,
          nickname: data.user?.nickname || app.globalData.userInfo?.nickname,
          avatar: config.getStaticUrl(data.user?.avatar || app.globalData.userInfo?.avatar, 'avatar'),
          jerseyNumber: data.user?.jerseyNumber || app.globalData.userInfo?.jerseyNumber
        },
        valueOverview: {
          totalValue: data.totalValue || 0,
          rank: data.rank || 0,
          // 比赛贡献 = 出勤 + 角色 + 结果 + 数据
          matchValue: (breakdown.attendance || 0) + (breakdown.role || 0) + (breakdown.result || 0) + (breakdown.data || 0),
          serviceValue: breakdown.service || 0,
          specialValue: breakdown.special || 0
        }
      });
    }).catch(err => {
      console.error('加载我的身价失败:', err);
      wx.showToast({
        title: err.message || '加载失败',
        icon: 'none'
      });
    });
  },

  // 加载球员身价
  loadPlayerValue() {
    return valueAPI.getPlayerValue(this.data.userId).then(res => {
      const data = res.data || {};
      const breakdown = data.breakdown || {};

      this.setData({
        userInfo: {
          id: data.userId,
          realName: data.user?.realName,
          nickname: data.user?.nickname,
          avatar: config.getStaticUrl(data.user?.avatar, 'avatar'),
          jerseyNumber: data.user?.jerseyNumber
        },
        valueOverview: {
          totalValue: data.totalValue || 0,
          rank: data.rank || 0,
          // 比赛贡献 = 出勤 + 角色 + 结果 + 数据
          matchValue: (breakdown.attendance || 0) + (breakdown.role || 0) + (breakdown.result || 0) + (breakdown.data || 0),
          serviceValue: breakdown.service || 0,
          specialValue: breakdown.special || 0
        }
      });
    }).catch(err => {
      console.error('加载球员身价失败:', err);
      wx.showToast({
        title: err.message || '加载失败',
        icon: 'none'
      });
    });
  },

  // 加载身价明细
  loadRecords() {
    const params = {
      page: this.data.page,
      pageSize: this.data.pageSize
    };

    const loadPromise = this.data.isSelf && !this.data.userId
      ? valueAPI.getMyRecords(params)
      : valueAPI.getPlayerRecords(this.data.userId, params);

    return loadPromise.then(res => {
      const list = res.data?.list || res.data || [];
      const records = list.map(item => this.formatRecord(item));

      this.setData({
        records,
        hasMore: list.length >= this.data.pageSize
      });
    }).catch(err => {
      console.error('加载身价明细失败:', err);
    });
  },

  // 加载更多明细
  loadMoreRecords() {
    if (!this.data.hasMore || this.data.loadingMore) return;

    this.setData({
      loadingMore: true,
      page: this.data.page + 1
    });

    const params = {
      page: this.data.page,
      pageSize: this.data.pageSize
    };

    const loadPromise = this.data.isSelf && !this.data.userId
      ? valueAPI.getMyRecords(params)
      : valueAPI.getPlayerRecords(this.data.userId, params);

    loadPromise.then(res => {
      const list = res.data?.list || res.data || [];
      const newRecords = list.map(item => this.formatRecord(item));

      this.setData({
        records: [...this.data.records, ...newRecords],
        hasMore: list.length >= this.data.pageSize,
        loadingMore: false
      });
    }).catch(err => {
      console.error('加载更多明细失败:', err);
      this.setData({ loadingMore: false });
    });
  },

  // 格式化明细记录
  formatRecord(item) {
    // 根据 sourceType 映射类型
    const typeMap = {
      goal: { label: '进球', icon: '⚽', color: '#27ae60' },
      assist: { label: '助攻', icon: '🎯', color: '#3498db' },
      mvp: { label: 'MVP', icon: '⭐', color: '#f39c12' },
      attendance: { label: '出勤', icon: '📅', color: '#9b59b6' },
      result: { label: '比赛结果', icon: '🏆', color: '#e74c3c' },
      win: { label: '胜利', icon: '🏆', color: '#e74c3c' },
      draw: { label: '平局', icon: '🤝', color: '#95a5a6' },
      loss: { label: '失败', icon: '😔', color: '#7f8c8d' },
      service: { label: '服务', icon: '🛠️', color: '#1abc9c' },
      special: { label: '特殊奖励', icon: '🎁', color: '#e91e63' },
      penalty: { label: '扣除', icon: '⚠️', color: '#95a5a6' },
      role: { label: '角色', icon: '👤', color: '#9b59b6' }
    };

    const sourceType = item.sourceType || '';
    let typeInfo = typeMap[sourceType] || { label: sourceType || '其他', icon: '💰', color: '#667eea' };

    // 对于 role 类型，根据 sourceDetail 显示具体角色名称
    if (sourceType === 'role') {
      const detail = item.sourceDetail || '';
      if (detail.includes('守门') || detail.includes('门将')) {
        typeInfo = { label: '守门员', icon: '🧤', color: '#9b59b6' };
      } else if (detail.includes('裁判')) {
        typeInfo = { label: '裁判', icon: '📣', color: '#e67e22' };
      } else if (detail.includes('队长')) {
        typeInfo = { label: '队长', icon: '©️', color: '#3498db' };
      } else {
        // 其他角色直接使用 sourceDetail 作为标签
        typeInfo = { label: detail || '角色', icon: '👤', color: '#9b59b6' };
      }
    }

    // 格式化日期：如果有比赛信息，使用比赛日期；否则使用创建日期
    let dateStr = '';
    const dateSource = item.match?.matchDate || item.createdAt;
    if (dateSource) {
      const date = new Date(dateSource);
      dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
    }

    // 获取金额（使用 finalAmount）
    const amount = item.finalAmount || item.amount || 0;

    return {
      id: item.id,
      type: sourceType,
      typeLabel: typeInfo.label,
      typeIcon: typeInfo.icon,
      typeColor: typeInfo.color,
      amount: amount,
      isPositive: amount >= 0,
      description: item.sourceDetail || item.notes || '',
      matchTitle: item.match?.title || '',
      date: dateStr,
      createdAt: item.createdAt
    };
  }
});
