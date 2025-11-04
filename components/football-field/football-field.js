// components/football-field/football-field.js
Component({
  properties: {
    // 球衣号码
    jerseyNumber: {
      type: Number,
      value: 0
    },
    // 位置代码数组，如 ["LB", "CB", "RB"]
    positionCodes: {
      type: Array,
      value: [],
      observer(newVal) {
        this.updatePositions(newVal);
      }
    }
  },

  data: {
    positions: [] // 处理后的位置数据，包含坐标和标签
  },

  lifetimes: {
    attached() {
      this.updatePositions(this.data.positionCodes);
    }
  },

  methods: {
    // 更新位置标记点
    updatePositions(positionCodes) {
      if (!positionCodes || positionCodes.length === 0) {
        this.setData({ positions: [] });
        return;
      }

      // 位置代码到球场坐标的映射（全场，百分比坐标）
      const positionMap = {
        // 门将
        'GK': { x: 50, y: 92, label: '门将' },

        // 后卫线（防守方向，靠下）
        'LB': { x: 20, y: 78, label: '左后卫' },
        'LCB': { x: 38, y: 80, label: '左中卫' },
        'CB': { x: 50, y: 80, label: '中后卫' },
        'RCB': { x: 62, y: 80, label: '右中卫' },
        'RB': { x: 80, y: 78, label: '右后卫' },

        // 边卫（更靠前）
        'LWB': { x: 15, y: 65, label: '左边卫' },
        'RWB': { x: 85, y: 65, label: '右边卫' },

        // 后腰
        'CDM': { x: 50, y: 62, label: '后腰' },
        'LCDM': { x: 38, y: 62, label: '左后腰' },
        'RCDM': { x: 62, y: 62, label: '右后腰' },

        // 中场线
        'LM': { x: 20, y: 50, label: '左中场' },
        'LCM': { x: 38, y: 50, label: '左中前卫' },
        'CM': { x: 50, y: 50, label: '中前卫' },
        'RCM': { x: 62, y: 50, label: '右中前卫' },
        'RM': { x: 80, y: 50, label: '右中场' },

        // 前腰
        'CAM': { x: 50, y: 38, label: '前腰' },
        'LCAM': { x: 38, y: 38, label: '左前腰' },
        'RCAM': { x: 62, y: 38, label: '右前腰' },

        // 边锋线（进攻方向，靠上）
        'LW': { x: 20, y: 25, label: '左边锋' },
        'RW': { x: 80, y: 25, label: '右边锋' },

        // 前锋线
        'LF': { x: 38, y: 15, label: '左前锋' },
        'ST': { x: 50, y: 12, label: '中锋' },
        'CF': { x: 50, y: 12, label: '中锋' },
        'RF': { x: 62, y: 15, label: '右前锋' }
      };

      const positions = positionCodes.map((code, index) => {
        const pos = positionMap[code] || { x: 50, y: 50, label: code };
        return {
          code: code,
          x: pos.x,
          y: pos.y,
          label: pos.label,
          isPrimary: index === 0 // 第一个位置为主位置
        };
      });

      this.setData({ positions });
    },

    // 点击位置标记
    onMarkerTap(e) {
      const position = e.currentTarget.dataset.position;
      this.triggerEvent('markerTap', { position });
    }
  }
});
