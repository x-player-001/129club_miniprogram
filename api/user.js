// 用户相关API
const { get, post, put } = require('../utils/request');

/**
 * 微信登录
 * @param {String|Object} codeOrData 微信code字符串 或 完整登录数据对象 { code, nickname, avatar }
 */
function login(codeOrData) {
  // 兼容两种调用方式
  // 1. login(code) - 只传code字符串
  // 2. login({ code, nickname, avatar }) - 传完整对象
  const data = typeof codeOrData === 'string'
    ? { code: codeOrData }
    : codeOrData;

  return post('/user/login', data);
}

/**
 * 获取用户信息
 */
function getUserInfo() {
  return get('/user/info');
}

/**
 * 更新用户信息
 * @param {Object} data 用户数据
 */
function updateUserInfo(data) {
  return put('/user/info', data);
}

/**
 * 获取成员列表
 * @param {Object} params 查询参数
 */
function getMemberList(params = {}) {
  return get('/user/members', params);
}

/**
 * 获取成员详情
 * @param {String} userId 用户ID
 */
function getMemberDetail(userId) {
  return get(`/user/members/${userId}`);
}

module.exports = {
  login,
  getUserInfo,
  updateUserInfo,
  getMemberList,
  getMemberDetail
};
