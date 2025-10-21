// 位置相关API
const { get } = require('../utils/request');

/**
 * 获取位置列表
 * @param {Object} params 查询参数
 */
function getPositionList(params = {}) {
  return get('/position/list', params);
}

/**
 * 按类别分组获取位置
 */
function getPositionGrouped() {
  return get('/position/grouped');
}

module.exports = {
  getPositionList,
  getPositionGrouped
};
