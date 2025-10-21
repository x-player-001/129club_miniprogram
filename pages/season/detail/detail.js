// pages/season/detail/detail.js
const API = require('../../../api/index');
const app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    seasonId: '',
    seasonInfo: {},
    currentTab: 'matches',  // matches | statistics
    matches: [],
    rankings: [],
    team1Data: {},
    team2Data: {},
    formattedStartDate: '',
    loading: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    if (options.id) {
      this.setData({ seasonId: options.id });
      this.loadSeasonDetail();
    } else {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadSeasonDetail().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 加载赛季详情
   */
  loadSeasonDetail() {
    this.setData({ loading: true });

    return API.season.getDetail(this.data.seasonId)
      .then(res => {
        console.log('[Season Detail] 加载成功:', res.data);

        const seasonInfo = res.data;
        const matches = seasonInfo.matches || [];

        // 格式化日期
        const formattedStartDate = this.formatDate(seasonInfo.startDate);

        // 处理比赛列表，添加格式化日期
        const formattedMatches = matches.map(match => ({
          ...match,
          formattedDate: this.formatDate(match.matchDate),
          team1Goals: match.result?.team1Goals || 0,
          team2Goals: match.result?.team2Goals || 0
        }));

        // 计算赛季总比分
        const { team1Wins, team2Wins } = this.calculateSeasonScore(formattedMatches);

        // 从比赛中提取队伍信息（假设所有比赛使用相同的两个队伍）
        let team1Info = { name: '队伍1', logo: '/static/images/logoa.png' };
        let team2Info = { name: '队伍2', logo: '/static/images/logob.png' };

        if (formattedMatches.length > 0) {
          const firstMatch = formattedMatches[0];
          if (firstMatch.team1) {
            team1Info = {
              name: firstMatch.team1.name || team1Info.name,
              logo: firstMatch.team1.logo || team1Info.logo
            };
          }
          if (firstMatch.team2) {
            team2Info = {
              name: firstMatch.team2.name || team2Info.name,
              logo: firstMatch.team2.logo || team2Info.logo
            };
          }
        }

        // 如果seasonInfo中有队伍信息，优先使用
        if (seasonInfo.team1Name) team1Info.name = seasonInfo.team1Name;
        if (seasonInfo.team1Logo) team1Info.logo = seasonInfo.team1Logo;
        if (seasonInfo.team2Name) team2Info.name = seasonInfo.team2Name;
        if (seasonInfo.team2Logo) team2Info.logo = seasonInfo.team2Logo;

        this.setData({
          seasonInfo,
          matches: formattedMatches,
          formattedStartDate,
          team1Data: {
            name: team1Info.name,
            logo: team1Info.logo,
            wins: team1Wins
          },
          team2Data: {
            name: team2Info.name,
            logo: team2Info.logo,
            wins: team2Wins
          },
          loading: false
        });

        // 如果当前是统计Tab，加载统计数据
        if (this.data.currentTab === 'statistics') {
          this.loadStatistics();
        }
      })
      .catch(err => {
        console.error('[Season Detail] 加载失败:', err);
        this.setData({ loading: false });
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
      });
  },

  /**
   * 加载统计数据
   */
  loadStatistics() {
    API.season.getStatistics(this.data.seasonId)
      .then(res => {
        console.log('[Season Statistics] 加载成功:', res.data);

        const rankings = res.data.rankings || [];

        this.setData({
          rankings
        });
      })
      .catch(err => {
        console.error('[Season Statistics] 加载失败:', err);
        wx.showToast({
          title: '统计数据加载失败',
          icon: 'none'
        });
      });
  },

  /**
   * 计算赛季总比分（两队各自获胜场数）
   */
  calculateSeasonScore(matches) {
    let team1Wins = 0;
    let team2Wins = 0;

    matches.forEach(match => {
      if (match.status === 'completed' && match.result) {
        // 4节制：使用 finalScore
        const team1Score = match.result.team1FinalScore !== undefined
          ? match.result.team1FinalScore
          : match.result.team1Goals || 0;

        const team2Score = match.result.team2FinalScore !== undefined
          ? match.result.team2FinalScore
          : match.result.team2Goals || 0;

        if (team1Score > team2Score) {
          team1Wins++;
        } else if (team2Score > team1Score) {
          team2Wins++;
        }
        // 平局不计入
      }
    });

    return { team1Wins, team2Wins };
  },

  /**
   * 格式化日期
   */
  formatDate(dateStr) {
    if (!dateStr) return '未设置';
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * Tab切换
   */
  onTabChange(e) {
    const tab = e.currentTarget.dataset.tab;
    if (tab === this.data.currentTab) return;

    this.setData({ currentTab: tab });

    // 切换到统计Tab时加载统计数据
    if (tab === 'statistics' && this.data.rankings.length === 0) {
      this.loadStatistics();
    }
  },

  /**
   * 点击比赛 - 跳转到比赛详情
   */
  onMatchTap(e) {
    const matchId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/match/detail/detail?id=${matchId}`
    });
  },

  /**
   * 编辑赛季
   */
  onEdit() {
    wx.navigateTo({
      url: `/pages/season/form/form?id=${this.data.seasonId}`
    });
  },

  /**
   * 完成赛季
   */
  onComplete() {
    wx.showModal({
      title: '确认完成',
      content: '完成后的赛季将无法再添加新比赛，确定要完成这个赛季吗？',
      success: (res) => {
        if (res.confirm) {
          this.completeSeason();
        }
      }
    });
  },

  /**
   * 完成赛季 - API调用
   */
  completeSeason() {
    wx.showLoading({ title: '处理中...' });

    API.season.complete(this.data.seasonId)
      .then(res => {
        wx.hideLoading();
        wx.showToast({
          title: '赛季已完成',
          icon: 'success'
        });

        // 刷新详情
        this.loadSeasonDetail();

        // 清除当前赛季缓存
        app.clearSeasonCache();
      })
      .catch(err => {
        wx.hideLoading();
        wx.showToast({
          title: err.message || '操作失败',
          icon: 'none'
        });
      });
  }
});
