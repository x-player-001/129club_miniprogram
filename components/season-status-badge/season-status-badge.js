// components/season-status-badge/season-status-badge.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    status: {
      type: String,
      value: 'upcoming'
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    statusText: ''
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 根据状态获取显示文本
    getStatusText(status) {
      const statusMap = {
        'upcoming': '即将开始',
        'active': '进行中',
        'completed': '已完成',
        'archived': '已归档'
      };
      return statusMap[status] || '未知';
    }
  },

  /**
   * 生命周期函数
   */
  lifetimes: {
    attached() {
      this.setData({
        statusText: this.getStatusText(this.data.status)
      });
    }
  },

  /**
   * 监听属性变化
   */
  observers: {
    'status': function(newStatus) {
      this.setData({
        statusText: this.getStatusText(newStatus)
      });
    }
  }
});
