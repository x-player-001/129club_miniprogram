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

    if (!token || !userInfo) {
      // 未登录，尝试静默登录
      console.log('未登录，尝试静默登录');
      this.setData({ loadingText: '正在登录...' });
      this.silentLogin();
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
      wx.redirectTo({
        url: '/pages/user/profile-edit/profile-edit?type=complete&required=true'
      });
      return;
    }

    // 4. 一切正常，跳转到首页
    console.log('用户信息完整，跳转到首页');
    this.setData({ loadingText: '进入首页...' });
    wx.switchTab({
      url: '/pages/index/index'
    });
  },

  // 静默登录
  silentLogin() {
    wx.login({
      success: (res) => {
        if (res.code) {
          console.log('获取到微信code:', res.code);

          // 调用登录接口
          userAPI.login(res.code)
            .then(loginRes => {
              console.log('静默登录成功');
              this.handleLoginSuccess(loginRes);
            })
            .catch(err => {
              console.error('静默登录失败:', err);
              // 静默登录失败，跳转到登录页让用户手动授权
              this.setData({ loadingText: '跳转到登录页...' });
              wx.redirectTo({
                url: '/pages/user/login/login?autoLogin=false'
              });
            });
        } else {
          console.error('获取微信code失败');
          // 跳转到登录页
          wx.redirectTo({
            url: '/pages/user/login/login?autoLogin=false'
          });
        }
      },
      fail: () => {
        console.error('wx.login调用失败');
        // 跳转到登录页
        wx.redirectTo({
          url: '/pages/user/login/login?autoLogin=false'
        });
      }
    });
  },

  // 处理登录成功
  handleLoginSuccess(res) {
    // 保存登录信息
    if (res.data.token) {
      wx.setStorageSync('token', res.data.token);
    }
    if (res.data.user || res.data.userInfo) {
      const userInfo = res.data.user || res.data.userInfo;
      wx.setStorageSync('userInfo', userInfo);
      app.globalData.userInfo = userInfo;
    }

    // 更新全局登录状态
    app.globalData.isLogin = true;

    // 检查用户信息是否完整
    const userInfo = wx.getStorageSync('userInfo');
    if (!app.checkUserInfoComplete(userInfo)) {
      console.log('登录成功，用户信息不完整，跳转到完善信息页');
      this.setData({ loadingText: '完善个人信息...' });
      wx.redirectTo({
        url: '/pages/user/profile-edit/profile-edit?type=complete&required=true'
      });
    } else {
      console.log('登录成功，用户信息完整，跳转到首页');
      this.setData({ loadingText: '进入首页...' });
      wx.switchTab({
        url: '/pages/index/index'
      });
    }
  }
});
