// components/menu-item/menu-item.js
const config = require('../../utils/config.js');

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 图标路径
    icon: {
      type: String,
      value: ''
    },
    // 图标背景色（渐变）
    iconBg: {
      type: String,
      // value: 'linear-gradient(135deg, #f0f0f0 0%, #d3d3d3 100%)'
    },
    // 菜单文字
    text: {
      type: String,
      value: ''
    },
    // 徽章数字（0或不传则不显示）
    badge: {
      type: Number,
      value: 0
    },
    // 菜单类型（用于识别点击的是哪个菜单）
    type: {
      type: String,
      value: ''
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    arrowIcon: config.getIconUrl('arrow-right.png')
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onMenuTap() {
      this.triggerEvent('tap', {
        type: this.data.type
      });
    }
  }
});
