// pages/season/form/form.js
const API = require('../../../api/index');
const app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    seasonId: '',
    isEdit: false,
    formData: {
      name: '',
      description: '',
      startDate: ''
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    if (options.id) {
      // 编辑模式
      this.setData({
        seasonId: options.id,
        isEdit: true
      });
      wx.setNavigationBarTitle({ title: '编辑赛季' });
      this.loadSeasonInfo();
    } else {
      // 创建模式，设置默认开始日期为今天
      const today = new Date();
      const dateStr = this.formatDateForPicker(today);
      this.setData({
        'formData.startDate': dateStr
      });
    }
  },

  /**
   * 加载赛季信息（编辑模式）
   */
  loadSeasonInfo() {
    wx.showLoading({ title: '加载中...' });

    API.season.getDetail(this.data.seasonId)
      .then(res => {
        wx.hideLoading();

        const seasonInfo = res.data;
        const formData = {
          name: seasonInfo.name || '',
          description: seasonInfo.description || '',
          startDate: this.formatDateForPicker(seasonInfo.startDate)
        };

        this.setData({ formData });
      })
      .catch(err => {
        wx.hideLoading();
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      });
  },

  /**
   * 输入框变化
   */
  onInputChange(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({
      [`formData.${field}`]: value
    });
  },

  /**
   * 日期选择
   */
  onDateChange(e) {
    this.setData({
      'formData.startDate': e.detail.value
    });
  },

  /**
   * 格式化日期为选择器格式
   */
  formatDateForPicker(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * 表单验证
   */
  validateForm() {
    const { name, startDate } = this.data.formData;

    if (!name || !name.trim()) {
      wx.showToast({
        title: '请输入赛季名称',
        icon: 'none'
      });
      return false;
    }

    if (!startDate) {
      wx.showToast({
        title: '请选择开始日期',
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
    if (!this.validateForm()) return;

    const { name, description, startDate } = this.data.formData;

    const submitData = {
      name: name.trim(),
      description: description.trim(),
      startDate: startDate
    };

    wx.showLoading({ title: this.data.isEdit ? '保存中...' : '创建中...' });

    const apiCall = this.data.isEdit
      ? API.season.update(this.data.seasonId, submitData)
      : API.season.create(submitData);

    apiCall
      .then(res => {
        wx.hideLoading();
        wx.showToast({
          title: this.data.isEdit ? '保存成功' : '创建成功',
          icon: 'success'
        });

        // 如果创建了新赛季，询问是否激活
        if (!this.data.isEdit) {
          setTimeout(() => {
            this.askToActivate(res.data.id);
          }, 1500);
        } else {
          // 编辑模式直接返回
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        }

        // 清除赛季缓存
        app.clearSeasonCache();
      })
      .catch(err => {
        wx.hideLoading();
        wx.showToast({
          title: err.message || (this.data.isEdit ? '保存失败' : '创建失败'),
          icon: 'none',
          duration: 2000
        });
      });
  },

  /**
   * 询问是否激活赛季
   */
  askToActivate(seasonId) {
    wx.showModal({
      title: '激活赛季',
      content: '是否立即激活这个赛季？激活后可以开始创建比赛。',
      confirmText: '激活',
      cancelText: '稍后',
      success: (res) => {
        if (res.confirm) {
          this.activateSeason(seasonId);
        } else {
          wx.navigateBack();
        }
      }
    });
  },

  /**
   * 激活赛季
   */
  activateSeason(seasonId) {
    wx.showLoading({ title: '激活中...' });

    API.season.activate(seasonId)
      .then(res => {
        wx.hideLoading();
        wx.showToast({
          title: '赛季已激活',
          icon: 'success'
        });

        // 刷新当前赛季缓存
        app.refreshCurrentSeason();

        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      })
      .catch(err => {
        wx.hideLoading();
        wx.showToast({
          title: err.message || '激活失败',
          icon: 'none'
        });

        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      });
  }
});
