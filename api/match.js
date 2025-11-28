// 比赛相关API
const { get, post, put, del } = require('../utils/request');

/**
 * 获取比赛列表
 * @param {Object} params 查询参数
 */
function getMatchList(params = {}) {
  return get('/match/list', params);
}

/**
 * 获取比赛详情
 * @param {String} matchId 比赛ID
 */
function getMatchDetail(matchId) {
  return get(`/match/${matchId}`);
}

/**
 * 创建比赛
 * @param {Object} data 比赛数据
 */
function createMatch(data) {
  return post('/match', data);
}

/**
 * 更新比赛信息
 * @param {String} matchId 比赛ID
 * @param {Object} data 比赛数据
 */
function updateMatch(matchId, data) {
  return put(`/match/${matchId}`, data);
}

/**
 * 报名比赛
 * @param {String} matchId 比赛ID
 * @param {Object} data 报名数据
 */
function registerMatch(matchId, data) {
  return post(`/match/${matchId}/register`, data);
}

/**
 * 取消报名
 * @param {String} matchId 比赛ID
 */
function cancelRegister(matchId) {
  return del(`/match/${matchId}/register`);
}

/**
 * 获取报名列表
 * @param {String} matchId 比赛ID
 */
function getRegistrationList(matchId) {
  return get(`/match/${matchId}/registration`);
}

/**
 * 设置阵容
 * @param {String} matchId 比赛ID
 * @param {Object} data 阵容数据
 */
function setLineup(matchId, data) {
  return post(`/match/${matchId}/lineup`, data);
}

/**
 * 记录比赛事件
 * @param {String} matchId 比赛ID
 * @param {Object} data 事件数据
 */
function recordEvent(matchId, data) {
  return post(`/match/${matchId}/event`, data);
}

/**
 * 提交比赛结果
 * @param {String} matchId 比赛ID
 * @param {Object} data 结果数据
 */
function submitResult(matchId, data) {
  return post(`/match/${matchId}/result`, data);
}

/**
 * 取消比赛
 * @param {String} matchId 比赛ID
 */
function cancelMatch(matchId) {
  return put(`/match/${matchId}/cancel`);
}

/**
 * AI解析比赛简报（异步任务）
 * @param {Object} data 简报数据
 * @returns {Promise} 返回任务ID
 */
function parseReport(data) {
  return post('/match/parse-report', data);
}

/**
 * 查询AI解析任务状态
 * @param {String} taskId 任务ID
 * @returns {Promise} 返回任务状态和结果
 */
function getParseTaskStatus(taskId) {
  return get(`/match/parse-report/${taskId}`);
}

/**
 * 录入单个节次（支持碎片化录入）
 * @param {String} matchId 比赛ID
 * @param {Object} data 节次数据
 */
function saveQuarter(matchId, data) {
  return post(`/match/${matchId}/quarter`, data);
}

/**
 * 批量录入完整4节比赛
 * @param {String} matchId 比赛ID
 * @param {Object} data 完整比赛数据
 */
function saveCompleteQuarters(matchId, data) {
  return post(`/match/${matchId}/complete-quarters`, data);
}

/**
 * 获取比赛详情（含节次数据）
 * @param {String} matchId 比赛ID
 */
function getQuarterDetail(matchId) {
  return get(`/match/${matchId}/detail`);
}

/**
 * 获取球员比赛统计
 * @param {String} matchId 比赛ID
 */
function getPlayerStats(matchId) {
  return get(`/match/${matchId}/player-stats`);
}

/**
 * 获取比赛实际到场球员列表
 * @param {String} matchId 比赛ID
 */
function getParticipants(matchId) {
  return get(`/match/${matchId}/participants`);
}

/**
 * 设置比赛参赛球员
 * @param {String} matchId 比赛ID
 * @param {Object} data 参赛球员数据 {team1: [], team2: []}
 */
function setParticipants(matchId, data) {
  return post(`/match/${matchId}/participants`, data);
}

/**
 * 补充比赛结果信息(MVP、照片、总结)
 * @param {String} matchId 比赛ID
 * @param {Object} data {mvpUserIds: [], photos: [], summary: ''}
 */
function supplementResult(matchId, data) {
  return post(`/match/${matchId}/supplement-result`, data);
}

/**
 * 请假
 * @param {String} matchId 比赛ID
 * @param {Object} data {reason: '请假原因'}
 */
function requestLeave(matchId, data) {
  return post(`/match/${matchId}/leave`, data);
}

/**
 * 取消请假
 * @param {String} matchId 比赛ID
 */
function cancelLeave(matchId) {
  return del(`/match/${matchId}/leave`);
}

/**
 * 获取可选球员列表（按报名状态分类）
 * @param {String} matchId 比赛ID
 * @param {String} teamId 队伍ID
 */
function getSelectablePlayers(matchId, teamId) {
  return get(`/match/${matchId}/selectable-players`, { teamId });
}

/**
 * 设置节次角色（裁判和守门员）
 * @param {String} matchId 比赛ID
 * @param {Number} quarterNumber 节次编号（1-4）
 * @param {Object} data 角色数据 {mainRefereeId, assistantReferee1Id, assistantReferee2Id, team1GoalkeeperId, team2GoalkeeperId}
 */
function setQuarterRoles(matchId, quarterNumber, data) {
  return put(`/match/${matchId}/quarter/${quarterNumber}/roles`, data);
}

module.exports = {
  getMatchList,
  getMatchDetail,
  createMatch,
  updateMatch,
  registerMatch,
  cancelRegister,
  getRegistrationList,
  setLineup,
  recordEvent,
  submitResult,
  cancelMatch,
  parseReport,
  getParseTaskStatus,
  saveQuarter,
  saveCompleteQuarters,
  getQuarterDetail,
  getPlayerStats,
  getParticipants,
  setParticipants,
  requestLeave,
  cancelLeave,
  supplementResult,
  getSelectablePlayers,
  setQuarterRoles
};
