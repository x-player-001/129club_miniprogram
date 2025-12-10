// pages/team/matches/matches.js
const app = getApp();
const matchAPI = require('../../../api/match.js');
const config = require('../../../utils/config.js');
const { getTeamLogoUrl } = require('../../../utils/dataFormatter.js');

Page({
  data: {
    teamId: '',
    teamName: '',
    seasonName: '',
    teamColor: '#f20810', // 队伍主题色
    teamColorDark: '#d10710', // 深色版本
    filterType: 'all', // all, win, draw, loss
    matchList: [],
    loading: false,

    // 图片URL
    images: {
      emptyMatch: config.getImageUrl('empty-match.png')
    }
  },

  onLoad(options) {
    if (options.teamId) {
      const teamColor = options.teamColor ? decodeURIComponent(options.teamColor) : '#f20810';

      // 获取赛季名称：优先使用URL参数，其次使用缓存，最后使用默认值
      let seasonName = '2024-2025赛季'; // 默认值
      if (options.seasonName) {
        seasonName = decodeURIComponent(options.seasonName);
      } else {
        // 从缓存读取当前赛季
        const cachedSeason = app.getCurrentSeason();
        if (cachedSeason && cachedSeason.name) {
          seasonName = cachedSeason.name;
        }
      }

      this.setData({
        teamId: options.teamId,
        teamName: decodeURIComponent(options.teamName || '队伍'),
        seasonName: seasonName,
        teamColor: teamColor,
        teamColorDark: this.darkenColor(teamColor),
        filterType: options.filterType || 'all'
      });

      // 设置导航栏标题
      const titleMap = {
        'all': '全部比赛',
        'win': '胜场记录',
        'draw': '平局记录',
        'loss': '负场记录'
      };
      wx.setNavigationBarTitle({
        title: `${this.data.teamName} - ${titleMap[this.data.filterType]}`
      });

      this.loadMatchList();
    }
  },

  // 加深颜色
  darkenColor(color, percent = 15) {
    // 移除 # 号
    const hex = color.replace('#', '');

    // 转换为 RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // 降低亮度
    const factor = 1 - percent / 100;
    const newR = Math.max(0, Math.floor(r * factor));
    const newG = Math.max(0, Math.floor(g * factor));
    const newB = Math.max(0, Math.floor(b * factor));

    // 转回十六进制
    return '#' +
      newR.toString(16).padStart(2, '0') +
      newG.toString(16).padStart(2, '0') +
      newB.toString(16).padStart(2, '0');
  },

  onPullDownRefresh() {
    this.loadMatchList().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 加载比赛列表
  loadMatchList() {
    this.setData({ loading: true });

    // 构建API参数
    const params = {
      teamId: this.data.teamId,
      status: 'completed' // 只加载已完成的比赛
    };

    // 根据filterType添加结果筛选
    if (this.data.filterType !== 'all') {
      params.matchResult = this.data.filterType; // win, draw, loss
    }

    return matchAPI.getMatchList(params).then(res => {
      const matchList = res.data?.list || res.data || [];
      const matches = matchList.map(match => this.formatMatchData(match));

      this.setData({
        matchList: matches,
        loading: false
      });
    }).catch(err => {
      console.error('加载比赛列表失败:', err);
      this.setData({ loading: false });
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    });
  },

  // 格式化比赛数据
  formatMatchData(match) {
    const date = new Date(match.matchDate || match.datetime);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    // 转换状态
    const statusMap = {
      'registration': 'upcoming',
      'in_progress': 'ongoing',
      'completed': 'finished',
      'cancelled': 'finished'
    };

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
        const team1Id = match.team1?.id || match.team1Id;
        const team2Id = match.team2?.id || match.team2Id;

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
      id: match.id,
      dateDay: day,
      dateMonth: month + '月',
      time: `${hours}:${minutes}`,
      location: match.location,
      status: statusMap[match.status] || match.status,
      team1: match.team1 ? { ...match.team1, logo: getTeamLogoUrl(match.team1.logo) } : { name: match.team1Name, logo: getTeamLogoUrl(match.team1Logo) },
      team2: match.team2 ? { ...match.team2, logo: getTeamLogoUrl(match.team2.logo) } : { name: match.team2Name, logo: getTeamLogoUrl(match.team2Logo) },
      team1Score: match.team1Score || 0,
      team2Score: match.team2Score || 0,
      team1FinalScore: match.result?.team1FinalScore || match.team1Score || 0,
      team2FinalScore: match.result?.team2FinalScore || match.team2Score || 0,
      team1TotalGoals: match.result?.team1TotalGoals,
      team2TotalGoals: match.result?.team2TotalGoals,
      penaltyShootout: penaltyShootout
    };
  },

  // 点击比赛卡片
  onMatchCardTap(e) {
    const { matchId } = e.detail;
    console.log('[Team Matches] onMatchCardTap 被调用, matchId:', matchId);

    // 防御性检查
    if (!matchId || matchId === 'undefined' || typeof matchId === 'undefined') {
      console.error('[Team Matches] matchId 无效，取消导航');
      return;
    }

    // 防止重复跳转
    if (this._navigating) {
      console.log('[Team Matches] 防抖：忽略重复跳转');
      return;
    }
    this._navigating = true;

    console.log('[Team Matches] 正在跳转到比赛详情:', matchId);
    wx.navigateTo({
      url: `/pages/match/detail/detail?id=${matchId}`,
      success: () => {
        console.log('[Team Matches] 跳转成功');
        setTimeout(() => {
          this._navigating = false;
        }, 500);
      },
      fail: (err) => {
        console.error('[Team Matches] 跳转失败:', err);
        this._navigating = false;
      }
    });
  }
});
