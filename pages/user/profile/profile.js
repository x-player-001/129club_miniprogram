// pages/user/profile/profile.js
const app = getApp();
const userAPI = require('../../../api/user.js');
const teamAPI = require('../../../api/team.js');
const statsAPI = require('../../../api/stats.js');
const config = require('../../../utils/config.js');

Page({
  data: {
    isLogin: false, // 是否登录
    userInfo: {},
    currentTeam: null,
    personalStats: {},
    unreadCount: 0,
    version: app.globalData.version,
    // 图标URL
    icons: {
      edit: config.getIconUrl('edit.png'),
      arrowRightWhite: config.getIconUrl('arrow-right-white.png'),
      arrowRight: config.getIconUrl('arrow-right.png'),
      users: config.getIconUrl('users.png'),
      message: config.getIconUrl('message.png'),
      notice: config.getIconUrl('notice.png'),
      setting: config.getIconUrl('setting.png')
    },
    // 图片URL
    images: {
      defaultAvatar: config.getImageUrl('default-avatar.png'),
      defaultTeam: config.getImageUrl('default-team.png')
    }
  },

  onLoad() {
    // 检查登录状态并加载数据
    this.checkLoginAndLoad();
  },

  onShow() {
    // 每次显示时检查登录并刷新数据
    this.checkLoginAndLoad();
  },

  // 检查登录状态并加载数据
  checkLoginAndLoad() {
    const isLogin = app.globalData.isLogin;
    this.setData({ isLogin });

    if (isLogin) {
      this.loadPageData();
    } else {
      console.log('[Profile] 游客模式，显示登录引导');
    }
  },

  // 游客点击登录按钮
  onGoToLogin() {
    wx.navigateTo({
      url: '/pages/user/login/login'
    });
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
      // 确保惯用脚数据为数字类型
      if (localUserInfo.leftFootSkill !== undefined) {
        localUserInfo.leftFootSkill = Number(localUserInfo.leftFootSkill || 0);
      }
      if (localUserInfo.rightFootSkill !== undefined) {
        localUserInfo.rightFootSkill = Number(localUserInfo.rightFootSkill || 0);
      }
      this.setData({ userInfo: localUserInfo });
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
      // 确保惯用脚数据为数字类型
      if (userInfo.leftFootSkill !== undefined) {
        userInfo.leftFootSkill = Number(userInfo.leftFootSkill || 0);
      }
      if (userInfo.rightFootSkill !== undefined) {
        userInfo.rightFootSkill = Number(userInfo.rightFootSkill || 0);
      }
      this.setData({ userInfo });
    }

    // 从服务器获取最新信息（包含统计数据）
    return userAPI.getUserInfo().then(res => {
      const userData = res.data;

      // 处理位置数据（如果是数组中包含逗号分隔字符串）
      if (userData.position && Array.isArray(userData.position)) {
        let selectedPositions = [];
        userData.position.forEach(item => {
          if (typeof item === 'string') {
            if (item.includes(',')) {
              const positions = item.split(',').map(p => p.trim()).filter(p => /^[A-Z]{2,3}$/.test(p));
              selectedPositions.push(...positions);
            } else if (/^[A-Z]{2,3}$/.test(item)) {
              selectedPositions.push(item);
            }
          }
        });
        // 保留所有位置代码用于显示
        userData.positions = selectedPositions;
      } else if (typeof userData.position === 'string') {
        // 如果是逗号分隔的字符串，分割成数组
        if (userData.position.includes(',')) {
          userData.positions = userData.position.split(',').map(p => p.trim()).filter(p => /^[A-Z]{2,3}$/.test(p));
        } else if (/^[A-Z]{2,3}$/.test(userData.position)) {
          userData.positions = [userData.position];
        }
      }

      // 确保惯用脚数据为数字类型
      if (userData.leftFootSkill !== undefined) {
        userData.leftFootSkill = Number(userData.leftFootSkill || 0);
      }
      if (userData.rightFootSkill !== undefined) {
        userData.rightFootSkill = Number(userData.rightFootSkill || 0);
      }

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
          { icon: config.getIconUrl('match.png'), iconClass: 'match-icon', value: stats.matchesPlayed || stats.matches || 0, label: '出场' },
          { icon: config.getIconUrl('goal.png'), iconClass: 'goal-icon', value: stats.goals || 0, label: '进球' },
          { icon: config.getIconUrl('assist.png'), iconClass: 'assist-icon', value: stats.assists || 0, label: '助攻' },
          { icon: config.getIconUrl('star.png'), iconClass: 'mvp-icon', value: stats.mvpCount || 0, label: 'MVP' }
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

    // 弹出选择菜单，让用户选择操作
    wx.showActionSheet({
      itemList: ['获取微信头像昵称', '从相册选择头像', '拍照上传头像'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 获取微信授权（昵称+头像）
          this.getUserProfile();
        } else {
          // 上传自定义头像（不改昵称）
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
