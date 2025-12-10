// pages/team/batch-create/batch-create.js
const app = getApp();
const teamAPI = require('../../../api/team.js');
const config = require('../../../utils/config.js');

Page({
  data: {
    seasonName: '', // 当前赛季名称
    seasonId: '', // 当前赛季ID

    // 队伍1表单数据
    team1: {
      name: '',
      captainId: '',
      color: '#b51316', // 默认红色
      jerseyImage: '' // 球衣图片
    },
    team1CaptainName: '',
    showTeam1CaptainPicker: false,

    // 队伍2表单数据
    team2: {
      name: '',
      captainId: '',
      color: '#924ab0', // 默认紫色
      jerseyImage: '' // 球衣图片
    },
    team2CaptainName: '',
    showTeam2CaptainPicker: false,

    // 颜色列表
    colorList: [
      '#b51316', '#8742a3', '#0a7ea3', '#e67e22', '#27ae60',
      '#f39c12', '#e74c3c', '#3498db', '#2ecc71',
      '#00bcd4', '#34495e', '#f1c40f'
    ],

    // 可选队长列表（只显示 memberType 为 regular 的队员）
    users: [],

    // 图标URL
    icons: {
      arrowRight: config.getIconUrl('arrow-right.png')
    }
  },

  onLoad(options) {
    // 检查权限
    this.checkSuperAdminPermission();

    // 获取当前赛季
    this.loadCurrentSeason();

    // 加载用户列表
    this.loadUsers();
  },

  /**
   * 检查超级管理员权限
   */
  checkSuperAdminPermission() {
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo');
    const isSuperAdmin = userInfo && userInfo.role === 'super_admin';

    if (!isSuperAdmin) {
      wx.showModal({
        title: '权限不足',
        content: '只有超级管理员才能批量创建队伍',
        showCancel: false,
        success: () => {
          wx.navigateBack();
        }
      });
    }
  },

  /**
   * 加载当前赛季
   */
  loadCurrentSeason() {
    const currentSeason = app.getCurrentSeason();

    if (!currentSeason || !currentSeason.id) {
      wx.showModal({
        title: '提示',
        content: '请先创建赛季',
        showCancel: false,
        success: () => {
          wx.navigateBack();
        }
      });
      return;
    }

    this.setData({
      seasonName: currentSeason.name,
      seasonId: currentSeason.id
    });
  },

  /**
   * 加载用户列表（只显示 memberType 为 regular 的队员）
   */
  loadUsers() {
    const userAPI = require('../../../api/user.js');
    userAPI.getMemberList().then(res => {
      const allUsers = res.data?.list || res.data || [];
      // 只显示 memberType 为 regular 的队员作为队长候选
      const users = allUsers.filter(user => user.memberType === 'regular');
      this.setData({ users });
    }).catch(err => {
      console.error('加载用户列表失败:', err);
    });
  },

  /**
   * 输入队伍1名称
   */
  onTeam1NameInput(e) {
    this.setData({
      'team1.name': e.detail.value
    });
  },

  /**
   * 输入队伍2名称
   */
  onTeam2NameInput(e) {
    this.setData({
      'team2.name': e.detail.value
    });
  },

  /**
   * 显示队伍1队长选择器
   */
  onShowTeam1CaptainPicker() {
    this.setData({ showTeam1CaptainPicker: true });
  },

  /**
   * 关闭队伍1队长选择器
   */
  onCloseTeam1CaptainPicker() {
    this.setData({ showTeam1CaptainPicker: false });
  },

  /**
   * 确认选择队伍1队长
   */
  onConfirmTeam1Captain(e) {
    const { value, text } = e.detail;
    this.setData({
      'team1.captainId': value || '',
      team1CaptainName: text || ''
    });
  },

  /**
   * 显示队伍2队长选择器
   */
  onShowTeam2CaptainPicker() {
    this.setData({ showTeam2CaptainPicker: true });
  },

  /**
   * 关闭队伍2队长选择器
   */
  onCloseTeam2CaptainPicker() {
    this.setData({ showTeam2CaptainPicker: false });
  },

  /**
   * 确认选择队伍2队长
   */
  onConfirmTeam2Captain(e) {
    const { value, text } = e.detail;
    this.setData({
      'team2.captainId': value || '',
      team2CaptainName: text || ''
    });
  },

  /**
   * 选择队伍1颜色
   */
  onSelectTeam1Color(e) {
    const color = e.currentTarget.dataset.color;
    this.setData({
      'team1.color': color
    });
  },

  /**
   * 选择队伍2颜色
   */
  onSelectTeam2Color(e) {
    const color = e.currentTarget.dataset.color;
    this.setData({
      'team2.color': color
    });
  },

  /**
   * 选择队伍1球衣图片
   */
  onChooseTeam1Jersey() {
    this.chooseJerseyImage('team1');
  },

  /**
   * 选择队伍2球衣图片
   */
  onChooseTeam2Jersey() {
    this.chooseJerseyImage('team2');
  },

  /**
   * 删除队伍1球衣图片
   */
  onDeleteTeam1Jersey() {
    this.setData({ 'team1.jerseyImage': '' });
  },

  /**
   * 删除队伍2球衣图片
   */
  onDeleteTeam2Jersey() {
    this.setData({ 'team2.jerseyImage': '' });
  },

  /**
   * 选择球衣图片通用方法
   */
  chooseJerseyImage(teamKey) {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        // 上传图片
        this.uploadJerseyImage(tempFilePath, teamKey);
      }
    });
  },

  /**
   * 上传球衣图片
   */
  uploadJerseyImage(filePath, teamKey) {
    wx.showLoading({ title: '上传中...' });

    const uploadAPI = require('../../../api/upload.js');
    uploadAPI.uploadImage(filePath)
      .then(res => {
        wx.hideLoading();
        const imageUrl = res.data?.url || res.url || res.data;
        this.setData({
          [`${teamKey}.jerseyImage`]: imageUrl
        });
        wx.showToast({
          title: '上传成功',
          icon: 'success'
        });
      })
      .catch(err => {
        wx.hideLoading();
        console.error('上传球衣图片失败:', err);
        wx.showToast({
          title: err.message || '上传失败',
          icon: 'none'
        });
      });
  },

  /**
   * 表单验证
   */
  validateForm() {
    const { team1, team2, seasonName } = this.data;

    if (!seasonName) {
      wx.showToast({
        title: '赛季信息缺失',
        icon: 'none'
      });
      return false;
    }

    if (!team1.name || team1.name.trim() === '') {
      wx.showToast({
        title: '请输入队伍1名称',
        icon: 'none'
      });
      return false;
    }

    if (!team1.captainId) {
      wx.showToast({
        title: '请选择队伍1队长',
        icon: 'none'
      });
      return false;
    }

    if (!team2.name || team2.name.trim() === '') {
      wx.showToast({
        title: '请输入队伍2名称',
        icon: 'none'
      });
      return false;
    }

    if (!team2.captainId) {
      wx.showToast({
        title: '请选择队伍2队长',
        icon: 'none'
      });
      return false;
    }

    if (team1.captainId === team2.captainId) {
      wx.showToast({
        title: '两个队伍不能是同一个队长',
        icon: 'none'
      });
      return false;
    }

    return true;
  },

  /**
   * 提交表单
   */
  onSubmit() {
    if (!this.validateForm()) {
      return;
    }

    wx.showModal({
      title: '确认创建',
      content: '确定要创建这两支队伍吗？',
      success: (res) => {
        if (res.confirm) {
          this.submitForm();
        }
      }
    });
  },

  /**
   * 提交表单（批量创建两个队伍）
   */
  submitForm() {
    const { seasonName, team1, team2 } = this.data;

    wx.showLoading({ title: '创建中...' });

    const submitData = {
      season: seasonName,
      seasonId: this.data.seasonId,
      team1Name: team1.name,
      team1CaptainId: team1.captainId,
      team1Color: team1.color,
      team1JerseyImage: team1.jerseyImage || '',
      team2Name: team2.name,
      team2CaptainId: team2.captainId,
      team2Color: team2.color,
      team2JerseyImage: team2.jerseyImage || ''
    };

    teamAPI.batchCreateTwoTeams(submitData)
      .then(res => {
        wx.hideLoading();
        wx.showToast({
          title: '创建成功',
          icon: 'success',
          duration: 1500
        });

        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      })
      .catch(err => {
        wx.hideLoading();
        wx.showToast({
          title: err.message || '创建失败',
          icon: 'none'
        });
      });
  },

  /**
   * 取消
   */
  onCancel() {
    wx.showModal({
      title: '确认取消',
      content: '确定要放弃创建队伍吗？',
      success: (res) => {
        if (res.confirm) {
          wx.navigateBack();
        }
      }
    });
  }
});
