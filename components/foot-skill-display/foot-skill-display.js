// components/foot-skill-display/foot-skill-display.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    leftFootSkill: {
      type: null,  // 接受任何类型，避免类型检查警告
      value: 0,
      observer(newVal) {
        // 强制转换为数字
        const numVal = Number(newVal);
        this.setData({ _leftFootSkill: isNaN(numVal) ? 0 : numVal });
      }
    },
    rightFootSkill: {
      type: null,  // 接受任何类型，避免类型检查警告
      value: 0,
      observer(newVal) {
        // 强制转换为数字
        const numVal = Number(newVal);
        this.setData({ _rightFootSkill: isNaN(numVal) ? 0 : numVal });
      }
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    _leftFootSkill: 0,
    _rightFootSkill: 0
  },

  /**
   * 组件的方法列表
   */
  methods: {

  }
})
