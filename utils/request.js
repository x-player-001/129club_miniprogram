// 网络请求封装

/**
 * 发起网络请求
 * @param {Object} options 请求配置
 */
function request(options) {
  const { url, method = 'GET', data = {}, header = {} } = options;

  return new Promise((resolve, reject) => {
    // 获取app实例（在函数内部获取，避免循环依赖）
    const app = getApp();

    // 获取token
    const token = wx.getStorageSync('token');

    // 构建完整URL
    const fullUrl = url.startsWith('http') ? url : `${app.globalData.apiBaseUrl}${url}`;

    // 发起请求
    wx.request({
      url: fullUrl,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...header
      },
      success: (res) => {
        if (res.statusCode === 200) {
          // 请求成功
          if (res.data.code === 0 || res.data.success) {
            resolve(res.data);
          } else {
            // 业务错误
            wx.showToast({
              title: res.data.message || '请求失败',
              icon: 'none'
            });
            reject(res.data);
          }
        } else if (res.statusCode === 401) {
          // 未授权，跳转登录
          wx.showToast({
            title: '请先登录',
            icon: 'none'
          });
          setTimeout(() => {
            wx.navigateTo({
              url: '/pages/user/login/login'
            });
          }, 1500);
          reject(res);
        } else {
          // 其他错误
          wx.showToast({
            title: '请求失败',
            icon: 'none'
          });
          reject(res);
        }
      },
      fail: (err) => {
        // 网络错误
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        });
        reject(err);
      }
    });
  });
}

/**
 * GET请求
 */
function get(url, data = {}, header = {}) {
  return request({ url, method: 'GET', data, header });
}

/**
 * POST请求
 */
function post(url, data = {}, header = {}) {
  return request({ url, method: 'POST', data, header });
}

/**
 * PUT请求
 */
function put(url, data = {}, header = {}) {
  return request({ url, method: 'PUT', data, header });
}

/**
 * DELETE请求
 */
function del(url, data = {}, header = {}) {
  return request({ url, method: 'DELETE', data, header });
}

/**
 * 上传文件
 * @param {string} url - 上传接口路径
 * @param {string} filePath - 本地文件路径
 * @param {string} name - 文件对应的 key
 * @param {Object} formData - 额外的表单数据
 */
function uploadFile(url, filePath, name = 'file', formData = {}) {
  return new Promise((resolve, reject) => {
    // 获取app实例
    const app = getApp();
    const token = wx.getStorageSync('token');

    // 构建完整URL
    const fullUrl = url.startsWith('http') ? url : `${app.globalData.apiBaseUrl}${url}`;

    wx.uploadFile({
      url: fullUrl,
      filePath,
      name: name,
      formData,
      header: {
        'Authorization': token ? `Bearer ${token}` : ''
      },
      success: (res) => {
        if (res.statusCode === 200) {
          const data = JSON.parse(res.data);
          if (data.code === 0 || data.success) {
            resolve(data);
          } else {
            wx.showToast({
              title: data.message || '上传失败',
              icon: 'none'
            });
            reject(data);
          }
        } else if (res.statusCode === 401) {
          wx.showToast({
            title: '请先登录',
            icon: 'none'
          });
          reject(res);
        } else {
          wx.showToast({
            title: '上传失败',
            icon: 'none'
          });
          reject(res);
        }
      },
      fail: (err) => {
        wx.showToast({
          title: '上传失败',
          icon: 'none'
        });
        reject(err);
      }
    });
  });
}

module.exports = {
  request,
  get,
  post,
  put,
  del,
  uploadFile
};
