// api/upload.js - 文件上传相关API
const { uploadFile, postRequest } = require('./index.js');

/**
 * 上传单张照片
 * @param {string} filePath - 本地文件路径
 * @param {string} category - 照片分类（如 match_photos）
 * @returns {Promise}
 */
function uploadPhoto(filePath, category = 'match_photos') {
  return uploadFile('/upload/photo', filePath, 'photo', {
    category: category
  });
}

/**
 * 批量上传照片
 * @param {Array<string>} filePaths - 本地文件路径数组
 * @param {string} category - 照片分类
 * @returns {Promise}
 */
function uploadPhotos(filePaths, category = 'match_photos') {
  // 逐个上传，返回Promise数组
  const uploadPromises = filePaths.map(filePath => uploadPhoto(filePath, category));
  return Promise.all(uploadPromises);
}

/**
 * 上传照片并自动关联到比赛
 * @param {string} matchId - 比赛ID
 * @param {string} filePath - 本地文件路径
 * @returns {Promise}
 */
function uploadMatchPhoto(matchId, filePath) {
  return uploadFile(`/upload/match/${matchId}/photos`, filePath, 'photo');
}

/**
 * 批量上传照片并关联到比赛
 * @param {string} matchId - 比赛ID
 * @param {Array<string>} filePaths - 本地文件路径数组
 * @returns {Promise}
 */
function uploadMatchPhotos(matchId, filePaths) {
  const uploadPromises = filePaths.map(filePath => uploadMatchPhoto(matchId, filePath));
  return Promise.all(uploadPromises);
}

/**
 * 删除照片（使用POST方法）
 * @param {string} url - 照片URL
 * @returns {Promise}
 */
function deletePhoto(url) {
  return postRequest('/upload/delete-photo', { url });
}

/**
 * 上传图片（通用方法）
 * @param {string} filePath - 本地文件路径
 * @param {string} category - 图片分类（默认 images）
 * @returns {Promise}
 */
function uploadImage(filePath, category = 'images') {
  return uploadFile('/upload/photo', filePath, 'photo', {
    category: category
  });
}

module.exports = {
  uploadPhoto,
  uploadPhotos,
  uploadMatchPhoto,
  uploadMatchPhotos,
  deletePhoto,
  uploadImage
};
