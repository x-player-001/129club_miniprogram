// components/position-tag/position-tag.js
Component({
  properties: {
    // 位置code，可以是单个或多个（逗号分隔），如：LB 或 LB,CAM,RW
    code: {
      type: String,
      value: ''
    },
    // 位置名称，如：左后卫
    name: {
      type: String,
      value: ''
    },
    // 显示模式：code（只显示code）, name（只显示名称）, both（都显示）
    mode: {
      type: String,
      value: 'code'
    },
    // 尺寸：small, medium, large
    size: {
      type: String,
      value: 'medium'
    }
  },

  data: {
    positionTags: [] // [{code: 'LB', bgColor: '#1e4ca8'}, ...]
  },

  lifetimes: {
    attached() {
      this.parsePositions();
    }
  },

  observers: {
    'code': function(newCode) {
      this.parsePositions();
    }
  },

  methods: {
    // 解析位置代码（处理逗号分隔的多个位置）
    parsePositions() {
      const code = this.data.code;
      if (!code) {
        this.setData({ positionTags: [] });
        return;
      }

      // 分割位置代码
      const codes = code.split(',').map(c => c.trim()).filter(c => c);

      // 为每个位置代码设置颜色
      const positionTags = codes.map(c => ({
        code: c,
        bgColor: this.getPositionColor(c)
      }));

      this.setData({ positionTags });
    },

    // 根据位置code获取背景色
    getPositionColor(code) {
      let bgColor = '#95a5a6'; // 默认灰色

      // 根据位置类别设置不同颜色
      if (code === 'GK') {
        // 守门员 - 黄色
        bgColor = '#cda20b';
      } else if (['DF', 'CB', 'LCB', 'RCB', 'LB', 'RB', 'LWB', 'RWB', 'SW'].includes(code)) {
        // 后卫 - 蓝色
        bgColor = '#1e4ca8';
      } else if (['MF', 'CDM', 'CM', 'CAM', 'LM', 'RM'].includes(code)) {
        // 中场 - 绿色
        bgColor = '#41a01c';
      } else if (['FW', 'LW', 'RW', 'CF', 'ST', 'LF', 'RF', 'SS'].includes(code)) {
        // 前锋 - 红色
        bgColor = '#af1616';
      }

      return bgColor;
    },

    // 点击事件
    onTap() {
      this.triggerEvent('tap', {
        code: this.data.code,
        name: this.data.name
      });
    }
  }
});
