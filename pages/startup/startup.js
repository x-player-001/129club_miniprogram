// pages/startup/startup.js
const app = getApp();
const userAPI = require('../../api/user.js');
const config = require('../../utils/config.js');

Page({
  data: {
    loadingText: '正在初始化...',
    images: {
      logo: config.getImageUrl('logo.png')
    }
  },

  onLoad() {
    console.log('启动页加载');
    // 立即检查并跳转
    this.checkAndRedirect();
  },

  // 检查并跳转
  checkAndRedirect() {
    // 1. 检查登录状态
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');

    if (token && userInfo) {
      // 已登录，更新全局状态
      console.log('已登录，设置全局状态');
      app.globalData.isLogin = true;
      app.globalData.userInfo = userInfo;

      // 检查用户信息是否完整
      if (!app.checkUserInfoComplete(userInfo)) {
        // 信息不完整，跳转到完善信息页
        console.log('用户信息不完整，跳转到完善信息页');
        this.setData({ loadingText: '完善个人信息...' });
        wx.redirectTo({
          url: '/pages/user/profile-edit/profile-edit?type=complete&required=true'
        });
        return;
      }
    } else {
      // 未登录，设置游客模式
      console.log('未登录，进入游客模式');
      app.globalData.isLogin = false;
      app.globalData.userInfo = null;
    }

    // 2. 直接跳转到首页（游客或已登录）
    console.log('跳转到首页');
    this.setData({ loadingText: '进入首页...' });
    wx.switchTab({
      url: '/pages/index/index'
    });
  }
});
