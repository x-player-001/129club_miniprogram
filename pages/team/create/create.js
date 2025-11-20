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
      color: '#b51316',
      captainId: ''
    },
    colorList: [
      '#b51316', '#8742a3', '#0a7ea3', '#e67e22', '#27ae60',
      '#f39c12', '#e74c3c', '#3498db', '#2ecc71',
      '#00bcd4', '#34495e', '#f1c40f'
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
    }
  },

  // 加载队伍信息（编辑模式）
  loadTeamInfo() {
    wx.showLoading({ title: '加载中...' });

    teamAPI.getTeamDetail(this.data.teamId).then(res => {
      const team = res.data;

      // 处理logo路径 - 转换为完整URL用于显示
      let logoUrl = '';
      if (team.logo) {
        // 如果是完整URL，直接使用
        if (team.logo.startsWith('http')) {
          logoUrl = team.logo;
        } else {
          // 如果是相对路径，转换为完整URL
          logoUrl = config.getStaticUrl(team.logo, 'teamLogos');
        }
      }

      // 如果有队伍成员信息，更新用户列表（编辑模式下只显示本队成员）
      if (team.members && Array.isArray(team.members)) {
        // 将成员数据扁平化，提取 user 字段中的信息
        const users = team.members.map(member => {
          if (member.user) {
            // 将 user 对象的属性合并到顶层，并保留 member 的一些字段
            return {
              ...member.user,
              id: member.userId || member.user.id,
              teamRole: member.role,
              joinedAt: member.joinedAt
            };
          }
          return member;
        }).filter(u => u && u.id); // 过滤掉无效数据

        this.setData({ users });
      }

      // 设置表单数据
      this.setData({
        formData: {
          name: team.name,
          logo: logoUrl, // 使用完整URL
          color: team.color || '#667eea',
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

    // uploadFile 参数: (url, filePath, name, formData)
    // 使用通用照片上传接口：POST /api/upload/photo
    // 字段名必须是 photo，分类使用 team_logos
    uploadFile('/upload/photo', filePath, 'photo', { category: 'team_logos' })
      .then(res => {
        wx.hideLoading();
        if (res.data && res.data.url) {
          // 后端返回的是相对路径（如 /team_logos/2025/11/xxx.png）
          // 需要转换为完整URL用于显示
          const logoUrl = config.getStaticUrl(res.data.url, 'teamLogos');

          this.setData({
            'formData.logo': logoUrl
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
    const { name } = this.data.formData;

    if (!name || name.trim() === '') {
      wx.showToast({
        title: '请输入队伍名称',
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

    // 处理logo - 如果是完整URL，提取路径部分
    let logoPath = formData.logo;
    if (logoPath && (logoPath.startsWith('http://') || logoPath.startsWith('https://'))) {
      // 微信小程序不支持 URL 构造函数，使用字符串方法提取路径
      // 例如: https://api.129club.cloud/images/cjhh.png -> /images/cjhh.png
      const urlParts = logoPath.split('/');
      // urlParts = ['https:', '', 'api.129club.cloud', 'images', 'cjhh.png']
      // 取从第3个元素开始的所有部分（跳过 'https:', '', 'api.129club.cloud'）
      if (urlParts.length > 3) {
        logoPath = '/' + urlParts.slice(3).join('/');
      }
    }

    const submitData = {
      name: formData.name,
      logo: logoPath || undefined,
      color: formData.color,
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
