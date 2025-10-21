/**
 * 工具函数库
 */

/**
 * 格式化时间
 * @param {Date} date 日期对象
 * @param {String} format 格式化字符串
 */
function formatTime(date, format = 'YYYY-MM-DD HH:mm:ss') {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();

  return format
    .replace('YYYY', year)
    .replace('MM', padZero(month))
    .replace('DD', padZero(day))
    .replace('HH', padZero(hour))
    .replace('mm', padZero(minute))
    .replace('ss', padZero(second));
}

/**
 * 补零
 */
function padZero(num) {
  return num < 10 ? `0${num}` : num;
}

/**
 * 格式化日期为相对时间
 * @param {String|Date} datetime 日期时间
 */
function formatRelativeTime(datetime) {
  const date = new Date(datetime);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) {
    return '刚刚';
  } else if (diff < hour) {
    return `${Math.floor(diff / minute)}分钟前`;
  } else if (diff < day) {
    return `${Math.floor(diff / hour)}小时前`;
  } else if (diff < 7 * day) {
    return `${Math.floor(diff / day)}天前`;
  } else {
    return formatTime(date, 'MM-DD HH:mm');
  }
}

/**
 * 防抖函数
 * @param {Function} fn 要执行的函数
 * @param {Number} delay 延迟时间
 */
function debounce(fn, delay = 500) {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

/**
 * 节流函数
 * @param {Function} fn 要执行的函数
 * @param {Number} interval 间隔时间
 */
function throttle(fn, interval = 500) {
  let lastTime = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastTime >= interval) {
      lastTime = now;
      fn.apply(this, args);
    }
  };
}

/**
 * 深拷贝
 * @param {*} obj 要拷贝的对象
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof Array) return obj.map(item => deepClone(item));

  const cloneObj = {};
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloneObj[key] = deepClone(obj[key]);
    }
  }
  return cloneObj;
}

/**
 * 显示加载提示
 * @param {String} title 提示文字
 */
function showLoading(title = '加载中...') {
  wx.showLoading({
    title,
    mask: true
  });
}

/**
 * 隐藏加载提示
 */
function hideLoading() {
  wx.hideLoading();
}

/**
 * 显示Toast提示
 * @param {String} title 提示文字
 * @param {String} icon 图标类型
 */
function showToast(title, icon = 'none') {
  wx.showToast({
    title,
    icon,
    duration: 2000
  });
}

/**
 * 显示确认对话框
 * @param {String} content 内容
 * @param {String} title 标题
 */
function showConfirm(content, title = '提示') {
  return new Promise((resolve, reject) => {
    wx.showModal({
      title,
      content,
      success: (res) => {
        if (res.confirm) {
          resolve();
        } else {
          reject();
        }
      }
    });
  });
}

/**
 * 计算胜率
 * @param {Number} wins 胜场
 * @param {Number} total 总场次
 */
function calculateWinRate(wins, total) {
  if (total === 0) return '0%';
  return `${((wins / total) * 100).toFixed(1)}%`;
}

/**
 * 获取位置名称
 * @param {String} position 位置代码
 */
function getPositionName(position) {
  const positionMap = {
    'GK': '守门员',
    'DF': '后卫',
    'MF': '中场',
    'FW': '前锋'
  };
  return positionMap[position] || position;
}

/**
 * 获取比赛状态文本
 * @param {String} status 状态代码
 */
function getMatchStatusText(status) {
  const statusMap = {
    'upcoming': '未开始',
    'ongoing': '进行中',
    'finished': '已结束',
    'cancelled': '已取消'
  };
  return statusMap[status] || status;
}

/**
 * 获取比赛类型文本
 * @param {String} type 类型代码
 */
function getMatchTypeText(type) {
  const typeMap = {
    'internal_match': '队内对抗',
    'friendly': '友谊赛',
    'league': '联赛',
    'cup': '杯赛'
  };
  return typeMap[type] || type;
}

/**
 * 验证手机号
 * @param {String} phone 手机号
 */
function validatePhone(phone) {
  return /^1[3-9]\d{9}$/.test(phone);
}

/**
 * 选择图片
 * @param {Number} count 最大选择数量
 */
function chooseImage(count = 1) {
  return new Promise((resolve, reject) => {
    wx.chooseImage({
      count,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        resolve(res.tempFilePaths);
      },
      fail: reject
    });
  });
}

/**
 * 获取用户授权
 * @param {String} scope 授权范围
 */
function authorize(scope) {
  return new Promise((resolve, reject) => {
    wx.authorize({
      scope,
      success: resolve,
      fail: reject
    });
  });
}

module.exports = {
  formatTime,
  formatRelativeTime,
  debounce,
  throttle,
  deepClone,
  showLoading,
  hideLoading,
  showToast,
  showConfirm,
  calculateWinRate,
  getPositionName,
  getMatchStatusText,
  getMatchTypeText,
  validatePhone,
  chooseImage,
  authorize
};
