// pages/season/list/list.js
const API = require('../../../api/index');
const app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    currentTab: 'active',  // 当前Tab：active, completed, ''(全部)
    seasons: [],
    loading: false,
    isAdmin: false  // 是否是管理员
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.checkAdminPermission();
    this.loadSeasonList();
  },

  /**
   * 检查管理员权限
   */
  checkAdminPermission() {
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo');
    const isAdmin = userInfo && (userInfo.role === 'admin' || userInfo.isAdmin === true);

    console.log('[Season List] 用户权限:', {
      role: userInfo?.role,
      isAdmin: userInfo?.isAdmin,
      hasPermission: isAdmin
    });

    this.setData({ isAdmin });
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 从创建/编辑页面返回时刷新列表
    if (this.data.seasons.length > 0) {
      this.loadSeasonList();
    }
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadSeasonList().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 加载赛季列表
   */
  loadSeasonList() {
    this.setData({ loading: true });

    const params = {};
    if (this.data.currentTab) {
      params.status = this.data.currentTab;
    }

    return API.season.getList(params)
      .then(res => {
        console.log('[Season List] 加载成功:', res.data);

        const seasons = res.data.list || [];

        // 处理赛季数据，添加队伍比分（如果有）
        // 注意：这里需要从详情或统计接口获取比分数据
        // 为简化，暂时只显示基本信息

        this.setData({
          seasons: seasons,
          loading: false
        });
      })
      .catch(err => {
        console.error('[Season List] 加载失败:', err);
        this.setData({ loading: false });
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
      });
  },

  /**
   * Tab切换
   */
  onTabChange(e) {
    const tab = e.currentTarget.dataset.tab;
    if (tab === this.data.currentTab) return;

    this.setData({ currentTab: tab });
    this.loadSeasonList();
  },

  /**
   * 点击赛季卡片 - 跳转到详情页
   */
  onSeasonTap(e) {
    const season = e.detail?.season;

    // 防御性检查
    if (!season || !season.id) {
      console.error('[Season List] 无效的赛季数据:', season);
      wx.showToast({
        title: '赛季数据错误',
        icon: 'none'
      });
      return;
    }

    wx.navigateTo({
      url: `/pages/season/detail/detail?id=${season.id}`
    });
  },

  /**
   * 创建赛季
   */
  onCreate() {
    if (!this.data.isAdmin) {
      wx.showToast({
        title: '仅管理员可操作',
        icon: 'none'
      });
      return;
    }

    wx.navigateTo({
      url: '/pages/season/form/form'
    });
  },

  /**
   * 编辑赛季
   */
  onEdit(e) {
    if (!this.data.isAdmin) {
      wx.showToast({
        title: '仅管理员可操作',
        icon: 'none'
      });
      return;
    }

    const seasonId = e.detail.seasonId;
    wx.navigateTo({
      url: `/pages/season/form/form?id=${seasonId}`
    });
  },

  /**
   * 完成赛季
   */
  onComplete(e) {
    if (!this.data.isAdmin) {
      wx.showToast({
        title: '仅管理员可操作',
        icon: 'none'
      });
      return;
    }

    const seasonId = e.detail.seasonId;

    wx.showModal({
      title: '确认完成',
      content: '完成后的赛季将无法再添加新比赛，确定要完成这个赛季吗？',
      success: (res) => {
        if (res.confirm) {
          this.completeSeason(seasonId);
        }
      }
    });
  },

  /**
   * 完成赛季 - API调用
   */
  completeSeason(seasonId) {
    wx.showLoading({ title: '处理中...' });

    API.season.complete(seasonId)
      .then(res => {
        wx.hideLoading();
        wx.showToast({
          title: '赛季已完成',
          icon: 'success'
        });

        // 刷新列表
        this.loadSeasonList();

        // 清除当前赛季缓存
        app.clearSeasonCache();
      })
      .catch(err => {
        wx.hideLoading();
        wx.showToast({
          title: err.message || '操作失败',
          icon: 'none'
        });
      });
  },

  /**
   * 删除赛季
   */
  onDelete(e) {
    if (!this.data.isAdmin) {
      wx.showToast({
        title: '仅管理员可操作',
        icon: 'none'
      });
      return;
    }

    const seasonId = e.detail.seasonId;

    wx.showModal({
      title: '确认删除',
      content: '删除赛季后，关联比赛的赛季信息将被清除。确定要删除吗？',
      confirmColor: '#e74c3c',
      success: (res) => {
        if (res.confirm) {
          this.deleteSeason(seasonId);
        }
      }
    });
  },

  /**
   * 删除赛季 - API调用
   */
  deleteSeason(seasonId) {
    wx.showLoading({ title: '删除中...' });

    API.season.delete(seasonId)
      .then(res => {
        wx.hideLoading();
        wx.showToast({
          title: '删除成功',
          icon: 'success'
        });

        // 刷新列表
        this.loadSeasonList();

        // 清除当前赛季缓存
        app.clearSeasonCache();
      })
      .catch(err => {
        wx.hideLoading();
        wx.showToast({
          title: err.message || '删除失败',
          icon: 'none',
          duration: 2000
        });
      });
  }
});
