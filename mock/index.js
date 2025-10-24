/**
 * Mock 数据统一入口
 *
 * 根据 URL 路径返回对应的 Mock 数据
 */

const userMock = require('./user');
const matchMock = require('./match');
const teamMock = require('./team');
const statsMock = require('./stats');
const seasonMock = require('./season');

/**
 * 获取 Mock 响应数据
 * @param {string} url - 请求URL
 * @param {string} method - 请求方法
 * @param {Object} data - 请求参数
 * @returns {Object} Mock 数据
 */
function getMockResponse(url, method, data) {
  console.log(`[Mock Router] ${method} ${url}`);

  // 统一响应格式
  const successResponse = (data) => ({
    code: 0,
    success: true,
    data: data,
    message: 'success'
  });

  const errorResponse = (message = '请求失败') => ({
    code: -1,
    success: false,
    data: null,
    message: message
  });

  // ========== 用户相关 ==========
  if (url.includes('/user/login') || url.includes('/auth/login')) {
    return successResponse(userMock.login(data));
  }
  if (url.includes('/user/info') || url.includes('/user/profile')) {
    return successResponse(userMock.getUserInfo(data));
  }
  if (url.includes('/user/update') || url.includes('/user/profile')) {
    return successResponse(userMock.updateProfile(data));
  }
  if (url.includes('/user/members') || url.includes('/user/list')) {
    return successResponse(userMock.getMemberList(data));
  }

  // ========== 比赛相关 ==========
  if (url.includes('/match/list') || url.includes('/matches')) {
    return successResponse(matchMock.getMatchList(data));
  }
  if (url.includes('/match/detail') || url.match(/\/matches\/\d+/)) {
    return successResponse(matchMock.getMatchDetail(data));
  }
  if (url.includes('/match/register')) {
    return successResponse(matchMock.registerMatch(data));
  }
  if (url.includes('/match/create')) {
    return successResponse(matchMock.createMatch(data));
  }
  if (url.includes('/match/record') || url.includes('/match/submit')) {
    return successResponse(matchMock.submitMatchRecord(data));
  }

  // ========== 队伍相关 ==========
  if (url.includes('/team/list') || url.includes('/teams')) {
    return successResponse(teamMock.getTeamList(data));
  }
  if (url.includes('/team/detail') || url.match(/\/teams\/\d+/)) {
    return successResponse(teamMock.getTeamDetail(data));
  }
  if (url.includes('/team/members')) {
    return successResponse(teamMock.getTeamMembers(data));
  }

  // ========== 统计相关 ==========
  if (url.includes('/stats/overview')) {
    return successResponse(statsMock.getStatsOverview(data));
  }
  if (url.includes('/stats/ranking')) {
    return successResponse(statsMock.getRankingList(data));
  }
  if (url.includes('/stats/player')) {
    return successResponse(statsMock.getPlayerStats(data));
  }
  if (url.includes('/stats/achievements')) {
    return successResponse(statsMock.getAchievements(data));
  }

  // ========== 赛季相关 ==========
  if (url.includes('/season/list') || url.includes('/seasons')) {
    return successResponse(seasonMock.getSeasonList(data));
  }
  if (url.includes('/season/current')) {
    return successResponse(seasonMock.getCurrentSeason(data));
  }
  if (url.includes('/season/detail') || url.match(/\/season\/[a-zA-Z0-9-]+$/)) {
    return successResponse(seasonMock.getDetail(data));
  }
  if (url.includes('/season/statistics')) {
    return successResponse(seasonMock.getStatistics(data));
  }
  if (url.includes('/season/complete')) {
    return successResponse(seasonMock.complete(data));
  }

  // 未匹配的接口
  console.warn(`[Mock] 未找到匹配的Mock数据: ${url}`);
  return errorResponse('接口未实现Mock数据');
}

module.exports = {
  getMockResponse
};
