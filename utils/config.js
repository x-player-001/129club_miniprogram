/**
 * 全局配置文件
 *
 * ⚙️ 一键切换 Mock 和 API 模式
 *
 * 使用场景：
 * - 开发环境：可以选择 Mock 或 API
 * - 体验版：必须使用 Mock（因为没有配置合法域名）
 * - 正式版：使用 API（需要配置HTTPS域名）
 */

// ========== 关键配置：一键切换 ==========
const USE_MOCK = false; // ✅ true = Mock模式  ❌ false = API模式

// ========== API 配置 ==========
const API_CONFIG = {
  // 开发环境
  dev: {
    // baseUrl: 'http://api.129club.cloud:3000/api',
    baseUrl: 'http://106.53.217.216:3000/api',
    // baseUrl: 'http://localhost:3000/api',
    // baseUrl: 'https://api.129club.cloud/api',
    timeout: 10000
  },
  // 生产环境（需要HTTPS + 已备案域名）
  prod: {
    baseUrl: 'https://api.129club.cloud/api',
    timeout: 10000
  }
};

// ========== 环境判断 ==========
// 根据不同环境自动选择配置
const ENV = 'dev'; // 'dev' | 'prod'

// ========== 导出配置 ==========
module.exports = {
  // 是否使用Mock数据
  useMock: USE_MOCK,

  // API基础URL（仅在非Mock模式下使用）
  apiBaseUrl: API_CONFIG[ENV].baseUrl,

  // 请求超时时间
  timeout: API_CONFIG[ENV].timeout,

  // 当前环境
  env: ENV,

  // 版本号
  version: '1.0.0',

  // 主题色
  themeColor: '#f20810',

  // 日志开关
  enableLog: true,

  // 缓存时长配置（毫秒）
  cacheDuration: {
    players: 10 * 60 * 1000,  // 球员列表：10分钟
    season: 5 * 60 * 1000,    // 赛季信息：5分钟
    matches: 2 * 60 * 1000,   // 比赛列表：2分钟
    stats: 5 * 60 * 1000      // 统计数据：5分钟
  }
};
