// 通知公告相关API
const { get, post, put } = require('../utils/request');

/**
 * 获取公告列表
 * @param {Object} params 查询参数
 */
function getNoticeList(params = {}) {
  return get('/notice/list', params);
}

/**
 * 获取公告详情
 * @param {String} noticeId 公告ID
 */
function getNoticeDetail(noticeId) {
  return get(`/notice/${noticeId}`);
}

/**
 * 发布公告
 * @param {Object} data 公告数据
 */
function publishNotice(data) {
  return post('/notice', data);
}

/**
 * 获取消息列表
 */
function getMessageList() {
  return get('/message/list');
}

/**
 * 标记消息已读
 * @param {String} messageId 消息ID
 */
function markMessageRead(messageId) {
  return put(`/message/${messageId}/read`);
}

/**
 * 获取未读消息数量
 */
function getUnreadCount() {
  return get('/message/unread-count');
}

module.exports = {
  getNoticeList,
  getNoticeDetail,
  publishNotice,
  getMessageList,
  markMessageRead,
  getUnreadCount
};
