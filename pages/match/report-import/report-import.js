// pages/match/report-import/report-import.js
const app = getApp();
const matchAPI = require('../../../api/match');

Page({
  data: {
    // 当前步骤: 1=输入简报, 2=解析结果预览
    currentStep: 1,

    // 简报文本
    reportText: '',

    // 解析状态
    isParsing: false,
    parseMethod: '', // AI 或 Regex
    parseProgress: 0, // 解析进度 0-100
    parseMessage: '', // 解析进度消息

    // 解析结果
    parsed: null,
    matched: null,
    warnings: [],

    // 轮询相关
    pollTimer: null, // 轮询定时器
    taskId: null, // 任务ID

    // 示例文本
    exampleText: `嘉陵摩托（红）VS 长江（花）
星期六2025.10.12，轨道集团
比分:3:0

到场人员：
花：待补充
红： 黄波 施毅 洪胜 王鑫 木头

第一节
第一节嘉陵江边后卫小刘远射破门...

第二节
第二节川哥、二筒上场...

第三节
第三节川哥继续冲刺...

第四节
第四节决战，最终红队3:0获胜。

数据：
银河 1助2裁
洪胜 4球2助
永健 1裁3门

MVP:洪胜 施毅 小黑 曹枫`,

    // 提交状态
    isSubmitting: false
  },

  onLoad(options) {
    console.log('[简报录入] 页面加载');
  },

  onUnload() {
    // 页面卸载时清除定时器
    if (this.data.pollTimer) {
      clearInterval(this.data.pollTimer);
      console.log('[简报录入] 清除轮询定时器');
    }
  },

  // 简报文本输入
  onReportInput(e) {
    this.setData({
      reportText: e.detail.value
    });
  },

  // 使用示例文本
  onUseExample() {
    this.setData({
      reportText: this.data.exampleText
    });
    wx.showToast({
      title: '已填入示例',
      icon: 'success'
    });
  },

  // 清空文本
  onClearText() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空已输入的文本吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            reportText: '',
            parsed: null,
            warnings: [],
            currentStep: 1
          });
        }
      }
    });
  },

  // AI解析简报
  async onParseReport() {
    const { reportText } = this.data;

    if (!reportText || reportText.trim().length === 0) {
      wx.showToast({
        title: '请输入比赛简报',
        icon: 'none'
      });
      return;
    }

    this.setData({
      isParsing: true,
      parseProgress: 0,
      parseMessage: '提交解析任务...'
    });

    try {
      console.log('[简报解析] 开始解析，文本长度:', reportText.length);

      // 1. 提交解析任务
      const res = await matchAPI.parseReport({
        reportText: reportText.trim(),
        autoCreate: false, // 仅解析，不自动创建
        useAI: true,
        fallbackToRegex: true
      });

      const { taskId, status, message } = res.data;

      console.log('[简报解析] 任务已创建:', taskId, status);

      // 保存任务ID
      this.setData({
        taskId,
        parseMessage: message || '正在解析...'
      });

      // 2. 开始轮询任务状态
      this.startPolling(taskId);

    } catch (err) {
      console.error('[简报解析] 提交任务失败:', err);
      this.setData({ isParsing: false });

      wx.showModal({
        title: '解析失败',
        content: err.message || '提交解析任务失败，请检查后重试',
        showCancel: false
      });
    }
  },

  // 开始轮询任务状态
  startPolling(taskId) {
    console.log('[简报解析] 开始轮询任务状态');

    // 清除旧的定时器
    if (this.data.pollTimer) {
      clearInterval(this.data.pollTimer);
    }

    // 每2秒轮询一次
    const pollTimer = setInterval(async () => {
      try {
        const res = await matchAPI.getParseTaskStatus(taskId);
        const task = res.data;

        console.log('[简报解析] 任务状态:', task.status, task.progress, task.progressMessage);

        // 更新进度
        this.setData({
          parseProgress: task.progress || 0,
          parseMessage: task.progressMessage || '正在解析...'
        });

        // 任务完成
        if (task.status === 'completed') {
          clearInterval(this.data.pollTimer);
          this.handleParseSuccess(task.result);
        }

        // 任务失败
        if (task.status === 'failed') {
          clearInterval(this.data.pollTimer);
          this.handleParseFailed(task.error);
        }

      } catch (err) {
        console.error('[简报解析] 查询任务状态失败:', err);
        clearInterval(this.data.pollTimer);
        this.handleParseFailed(err.message || '查询任务状态失败');
      }
    }, 2000); // 每2秒轮询一次

    this.setData({ pollTimer });
  },

  // 处理解析成功
  handleParseSuccess(result) {
    console.log('[简报解析] 解析成功:', result);

    const { parsed, matched, warnings } = result;

    this.setData({
      parsed,
      matched,
      warnings: warnings || [],
      parseMethod: parsed.parseMethod || 'Unknown',
      currentStep: 2,
      isParsing: false,
      parseProgress: 100,
      parseMessage: '解析完成'
    });

    wx.showToast({
      title: `${parsed.parseMethod}解析成功`,
      icon: 'success'
    });
  },

  // 处理解析失败
  handleParseFailed(errorMessage) {
    console.error('[简报解析] 解析失败:', errorMessage);

    this.setData({
      isParsing: false,
      parseProgress: 0,
      parseMessage: ''
    });

    wx.showModal({
      title: '解析失败',
      content: errorMessage || '简报格式可能有误，请检查后重试',
      showCancel: false
    });
  },

  // 返回修改简报
  onBackToEdit() {
    // 清除定时器
    if (this.data.pollTimer) {
      clearInterval(this.data.pollTimer);
    }

    this.setData({
      currentStep: 1,
      parsed: null,
      warnings: [],
      parseProgress: 0,
      parseMessage: '',
      isParsing: false,
      pollTimer: null,
      taskId: null
    });
  },

  // 确认导入
  async onConfirmImport() {
    const { parsed, reportText } = this.data;

    if (!parsed) {
      wx.showToast({
        title: '请先解析简报',
        icon: 'none'
      });
      return;
    }

    wx.showModal({
      title: '确认导入',
      content: '确定要根据解析结果创建比赛记录吗？',
      success: async (res) => {
        if (res.confirm) {
          await this.createMatchFromParsed();
        }
      }
    });
  },

  // 根据解析结果创建比赛
  async createMatchFromParsed() {
    this.setData({ isSubmitting: true });
    wx.showLoading({ title: '创建中...' });

    try {
      // 重新调用解析接口，这次设置 autoCreate: true
      const res = await matchAPI.parseReport({
        reportText: this.data.reportText.trim(),
        autoCreate: true,
        useAI: false, // 不重复调用AI，使用之前的解析结果
        fallbackToRegex: false
      });

      console.log('[简报导入] 创建成功:', res.data);

      wx.hideLoading();
      this.setData({ isSubmitting: false });

      wx.showToast({
        title: '导入成功',
        icon: 'success',
        duration: 2000
      });

      // 延迟跳转到比赛详情页
      setTimeout(() => {
        const matchId = res.data.matchId;
        if (matchId) {
          wx.redirectTo({
            url: `/pages/match/detail/detail?id=${matchId}`
          });
        } else {
          wx.navigateBack();
        }
      }, 2000);

    } catch (err) {
      console.error('[简报导入] 创建失败:', err);
      wx.hideLoading();
      this.setData({ isSubmitting: false });

      wx.showModal({
        title: '导入失败',
        content: err.message || '创建比赛记录失败，请稍后重试',
        showCancel: false
      });
    }
  }
});
