// pages/user/login/login.js
const app = getApp();
const userAPI = require('../../../api/user.js');

Page({
  data: {
    agreed: true // 默认已同意协议
  },

  onLoad(options) {
    // 检查是否已登录
    if (app.globalData.isLogin) {
      // 已登录，跳转到首页
      wx.switchTab({
        url: '/pages/index/index'
      });
      return;
    }

    // 如果是从其他页面跳转过来的（即token过期），尝试静默登录
    const autoLogin = options.autoLogin !== 'false';
    if (autoLogin) {
      this.silentLogin();
    }
  },

  // 静默登录（无需用户授权）
  // 注意：静默登录只能获取code，无法获取用户昵称和头像
  // 后端需要支持只传code的登录方式，并返回默认昵称/头像
  silentLogin() {
    console.log('尝试静默登录（只传code，无昵称头像）...');
    wx.showLoading({
      title: '登录中...',
      mask: true
    });

    wx.login({
      success: (res) => {
        if (res.code) {
          console.log('获取到微信code:', res.code);

          // 只传code，后端需要支持此模式
          // 后端应该：
          // 1. 用code换取openid/unionid
          // 2. 创建/查找用户
          // 3. 返回默认昵称（如：用户xxx）和默认头像
          userAPI.login(res.code)
            .then(loginRes => {
              wx.hideLoading();
              console.log('静默登录成功');
              this.handleLoginSuccess(loginRes);
            })
            .catch(err => {
              wx.hideLoading();
              console.error('静默登录失败:', err);

              // 如果后端不支持只传code的登录，需要用户手动授权
              wx.showModal({
                title: '提示',
                content: '需要获取您的昵称和头像才能继续',
                confirmText: '去授权',
                success: (modalRes) => {
                  if (modalRes.confirm) {
                    // 等待用户手动点击授权按钮
                    console.log('等待用户点击授权按钮');
                  }
                }
              });
            });
        } else {
          wx.hideLoading();
          console.error('获取微信code失败');
        }
      },
      fail: () => {
        wx.hideLoading();
        console.error('wx.login调用失败');
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

    wx.showToast({
      title: '登录成功',
      icon: 'success',
      duration: 1500
    });

    // 延迟跳转
    setTimeout(() => {
      const userInfo = res.data.user || res.data.userInfo;

      // 使用全局方法检查用户信息是否完整
      if (!app.checkUserInfoComplete(userInfo)) {
        console.log('用户信息不完整，跳转到完善信息页面');
        // 跳转到信息完善页面（强制模式）
        app.redirectToProfileEdit();
      } else {
        console.log('用户信息完整，跳转到首页');
        // 跳转到首页
        wx.switchTab({
          url: '/pages/index/index'
        });
      }
    }, 1500);
  },

  // 切换协议同意状态
  toggleAgreement() {
    this.setData({
      agreed: !this.data.agreed
    });
  },

  // 查看协议
  onViewAgreement(e) {
    const type = e.currentTarget.dataset.type;
    const title = type === 'privacy' ? '隐私政策' : '用户协议';

    wx.showModal({
      title: title,
      content: '这里显示协议内容...',
      showCancel: false
    });
  },

  // 获取用户信息
  onGetUserInfo(e) {
    if (!this.data.agreed) {
      wx.showToast({
        title: '请先同意用户协议',
        icon: 'none'
      });
      return;
    }

    if (e.detail.errMsg === 'getUserInfo:ok') {
      const userInfo = e.detail.userInfo;

      // 显示加载中
      wx.showLoading({
        title: '登录中...',
        mask: true
      });

      // 调用微信登录
      this.wxLogin(userInfo);
    } else {
      wx.showToast({
        title: '登录失败，请重试',
        icon: 'none'
      });
    }
  },

  // 微信登录
  wxLogin(userInfo) {
    wx.login({
      success: (res) => {
        if (res.code) {
          // 调用后端登录接口
          this.loginToServer(res.code, userInfo);
        } else {
          wx.hideLoading();
          wx.showToast({
            title: '获取登录凭证失败',
            icon: 'none'
          });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({
          title: '微信登录失败',
          icon: 'none'
        });
      }
    });
  },

  // 调用后端登录接口
  loginToServer(code, userInfo) {
    userAPI.login({
      code: code,
      nickname: userInfo.nickName,
      avatar: userInfo.avatarUrl
    }).then(res => {
      wx.hideLoading();
      this.handleLoginSuccess(res);
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({
        title: err.message || '登录失败',
        icon: 'none'
      });
    });
  }
});
