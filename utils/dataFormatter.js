/**
 * 数据格式化工具
 * 用于将API返回的数据转换为页面组件需要的格式
 */

const config = require('./config.js');

/**
 * 格式化比赛数据为match-card组件格式
 * @param {Object} match API返回的比赛数据
 * @returns {Object} 格式化后的比赛数据
 */
function formatMatchData(match) {
  if (!match) return null;

  const date = new Date(match.matchDate || match.datetime);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return {
    id: match.id,
    title: match.title,
    dateDay: day,
    dateMonth: month + '月',
    time: `${hours}:${minutes}`,
    location: match.location,
    status: match.status,
    team1: match.team1 ? {
      ...match.team1,
      logo: getTeamLogoUrl(match.team1.logo)
    } : {
      id: match.team1Id,
      name: match.team1Name,
      logo: getTeamLogoUrl(match.team1Logo)
    },
    team2: match.team2 ? {
      ...match.team2,
      logo: getTeamLogoUrl(match.team2.logo)
    } : {
      id: match.team2Id,
      name: match.team2Name,
      logo: getTeamLogoUrl(match.team2Logo)
    },
    team1Score: match.team1Score,
    team2Score: match.team2Score,
    mvpPlayer: match.mvpPlayer,
    registrationDeadline: match.registrationDeadline,
    maxPlayersPerTeam: match.maxPlayersPerTeam,
    team1Count: match.team1Count,
    team2Count: match.team2Count
  };
}

/**
 * 格式化队伍数据为team-card组件格式
 * @param {Object} team API返回的队伍数据
 * @returns {Object} 格式化后的队伍数据
 */
function formatTeamData(team) {
  if (!team) return null;

  return {
    id: team.id,
    name: team.name,
    logo: team.logo || config.getImageUrl('default-team.png'),
    color: team.color || '#ff6b6b',
    colorDark: darkenColor(team.color || '#ff6b6b'),
    captainName: team.captain?.realName || team.captain?.nickname || team.captainName || '未设置',
    season: team.season,
    memberCount: team.memberCount || 0,
    isCaptain: team.isCaptain || false,
    stats: team.stats || {
      totalMatches: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      winRate: 0
    }
  };
}

/**
 * 格式化球员数据为player-card组件格式
 * @param {Object} player API返回的球员数据
 * @returns {Object} 格式化后的球员数据
 */
function formatPlayerData(player) {
  if (!player) return null;

  return {
    id: player.id,
    nickname: player.nickname,
    realName: player.realName,
    avatar: player.avatar || config.getImageUrl('default-avatar.png'),
    jerseyNumber: player.jerseyNumber,
    position: player.position,
    teamName: player.team?.name || player.teamName,
    teamColor: player.team?.color || player.teamColor,
    stats: player.stats || {
      goals: 0,
      assists: 0,
      matchesPlayed: 0,
      mvpCount: 0
    }
  };
}

/**
 * 格式化个人统计数据为stats-grid组件格式
 * @param {Object} stats API返回的统计数据
 * @returns {Array} 格式化后的数据网格
 */
function formatStatsGrid(stats) {
  if (!stats) return [];

  return [
    {
      icon: config.getIconUrl('goal.png'),
      iconClass: 'goal-icon',
      value: stats.goals || 0,
      label: '进球'
    },
    {
      icon: config.getIconUrl('assist.png'),
      iconClass: 'assist-icon',
      value: stats.assists || 0,
      label: '助攻'
    },
    {
      icon: config.getIconUrl('match.png'),
      iconClass: 'match-icon',
      value: stats.matchesPlayed || stats.matches || 0,
      label: '出场'
    },
    {
      icon: config.getIconUrl('star.png'),
      iconClass: 'mvp-icon',
      value: stats.mvpCount || 0,
      label: 'MVP'
    }
  ];
}

/**
 * 格式化队伍战绩数据为team-stats-bar组件格式
 * @param {Object} team API返回的队伍数据
 * @returns {Object} 格式化后的战绩数据
 */
function formatTeamStatsBar(team) {
  if (!team || !team.stats) return null;

  const stats = team.stats;
  return {
    teamName: team.name,
    teamColor: team.color,
    wins: stats.wins || 0,
    draws: stats.draws || 0,
    losses: stats.losses || 0,
    winRate: stats.winRate || 0,
    totalMatches: stats.totalMatches || 0,
    goalsFor: stats.goalsFor,
    goalsAgainst: stats.goalsAgainst
  };
}

/**
 * 格式化排行榜数据为ranking-item组件格式
 * @param {Object} rankingItem API返回的排行榜项
 * @param {Number} index 索引
 * @returns {Object} 格式化后的排行榜数据
 */
function formatRankingItem(rankingItem, index) {
  if (!rankingItem) return null;

  const user = rankingItem.user || rankingItem;
  return {
    rank: rankingItem.rank || index + 1,
    id: user.id,
    nickname: user.nickname,
    realName: user.realName,
    avatar: user.avatar || config.getImageUrl('default-avatar.png'),
    teamName: user.team?.name || rankingItem.teamName,
    teamColor: user.team?.color || rankingItem.teamColor,
    value: rankingItem.goals || rankingItem.assists || rankingItem.mvpCount || rankingItem.attendanceRate || 0,
    matchesPlayed: rankingItem.matchesPlayed || 0
  };
}

/**
 * 获取队伍logo URL（统一使用服务器地址）
 * @param {String} logoPath logo路径
 * @returns {String} 完整的logo URL
 */
function getTeamLogoUrl(logoPath) {
  return config.getStaticUrl(logoPath, 'teamLogos');
}

/**
 * 获取图标URL（统一使用服务器地址）
 * @param {String} iconPath 图标路径
 * @returns {String} 完整的图标URL
 */
function getIconUrl(iconPath) {
  return config.getStaticUrl(iconPath, 'icons');
}

/**
 * 获取图片URL（统一使用服务器地址）
 * @param {String} imagePath 图片路径
 * @returns {String} 完整的图片URL
 */
function getImageUrl(imagePath) {
  return config.getStaticUrl(imagePath, 'images');
}

/**
 * 颜色加深函数
 * @param {String} color 原颜色
 * @returns {String} 加深后的颜色
 */
function darkenColor(color) {
  if (!color || !color.startsWith('#')) return color;

  const hex = color.replace('#', '');
  const r = Math.max(0, parseInt(hex.substring(0, 2), 16) - 30);
  const g = Math.max(0, parseInt(hex.substring(2, 4), 16) - 30);
  const b = Math.max(0, parseInt(hex.substring(4, 6), 16) - 30);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * 格式化时间段
 * @param {String} start 开始时间
 * @param {String} end 结束时间
 * @returns {String} 格式化后的时间段
 */
function formatPeriod(start, end) {
  if (!start || !end) return '';
  const startDate = new Date(start);
  const endDate = new Date(end);
  const startStr = `${startDate.getFullYear()}.${startDate.getMonth() + 1}`;
  const endStr = `${endDate.getFullYear()}.${endDate.getMonth() + 1}`;
  return `${startStr} - ${endStr}`;
}

module.exports = {
  formatMatchData,
  formatTeamData,
  formatPlayerData,
  formatStatsGrid,
  formatTeamStatsBar,
  formatRankingItem,
  getTeamLogoUrl,
  darkenColor,
  formatPeriod
};
