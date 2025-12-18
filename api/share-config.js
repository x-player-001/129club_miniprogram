// 分享配置API
const { get, post } = require('../utils/request');

/**
 * 获取当前有效的分享配置（支持游客）
 */
function getActiveConfig() {
  return get('/share-config/active');
}

/**
 * 获取分享配置历史记录（需要管理员权限）
 */
function getHistory() {
  return get('/share-config/history');
}

/**
 * 创建新的分享配置（需要管理员权限）
 * @param {Object} data - 配置数据
 * @param {string} data.title - 分享标题
 * @param {string} data.imageUrl - 分享图片URL
 * @param {string} data.description - 分享描述
 */
function createConfig(data) {
  return post('/share-config', data);
}

module.exports = {
  getActiveConfig,
  getHistory,
  createConfig
};
