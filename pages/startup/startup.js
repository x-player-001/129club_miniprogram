// pages/startup/startup.js
const app = getApp();

Page({
  data: {
    loadingText: '正在初始化...'
  },

  onLoad() {
    console.log('启动页加载');
    // 延迟一下，让Loading动画显示出来
    setTimeout(() => {
      this.checkAndRedirect();
    }, 500);
  },

  // 检查并跳转
  checkAndRedirect() {
    // 1. 检查登录状态
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');

    if (!token || !userInfo) {
      // 未登录，跳转到登录页
      console.log('未登录，跳转到登录页');
      this.setData({ loadingText: '跳转到登录...' });
      setTimeout(() => {
        wx.redirectTo({
          url: '/pages/user/login/login'
        });
      }, 300);
      return;
    }

    // 2. 已登录，更新全局状态
    app.globalData.isLogin = true;
    app.globalData.userInfo = userInfo;

    // 3. 检查用户信息是否完整
    if (!app.checkUserInfoComplete(userInfo)) {
      // 信息不完整，跳转到完善信息页
      console.log('用户信息不完整，跳转到完善信息页');
      this.setData({ loadingText: '完善个人信息...' });
      setTimeout(() => {
        wx.redirectTo({
          url: '/pages/user/profile-edit/profile-edit?type=complete&required=true'
        });
      }, 300);
      return;
    }

    // 4. 一切正常，跳转到首页
    console.log('用户信息完整，跳转到首页');
    this.setData({ loadingText: '进入首页...' });
    setTimeout(() => {
      wx.switchTab({
        url: '/pages/index/index'
      });
    }, 300);
  }
});
