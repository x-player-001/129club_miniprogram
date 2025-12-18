// 分享配置管理页面
const app = getApp();
const shareConfigAPI = require('../../../api/share-config.js');
const { uploadFile } = require('../../../utils/request.js');
const config = require('../../../utils/config.js');

Page({
  data: {
    // 当前配置
    currentConfig: null,
    // 历史配置列表
    historyList: [],
    // 编辑中的配置
    editConfig: {
      title: '',
      imageUrl: ''
    },
    // 预览图片（本地临时路径）
    previewImage: '',
    // 预览标题（替换占位符后的标题）
    previewTitle: '129俱乐部比赛报名',
    // 是否正在加载
    loading: true,
    // 是否正在提交
    submitting: false,
    // 图片URL
    images: {
      defaultShare: config.getStaticUrl('/share_images/registration.png', 'shareImages')
    },
    // 模拟数据（用于预览占位符替换效果）
    mockData: {
      matchTitle: '周末友谊赛',
      totalRegistered: 16
    },
    // 默认配置模板
    defaultConfig: {
      title: '⚽ {matchTitle} | 已集结{totalRegistered}人，快来报名！',
      imageUrl: ''
    }
  },

  onLoad() {
    // 检查权限
    this.checkPermission();
    // 加载数据
    this.loadData();
  },

  onPullDownRefresh() {
    this.loadData().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 检查权限
  checkPermission() {
    const userInfo = app.globalData.userInfo;
    if (!userInfo || userInfo.role !== 'super_admin') {
      wx.showModal({
        title: '无权限',
        content: '仅超级管理员可访问此页面',
        showCancel: false,
        success: () => {
          wx.navigateBack();
        }
      });
    }
  },

  // 加载数据
  loadData() {
    this.setData({ loading: true });

    const { defaultConfig } = this.data;

    return Promise.all([
      shareConfigAPI.getActiveConfig(),
      shareConfigAPI.getHistory()
    ]).then(([activeRes, historyRes]) => {
      const currentConfig = activeRes.data || null;
      const historyList = historyRes.data || [];

      // 如果有当前配置，填充到编辑区；否则使用默认配置
      const editConfig = currentConfig ? {
        title: currentConfig.title || '',
        imageUrl: currentConfig.imageUrl || ''
      } : {
        title: defaultConfig.title,
        imageUrl: defaultConfig.imageUrl
      };

      this.setData({
        currentConfig,
        historyList,
        editConfig,
        previewImage: currentConfig?.imageUrl || '',
        loading: false
      });

      // 更新预览标题
      this.updatePreviewTitle(editConfig.title);
    }).catch(err => {
      console.error('加载分享配置失败:', err);
      // 加载失败时也使用默认配置
      this.setData({
        loading: false,
        editConfig: {
          title: defaultConfig.title,
          imageUrl: defaultConfig.imageUrl
        }
      });
      this.updatePreviewTitle(defaultConfig.title);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    });
  },

  // 输入标题
  onTitleInput(e) {
    const title = e.detail.value;
    this.setData({
      'editConfig.title': title
    });
    this.updatePreviewTitle(title);
  },

  // 更新预览标题（替换占位符）
  updatePreviewTitle(title) {
    if (!title) {
      this.setData({ previewTitle: '129俱乐部比赛报名' });
      return;
    }

    const { mockData } = this.data;
    let previewTitle = title
      .replace(/\{matchTitle\}/g, mockData.matchTitle)
      .replace(/\{totalRegistered\}/g, mockData.totalRegistered);

    this.setData({ previewTitle });
  },

  // 插入占位符
  onInsertPlaceholder(e) {
    const placeholder = e.currentTarget.dataset.placeholder;
    const currentTitle = this.data.editConfig.title || '';
    const newTitle = currentTitle + placeholder;

    this.setData({
      'editConfig.title': newTitle
    });
    this.updatePreviewTitle(newTitle);

    wx.showToast({
      title: '已插入',
      icon: 'none',
      duration: 1000
    });
  },

  // 从相册选择图片
  chooseFromAlbum() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        this.setData({
          previewImage: tempFilePath
        });

        // 上传图片
        wx.showLoading({
          title: '上传中...',
          mask: true
        });

        uploadFile('/upload/photo', tempFilePath, 'photo', { category: 'share_images' })
          .then(uploadRes => {
            wx.hideLoading();
            if (uploadRes.data && uploadRes.data.url) {
              // 服务器返回的是相对路径 /share_images/2025/12/xxx.png，需要转换为完整URL
              const imageUrl = config.getStaticUrl(uploadRes.data.url, 'shareImages');
              this.setData({
                'editConfig.imageUrl': imageUrl,
                previewImage: imageUrl
              });
              wx.showToast({
                title: '图片上传成功',
                icon: 'success'
              });
            }
          })
          .catch(err => {
            wx.hideLoading();
            console.error('上传图片失败:', err);
            wx.showToast({
              title: '上传失败',
              icon: 'none'
            });
            // 清除预览
            this.setData({
              previewImage: this.data.editConfig.imageUrl || ''
            });
          });
      }
    });
  },

  // 删除图片
  onDeleteImage() {
    this.setData({
      'editConfig.imageUrl': '',
      previewImage: ''
    });
  },

  // 预览图片
  onPreviewImage() {
    const url = this.data.previewImage;
    if (url) {
      wx.previewImage({
        urls: [url],
        current: url
      });
    }
  },

  // 提交配置
  onSubmit() {
    const { editConfig } = this.data;

    // 验证：标题和图片至少填一项
    if (!editConfig.title && !editConfig.imageUrl) {
      wx.showToast({
        title: '请填写标题或上传图片',
        icon: 'none'
      });
      return;
    }

    wx.showModal({
      title: '确认保存',
      content: '保存后将立即生效，原配置将被覆盖',
      success: (res) => {
        if (res.confirm) {
          this.doSubmit();
        }
      }
    });
  },

  // 执行提交
  doSubmit() {
    const { editConfig } = this.data;

    this.setData({ submitting: true });
    wx.showLoading({
      title: '保存中...',
      mask: true
    });

    // 构建提交数据（只提交非空字段）
    const submitData = {};
    if (editConfig.title) {
      submitData.title = editConfig.title;
    }
    if (editConfig.imageUrl) {
      submitData.imageUrl = editConfig.imageUrl;
    }

    shareConfigAPI.createConfig(submitData)
      .then(res => {
        wx.hideLoading();
        this.setData({ submitting: false });

        wx.showToast({
          title: '保存成功',
          icon: 'success'
        });

        // 刷新数据
        this.loadData();
      })
      .catch(err => {
        wx.hideLoading();
        this.setData({ submitting: false });
        console.error('保存分享配置失败:', err);
        wx.showToast({
          title: err.message || '保存失败',
          icon: 'none'
        });
      });
  },

  // 恢复历史配置
  onRestoreHistory(e) {
    const index = e.currentTarget.dataset.index;
    const historyItem = this.data.historyList[index];

    if (!historyItem) return;

    wx.showModal({
      title: '恢复配置',
      content: `确定要恢复这个配置吗？\n标题：${historyItem.title || '（无）'}`,
      success: (res) => {
        if (res.confirm) {
          this.setData({
            'editConfig.title': historyItem.title || '',
            'editConfig.imageUrl': historyItem.imageUrl || '',
            previewImage: historyItem.imageUrl || ''
          });
          this.updatePreviewTitle(historyItem.title || '');

          wx.showToast({
            title: '已恢复，请保存',
            icon: 'none'
          });
        }
      }
    });
  },

  // 重置为默认
  onResetDefault() {
    const { defaultConfig } = this.data;

    wx.showModal({
      title: '重置为默认',
      content: '将恢复为系统默认的分享配置',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            'editConfig.title': defaultConfig.title,
            'editConfig.imageUrl': defaultConfig.imageUrl,
            previewImage: defaultConfig.imageUrl || ''
          });
          this.updatePreviewTitle(defaultConfig.title);

          wx.showToast({
            title: '已重置，请保存',
            icon: 'none'
          });
        }
      }
    });
  }
});
