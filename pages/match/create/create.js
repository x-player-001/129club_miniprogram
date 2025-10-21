// pages/match/create/create.js
const app = getApp();
const matchAPI = require('../../../api/match.js');
const teamAPI = require('../../../api/team.js');
const seasonAPI = require('../../../api/season.js');

Page({
  data: {
    formData: {
      title: '',
      matchDate: '',
      matchTime: '',
      location: '',
      address: '',
      description: '',
      team1Id: '',
      team2Id: ''
    },
    currentDate: '',
    team1: null,
    team2: null,
    currentSeason: null,  // 当前活跃赛季
    noActiveSeason: false  // 是否没有活跃赛季
  },

  onLoad(options) {
    // 设置当前日期作为最小日期
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const currentDate = `${year}-${month}-${day}`;

    this.setData({
      currentDate: currentDate,
      'formData.matchTime': '08:00'
    });

    // 加载当前赛季
    this.loadCurrentSeason();

    // 加载队伍列表
    this.loadTeams();
  },

  /**
   * 加载当前活跃赛季
   */
  loadCurrentSeason() {
    // 先尝试从app获取缓存的当前赛季
    const cachedSeason = app.getCurrentSeason();
    if (cachedSeason) {
      this.onSeasonLoaded(cachedSeason);
      return;
    }

    // 如果没有缓存，从API加载
    seasonAPI.getList({ status: 'active', limit: 1 })
      .then(res => {
        const seasons = res.data.list || [];
        if (seasons.length > 0) {
          this.onSeasonLoaded(seasons[0]);
        } else {
          this.setData({ noActiveSeason: true });
          wx.showModal({
            title: '提示',
            content: '当前没有活跃的赛季，请先创建并激活一个赛季。',
            confirmText: '去创建',
            cancelText: '稍后',
            success: (res) => {
              if (res.confirm) {
                wx.navigateTo({
                  url: '/pages/season/form/form'
                });
              }
            }
          });
        }
      })
      .catch(err => {
        console.error('[Match Create] 加载赛季失败:', err);
      });
  },

  /**
   * 赛季加载成功回调
   */
  onSeasonLoaded(season) {
    const matchCount = season.matchCount || 0;
    const autoTitle = `${season.name} 第${matchCount + 1}场`;

    this.setData({
      currentSeason: season,
      'formData.title': autoTitle
    });

    console.log(`[Match Create] 当前赛季: ${season.name}, 自动标题: ${autoTitle}`);
  },

  // 加载队伍列表
  loadTeams() {
    wx.showLoading({ title: '加载中...' });

    teamAPI.getTeamList({ status: 'active' }).then(res => {
      wx.hideLoading();

      const teams = res.data?.list || [];

      if (teams.length >= 2) {
        const team1 = teams[0];
        const team2 = teams[1];

        this.setData({
          team1: team1,
          team2: team2,
          'formData.team1Id': team1.id,
          'formData.team2Id': team2.id
        });
      } else {
        wx.showToast({
          title: '需要至少2个活跃队伍',
          icon: 'none',
          duration: 2000
        });
      }
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({
        title: err.message || '加载队伍失败',
        icon: 'none'
      });
    });
  },

  // 输入标题
  onTitleInput(e) {
    this.setData({
      'formData.title': e.detail.value
    });
  },

  // 选择比赛日期
  onDateChange(e) {
    this.setData({
      'formData.matchDate': e.detail.value
    });
  },

  // 选择比赛时刻
  onTimeChange(e) {
    this.setData({
      'formData.matchTime': e.detail.value
    });
  },

  // 输入地点
  onLocationInput(e) {
    this.setData({
      'formData.location': e.detail.value
    });
  },

  // 选择地点（地图）
  onChooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        this.setData({
          'formData.location': res.name,
          'formData.address': res.address
        });
      },
      fail: (err) => {
        if (err.errMsg.indexOf('auth deny') !== -1) {
          wx.showModal({
            title: '提示',
            content: '需要授权位置信息才能使用此功能',
            success: (res) => {
              if (res.confirm) {
                wx.openSetting();
              }
            }
          });
        }
      }
    });
  },

  // 输入说明
  onDescriptionInput(e) {
    this.setData({
      'formData.description': e.detail.value
    });
  },

  // 表单验证
  validateForm() {
    const { title, matchDate, matchTime, location } = this.data.formData;

    if (!title || title.trim() === '') {
      wx.showToast({
        title: '请输入比赛标题',
        icon: 'none'
      });
      return false;
    }

    if (!matchDate) {
      wx.showToast({
        title: '请选择比赛日期',
        icon: 'none'
      });
      return false;
    }

    if (!matchTime) {
      wx.showToast({
        title: '请选择比赛时刻',
        icon: 'none'
      });
      return false;
    }

    if (!location || location.trim() === '') {
      wx.showToast({
        title: '请输入比赛地点',
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

    wx.showModal({
      title: '确认创建',
      content: '确定要创建这场比赛吗？',
      success: (res) => {
        if (res.confirm) {
          this.createMatch();
        }
      }
    });
  },

  // 创建比赛
  createMatch() {
    wx.showLoading({ title: '创建中...' });

    const { matchDate: date, matchTime, ...otherData } = this.data.formData;

    // 组合日期和时间
    const matchDate = `${date} ${matchTime}`;

    const formData = {
      ...otherData,
      matchDate
    };

    // 如果有当前赛季，自动关联
    if (this.data.currentSeason) {
      formData.seasonId = this.data.currentSeason.id;
      console.log(`[Match Create] 关联赛季: ${this.data.currentSeason.name}`);
    }

    matchAPI.createMatch(formData).then(res => {
      wx.hideLoading();
      wx.showToast({
        title: '创建成功',
        icon: 'success',
        duration: 1500
      });

      // 刷新当前赛季缓存（因为matchCount变化了）
      if (this.data.currentSeason) {
        app.refreshCurrentSeason();
      }

      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({
        title: err.message || '创建失败',
        icon: 'none'
      });
    });
  },

  // 取消
  onCancel() {
    wx.showModal({
      title: '确认取消',
      content: '确定要放弃创建比赛吗？',
      success: (res) => {
        if (res.confirm) {
          wx.navigateBack();
        }
      }
    });
  }
});
