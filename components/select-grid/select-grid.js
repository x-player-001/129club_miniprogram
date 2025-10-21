// components/select-grid/select-grid.js
Component({
  /**
   * 通用弹窗选择器组件
   * 支持单选/多选模式，圆角矩形网格布局，底部弹出
   */
  properties: {
    // 是否显示选择器
    show: {
      type: Boolean,
      value: false
    },
    // 标题
    title: {
      type: String,
      value: '请选择'
    },
    // 选项列表 [{id, name, avatar, ...}]
    options: {
      type: Array,
      value: []
    },
    // 已选中的值（单选：字符串/数字，多选：数组）
    value: {
      type: null,
      value: null
    },
    // 是否多选模式
    multiple: {
      type: Boolean,
      value: false
    },
    // 显示字段（用于展示的字段名）
    displayField: {
      type: String,
      value: 'name'
    },
    // 值字段（用于选中值的字段名）
    valueField: {
      type: String,
      value: 'id'
    },
    // 是否显示头像
    showAvatar: {
      type: Boolean,
      value: false
    },
    // 头像字段名
    avatarField: {
      type: String,
      value: 'avatar'
    },
    // 每行显示数量（2-4）
    columns: {
      type: Number,
      value: 3
    },
    // 空状态提示文字
    emptyText: {
      type: String,
      value: '暂无选项'
    }
  },

  data: {
    selectedValues: [] // 内部临时维护的选中值数组
  },

  observers: {
    'show': function(show) {
      if (show) {
        // 打开时，同步外部的 value 到内部 selectedValues
        this.syncSelectedValues();
      }
    }
  },

  methods: {
    // 同步选中值
    syncSelectedValues() {
      const { value, multiple } = this.properties;
      let selectedValues = [];

      if (multiple) {
        // 多选模式：确保是数组
        selectedValues = Array.isArray(value) ? [...value] : [];
      } else {
        // 单选模式：转为数组（方便统一处理）
        if (value !== null && value !== undefined && value !== '') {
          selectedValues = [value];
        }
      }

      this.setData({ selectedValues });
    },

    // 点击遮罩层关闭
    onMaskTap() {
      this.triggerEvent('close');
    },

    // 阻止事件冒泡
    onStopPropagation() {
      // 空函数，仅用于阻止事件冒泡到遮罩层
    },

    // 点击关闭按钮
    onCloseTap() {
      this.triggerEvent('close');
    },

    // 点击选项
    onItemTap(e) {
      const { value } = e.currentTarget.dataset;
      const { multiple } = this.properties;
      let { selectedValues } = this.data;

      if (multiple) {
        // 多选模式：切换选中状态
        const index = selectedValues.indexOf(value);
        if (index > -1) {
          selectedValues.splice(index, 1);
        } else {
          selectedValues.push(value);
        }
        this.setData({ selectedValues });
      } else {
        // 单选模式：直接设置选中项，不自动关闭
        selectedValues = [value];
        this.setData({ selectedValues });
      }
    },

    // 取消
    onCancel() {
      this.triggerEvent('close');
    },

    // 确认选择
    onConfirm() {
      const { multiple, options, valueField, displayField } = this.properties;
      const { selectedValues } = this.data;

      // 获取完整的选中项数据
      const selectedItems = options.filter(item =>
        selectedValues.includes(item[valueField])
      );

      // 根据单选/多选返回不同格式
      const detail = {
        value: multiple ? selectedValues : (selectedValues[0] || null),
        items: multiple ? selectedItems : (selectedItems[0] || null),
        // 便捷获取显示文本
        text: selectedItems.map(item => item[displayField]).join(',')
      };

      this.triggerEvent('confirm', detail);
      this.triggerEvent('close');
    }
  }
});
