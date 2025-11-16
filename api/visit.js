// 访问记录相关API
const { post } = require('../utils/request');

/**
 * 记录用户访问
 * @param {Object} data 访问数据
 * @param {String} data.platform 平台：ios/android/devtools
 * @param {String} data.appVersion 小程序版本号（可选）
 * @param {Number} data.scene 场景值（可选）
 * @param {String} data.deviceModel 设备型号（可选）
 * @param {String} data.systemVersion 系统版本（可选）
 */
function recordVisit(data) {
  // 添加 silent: true 标记，告诉 request.js 不要弹窗
  return post('/visit/record', data, { 'X-Silent': 'true' });
}

module.exports = {
  recordVisit
};
