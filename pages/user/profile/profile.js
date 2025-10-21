// pages/user/profile/profile.js
const app = getApp();
const userAPI = require('../../../api/user.js');
const teamAPI = require('../../../api/team.js');
const statsAPI = require('../../../api/stats.js');

Page({
  data: {
    userInfo: {},
    currentTeam: null,
    personalStats: {},
    unreadCount: 0,
    version: app.globalData.version
  },

  onLoad() {
    // 启动页已经完成了登录和信息完整性检查，这里直接加载数据
    this.loadPageData();
  },

  onShow() {
    // 每次显示时刷新数据
    this.loadPageData();
  },

  onPullDownRefresh() {
    this.loadPageData().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 加载页面数据
  loadPageData() {
    // 先从本地加载用户信息（快速显示）
    const localUserInfo = app.globalData.userInfo || wx.getStorageSync('userInfo');
    if (localUserInfo) {
      this.setData({ userInfo: localUserInfo });
      console.log('从本地加载用户信息:', localUserInfo);
    }

    // 真实API调用
    return Promise.all([
      this.loadUserInfo(),
      this.loadCurrentTeam(),
      this.loadUnreadCount()
    ]).catch(err => {
      console.error('加载API数据失败:', err);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    });
  },

  // 加载用户信息
  loadUserInfo() {
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({ userInfo });
    }

    // 从服务器获取最新信息（包含统计数据）
    return userAPI.getUserInfo().then(res => {
      const userData = res.data;

      this.setData({
        userInfo: userData
      });

      // 如果返回了统计数据，同时设置 personalStats
      if (userData.stats || userData.statistics) {
        const stats = userData.stats || userData.statistics;
        this.setData({
          personalStats: {
            goals: stats.goals || 0,
            assists: stats.assists || 0,
            matches: stats.matchesPlayed || stats.matches || 0,
            mvpCount: stats.mvpCount || 0
          }
        });

        // 格式化数据给 stats-grid 组件
        const personalStatsGrid = [
          { icon: '/static/icons/match.png', iconClass: 'match-icon', value: stats.matchesPlayed || stats.matches || 0, label: '出场' },
          { icon: '/static/icons/goal.png', iconClass: 'goal-icon', value: stats.goals || 0, label: '进球' },
          { icon: '/static/icons/assist.png', iconClass: 'assist-icon', value: stats.assists || 0, label: '助攻' },
          { icon: '/static/icons/star.png', iconClass: 'mvp-icon', value: stats.mvpCount || 0, label: 'MVP' }
        ];

        this.setData({
          personalStatsGrid: personalStatsGrid
        });
      }

      // 更新本地存储
      wx.setStorageSync('userInfo', userData);
      app.globalData.userInfo = userData;
    }).catch(err => {
      console.error('加载用户信息失败:', err);
    });
  },

  // 加载当前队伍
  loadCurrentTeam() {
    return teamAPI.getCurrentTeam().then(res => {
      if (res.data) {
        this.setData({
          currentTeam: res.data
        });
      }
    }).catch(err => {
      console.error('加载队伍信息失败:', err);
      this.setData({
        currentTeam: null
      });
    });
  },

  // 加载未读消息数
  loadUnreadCount() {
    // TODO: 实现消息API
    this.setData({
      unreadCount: 0
    });
    return Promise.resolve();
  },

  // 点击头像或昵称
  onAvatarTap() {
    const userInfo = this.data.userInfo;

    console.log('点击头像/昵称，当前用户信息:', userInfo);

    // 弹出选择菜单，让用户选择操作
    wx.showActionSheet({
      itemList: ['获取微信头像昵称', '从相册选择头像', '拍照上传头像'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 获取微信授权（昵称+头像）
          console.log('用户选择：获取微信授权');
          this.getUserProfile();
        } else {
          // 上传自定义头像（不改昵称）
          console.log('用户选择：上传自定义头像');
          const sourceType = res.tapIndex === 1 ? ['album'] : ['camera'];
          wx.chooseImage({
            count: 1,
            sizeType: ['compressed'],
            sourceType: sourceType,
            success: (imgRes) => {
              wx.showLoading({
                title: '上传中...',
                mask: true
              });
              this.uploadAvatar(imgRes.tempFilePaths[0]);
            }
          });
        }
      }
    });
  },

  // 获取用户授权信息（昵称+头像）
  getUserProfile() {
    wx.showModal({
      title: '获取头像昵称',
      content: '需要获取您的微信头像和昵称',
      confirmText: '去授权',
      success: (res) => {
        if (res.confirm) {
          // 使用 getUserProfile 获取用户信息
          wx.getUserProfile({
            desc: '用于完善用户资料',
            success: (profileRes) => {
              const { nickName, avatarUrl } = profileRes.userInfo;

              console.log('获取到用户信息:', nickName, avatarUrl);

              // 更新到服务器
              this.updateUserProfile({
                nickname: nickName,
                avatar: avatarUrl
              });
            },
            fail: (err) => {
              console.error('用户拒绝授权:', err);
              wx.showToast({
                title: '您取消了授权',
                icon: 'none'
              });
            }
          });
        }
      }
    });
  },

  // 选择头像（已授权用户可自定义）
  chooseAvatar() {
    wx.showActionSheet({
      itemList: ['从相册选择', '拍照'],
      success: (res) => {
        const sourceType = res.tapIndex === 0 ? ['album'] : ['camera'];

        wx.chooseImage({
          count: 1,
          sizeType: ['compressed'],
          sourceType: sourceType,
          success: (imgRes) => {
            const tempFilePath = imgRes.tempFilePaths[0];

            wx.showLoading({
              title: '上传中...',
              mask: true
            });

            // 上传头像
            this.uploadAvatar(tempFilePath);
          }
        });
      }
    });
  },

  // 上传头像
  uploadAvatar(filePath) {
    const { uploadFile } = require('../../../utils/request.js');

    uploadFile(filePath, { type: 'avatar' })
      .then(res => {
        wx.hideLoading();

        if (res.data && res.data.url) {
          // 更新头像到服务器
          this.updateUserProfile({
            avatar: res.data.url
          });
        }
      })
      .catch(err => {
        wx.hideLoading();
        wx.showToast({
          title: '上传失败',
          icon: 'none'
        });
        console.error('上传头像失败:', err);
      });
  },

  // 更新用户资料
  updateUserProfile(data) {
    wx.showLoading({
      title: '更新中...',
      mask: true
    });

    userAPI.updateUserInfo(data)
      .then(res => {
        wx.hideLoading();

        wx.showToast({
          title: '更新成功',
          icon: 'success'
        });

        // 刷新页面数据
        this.loadUserInfo();
      })
      .catch(err => {
        wx.hideLoading();
        wx.showToast({
          title: '更新失败',
          icon: 'none'
        });
        console.error('更新用户信息失败:', err);
      });
  },

  // 编辑资料
  onEditProfile() {
    wx.navigateTo({
      url: '/pages/user/profile-edit/profile-edit?type=edit'
    });
  },

  // 前往队伍详情
  onGoToTeamDetail() {
    if (!this.data.currentTeam) return;

    wx.navigateTo({
      url: `/pages/team/detail/detail?id=${this.data.currentTeam.id}`
    });
  },

  // 查看详细数据
  onViewStats() {
    wx.navigateTo({
      url: '/pages/user/stats/stats'
    });
  },

  // stats-grid 组件点击事件
  onStatsGridTap(e) {
    // 点击任意统计项都跳转到详细数据页
    this.onViewStats();
  },

  // 菜单点击
  onMenuClick(e) {
    const type = e.currentTarget.dataset.type;
    this.handleMenuNavigation(type);
  },

  // menu-item 组件点击事件
  onMenuItemTap(e) {
    const { type } = e.detail;
    this.handleMenuNavigation(type);
  },

  // 处理菜单导航
  handleMenuNavigation(type) {
    switch (type) {
      case 'members':
        wx.navigateTo({
          url: '/pages/user/members/members'
        });
        break;
      case 'message':
        wx.navigateTo({
          url: '/pages/user/message/message'
        });
        break;
      case 'notice':
        wx.navigateTo({
          url: '/pages/notice/list/list'
        });
        break;
      case 'settings':
        wx.navigateTo({
          url: '/pages/user/settings/settings'
        });
        break;
      case 'about':
        wx.navigateTo({
          url: '/pages/about/about'
        });
        break;
    }
  },

  // 退出登录
  onLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗?',
      success: (res) => {
        if (res.confirm) {
          // 清除登录信息
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');

          // 清除全局数据
          app.globalData.isLogin = false;
          app.globalData.userInfo = null;

          wx.showToast({
            title: '已退出登录',
            icon: 'success',
            duration: 1500
          });

          // 跳转到登录页
          setTimeout(() => {
            wx.redirectTo({
              url: '/pages/user/login/login'
            });
          }, 1500);
        }
      }
    });
  }
});
