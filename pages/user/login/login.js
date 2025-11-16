// pages/user/login/login.js
const app = getApp();
const userAPI = require('../../../api/user.js');

Page({
  data: {
    privacyAgreed: false  // 是否同意隐私协议
  },

  onLoad(options) {
    console.log('登录页加载，参数:', options);

    // 自动尝试静默登录（除非明确指定不要自动登录）
    // autoLogin=false 表示不要自动登录（如：token过期后显示登录界面）
    const autoLogin = options.autoLogin !== 'false';
    if (autoLogin) {
      console.log('尝试静默登录');
      this.silentLogin();
    } else {
      console.log('跳过静默登录，等待用户手动登录');
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

    // 延迟跳转，让用户看到登录成功提示
    setTimeout(() => {
      const userInfo = wx.getStorageSync('userInfo');

      // 检查用户信息是否完整
      if (!app.checkUserInfoComplete(userInfo)) {
        console.log('登录成功，用户信息不完整，跳转到完善信息页');
        wx.redirectTo({
          url: '/pages/user/profile-edit/profile-edit?type=complete&required=true'
        });
      } else {
        console.log('登录成功，用户信息完整，跳转到首页');
        wx.switchTab({
          url: '/pages/index/index'
        });
      }
    }, 1500);
  },

  // 切换隐私协议勾选状态
  onTogglePrivacy() {
    this.setData({
      privacyAgreed: !this.data.privacyAgreed
    });
  },

  // 查看隐私协议
  onViewPrivacy(e) {
    wx.navigateTo({
      url: '/pages/user/privacy/privacy'
    });
  },

  // 获取用户信息
  onGetUserInfo(e) {
    // 检查是否同意隐私协议
    if (!this.data.privacyAgreed) {
      wx.showToast({
        title: '请先同意隐私保护指引',
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
