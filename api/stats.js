// 统计相关API
const { get } = require('../utils/request');

/**
 * 获取个人统计
 * @param {String} userId 用户ID
 * @param {Object} params 查询参数
 */
function getPlayerStats(userId, params = {}) {
  return get(`/stats/player/${userId}`, params);
}

/**
 * 获取队伍统计
 * @param {String} teamId 队伍ID
 * @param {Object} params 查询参数
 */
function getTeamStats(teamId, params = {}) {
  return get(`/stats/team/${teamId}`, params);
}

/**
 * 获取排行榜
 * @param {String} type 排行榜类型（goals/assists/mvp/attendance）
 * @param {Object} params 查询参数
 */
function getRanking(type, params = {}) {
  return get(`/stats/ranking/${type}`, params);
}

/**
 * 获取数据总览
 */
function getOverview() {
  return get('/stats/overview');
}

/**
 * 获取队伍对比数据
 * @param {String} team1Id 队伍1 ID
 * @param {String} team2Id 队伍2 ID
 */
function getTeamCompare(team1Id, team2Id) {
  return get('/stats/team-compare', { team1Id, team2Id });
}

module.exports = {
  getPlayerStats,
  getTeamStats,
  getRanking,
  getOverview,
  getTeamCompare
};
