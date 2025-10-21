// API接口统一导出
const user = require('./user');
const team = require('./team');
const match = require('./match');
const stats = require('./stats');
const notice = require('./notice');
const season = require('./season');

// 导出请求工具函数供其他API模块使用
const { uploadFile, post: postRequest } = require('../utils/request');

module.exports = {
  user,
  team,
  match,
  stats,
  notice,
  season,
  uploadFile,
  postRequest
};
