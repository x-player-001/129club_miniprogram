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
 * 获取Draft会话信息
 * @param {String} sessionId 会话ID
 */
function getDraftSession(sessionId) {
  return get(`/team/reshuffle/${sessionId}`);
}

/**
 * 完成队伍重组并发布队伍
 * @param {Object} data 发布数据
 * @param {String} data.sessionId 会话ID
 * @param {String} data.team1Name 队伍1名称
 * @param {String} data.team2Name 队伍2名称
 * @param {String} data.team1Color 队伍1颜色（可选）
 * @param {String} data.team2Color 队伍2颜色（可选）
 */
function publishDraftTeams(data) {
  return post('/team/reshuffle/publish', data);
}

/**
 * 完成队伍重组（旧接口，保留兼容）
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

/**
 * 批量创建两个队伍
 * @param {Object} data 批量创建数据
 * @param {String} data.season 赛季名称
 * @param {String} data.team1Name 队伍1名称
 * @param {String} data.team1CaptainId 队伍1队长ID
 * @param {String} data.team1Color 队伍1颜色（可选）
 * @param {String} data.team2Name 队伍2名称
 * @param {String} data.team2CaptainId 队伍2队长ID
 * @param {String} data.team2Color 队伍2颜色（可选）
 */
function batchCreateTwoTeams(data) {
  return post('/team/batch/create-two', data);
}

module.exports = {
  getTeamList,
  getTeamDetail,
  createTeam,
  updateTeam,
  startReshuffle,
  getDraftSession,
  pickPlayer,
  publishDraftTeams,
  completeReshuffle,
  getTeamVsRecord,
  getTeamMembers,
  getCurrentTeam,
  batchCreateTwoTeams
};
