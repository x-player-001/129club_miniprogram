// pages/team/create/create.js
const app = getApp();
const teamAPI = require('../../../api/team.js');
const config = require('../../../utils/config.js');

Page({
  data: {
    mode: 'create', // 'create' 或 'edit'
    teamId: '',
    formData: {
      name: '',
      logo: '',
      color: '#667eea',
      season: '',
      captainId: ''
    },
    colorList: [
      '#667eea', '#f20810', '#924ab0', '#27ae60',
      '#3498db', '#e74c3c', '#f39c12', '#9b59b6',
      '#1abc9c', '#34495e', '#e67e22', '#95a5a6'
    ],
    users: [], // 可选队长列表
    captainName: '', // 已选队长的名字
    showCaptainPicker: false, // 是否显示队长选择器

    // 图标URL
    icons: {
      arrowRight: config.getIconUrl('arrow-right.png')
    }
  },

  onLoad(options) {
    this.loadUsers();

    // 判断是创建还是编辑模式
    if (options.id) {
      // 编辑模式
      this.setData({
        mode: 'edit',
        teamId: options.id
      });
      wx.setNavigationBarTitle({ title: '编辑队伍' });
      this.loadTeamInfo();
    } else {
      // 创建模式
      this.setData({ mode: 'create' });
      wx.setNavigationBarTitle({ title: '创建队伍' });
      // 自动生成赛季名称
      const year = new Date().getFullYear();
      this.setData({
        'formData.season': `${year}赛季`
      });
    }
  },

  // 加载队伍信息（编辑模式）
  loadTeamInfo() {
    wx.showLoading({ title: '加载中...' });

    teamAPI.getTeamDetail(this.data.teamId).then(res => {
      const team = res.data;

      // 设置表单数据
      this.setData({
        formData: {
          name: team.name,
          logo: team.logo || '',
          color: team.color || '#667eea',
          season: team.season,
          captainId: team.captainId || ''
        }
      });

      // 更新队长名字显示
      if (team.captainId) {
        const captain = this.data.users.find(u => u.id === team.captainId);
        if (captain) {
          this.setData({ captainName: captain.realName || captain.nickname });
        }
      }

      wx.hideLoading();
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
      console.error('加载队伍信息失败:', err);
    });
  },

  // 加载用户列表（用于选择队长）
  loadUsers() {
    const userAPI = require('../../../api/user.js');
    userAPI.getMemberList().then(res => {
      const users = res.data?.list || res.data || [];
      this.setData({ users });
    }).catch(err => {
      console.error('加载用户列表失败:', err);
    });
  },

  // 输入队伍名称
  onNameInput(e) {
    this.setData({
      'formData.name': e.detail.value
    });
  },

  // 选择 logo
  onChooseLogo() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        wx.showLoading({ title: '上传中...' });
        this.uploadLogo(tempFilePath);
      }
    });
  },

  // 上传 logo
  uploadLogo(filePath) {
    const { uploadFile } = require('../../../utils/request.js');

    uploadFile(filePath, { type: 'team_logo' })
      .then(res => {
        wx.hideLoading();
        if (res.data && res.data.url) {
          this.setData({
            'formData.logo': res.data.url
          });
          wx.showToast({
            title: '上传成功',
            icon: 'success'
          });
        }
      })
      .catch(err => {
        wx.hideLoading();
        wx.showToast({
          title: '上传失败',
          icon: 'none'
        });
        console.error('上传 logo 失败:', err);
      });
  },

  // 选择颜色
  onSelectColor(e) {
    const color = e.currentTarget.dataset.color;
    this.setData({
      'formData.color': color
    });
  },

  // 输入赛季
  onSeasonInput(e) {
    this.setData({
      'formData.season': e.detail.value
    });
  },

  // 显示队长选择器
  onShowCaptainPicker() {
    this.setData({ showCaptainPicker: true });
  },

  // 关闭队长选择器
  onCloseCaptainPicker() {
    this.setData({ showCaptainPicker: false });
  },

  // 确认选择队长
  onConfirmCaptain(e) {
    const { value, text } = e.detail;
    this.setData({
      'formData.captainId': value || '',
      captainName: text || ''
    });
  },

  // 表单验证
  validateForm() {
    const { name, season } = this.data.formData;

    if (!name || name.trim() === '') {
      wx.showToast({
        title: '请输入队伍名称',
        icon: 'none'
      });
      return false;
    }

    if (!season || season.trim() === '') {
      wx.showToast({
        title: '请输入赛季',
        icon: 'none'
      });
      return false;
    }

    return true;
  },

  // 提交表单
  onSubmit() {
    if (!this.validateForm()) {
      return;
    }

    const { mode } = this.data;
    const title = mode === 'edit' ? '确认保存' : '确认创建';
    const content = mode === 'edit' ? '确定要保存修改吗？' : '确定要创建这支队伍吗？';

    wx.showModal({
      title,
      content,
      success: (res) => {
        if (res.confirm) {
          this.submitForm();
        }
      }
    });
  },

  // 提交表单（创建或更新）
  submitForm() {
    const { mode, teamId, formData } = this.data;
    const loadingText = mode === 'edit' ? '保存中...' : '创建中...';
    const successText = mode === 'edit' ? '保存成功' : '创建成功';
    const failText = mode === 'edit' ? '保存失败' : '创建失败';

    wx.showLoading({ title: loadingText });

    const submitData = {
      name: formData.name,
      logo: formData.logo || undefined,
      color: formData.color,
      season: formData.season,
      captainId: formData.captainId || undefined
    };

    // 根据模式调用不同的 API
    const apiCall = mode === 'edit'
      ? teamAPI.updateTeam(teamId, submitData)
      : teamAPI.createTeam(submitData);

    apiCall.then(res => {
      wx.hideLoading();
      wx.showToast({
        title: successText,
        icon: 'success',
        duration: 1500
      });

      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({
        title: err.message || failText,
        icon: 'none'
      });
    });
  },

  // 取消
  onCancel() {
    const { mode } = this.data;
    const content = mode === 'edit' ? '确定要放弃修改吗？' : '确定要放弃创建队伍吗？';

    wx.showModal({
      title: '确认取消',
      content,
      success: (res) => {
        if (res.confirm) {
          wx.navigateBack();
        }
      }
    });
  }
});
