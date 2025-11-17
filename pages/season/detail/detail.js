// pages/season/detail/detail.js
const API = require('../../../api/index');
const app = getApp();
const { getTeamLogoUrl } = require('../../../utils/dataFormatter.js');

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
    loading: false,
    isAdmin: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.checkAdminRole();

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
   * 检查管理员权限（超级管理员或队长）
   */
  checkAdminRole() {
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo');
    const isSuperAdmin = userInfo && userInfo.role === 'super_admin';
    const isCaptain = userInfo && userInfo.role === 'captain';

    this.setData({
      isAdmin: isSuperAdmin || isCaptain
    });
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

        // 处理比赛列表，添加格式化日期和比分
        const formattedMatches = matches.map(match => {
          // 后端字段：finalTeam1Score / finalTeam2Score（顶层字段）
          // 备用字段：result.team1FinalScore / team1Score
          const team1Score = match.finalTeam1Score !== undefined
            ? match.finalTeam1Score
            : (match.result?.team1FinalScore !== undefined
              ? match.result.team1FinalScore
              : (match.team1Score !== undefined ? match.team1Score : 0));

          const team2Score = match.finalTeam2Score !== undefined
            ? match.finalTeam2Score
            : (match.result?.team2FinalScore !== undefined
              ? match.result.team2FinalScore
              : (match.team2Score !== undefined ? match.team2Score : 0));

          // 处理点球大战数据
          let penaltyShootout = {
            enabled: false,
            team1Score: 0,
            team2Score: 0,
            winner: ''
          };

          if (match.result && match.result.penaltyShootout) {
            let winner = '';
            if (match.result.penaltyWinnerTeamId) {
              const team1Id = match.team1?.id;
              const team2Id = match.team2?.id;

              if (match.result.penaltyWinnerTeamId === team1Id) {
                winner = 'team1';
              } else if (match.result.penaltyWinnerTeamId === team2Id) {
                winner = 'team2';
              }
            }

            penaltyShootout = {
              enabled: true,
              team1Score: match.result.team1PenaltyScore || 0,
              team2Score: match.result.team2PenaltyScore || 0,
              winner: winner
            };
          }

          return {
            ...match,
            formattedDate: this.formatDate(match.matchDate),
            team1FinalScore: team1Score,
            team2FinalScore: team2Score,
            // 保留进球数用于其他显示
            team1TotalGoals: match.result?.team1TotalGoals,
            team2TotalGoals: match.result?.team2TotalGoals,
            penaltyShootout: penaltyShootout
          };
        });

        // 使用后端返回的 rankings 数据获取总比分
        const rankings = seasonInfo.rankings || [];

        // 从 rankings 中提取队伍信息和总比分
        let team1Data = { name: '队伍1', logo: getTeamLogoUrl('/static/images/logoa.png'), wins: 0 };
        let team2Data = { name: '队伍2', logo: getTeamLogoUrl('/static/images/logob.png'), wins: 0 };

        if (rankings.length >= 2) {
          // 假设 rankings 中第一个是长江黄河，第二个是嘉陵摩托
          // 或者根据 teamId 匹配（如果 seasonInfo 中有 team1Id/team2Id）
          const ranking1 = rankings[0];
          const ranking2 = rankings[1];

          // 如果有明确的队伍ID，进行匹配
          if (seasonInfo.team1Id && seasonInfo.team2Id) {
            const team1Ranking = rankings.find(r => r.teamId === seasonInfo.team1Id);
            const team2Ranking = rankings.find(r => r.teamId === seasonInfo.team2Id);

            if (team1Ranking) {
              team1Data = {
                name: team1Ranking.teamName,
                logo: getTeamLogoUrl(team1Ranking.teamLogo),
                wins: team1Ranking.totalScore
              };
            }

            if (team2Ranking) {
              team2Data = {
                name: team2Ranking.teamName,
                logo: getTeamLogoUrl(team2Ranking.teamLogo),
                wins: team2Ranking.totalScore
              };
            }
          } else {
            // 如果没有明确的队伍ID，按顺序使用（需要后端保证顺序）
            team1Data = {
              name: ranking1.teamName,
              logo: getTeamLogoUrl(ranking1.teamLogo),
              wins: ranking1.totalScore
            };
            team2Data = {
              name: ranking2.teamName,
              logo: getTeamLogoUrl(ranking2.teamLogo),
              wins: ranking2.totalScore
            };
          }
        } else if (formattedMatches.length > 0) {
          // 如果 rankings 数据不可用，从比赛中提取队伍信息（降级方案）
          const firstMatch = formattedMatches[0];
          if (firstMatch.team1) {
            team1Data.name = firstMatch.team1.name || team1Data.name;
            team1Data.logo = getTeamLogoUrl(firstMatch.team1.logo) || team1Data.logo;
          }
          if (firstMatch.team2) {
            team2Data.name = firstMatch.team2.name || team2Data.name;
            team2Data.logo = getTeamLogoUrl(firstMatch.team2.logo) || team2Data.logo;
          }

          // 使用前端计算的总比分（降级方案）
          const { team1Wins, team2Wins } = this.calculateSeasonScore(formattedMatches);
          team1Data.wins = team1Wins;
          team2Data.wins = team2Wins;
        }

        this.setData({
          seasonInfo,
          matches: formattedMatches,
          formattedStartDate,
          team1Data,
          team2Data,
          rankings, // 保存 rankings 数据，供统计Tab使用
          loading: false
        });

        // 如果当前是统计Tab且没有 rankings 数据，加载统计数据
        if (this.data.currentTab === 'statistics' && rankings.length === 0) {
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
      if (match.status === 'completed') {
        // 使用已经处理好的 team1FinalScore 和 team2FinalScore
        const team1Score = match.team1FinalScore || 0;
        const team2Score = match.team2FinalScore || 0;

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
    console.log('[Season Detail] onMatchTap 被调用, matchId:', matchId);

    // 防御性检查：确保 matchId 存在且有效
    if (!matchId || matchId === 'undefined' || typeof matchId === 'undefined') {
      console.error('[Season Detail] matchId 无效，取消导航');
      return;
    }

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
