// api/season.js - 赛季相关API
const { get, post, put, del } = require('../utils/request');

/**
 * 获取赛季列表
 * @param {Object} params - 查询参数
 * @param {string} params.status - 筛选状态：upcoming/active/completed/archived
 * @param {number} params.page - 页码，默认1
 * @param {number} params.limit - 每页数量，默认20
 * @returns {Promise}
 */
function getList(params = {}) {
  return get('/season/list', params);
}

/**
 * 获取赛季详情
 * @param {string} seasonId - 赛季ID
 * @returns {Promise}
 */
function getDetail(seasonId) {
  return get(`/season/${seasonId}/detail`);
}

/**
 * 获取赛季统计
 * @param {string} seasonId - 赛季ID
 * @returns {Promise}
 */
function getStatistics(seasonId) {
  return get(`/season/${seasonId}/statistics`);
}

/**
 * 创建赛季
 * @param {Object} data - 赛季数据
 * @param {string} data.name - 赛季名称（必填，唯一）
 * @param {string} data.title - 赛季标题（可选）
 * @param {string} data.description - 赛季说明（可选）
 * @param {string} data.startDate - 开始日期（可选）
 * @returns {Promise}
 */
function create(data) {
  return post('/season', data);
}

/**
 * 更新赛季信息
 * @param {string} seasonId - 赛季ID
 * @param {Object} data - 更新数据
 * @returns {Promise}
 */
function update(seasonId, data) {
  return put(`/season/${seasonId}`, data);
}

/**
 * 激活赛季
 * @param {string} seasonId - 赛季ID
 * @returns {Promise}
 */
function activate(seasonId) {
  return post(`/season/${seasonId}/activate`);
}

/**
 * 完成赛季
 * @param {string} seasonId - 赛季ID
 * @returns {Promise}
 */
function complete(seasonId) {
  return post(`/season/${seasonId}/complete`);
}

/**
 * 删除赛季
 * @param {string} seasonId - 赛季ID
 * @returns {Promise}
 */
function deleteSeason(seasonId) {
  return del(`/season/${seasonId}`);
}

module.exports = {
  getList,
  getDetail,
  getStatistics,
  create,
  update,
  activate,
  complete,
  delete: deleteSeason
};
