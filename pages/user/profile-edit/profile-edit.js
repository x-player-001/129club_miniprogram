// pages/user/profile-edit/profile-edit.js
const app = getApp();
const userAPI = require('../../../api/user.js');
const positionAPI = require('../../../api/position.js');

Page({
  data: {
    type: 'edit', // complete: 首次完善信息, edit: 编辑资料
    statusBarHeight: 0, // 状态栏高度
    navBarHeight: 0, // 导航栏总高度
    formData: {
      avatar: '',
      nickname: '',
      realName: '',
      phone: '',
      jerseyNumber: '',
      position: '',
      height: '',
      weight: '',
      preferredFoot: '',
      skillDescription: ''
    },
    // 位置数据
    positionGroups: {}, // 分组的位置数据 {GK: [...], DF: [...], MF: [...], FW: [...]}
    selectedPositions: [], // 已选择的位置code数组
    showPositionPicker: false, // 是否显示位置选择器

    footList: ['右脚', '左脚', '双脚'],
    footIndex: -1
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

      // 设置表单数据
      this.setData({
        formData: {
          avatar: userInfo.avatar || '',
          nickname: userInfo.nickname || '',
          realName: userInfo.realName || '',
          phone: userInfo.phone || '',
          jerseyNumber: userInfo.jerseyNumber || '',
          position: userInfo.position || '',
          height: userInfo.height || '',
          weight: userInfo.weight || '',
          preferredFoot: userInfo.preferredFoot || '',
          skillDescription: userInfo.skillDescription || ''
        }
      });

      // 设置位置选择（支持多选，兼容字符串和数组格式）
      if (userInfo.position) {
        let selectedPositions = [];

        // 如果是数组，直接过滤
        if (Array.isArray(userInfo.position)) {
          selectedPositions = userInfo.position.filter(p => {
            return p && /^[A-Z]{2,3}$/.test(p);
          });
        } else if (typeof userInfo.position === 'string') {
          // 如果是字符串，先分割再过滤
          selectedPositions = userInfo.position.split(',').map(p => p.trim()).filter(p => {
            return /^[A-Z]{2,3}$/.test(p);
          });
        }

        this.setData({ selectedPositions });
      }

      if (userInfo.preferredFoot) {
        const footIndex = this.data.footList.indexOf(userInfo.preferredFoot);
        this.setData({ footIndex });
      }
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

  // 点击昵称区域
  onNicknameTap() {
    // 如果昵称为空，直接尝试获取授权
    if (!this.data.formData.nickname || this.data.formData.nickname.trim() === '') {
      this.getUserProfile();
    }
    // 如果昵称不为空，不做任何操作，让用户正常编辑
  },

  // 选择头像
  onChooseAvatar() {
    // 弹出选择菜单
    wx.showActionSheet({
      itemList: ['获取微信头像昵称', '从相册选择', '拍照'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 获取微信授权
          this.getUserProfile();
        } else {
          // 上传自定义头像
          const sourceType = res.tapIndex === 1 ? ['album'] : ['camera'];
          this.uploadCustomAvatar(sourceType);
        }
      }
    });
  },

  // 获取微信授权（昵称+头像）
  getUserProfile() {
    console.log('准备调用 wx.getUserProfile...');

    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        const { nickName, avatarUrl } = res.userInfo;

        console.log('获取微信授权成功:', nickName, avatarUrl);

        // 更新表单数据
        this.setData({
          'formData.nickname': nickName,
          'formData.avatar': avatarUrl
        });

        wx.showToast({
          title: '授权成功',
          icon: 'success'
        });
      },
      fail: (err) => {
        console.error('用户拒绝授权:', err);
        wx.showToast({
          title: '您取消了授权，可手动输入昵称',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  // 上传自定义头像
  uploadCustomAvatar(sourceType) {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: sourceType,
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];

        // 显示加载
        wx.showLoading({
          title: '上传中...'
        });

        // 上传头像
        wx.uploadFile({
          url: app.globalData.apiBaseUrl + '/upload/avatar',
          filePath: tempFilePath,
          name: 'file',
          header: {
            'Authorization': 'Bearer ' + wx.getStorageSync('token')
          },
          success: (uploadRes) => {
            wx.hideLoading();
            const data = JSON.parse(uploadRes.data);

            if (data.code === 0) {
              this.setData({
                'formData.avatar': data.data.url
              });
              wx.showToast({
                title: '上传成功',
                icon: 'success'
              });
            } else {
              wx.showToast({
                title: data.message || '上传失败',
                icon: 'none'
              });
            }
          },
          fail: () => {
            wx.hideLoading();
            wx.showToast({
              title: '上传失败',
              icon: 'none'
            });
          }
        });
      }
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

    // 更新表单数据（使用逗号分隔的位置code）
    const positionValue = this.data.selectedPositions.join(',');
    this.setData({
      'formData.position': positionValue,
      showPositionPicker: false
    });
  },

  // 显示擅长脚选择器
  onShowFootPicker() {
    wx.showActionSheet({
      itemList: this.data.footList,
      success: (res) => {
        this.onFootChange({
          detail: {
            value: res.tapIndex
          }
        });
      }
    });
  },

  // 擅长脚选择变化
  onFootChange(e) {
    const index = e.detail.value;
    this.setData({
      footIndex: index,
      'formData.preferredFoot': this.data.footList[index]
    });
  },

  // 表单验证
  validateForm() {
    const { nickname, realName, phone, jerseyNumber, position } = this.data.formData;

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

    // 调用更新接口
    userAPI.updateUserInfo(this.data.formData).then(res => {
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
