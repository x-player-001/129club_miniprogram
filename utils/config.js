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
    // baseUrl: 'http://106.53.217.216:3000/api',
    // baseUrl: 'http://localhost:3000/api',
    baseUrl: 'https://api.129club.cloud/api',
    timeout: 10000
  },
  // 生产环境（需要HTTPS + 已备案域名）
  prod: {
    baseUrl: 'https://api.129club.cloud/api',
    timeout: 10000
  }
};

// ========== 静态资源配置 ==========
const STATIC_RESOURCE_CONFIG = {
  // 静态资源服务器基础URL
  baseUrl: 'https://api.129club.cloud',

  // 资源路径
  paths: {
    images: '/images',
    icons: '/icons',
    shareImages: '/share_images',
    teamLogos: '/images',
    matchPhotos: '/match_photos',
    avatars: '/avatars',
    defaultTeamLogo: '/images/default-team.png',
    defaultAvatar: '/images/default-avatar.png'
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
  },

  // 静态资源URL配置
  staticResourceBaseUrl: STATIC_RESOURCE_CONFIG.baseUrl,
  staticResourcePaths: STATIC_RESOURCE_CONFIG.paths,

  /**
   * 获取完整的静态资源URL
   * @param {string} path - 资源路径（如 '/images/logo.png' 或 'logo.png'）
   * @param {string} type - 资源类型（'images', 'icons', 'shareImages', 'teamLogos'），默认 'images'
   * @returns {string} 完整的URL
   */
  getStaticUrl(path, type = 'images') {
    if (!path) {
      // 返回默认资源
      if (type === 'teamLogos') {
        return `${STATIC_RESOURCE_CONFIG.baseUrl}${STATIC_RESOURCE_CONFIG.paths.defaultTeamLogo}`;
      }
      if (type === 'avatars' || type === 'avatar') {
        return `${STATIC_RESOURCE_CONFIG.baseUrl}${STATIC_RESOURCE_CONFIG.paths.defaultAvatar}`;
      }
      return '';
    }

    // 如果已经是完整的URL且包含当前服务器地址，直接返回
    if (path.startsWith('http') && path.includes(STATIC_RESOURCE_CONFIG.baseUrl)) {
      return path;
    }

    // 如果是本地静态资源路径，替换为服务器路径
    if (path.startsWith('/static/icons/')) {
      const filename = path.replace('/static/icons/', '');
      return `${STATIC_RESOURCE_CONFIG.baseUrl}/icons/${filename}`;
    }
    if (path.startsWith('/static/images/')) {
      const filename = path.replace('/static/images/', '');
      return `${STATIC_RESOURCE_CONFIG.baseUrl}/images/${filename}`;
    }

    // 如果是完整的HTTP(S) URL（其他服务器），提取路径部分并使用当前服务器
    if (path.startsWith('http://') || path.startsWith('https://')) {
      try {
        const urlObj = new URL(path);
        // 只保留路径部分，使用当前服务器的baseUrl
        return `${STATIC_RESOURCE_CONFIG.baseUrl}${urlObj.pathname}`;
      } catch (e) {
        console.error('[Config] URL解析失败:', path, e);
        // URL解析失败，返回默认
        if (type === 'teamLogos') {
          return `${STATIC_RESOURCE_CONFIG.baseUrl}${STATIC_RESOURCE_CONFIG.paths.defaultTeamLogo}`;
        }
        if (type === 'avatars' || type === 'avatar') {
          return `${STATIC_RESOURCE_CONFIG.baseUrl}${STATIC_RESOURCE_CONFIG.paths.defaultAvatar}`;
        }
        return '';
      }
    }

    // 如果是相对路径（如 '/match_photos/xxx.png' 或 '/avatars/1.png'）
    // 确保路径以 / 开头，然后拼接
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${STATIC_RESOURCE_CONFIG.baseUrl}${normalizedPath}`;
  },

  /**
   * 获取图标URL（便捷方法）
   * @param {string} iconName - 图标文件名（如 'arrow-right.png' 或 '/static/icons/arrow-right.png'）
   * @returns {string} 完整的图标URL
   */
  getIconUrl(iconName) {
    if (!iconName) return '';
    // 如果已经是完整路径，使用 getStaticUrl 处理
    if (iconName.startsWith('/') || iconName.startsWith('http')) {
      return this.getStaticUrl(iconName, 'icons');
    }
    // 否则直接拼接
    return `${STATIC_RESOURCE_CONFIG.baseUrl}/icons/${iconName}`;
  },

  /**
   * 获取图片URL（便捷方法）
   * @param {string} imageName - 图片文件名（如 'logo.png' 或 '/static/images/logo.png'）
   * @returns {string} 完整的图片URL
   */
  getImageUrl(imageName) {
    if (!imageName) return '';
    // 如果已经是完整路径，使用 getStaticUrl 处理
    if (imageName.startsWith('/') || imageName.startsWith('http')) {
      return this.getStaticUrl(imageName, 'images');
    }
    // 否则直接拼接
    return `${STATIC_RESOURCE_CONFIG.baseUrl}/images/${imageName}`;
  }
};
