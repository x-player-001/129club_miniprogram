// app.js
const userAPI = require('./api/user');
const seasonAPI = require('./api/season');
const visitAPI = require('./api/visit');
const cache = require('./utils/cache');

App({
  onLaunch() {
    console.log('129俱乐部小程序启动');
    this.getSystemInfo();
    this.checkLoginStatus();
    this.checkUpdate();

    // 延迟加载球员列表和当前赛季（等待 app 实例完全初始化）
    // 仅在已登录时才预加载（避免401错误触发重定向）
    setTimeout(() => {
      const token = wx.getStorageSync('token');
      if (token) {
        this.loadAllPlayers().catch(err => {
          console.error('[App] 预加载球员列表失败:', err);
        });
        this.loadCurrentSeason().catch(err => {
          console.error('[App] 预加载当前赛季失败:', err);
        });
      } else {
        console.log('[App] 未登录，跳过预加载');
      }
    }, 500);
  },

  // 检查登录状态
  checkLoginStatus() {
    // 从本地存储获取token
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');

    if (token && userInfo) {
      console.log('发现本地token，设置为已登录');
      this.globalData.isLogin = true;
      this.globalData.userInfo = userInfo;
    } else {
      console.log('未登录，需要调用登录流程');
      this.globalData.isLogin = false;
      this.globalData.userInfo = null;
    }
  },

  /**
   * 加载所有球员列表（全局缓存）
   * @param {Boolean} forceRefresh 是否强制刷新
   * @returns {Promise<Array>} 球员列表
   */
  async loadAllPlayers(forceRefresh = false) {
    // 1. 检查内存缓存
    if (!forceRefresh && this.globalData.allPlayers && this.globalData.playersLastUpdate) {
      const age = Date.now() - this.globalData.playersLastUpdate;
      if (age < cache.CACHE_DURATION.PLAYERS) {
        console.log('[Players] 使用内存缓存');
        return this.globalData.allPlayers;
      }
    }

    // 2. 检查本地缓存
    if (!forceRefresh) {
      const cached = cache.getCachedPlayers();
      if (cached) {
        this.globalData.allPlayers = cached;
        this.globalData.playersLastUpdate = Date.now();
        return cached;
      }
    }

    // 3. 请求API
    try {
      console.log('[Players] 从API加载');
      const res = await userAPI.getMemberList({
        status: 'active',
        pageSize: 1000
      });

      const players = res.data.list || [];

      // 4. 更新缓存
      this.globalData.allPlayers = players;
      this.globalData.playersLastUpdate = Date.now();
      cache.setCachedPlayers(players);

      console.log(`[Players] 加载成功，共 ${players.length} 人`);
      return players;
    } catch (err) {
      console.error('[Players] 加载失败:', err);

      // 失败时返回本地缓存（即使过期）或空数组
      const fallback = wx.getStorageSync('all_players') || [];
      this.globalData.allPlayers = fallback;
      return fallback;
    }
  },

  /**
   * 获取球员列表（同步方法，供页面快速获取）
   * @returns {Array} 球员列表（可能为空或过期数据）
   */
  getAllPlayers() {
    return this.globalData.allPlayers || [];
  },

  /**
   * 刷新球员列表（供下拉刷新使用）
   */
  refreshPlayers() {
    return this.loadAllPlayers(true);
  },

  /**
   * 清除球员缓存（供球员信息变更后使用）
   */
  clearPlayersCache() {
    this.globalData.allPlayers = null;
    this.globalData.playersLastUpdate = null;
    cache.clearCachedPlayers();
    console.log('[Players] 缓存已清除');
  },

  /**
   * 加载当前活跃赛季
   * @param {Boolean} forceRefresh 是否强制刷新
   * @returns {Promise<Object>} 当前赛季信息
   */
  async loadCurrentSeason(forceRefresh = false) {
    // 检查内存缓存
    if (!forceRefresh && this.globalData.currentSeason && this.globalData.seasonLastUpdate) {
      const age = Date.now() - this.globalData.seasonLastUpdate;
      if (age < 5 * 60 * 1000) { // 5分钟缓存
        console.log('[Season] 使用内存缓存');
        return this.globalData.currentSeason;
      }
    }

    // 请求API获取活跃赛季
    try {
      console.log('[Season] 从API加载当前赛季');
      const res = await seasonAPI.getList({ status: 'active', limit: 1 });

      const currentSeason = res.data.list && res.data.list.length > 0 ? res.data.list[0] : null;

      // 更新缓存
      this.globalData.currentSeason = currentSeason;
      this.globalData.seasonLastUpdate = Date.now();

      if (currentSeason) {
        console.log(`[Season] 当前赛季: ${currentSeason.name}`);
      } else {
        console.log('[Season] 没有活跃赛季');
      }

      return currentSeason;
    } catch (err) {
      console.error('[Season] 加载失败:', err);
      this.globalData.currentSeason = null;
      return null;
    }
  },

  /**
   * 获取当前赛季（同步方法）
   * @returns {Object|null} 当前赛季信息
   */
  getCurrentSeason() {
    return this.globalData.currentSeason;
  },

  /**
   * 刷新当前赛季
   */
  refreshCurrentSeason() {
    return this.loadCurrentSeason(true);
  },

  /**
   * 清除赛季缓存
   */
  clearSeasonCache() {
    this.globalData.currentSeason = null;
    this.globalData.seasonLastUpdate = null;
    console.log('[Season] 缓存已清除');
  },

  // 检查用户信息是否完整（必填字段）
  // 必填字段：nickname, realName, phone, position, jerseyNumber
  checkUserInfoComplete(userInfo) {
    if (!userInfo) {
      return false;
    }

    const requiredFields = ['nickname', 'realName', 'phone', 'position', 'jerseyNumber'];

    for (const field of requiredFields) {
      const value = userInfo[field];
      const isEmpty = !value || (typeof value === 'string' && value.trim() === '');

      if (isEmpty) {
        console.log(`用户信息不完整，缺少字段: ${field}`);
        return false;
      }
    }

    return true;
  },

  // 强制跳转到完善信息页面
  redirectToProfileEdit() {
    wx.redirectTo({
      url: '/pages/user/profile-edit/profile-edit?type=complete&required=true'
    });
  },

  // 检查并强制完善信息（供所有页面调用）
  // 如果信息不完整，自动跳转到完善信息页
  // 返回 true 表示信息完整，false 表示已跳转
  checkAndRedirectIfIncomplete() {
    const userInfo = wx.getStorageSync('userInfo');

    if (!this.checkUserInfoComplete(userInfo)) {
      console.log('[App] 检测到用户信息不完整，强制跳转完善信息页');
      this.redirectToProfileEdit();
      return false;
    }

    return true;
  },

  onShow(options) {
    console.log('小程序显示');
    this.recordVisit(options);
  },

  /**
   * 记录用户访问
   * @param {Object} options 启动参数
   */
  recordVisit(options = {}) {
    // 检查是否已登录
    const token = wx.getStorageSync('token');
    if (!token) {
      console.log('[Visit] 未登录，跳过访问记录');
      return;
    }

    // 防抖：避免快速切换导致重复记录（5分钟内只记录一次）
    const now = Date.now();
    const lastVisitTime = this.globalData.lastVisitTime || 0;
    const timeDiff = now - lastVisitTime;

    if (timeDiff < 5 * 60 * 1000) {
      console.log('[Visit] 5分钟内已记录，跳过');
      return;
    }

    // 获取系统信息
    const systemInfo = this.globalData.systemInfo || wx.getSystemInfoSync();

    // 构建访问数据
    const visitData = {
      platform: systemInfo.platform || 'unknown',
      scene: options.scene || 0,
      deviceModel: systemInfo.model || '',
      systemVersion: systemInfo.system || '',
      appVersion: systemInfo.version || ''
    };

    console.log('[Visit] 记录访问:', visitData);

    // 调用接口（静默失败，不影响用户体验）
    visitAPI.recordVisit(visitData).then(res => {
      console.log('[Visit] 记录成功:', res);
      this.globalData.lastVisitTime = now;
    }).catch(err => {
      console.error('[Visit] 记录失败（静默处理）:', err);
      // 失败也记录时间戳，避免死循环（特别是401错误会触发重新登录）
      this.globalData.lastVisitTime = now;
    });
  },

  onHide() {
    console.log('小程序隐藏');
  },

  getSystemInfo() {
    const systemInfo = wx.getSystemInfoSync();
    this.globalData.systemInfo = systemInfo;
    console.log('系统信息:', systemInfo);
  },

  checkUpdate() {
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager();
      updateManager.onCheckForUpdate((res) => {
        console.log('检查更新:', res.hasUpdate);
      });
      updateManager.onUpdateReady(() => {
        wx.showModal({
          title: '更新提示',
          content: '新版本已经准备好，是否重启应用？',
          success: (res) => {
            if (res.confirm) {
              updateManager.applyUpdate();
            }
          }
        });
      });
      updateManager.onUpdateFailed(() => {
        wx.showToast({
          title: '更新失败',
          icon: 'none'
        });
      });
    }
  },

  globalData: {
    isLogin: false,
    userInfo: null,
    systemInfo: null,
    // 球员列表全局缓存
    allPlayers: null,
    playersLastUpdate: null,
    // 当前赛季全局缓存
    currentSeason: null,
    seasonLastUpdate: null,
    // 访问记录时间戳
    lastVisitTime: null
  }
});
