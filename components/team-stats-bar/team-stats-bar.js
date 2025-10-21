// components/team-stats-bar/team-stats-bar.js
Component({
  properties: {
    // 战绩数据
    stats: {
      type: Object,
      value: {}
    },
    // 显示模式：full（完整版）| compact（紧凑版）
    mode: {
      type: String,
      value: 'full'
    },
    // 自定义样式类名
    customClass: {
      type: String,
      value: ''
    }
  }
});
