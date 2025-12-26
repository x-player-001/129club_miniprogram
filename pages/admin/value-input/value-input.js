// 身价录入页面（管理员专用）
const app = getApp();
const valueAPI = require('../../../api/value.js');
const userAPI = require('../../../api/user.js');
const matchAPI = require('../../../api/match.js');
const config = require('../../../utils/config.js');

Page({
  data: {
    // 当前操作类型
    activeTab: 'special', // special: 特殊奖励, recalculate: 重算比赛
    tabs: [
      { id: 'special', name: '特殊奖励' },
      { id: 'recalculate', name: '重算比赛' }
    ],

    // 特殊奖励表单
    specialForm: {
      userId: '',
      userName: '',
      amount: '',
      notes: '',        // 备注说明
      matchId: '',      // 可选：关联比赛
      matchTitle: ''    // 比赛标题（仅展示用）
    },

    // 重算比赛表单
    recalculateForm: {
      matchId: '',
      matchTitle: ''
    },

    // 用户搜索
    userKeyword: '',
    userSearchResults: [],
    showUserDropdown: false,

    // 比赛搜索
    matchKeyword: '',
    matchSearchResults: [],
    showMatchDropdown: false,

    // 关联比赛搜索（特殊奖励用）
    specialMatchKeyword: '',
    specialMatchResults: [],
    showSpecialMatchDropdown: false,

    // 状态
    loading: false,
    submitting: false,

    // 图片
    images: {
      defaultAvatar: config.getImageUrl('default-avatar.png')
    }
  },

  onLoad() {
    this.checkPermission();
  },

  // 检查权限
  checkPermission() {
    const userInfo = app.globalData.userInfo;
    if (!userInfo || userInfo.role !== 'super_admin') {
      wx.showModal({
        title: '无权限',
        content: '仅超级管理员可访问此页面',
        showCancel: false,
        success: () => {
          wx.navigateBack();
        }
      });
    }
  },

  // 切换Tab
  onTabChange(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      activeTab: tab
    });
  },

  // ========== 特殊奖励相关 ==========

  // 用户搜索输入
  onUserKeywordInput(e) {
    const keyword = e.detail.value;
    this.setData({ userKeyword: keyword });

    if (keyword.length >= 1) {
      this.searchUsers(keyword);
    } else {
      this.setData({
        userSearchResults: [],
        showUserDropdown: false
      });
    }
  },

  // 搜索用户
  searchUsers(keyword) {
    userAPI.searchUsers({ keyword, limit: 10 })
      .then(res => {
        const users = res.data || [];
        this.setData({
          userSearchResults: users,
          showUserDropdown: users.length > 0
        });
      })
      .catch(err => {
        console.error('搜索用户失败:', err);
      });
  },

  // 选择用户
  onSelectUser(e) {
    const user = e.currentTarget.dataset.user;
    this.setData({
      'specialForm.userId': user.id,
      'specialForm.userName': user.realName || user.nickname,
      userKeyword: user.realName || user.nickname,
      showUserDropdown: false,
      userSearchResults: []
    });
  },

  // 清除选择的用户
  onClearUser() {
    this.setData({
      'specialForm.userId': '',
      'specialForm.userName': '',
      userKeyword: ''
    });
  },

  // 金额输入
  onAmountInput(e) {
    let value = e.detail.value;
    // 只允许数字和负号，支持小数
    value = value.replace(/[^\d.-]/g, '');
    this.setData({
      'specialForm.amount': value
    });
  },

  // 备注输入
  onNotesInput(e) {
    this.setData({
      'specialForm.notes': e.detail.value
    });
  },

  // 特殊奖励关联比赛搜索
  onSpecialMatchInput(e) {
    const keyword = e.detail.value;
    this.setData({ specialMatchKeyword: keyword });

    if (keyword.length >= 1) {
      this.searchSpecialMatches(keyword);
    } else {
      this.setData({
        specialMatchResults: [],
        showSpecialMatchDropdown: false
      });
    }
  },

  // 搜索关联比赛
  searchSpecialMatches(keyword) {
    matchAPI.getMatchList({ keyword, limit: 10 })
      .then(res => {
        const matches = res.data?.list || res.data || [];
        this.setData({
          specialMatchResults: matches,
          showSpecialMatchDropdown: matches.length > 0
        });
      })
      .catch(err => {
        console.error('搜索比赛失败:', err);
      });
  },

  // 选择关联比赛
  onSelectSpecialMatch(e) {
    const match = e.currentTarget.dataset.match;
    this.setData({
      'specialForm.matchId': match.id,
      'specialForm.matchTitle': match.title,
      specialMatchKeyword: match.title,
      showSpecialMatchDropdown: false,
      specialMatchResults: []
    });
  },

  // 清除关联比赛
  onClearSpecialMatch() {
    this.setData({
      'specialForm.matchId': '',
      'specialForm.matchTitle': '',
      specialMatchKeyword: ''
    });
  },

  // 提交特殊奖励
  onSubmitSpecial() {
    const { specialForm } = this.data;

    // 验证
    if (!specialForm.userId) {
      wx.showToast({ title: '请选择用户', icon: 'none' });
      return;
    }
    if (!specialForm.amount || isNaN(parseFloat(specialForm.amount))) {
      wx.showToast({ title: '请输入有效金额', icon: 'none' });
      return;
    }

    const amount = parseFloat(specialForm.amount);

    wx.showModal({
      title: '确认提交',
      content: `确定为 ${specialForm.userName} ${amount >= 0 ? '增加' : '扣除'} ${Math.abs(amount)}万身价？`,
      success: (res) => {
        if (res.confirm) {
          this.doSubmitSpecial();
        }
      }
    });
  },

  // 执行提交特殊奖励
  doSubmitSpecial() {
    const { specialForm } = this.data;

    this.setData({ submitting: true });
    wx.showLoading({ title: '提交中...', mask: true });

    // 构建请求数据，按API规范：{userId, amount, notes?, matchId?, clubYear?}
    const requestData = {
      userId: specialForm.userId,
      amount: parseFloat(specialForm.amount)
    };

    // 可选字段
    if (specialForm.notes) {
      requestData.notes = specialForm.notes;
    }
    if (specialForm.matchId) {
      requestData.matchId = specialForm.matchId;
    }

    valueAPI.addSpecialReward(requestData)
      .then(res => {
        wx.hideLoading();
        this.setData({ submitting: false });

        wx.showToast({
          title: '录入成功',
          icon: 'success'
        });

        // 重置表单
        this.setData({
          specialForm: {
            userId: '',
            userName: '',
            amount: '',
            notes: '',
            matchId: '',
            matchTitle: ''
          },
          userKeyword: '',
          specialMatchKeyword: ''
        });
      })
      .catch(err => {
        wx.hideLoading();
        this.setData({ submitting: false });
        wx.showToast({
          title: err.message || '录入失败',
          icon: 'none'
        });
      });
  },

  // ========== 重算比赛相关 ==========

  // 比赛搜索输入
  onMatchKeywordInput(e) {
    const keyword = e.detail.value;
    this.setData({ matchKeyword: keyword });

    if (keyword.length >= 1) {
      this.searchMatches(keyword);
    } else {
      this.setData({
        matchSearchResults: [],
        showMatchDropdown: false
      });
    }
  },

  // 搜索比赛
  searchMatches(keyword) {
    matchAPI.getMatchList({ keyword, status: 'completed', limit: 10 })
      .then(res => {
        const matches = res.data?.list || res.data || [];
        this.setData({
          matchSearchResults: matches,
          showMatchDropdown: matches.length > 0
        });
      })
      .catch(err => {
        console.error('搜索比赛失败:', err);
      });
  },

  // 选择比赛
  onSelectMatch(e) {
    const match = e.currentTarget.dataset.match;
    this.setData({
      'recalculateForm.matchId': match.id,
      'recalculateForm.matchTitle': match.title,
      matchKeyword: match.title,
      showMatchDropdown: false,
      matchSearchResults: []
    });
  },

  // 清除选择的比赛
  onClearMatch() {
    this.setData({
      'recalculateForm.matchId': '',
      'recalculateForm.matchTitle': '',
      matchKeyword: ''
    });
  },

  // 提交重算比赛
  onSubmitRecalculate() {
    const { recalculateForm } = this.data;

    if (!recalculateForm.matchId) {
      wx.showToast({ title: '请选择比赛', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认重算',
      content: `确定重新计算"${recalculateForm.matchTitle}"的身价吗？\n这将重新根据比赛数据计算所有参赛球员的身价变动。`,
      success: (res) => {
        if (res.confirm) {
          this.doSubmitRecalculate();
        }
      }
    });
  },

  // 执行重算比赛
  doSubmitRecalculate() {
    const { recalculateForm } = this.data;

    this.setData({ submitting: true });
    wx.showLoading({ title: '重算中...', mask: true });

    valueAPI.recalculateMatch(recalculateForm.matchId)
      .then(res => {
        wx.hideLoading();
        this.setData({ submitting: false });

        const affectedCount = res.data?.affectedPlayers || 0;
        wx.showModal({
          title: '重算完成',
          content: `已重新计算身价，影响 ${affectedCount} 名球员`,
          showCancel: false
        });

        // 重置表单
        this.setData({
          recalculateForm: {
            matchId: '',
            matchTitle: ''
          },
          matchKeyword: ''
        });
      })
      .catch(err => {
        wx.hideLoading();
        this.setData({ submitting: false });
        wx.showToast({
          title: err.message || '重算失败',
          icon: 'none'
        });
      });
  },

  // 隐藏下拉
  hideDropdowns() {
    this.setData({
      showUserDropdown: false,
      showMatchDropdown: false,
      showSpecialMatchDropdown: false
    });
  }
});
