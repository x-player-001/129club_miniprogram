Component({
  properties: {
    // 雷达图数据
    data: {
      type: Array,
      value: [],
      observer: 'drawRadar'
    },
    // 指标名称
    indicators: {
      type: Array,
      value: []
    },
    // 主题色
    color: {
      type: String,
      value: '#f20810'
    },
    // 画布宽度
    width: {
      type: Number,
      value: 300
    },
    // 画布高度
    height: {
      type: Number,
      value: 300
    }
  },

  data: {
    canvasId: 'radar-' + Date.now()
  },

  lifetimes: {
    attached() {
      // 组件实例被放入页面节点树后执行
      this.setData({
        canvasId: 'radar-' + Date.now()
      });
    },

    ready() {
      // 组件布局完成后执行
      if (this.data.data.length > 0) {
        this.drawRadar();
      }
    }
  },

  methods: {
    drawRadar() {
      const { data, indicators, color, width, height } = this.data;

      if (!data || data.length === 0 || !indicators || indicators.length === 0) {
        return;
      }

      // 使用 Canvas 2D API
      const query = this.createSelectorQuery();
      query.select('#' + this.data.canvasId)
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res || !res[0]) {
            console.error('Canvas node not found');
            return;
          }

          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');

          // 设置画布尺寸
          const dpr = wx.getSystemInfoSync().pixelRatio;
          canvas.width = width * dpr;
          canvas.height = height * dpr;
          ctx.scale(dpr, dpr);

          // 绘制雷达图
          this._drawRadarChart(ctx, canvas, data, indicators, color, width, height);
        });
    },

    _drawRadarChart(ctx, canvas, data, indicators, color, width, height) {
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) / 2 - 40; // 留出边距显示文字
      const sides = indicators.length;

      // 清空画布
      ctx.clearRect(0, 0, width, height);

      // 绘制背景网格（5层）
      this._drawGrid(ctx, centerX, centerY, radius, sides, color);

      // 绘制数据区域
      this._drawDataArea(ctx, centerX, centerY, radius, sides, data, color);

      // 绘制指标文字
      this._drawLabels(ctx, centerX, centerY, radius, sides, indicators);

      // 绘制数据点
      this._drawDataPoints(ctx, centerX, centerY, radius, sides, data, color);
    },

    // 绘制背景网格
    _drawGrid(ctx, centerX, centerY, radius, sides, color) {
      const angle = (Math.PI * 2) / sides;

      // 绘制5层网格
      for (let level = 1; level <= 5; level++) {
        const r = (radius / 5) * level;

        ctx.beginPath();
        for (let i = 0; i <= sides; i++) {
          const x = centerX + r * Math.cos(angle * i - Math.PI / 2);
          const y = centerY + r * Math.sin(angle * i - Math.PI / 2);

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        ctx.strokeStyle = level === 5 ? 'rgba(200, 200, 200, 0.5)' : 'rgba(230, 230, 230, 0.8)';
        ctx.lineWidth = level === 5 ? 1.5 : 1;
        ctx.stroke();
      }

      // 绘制从中心到各顶点的线
      for (let i = 0; i < sides; i++) {
        const x = centerX + radius * Math.cos(angle * i - Math.PI / 2);
        const y = centerY + radius * Math.sin(angle * i - Math.PI / 2);

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.strokeStyle = 'rgba(230, 230, 230, 0.8)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    },

    // 绘制数据区域
    _drawDataArea(ctx, centerX, centerY, radius, sides, data, color) {
      const angle = (Math.PI * 2) / sides;

      ctx.beginPath();
      for (let i = 0; i <= sides; i++) {
        const value = data[i % sides] || 0;
        const r = (radius * value) / 100; // 假设数据是0-100的百分比
        const x = centerX + r * Math.cos(angle * i - Math.PI / 2);
        const y = centerY + r * Math.sin(angle * i - Math.PI / 2);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();

      // 填充区域
      ctx.fillStyle = this._hexToRgba(color, 0.2);
      ctx.fill();

      // 描边
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    },

    // 绘制指标文字
    _drawLabels(ctx, centerX, centerY, radius, sides, indicators) {
      const angle = (Math.PI * 2) / sides;
      const labelRadius = radius + 20; // 文字距离中心更远一点

      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#636e72';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (let i = 0; i < sides; i++) {
        const x = centerX + labelRadius * Math.cos(angle * i - Math.PI / 2);
        const y = centerY + labelRadius * Math.sin(angle * i - Math.PI / 2);

        // 根据位置调整文字对齐方式
        const angleVal = angle * i - Math.PI / 2;
        if (Math.abs(Math.cos(angleVal)) < 0.1) {
          // 顶部或底部
          ctx.textAlign = 'center';
        } else if (Math.cos(angleVal) > 0) {
          // 右侧
          ctx.textAlign = 'left';
        } else {
          // 左侧
          ctx.textAlign = 'right';
        }

        ctx.fillText(indicators[i] || '', x, y);
      }
    },

    // 绘制数据点
    _drawDataPoints(ctx, centerX, centerY, radius, sides, data, color) {
      const angle = (Math.PI * 2) / sides;

      for (let i = 0; i < sides; i++) {
        const value = data[i] || 0;
        const r = (radius * value) / 100;
        const x = centerX + r * Math.cos(angle * i - Math.PI / 2);
        const y = centerY + r * Math.sin(angle * i - Math.PI / 2);

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    },

    // 十六进制颜色转RGBA
    _hexToRgba(hex, alpha) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }
});
