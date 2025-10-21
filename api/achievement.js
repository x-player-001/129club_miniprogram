// 成就相关API
const { get, post, del } = require('../utils/request');

/**
 * 获取所有可用成就列表
 */
function getList() {
  return get('/achievement/list');
}

/**
 * 获取我的成就进度（包含已解锁和未解锁）
 * @param {Object} params 查询参数
 * @param {String} params.seasonId 赛季ID（可选）
 */
function getMyProgress(params = {}) {
  return get('/achievement/my/progress', params);
}

/**
 * 获取我的已解锁成就
 * @param {Object} params 查询参数
 * @param {String} params.seasonId 赛季ID（可选）
 */
function getMyAchievements(params = {}) {
  return get('/achievement/my', params);
}

/**
 * 获取通知列表
 * @param {Object} params 查询参数
 * @param {Boolean} params.isRead 是否已读（可选）
 * @param {Boolean} params.isShown 是否已显示（可选）
 * @param {String} params.type 类型：achievement/match/system（可选）
 * @param {Number} params.page 页码（可选，默认1）
 * @param {Number} params.limit 每页数量（可选，默认20）
 */
function getNotifications(params = {}) {
  return get('/notification/list', params);
}

/**
 * 获取未读通知数量
 */
function getUnreadCount() {
  return get('/notification/unread-count');
}

/**
 * 标记通知为已读
 * @param {String} id 通知ID
 */
function markAsRead(id) {
  return post(`/notification/${id}/read`);
}

/**
 * 标记通知为已显示
 * @param {String} id 通知ID
 */
function markAsShown(id) {
  return post(`/notification/${id}/shown`);
}

/**
 * 删除通知
 * @param {String} id 通知ID
 */
function deleteNotification(id) {
  return del(`/notification/${id}`);
}

module.exports = {
  getList,
  getMyProgress,
  getMyAchievements,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAsShown,
  deleteNotification
};
