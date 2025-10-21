// 队伍相关API
const { get, post, put, del } = require('../utils/request');

/**
 * 获取队伍列表
 * @param {Object} params 查询参数
 */
function getTeamList(params = {}) {
  return get('/team/list', params);
}

/**
 * 获取队伍详情
 * @param {String} teamId 队伍ID
 */
function getTeamDetail(teamId) {
  return get(`/team/${teamId}`);
}

/**
 * 创建队伍
 * @param {Object} data 队伍数据
 */
function createTeam(data) {
  return post('/team', data);
}

/**
 * 更新队伍信息
 * @param {String} teamId 队伍ID
 * @param {Object} data 队伍数据
 */
function updateTeam(teamId, data) {
  return put(`/team/${teamId}`, data);
}

/**
 * 发起队伍重组
 * @param {Object} data 重组数据
 */
function startReshuffle(data) {
  return post('/team/reshuffle/start', data);
}

/**
 * 选择球员（Draft）
 * @param {Object} data 选人数据
 */
function pickPlayer(data) {
  return post('/team/reshuffle/pick', data);
}

/**
 * 完成队伍重组
 * @param {String} reshuffleId 重组ID
 */
function completeReshuffle(reshuffleId) {
  return post(`/team/reshuffle/${reshuffleId}/complete`);
}

/**
 * 获取队伍对战记录
 * @param {String} team1Id 队伍1 ID
 * @param {String} team2Id 队伍2 ID
 */
function getTeamVsRecord(team1Id, team2Id) {
  return get('/team/vs', { team1Id, team2Id });
}

/**
 * 获取队伍成员
 * @param {String} teamId 队伍ID
 */
function getTeamMembers(teamId) {
  return get(`/team/${teamId}/members`);
}

/**
 * 获取当前用户所在队伍
 */
function getCurrentTeam() {
  return get('/team/current');
}

module.exports = {
  getTeamList,
  getTeamDetail,
  createTeam,
  updateTeam,
  startReshuffle,
  pickPlayer,
  completeReshuffle,
  getTeamVsRecord,
  getTeamMembers,
  getCurrentTeam
};
