// 缓存工具函数
const CACHE_DURATION = {
  PLAYERS: 10 * 60 * 1000,      // 球员列表：10分钟
  MATCHES: 2 * 60 * 1000,        // 比赛列表：2分钟
  USER_INFO: 24 * 60 * 60 * 1000 // 用户信息：24小时
};

/**
 * 获取缓存数据
 * @param {String} key 缓存键
 * @param {Number} duration 有效期（毫秒）
 */
function getCachedData(key, duration = CACHE_DURATION.PLAYERS) {
  try {
    const cached = wx.getStorageSync(key);
    const timestamp = wx.getStorageSync(`${key}_timestamp`);

    if (cached && timestamp) {
      const age = Date.now() - timestamp;
      if (age < duration) {
        console.log(`[Cache Hit] ${key}, age: ${Math.floor(age / 1000)}s`);
        return cached;
      } else {
        console.log(`[Cache Expired] ${key}, age: ${Math.floor(age / 1000)}s`);
      }
    }
  } catch (err) {
    console.error(`[Cache Error] 读取缓存失败 ${key}:`, err);
  }

  return null;
}

/**
 * 设置缓存数据
 * @param {String} key 缓存键
 * @param {Any} data 缓存数据
 */
function setCachedData(key, data) {
  try {
    wx.setStorageSync(key, data);
    wx.setStorageSync(`${key}_timestamp`, Date.now());
    console.log(`[Cache Set] ${key}`);
  } catch (err) {
    console.error(`[Cache Error] 写入缓存失败 ${key}:`, err);
  }
}

/**
 * 清除缓存数据
 * @param {String} key 缓存键
 */
function clearCachedData(key) {
  try {
    wx.removeStorageSync(key);
    wx.removeStorageSync(`${key}_timestamp`);
    console.log(`[Cache Clear] ${key}`);
  } catch (err) {
    console.error(`[Cache Error] 清除缓存失败 ${key}:`, err);
  }
}

/**
 * 清除所有缓存
 */
function clearAllCache() {
  try {
    wx.clearStorageSync();
    console.log(`[Cache Clear] 所有缓存已清除`);
  } catch (err) {
    console.error(`[Cache Error] 清除所有缓存失败:`, err);
  }
}

/**
 * 获取球员列表缓存
 */
function getCachedPlayers() {
  return getCachedData('all_players', CACHE_DURATION.PLAYERS);
}

/**
 * 设置球员列表缓存
 */
function setCachedPlayers(players) {
  setCachedData('all_players', players);
}

/**
 * 清除球员列表缓存
 */
function clearCachedPlayers() {
  clearCachedData('all_players');
}

module.exports = {
  CACHE_DURATION,
  getCachedData,
  setCachedData,
  clearCachedData,
  clearAllCache,
  getCachedPlayers,
  setCachedPlayers,
  clearCachedPlayers
};
