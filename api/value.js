// 身价系统API
const { get, post } = require('../utils/request');

// ========== 公开接口 ==========

/**
 * 获取年度身价排行榜
 * @param {Object} params - 查询参数
 * @param {string} params.clubYearId - 俱乐部年度ID（可选）
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页数量
 */
function getRanking(params = {}) {
  return get('/value/ranking', params);
}

/**
 * 获取当前俱乐部年度
 */
function getCurrentClubYear() {
  return get('/value/club-year/current');
}

/**
 * 获取俱乐部年度列表
 */
function getClubYears() {
  return get('/value/club-years');
}

// ========== 需登录接口 ==========

/**
 * 获取我的年度身价
 */
function getMyValue() {
  return get('/value/my');
}

/**
 * 获取我的身价明细
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页数量
 */
function getMyRecords(params = {}) {
  return get('/value/my/records', params);
}

/**
 * 申报服务身价
 * @param {Object} data - 申报数据
 * @param {string} data.serviceType - 服务类型
 * @param {string} data.description - 服务描述
 * @param {number} data.amount - 申报金额
 */
function applyService(data) {
  return post('/value/service', data);
}

/**
 * 查看球员身价
 * @param {string} userId - 用户ID
 */
function getPlayerValue(userId) {
  return get(`/value/player/${userId}`);
}

/**
 * 查看球员身价明细
 * @param {string} userId - 用户ID
 * @param {Object} params - 查询参数
 */
function getPlayerRecords(userId, params = {}) {
  return get(`/value/player/${userId}/records`, params);
}

// ========== 管理员接口 ==========

/**
 * 添加特殊奖励
 * @param {Object} data - 奖励数据
 * @param {string} data.userId - 用户ID（必填）
 * @param {number} data.amount - 奖励金额（必填）
 * @param {string} data.notes - 备注说明（选填）
 * @param {string} data.matchId - 关联比赛ID（选填）
 * @param {string} data.clubYear - 俱乐部年度（选填）
 */
function addSpecialReward(data) {
  return post('/value/special', data);
}

/**
 * 重算比赛身价
 * @param {string} matchId - 比赛ID
 */
function recalculateMatch(matchId) {
  return post(`/value/recalculate/${matchId}`);
}

module.exports = {
  // 公开接口
  getRanking,
  getCurrentClubYear,
  getClubYears,
  // 需登录接口
  getMyValue,
  getMyRecords,
  applyService,
  getPlayerValue,
  getPlayerRecords,
  // 管理员接口
  addSpecialReward,
  recalculateMatch
};
