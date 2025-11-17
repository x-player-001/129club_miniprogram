// pages/user/profile-edit/profile-edit.js
const app = getApp();
const userAPI = require('../../../api/user.js');
const positionAPI = require('../../../api/position.js');
const config = require('../../../utils/config.js');

Page({
  data: {
    type: 'edit', // complete: 首次完善信息, edit: 编辑资料
    statusBarHeight: 0, // 状态栏高度
    navBarHeight: 0, // 导航栏总高度

    // 图标URL
    icons: {
      back: config.getIconUrl('back.png'),
      camera: config.getIconUrl('camera.png'),
      arrowRight: config.getIconUrl('arrow-right.png'),
      close: config.getIconUrl('close.png')
    },

    formData: {
      avatar: '',
      nickname: '',
      realName: '',
      phone: '',
      jerseyNumber: '',
      position: '',
      leftFootLevel: 0,    // 左脚熟练度 0-5，0表示未选择
      rightFootLevel: 0    // 右脚熟练度 0-5，0表示未选择
    },
    // 脚印图标URL（根据 level 动态计算）
    leftFootIcon: config.getIconUrl('foot-print-0.png'),
    rightFootIcon: config.getIconUrl('foot-print-0.png'),
    // 位置数据
    positionGroups: {}, // 分组的位置数据 {GK: [...], DF: [...], MF: [...], FW: [...]}
    selectedPositions: [], // 已选择的位置code数组
    showPositionPicker: false // 是否显示位置选择器
  },

  onLoad(options) {
    // 获取系统信息，计算导航栏高度
    const systemInfo = wx.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight || 0;
    const navBarHeight = statusBarHeight + 44; // 44px 是导航栏内容区域的标准高度

    this.setData({
      statusBarHeight,
      navBarHeight
    });
    // 判断是完善信息还是编辑资料
    const isComplete = options.type === 'complete';
    const isRequired = options.required === 'true'; // 标记是否为强制完善（必须完成）

    this.setData({
      type: isComplete ? 'complete' : 'edit',
      isRequired: isRequired || false
    });

    // 加载位置数据
    this.loadPositionData();

    // 如果是编辑资料，加载用户信息
    if (this.data.type === 'edit') {
      this.loadUserInfo();
    } else {
      // 完善信息时，从全局数据获取头像和昵称（如果有的话）
      const userInfo = app.globalData.userInfo;
      if (userInfo) {
        this.setData({
          'formData.avatar': userInfo.avatar || '',
          'formData.nickname': userInfo.nickname || ''
        });
      }
    }
  },

  // 加载位置数据
  loadPositionData() {
    positionAPI.getPositionGrouped().then(res => {
      const positionGroups = res.data || {};
      this.setData({ positionGroups });
    }).catch(err => {
      console.error('加载位置列表失败:', err);
      wx.showToast({
        title: '加载位置失败',
        icon: 'none'
      });
    });
  },

  // 加载用户信息
  loadUserInfo() {
    wx.showLoading({
      title: '加载中...'
    });

    userAPI.getUserInfo().then(res => {
      wx.hideLoading();
      const userInfo = res.data;

      // 设置位置选择（后端数组 → 前端数组）
      let selectedPositions = [];
      let positionDisplay = '';

      if (userInfo.position) {
        // 如果是数组
        if (Array.isArray(userInfo.position)) {
          selectedPositions = [];
          userInfo.position.forEach(item => {
            if (typeof item === 'string') {
              // 数组元素可能是逗号分隔的字符串（如 "LB,RB,LW,RW"）
              if (item.includes(',')) {
                const positions = item.split(',').map(p => p.trim()).filter(p => /^[A-Z]{2,3}$/.test(p));
                selectedPositions.push(...positions);
              } else if (/^[A-Z]{2,3}$/.test(item)) {
                // 或者是单个位置代码（如 "LB"）
                selectedPositions.push(item);
              }
            }
          });
        } else if (typeof userInfo.position === 'string') {
          // 如果是字符串，先分割再过滤（兼容旧数据）
          selectedPositions = userInfo.position.split(',').map(p => p.trim()).filter(p => {
            return /^[A-Z]{2,3}$/.test(p);
          });
        }

        // 生成显示用的字符串
        positionDisplay = selectedPositions.join(',');
      }

      // 设置表单数据（后端字段映射）
      const leftFootLevel = userInfo.leftFootSkill || 0;
      const rightFootLevel = userInfo.rightFootSkill || 0;

      this.setData({
        selectedPositions,
        formData: {
          avatar: userInfo.avatar || '',
          nickname: userInfo.nickname || '',
          realName: userInfo.realName || '',
          phone: userInfo.phone || '',
          jerseyNumber: userInfo.jerseyNumber || '',
          position: positionDisplay,  // 用于显示的字符串
          leftFootLevel: leftFootLevel,   // 后端字段: leftFootSkill
          rightFootLevel: rightFootLevel  // 后端字段: rightFootSkill
        },
        leftFootIcon: config.getIconUrl(`foot-print-${leftFootLevel >= 5 ? 5 : 0}.png`),
        rightFootIcon: config.getIconUrl(`foot-print-${rightFootLevel >= 5 ? 5 : 0}.png`)
      });
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({
        title: err.message || '加载失败',
        icon: 'none'
      });
    });
  },

  // 返回
  onBack() {
    // 如果是必填的完善信息模式，提示用户必须完成
    if (this.data.isRequired && this.data.type === 'complete') {
      wx.showModal({
        title: '提示',
        content: '请先完成必填信息，才能继续使用小程序',
        showCancel: false,
        confirmText: '知道了'
      });
      return;
    }

    wx.navigateBack();
  },

  // 选择微信头像（open-type="chooseAvatar"）
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    console.log('获取微信头像临时路径:', avatarUrl);

    // avatarUrl 是 http://tmp/xxx 格式的临时路径
    // 需要先将其上传到服务器，获取永久URL
    this.uploadAvatarFile(avatarUrl);
  },

  // 从相册选择图片
  chooseImageFromAlbum() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        console.log('选择图片成功:', tempFilePath);

        // 上传到服务器
        this.uploadAvatarFile(tempFilePath);
      },
      fail: (err) => {
        console.error('选择图片失败:', err);
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        });
      }
    });
  },

  // 上传头像文件到服务器
  uploadAvatarFile(filePath) {
    wx.showLoading({
      title: '上传中...',
      mask: true
    });

    const token = wx.getStorageSync('token');
    const apiBaseUrl = app.globalData.apiBaseUrl;

    wx.uploadFile({
      url: `${apiBaseUrl}/upload/avatar`,
      filePath: filePath,
      name: 'file',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (uploadRes) => {
        console.log('上传响应:', uploadRes);
        wx.hideLoading();

        try {
          const data = JSON.parse(uploadRes.data);

          if (data.code === 0 && data.data && data.data.url) {
            // 上传成功，使用服务器返回的永久URL
            let avatarUrl = data.data.url;

            // 如果返回的是相对路径，拼接完整URL
            if (avatarUrl.startsWith('/')) {
              const apiBaseUrl = app.globalData.apiBaseUrl;
              // 移除 /api 后缀（如果有）
              const baseUrl = apiBaseUrl.replace(/\/api$/, '');
              avatarUrl = `${baseUrl}${avatarUrl}`;
            }

            this.setData({
              'formData.avatar': avatarUrl
            });

            wx.showToast({
              title: '头像上传成功',
              icon: 'success'
            });

            console.log('头像URL已更新为:', avatarUrl);
          } else {
            throw new Error(data.message || '上传失败');
          }
        } catch (err) {
          console.error('解析上传结果失败:', err);
          wx.showToast({
            title: err.message || '上传失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('上传头像失败:', err);
        wx.showToast({
          title: '上传失败，请重试',
          icon: 'none'
        });
      }
    });
  },

  // 昵称输入失焦（type="nickname" 会自动触发微信昵称填写）
  onNicknameBlur(e) {
    const nickname = e.detail.value;
    console.log('昵称输入:', nickname);

    this.setData({
      'formData.nickname': nickname
    });
  },


  // 输入框变化
  onInputChange(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({
      [`formData.${field}`]: value
    });
  },

  // 显示位置选择器
  onShowPositionPicker() {
    this.setData({ showPositionPicker: true });
  },

  // 关闭位置选择器
  onClosePositionPicker() {
    this.setData({ showPositionPicker: false });
  },

  // 阻止事件冒泡
  onStopPropagation() {
    // 空函数，仅用于阻止事件冒泡到遮罩层
  },

  // 切换位置选择
  onTogglePosition(e) {
    const code = e.currentTarget.dataset.code;
    const selectedPositions = [...this.data.selectedPositions];
    const index = selectedPositions.indexOf(code);

    if (index > -1) {
      // 已选中，取消选择
      selectedPositions.splice(index, 1);
    } else {
      // 未选中，添加选择
      selectedPositions.push(code);
    }

    this.setData({ selectedPositions });
  },

  // 确认位置选择
  onConfirmPosition() {
    if (this.data.selectedPositions.length === 0) {
      wx.showToast({
        title: '请至少选择一个位置',
        icon: 'none'
      });
      return;
    }

    // 更新表单数据（用于显示，逗号分隔）
    const positionValue = this.data.selectedPositions.join(',');
    this.setData({
      'formData.position': positionValue, // 仅用于显示
      showPositionPicker: false
    });
  },

  // 增加左脚熟练度
  onIncreaseLeftFoot() {
    const current = this.data.formData.leftFootLevel;
    if (current < 5) {
      const newLevel = current + 1;
      this.setData({
        'formData.leftFootLevel': newLevel,
        leftFootIcon: config.getIconUrl(`foot-print-${newLevel >= 5 ? 5 : 0}.png`)
      });
    }
  },

  // 减少左脚熟练度
  onDecreaseLeftFoot() {
    const current = this.data.formData.leftFootLevel;
    if (current > 0) {
      const newLevel = current - 1;
      this.setData({
        'formData.leftFootLevel': newLevel,
        leftFootIcon: config.getIconUrl(`foot-print-${newLevel >= 5 ? 5 : 0}.png`)
      });
    }
  },

  // 增加右脚熟练度
  onIncreaseRightFoot() {
    const current = this.data.formData.rightFootLevel;
    if (current < 5) {
      const newLevel = current + 1;
      this.setData({
        'formData.rightFootLevel': newLevel,
        rightFootIcon: config.getIconUrl(`foot-print-${newLevel >= 5 ? 5 : 0}.png`)
      });
    }
  },

  // 减少右脚熟练度
  onDecreaseRightFoot() {
    const current = this.data.formData.rightFootLevel;
    if (current > 0) {
      const newLevel = current - 1;
      this.setData({
        'formData.rightFootLevel': newLevel,
        rightFootIcon: config.getIconUrl(`foot-print-${newLevel >= 5 ? 5 : 0}.png`)
      });
    }
  },

  // 表单验证
  validateForm() {
    const { avatar, nickname, realName, phone, jerseyNumber, position, leftFootLevel, rightFootLevel } = this.data.formData;

    // 头像必填验证
    if (!avatar || !avatar.trim()) {
      wx.showToast({
        title: '请上传头像',
        icon: 'none'
      });
      return false;
    }

    if (!nickname || !nickname.trim()) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      });
      return false;
    }

    if (!realName || !realName.trim()) {
      wx.showToast({
        title: '请输入真实姓名',
        icon: 'none'
      });
      return false;
    }

    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({
        title: '请输入正确的手机号',
        icon: 'none'
      });
      return false;
    }

    if (!jerseyNumber) {
      wx.showToast({
        title: '请输入球衣号码',
        icon: 'none'
      });
      return false;
    }

    if (!position) {
      wx.showToast({
        title: '请选择场上位置',
        icon: 'none'
      });
      return false;
    }

    if (leftFootLevel === 0 && rightFootLevel === 0) {
      wx.showToast({
        title: '请选择惯用脚',
        icon: 'none'
      });
      return false;
    }

    return true;
  },

  // 提交表单
  onSubmit() {
    // 表单验证
    if (!this.validateForm()) {
      return;
    }

    wx.showLoading({
      title: '提交中...'
    });

    // 准备提交数据，映射前端字段到后端字段
    const submitData = {
      ...this.data.formData,
      leftFootSkill: this.data.formData.leftFootLevel,   // 前端 leftFootLevel → 后端 leftFootSkill
      rightFootSkill: this.data.formData.rightFootLevel, // 前端 rightFootLevel → 后端 rightFootSkill
      position: this.data.selectedPositions,              // 后端需要数组格式
    };
    // 删除前端字段
    delete submitData.leftFootLevel;
    delete submitData.rightFootLevel;

    // 调用更新接口
    userAPI.updateUserInfo(submitData).then(res => {
      wx.hideLoading();

      // 更新本地存储
      const userInfo = wx.getStorageSync('userInfo') || {};
      Object.assign(userInfo, this.data.formData);
      wx.setStorageSync('userInfo', userInfo);

      // 更新全局数据
      app.globalData.userInfo = userInfo;

      wx.showToast({
        title: this.data.type === 'complete' ? '完善成功' : '保存成功',
        icon: 'success',
        duration: 1500
      });

      // 延迟跳转
      setTimeout(() => {
        if (this.data.type === 'complete') {
          // 完善信息后跳转到首页
          wx.switchTab({
            url: '/pages/index/index'
          });
        } else {
          // 编辑资料后返回
          wx.navigateBack();
        }
      }, 1500);

    }).catch(err => {
      wx.hideLoading();
      wx.showToast({
        title: err.message || '提交失败',
        icon: 'none'
      });
    });
  }
});
