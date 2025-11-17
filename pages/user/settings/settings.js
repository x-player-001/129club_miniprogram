// pages/user/settings/settings.js
const app = getApp();
const config = require('../../../utils/config.js');

Page({
  data: {
    userInfo: null,
    version: '1.0.0', // 小程序版本号

    // 图标URL
    icons: {
      logout: config.getIconUrl('logout.png'),
      arrowRight: config.getIconUrl('arrow-right.png')
    }
  },

  onLoad(options) {
    this.loadUserInfo();
  },

  onShow() {
    this.loadUserInfo();
  },

  /**
   * 加载用户信息
   */
  loadUserInfo() {
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo');
    this.setData({ userInfo });
  },

  /**
   * 退出登录
   */
  onLogout() {
    wx.showModal({
      title: '确认退出',
      content: '退出后需要重新登录才能使用',
      confirmText: '退出',
      confirmColor: '#f20810',
      success: (res) => {
        if (res.confirm) {
          // 清除所有缓存数据
          wx.clearStorageSync();

          // 清除全局用户信息
          app.globalData.userInfo = null;
          app.globalData.token = null;

          wx.showToast({
            title: '已退出登录',
            icon: 'success',
            duration: 1500
          });

          // 延迟跳转到登录页
          setTimeout(() => {
            wx.reLaunch({
              url: '/pages/user/login/login'
            });
          }, 1500);
        }
      }
    });
  },

  /**
   * 清除缓存
   */
  onClearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '确定要清除所有缓存数据吗？（不会退出登录）',
      confirmText: '清除',
      confirmColor: '#f20810',
      success: (res) => {
        if (res.confirm) {
          // 保留 token 和 userInfo
          const token = wx.getStorageSync('token');
          const userInfo = wx.getStorageSync('userInfo');

          // 清除所有缓存
          wx.clearStorageSync();

          // 恢复 token 和 userInfo
          if (token) wx.setStorageSync('token', token);
          if (userInfo) wx.setStorageSync('userInfo', userInfo);

          wx.showToast({
            title: '缓存已清除',
            icon: 'success'
          });
        }
      }
    });
  },

  /**
   * 关于我们
   */
  onAbout() {
    wx.showModal({
      title: '关于129俱乐部',
      content: `版本号：${this.data.version}\n\n129俱乐部是一个专注于足球队管理的小程序，提供比赛管理、数据统计、队伍管理等功能。`,
      showCancel: false,
      confirmText: '知道了'
    });
  }
});
