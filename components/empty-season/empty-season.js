// components/empty-season/empty-season.js
const config = require('../../utils/config.js');

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    type: {
      type: String,
      value: 'no-season' // no-season | no-match
    },
    actionText: {
      type: String,
      value: ''
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    iconSrc: '',
    title: '',
    description: ''
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 获取类型配置
    getTypeConfig(type) {
      const configs = {
        'no-season': {
          iconSrc: config.getIconUrl('empty-season.png'),
          title: '暂无赛季',
          description: '还没有创建任何赛季\n点击下方按钮创建第一个赛季'
        },
        'no-completed-season': {
          iconSrc: config.getIconUrl('empty-season.png'),
          description: '还没有已完成的赛季'
        },
        'no-all-season': {
          iconSrc: config.getIconUrl('empty-season.png'),
          title: '暂无赛季',
          description: '还没有任何赛季记录'
        },
        'no-match': {
          iconSrc: config.getImageUrl('empty-match.png'),
          title: '暂无比赛',
          description: '该赛季还没有比赛记录'
        }
      };
      return configs[type] || configs['no-season'];
    },

    // 初始化配置
    initConfig() {
      const typeConfig = this.getTypeConfig(this.data.type);
      this.setData({
        iconSrc: typeConfig.iconSrc,
        title: typeConfig.title,
        description: typeConfig.description
      });
    },

    // 点击操作按钮
    onAction() {
      this.triggerEvent('action');
    }
  },

  /**
   * 生命周期函数
   */
  lifetimes: {
    attached() {
      this.initConfig();
    }
  },

  /**
   * 监听属性变化
   */
  observers: {
    'type': function() {
      this.initConfig();
    }
  }
});
