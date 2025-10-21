# 129俱乐部小程序开发规范文档

## 📋 项目概述

**项目名称**: 129俱乐部足球队管理小程序
**技术栈**: 微信小程序原生框架（WXML + WXSS + JavaScript）
**开发模式**: 前后端分离，前端使用Mock数据开发
**主题色**: `#f20810` (嘉陵摩托红)、`#924ab0` (长江黄河紫)

---

## 🎯 开发原则

### 1. 代码规范

#### 1.1 文件结构
```
pages/
  ├── [模块名]/
  │   ├── [页面名]/
  │   │   ├── [页面名].js       # 页面逻辑
  │   │   ├── [页面名].wxml     # 页面结构
  │   │   ├── [页面名].wxss     # 页面样式
  │   │   └── [页面名].json     # 页面配置
```

#### 1.2 命名规范
- **文件名**: 小写字母，多个单词用连字符分隔（如 `team-compare.js`）
- **变量名**: 小驼峰命名法（如 `matchInfo`, `teamStats`）
- **常量名**: 大写字母，下划线分隔（如 `MAX_PHOTOS`, `API_BASE_URL`）
- **CSS类名**: 小写字母，连字符分隔（如 `.stat-value`, `.team-logo`）

#### 1.3 代码注释
```javascript
// 单行注释：简短说明

/**
 * 多行注释：复杂逻辑说明
 * @param {string} id - 参数说明
 * @returns {object} 返回值说明
 */
```

---

## ⚠️ 重要注意事项

### 1. WXML模板限制

**❌ 不支持的语法**:
```xml
<!-- 错误：不能使用 JavaScript 方法 -->
<text>{{array.map(p => p.name).join('、')}}</text>
<text>{{items.filter(i => i.active)}}</text>
```

**✅ 正确做法**:
```javascript
// 在 JS 中预处理数据
data: {
  playerNames: '', // 预计算的字符串
  activeItems: []  // 预过滤的数组
}

// 在方法中计算
const playerNames = players.map(p => p.name).join('、');
this.setData({ playerNames });
```

**规则**: WXML只支持简单的三元运算符和基本运算，复杂逻辑必须在JS中处理。

---

### 2. 按钮组件样式问题

#### 2.1 圆形按钮问题

**问题**: 微信小程序 `<button>` 组件有无法覆盖的默认样式（padding、min-width等），即使设置 `width: 72rpx; height: 72rpx; border-radius: 50%` 也会显示为椭圆。

**解决方案**: 圆形按钮使用 `<view>` 组件代替 `<button>`

```xml
<!-- 错误：使用 button -->
<button class="circle-btn" bindtap="onClick">
  <image src="/static/icons/icon.png"></image>
</button>

<!-- 正确：使用 view -->
<view class="circle-btn" bindtap="onClick">
  <image src="/static/icons/icon.png"></image>
</view>
```

```css
/* 圆形按钮样式 */
.circle-btn {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.circle-btn:active {
  transform: scale(0.9);
  opacity: 0.8;
}
```

#### 2.2 矩形按钮文字居中

**问题**: 设置 `padding: 0` 后，按钮文字垂直方向不居中（居顶）。

**解决方案**: 保留水平padding，使用 `line-height` 实现垂直居中

```css
/* 矩形按钮 - 使用 line-height */
.rect-btn {
  height: 88rpx;
  padding: 0 24rpx;  /* 仅水平padding */
  line-height: 88rpx; /* 等于height */
  border-radius: 16rpx;
}

/* 矩形按钮 - 使用 flex（如果按钮内有图标） */
.flex-btn {
  height: 88rpx;
  padding: 0 16rpx;  /* 仅水平padding */
  display: flex;
  align-items: center; /* flex自动垂直居中 */
  justify-content: center;
  gap: 12rpx;
}
```

#### 2.3 按钮组件选择指南

| 按钮类型 | 使用组件 | 原因 |
|---------|---------|------|
| 圆形按钮 | `<view>` | 避免默认样式干扰 |
| 矩形按钮 | `<button>` | 保持语义化和可访问性 |
| 分享按钮 | `<button open-type="share">` | 必须使用button的特殊功能 |

---

### 3. CSS主题色变量

**全局变量** (定义在 `app.wxss`):
```css
:root {
  --theme-color: #f20810;        /* 主题红色 */
  --theme-color-dark: #d10710;   /* 深红色 */
  --theme-color-light: #ff4757;  /* 浅红色 */
}
```

**使用方式**:
```css
.element {
  background: var(--theme-color);
  color: var(--theme-color);
  border: 2rpx solid var(--theme-color);
}

/* 渐变背景 */
.gradient-bg {
  background: linear-gradient(135deg, var(--theme-color) 0%, var(--theme-color-dark) 100%);
}
```

---

## 🎨 UI设计规范

### 1. 间距规范

```css
/* 标准间距（使用 rpx 单位） */
--spacing-xs: 8rpx;    /* 超小间距 */
--spacing-sm: 16rpx;   /* 小间距 */
--spacing-md: 24rpx;   /* 中等间距（常用） */
--spacing-lg: 32rpx;   /* 大间距 */
--spacing-xl: 48rpx;   /* 超大间距 */

/* 应用示例 */
.card {
  padding: 32rpx;           /* 卡片内边距 */
  margin-bottom: 24rpx;     /* 卡片间距 */
  border-radius: 24rpx;     /* 圆角 */
}
```

### 2. 字体规范

```css
/* 字体大小 */
--font-xs: 20rpx;   /* 超小文字（提示） */
--font-sm: 24rpx;   /* 小文字（副标题） */
--font-md: 28rpx;   /* 正文（常用） */
--font-lg: 32rpx;   /* 标题 */
--font-xl: 40rpx;   /* 大标题 */
--font-xxl: 48rpx;  /* 数据展示 */

/* 字重 */
--font-normal: 400;
--font-medium: 600;
--font-bold: 700;
```

### 3. 颜色规范

```css
/* 文字颜色 */
--text-primary: #2c3e50;    /* 主要文字 */
--text-secondary: #636e72;  /* 次要文字 */
--text-placeholder: #95a5a6; /* 占位文字 */
--text-disabled: #bdc3c7;   /* 禁用文字 */

/* 背景颜色 */
--bg-page: #f5f6f8;         /* 页面背景 */
--bg-card: #ffffff;         /* 卡片背景 */
--bg-hover: #f8f9fa;        /* 悬停背景 */

/* 状态颜色 */
--color-success: #27ae60;   /* 成功/胜利 */
--color-warning: #f39c12;   /* 警告/平局 */
--color-danger: #e74c3c;    /* 危险/失败 */
--color-info: #3498db;      /* 信息 */
```

### 4. 卡片样式模板

```css
/* 标准卡片 */
.card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

/* 卡片标题 */
.card-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 24rpx;
}

/* 卡片头部（带操作） */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}
```

### 5. 动画效果

```css
/* 标准过渡 */
.interactive-element {
  transition: all 0.3s ease;
}

/* 点击缩放 */
.clickable:active {
  transform: scale(0.95);
}

/* 滑入动画 */
@keyframes slideIn {
  from {
    transform: translateY(100rpx);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```

---

## 📦 Mock数据规范

### 1. 数据结构示例

```javascript
// Mock数据应该模拟真实API返回的数据结构
const mockMatchInfo = {
  id: '1',
  title: '周末友谊赛',
  date: '2025-10-20',
  time: '14:00',
  location: '嘉陵体育中心',
  status: 'upcoming', // upcoming, ongoing, completed
  team1: {
    id: '1',
    name: '嘉陵摩托',
    logo: '/static/images/logoa.png',
    color: '#f20810'
  },
  team2: {
    id: '2',
    name: '长江黄河',
    logo: '/static/images/logob.png',
    color: '#924ab0'
  },
  maxPlayers: 11,
  currentPlayers: 8,
  fee: 30
};
```

### 2. API调用注释模板

```javascript
loadMatchDetail() {
  wx.showLoading({ title: '加载中...' });

  // Mock数据（开发阶段）
  const mockData = { /* ... */ };
  this.setData({ matchInfo: mockData });
  wx.hideLoading();

  // 真实API调用（暂时注释，待后端接口完成后启用）
  // matchAPI.getMatchDetail(this.data.matchId).then(res => {
  //   this.setData({ matchInfo: res.data });
  //   wx.hideLoading();
  // }).catch(err => {
  //   wx.hideLoading();
  //   wx.showToast({
  //     title: err.message || '加载失败',
  //     icon: 'none'
  //   });
  // });
}
```

---

## 🔧 常用功能实现

### 1. 下拉刷新

```javascript
// pages/xxx/xxx.json
{
  "enablePullDownRefresh": true,
  "backgroundTextStyle": "dark"
}

// pages/xxx/xxx.js
Page({
  onPullDownRefresh() {
    this.loadData();
    wx.stopPullDownRefresh();
  }
});
```

### 2. 页面跳转

```javascript
// 保留当前页面，跳转到新页面（可返回）
wx.navigateTo({
  url: '/pages/match/detail/detail?id=123'
});

// 关闭当前页面，跳转到新页面（不可返回）
wx.redirectTo({
  url: '/pages/login/login'
});

// 跳转到tabBar页面
wx.switchTab({
  url: '/pages/index/index'
});

// 返回上一页
wx.navigateBack({
  delta: 1 // 返回的页面数
});
```

### 3. 图片选择和上传

```javascript
// 选择图片
onChoosePhoto() {
  wx.chooseImage({
    count: 9, // 最多选择9张
    sizeType: ['compressed'], // 压缩图
    sourceType: ['album', 'camera'], // 相册和相机
    success: (res) => {
      const photos = res.tempFilePaths;
      this.setData({ photos });
    }
  });
}

// 预览图片
onPreviewPhoto(e) {
  const index = e.currentTarget.dataset.index;
  wx.previewImage({
    urls: this.data.photos, // 所有图片
    current: this.data.photos[index] // 当前图片
  });
}
```

### 4. 弹窗提示

```javascript
// Toast提示（自动消失）
wx.showToast({
  title: '操作成功',
  icon: 'success', // success, error, loading, none
  duration: 2000
});

// Modal对话框（需要确认）
wx.showModal({
  title: '确认删除',
  content: '确定要删除这条记录吗？',
  success: (res) => {
    if (res.confirm) {
      // 用户点击确定
      this.deleteItem();
    }
  }
});

// Loading加载
wx.showLoading({
  title: '加载中...',
  mask: true // 是否显示透明蒙层
});
wx.hideLoading(); // 关闭loading
```

### 5. 数据绑定和更新

```javascript
// 设置数据
this.setData({
  count: 10,
  'user.name': '张三', // 支持路径
  'list[0].checked': true // 支持数组索引
});

// 获取数据
const count = this.data.count;

// 事件传参
// WXML: <view bindtap="onClick" data-id="123">
onClick(e) {
  const id = e.currentTarget.dataset.id; // 获取data-id
}
```

---

## 📐 布局最佳实践

### 1. Flex布局（推荐）

```css
/* 水平居中 */
.flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 两端对齐 */
.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 垂直排列 */
.flex-column {
  display: flex;
  flex-direction: column;
  gap: 16rpx; /* 子元素间距 */
}
```

### 2. Grid布局（多列）

```css
/* 2列网格 */
.grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24rpx;
}

/* 3列网格 */
.grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
}
```

### 3. 固定底部按钮

```css
.page-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.content {
  flex: 1;
  padding: 24rpx;
  padding-bottom: 160rpx; /* 底部按钮高度 + 间距 */
}

.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 24rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom)); /* 适配iPhone X+ */
  background: #ffffff;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.08);
  z-index: 100;
}
```

### 4. 安全区域适配

```css
/* 底部安全区域 */
.bottom-bar {
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
}

/* 顶部安全区域 */
.top-bar {
  padding-top: calc(20rpx + env(safe-area-inset-top));
}
```

---

## 🐛 常见问题和解决方案

### 1. 数据不更新

**问题**: 修改了数据，页面没有更新

**原因**: 直接修改 `this.data.xxx` 不会触发视图更新

**解决**:
```javascript
// ❌ 错误
this.data.count = 10;

// ✅ 正确
this.setData({ count: 10 });
```

### 2. 事件冒泡

**问题**: 点击子元素，父元素事件也触发

**解决**:
```xml
<!-- 阻止事件冒泡：使用 catchtap 代替 bindtap -->
<view bindtap="onParentClick">
  <view catchtap="onChildClick">子元素</view>
</view>
```

### 3. 图片路径问题

**问题**: 本地图片显示不出来

**解决**:
```javascript
// ✅ 正确：使用绝对路径
src="/static/images/logo.png"

// ❌ 错误：使用相对路径
src="../../static/images/logo.png"
```

### 4. wx:for 的 key

**问题**: 列表渲染警告 "wx:key"

**解决**:
```xml
<!-- ✅ 正确：使用唯一的 id -->
<view wx:for="{{list}}" wx:key="id">
  {{item.name}}
</view>

<!-- 使用 index 作为 key（仅在列表不会重新排序时使用） -->
<view wx:for="{{list}}" wx:key="*this">
  {{item}}
</view>
```

### 5. button 样式重置

**问题**: button有默认的边框和背景

**解决**:
```css
button {
  border: none;
  background: none;
  padding: 0;
  margin: 0;
  line-height: inherit;
}

button::after {
  border: none; /* 去除默认边框 */
}
```

---

## 📚 API模块划分

```
api/
  ├── config.js        # API配置（baseURL等）
  ├── request.js       # 封装的请求方法
  ├── auth.js          # 登录认证相关
  ├── team.js          # 队伍相关
  ├── match.js         # 比赛相关
  ├── stats.js         # 统计相关
  └── user.js          # 用户相关
```

---

## 🎯 页面开发流程

### 标准开发步骤

1. **创建页面文件**
   - 在对应模块目录下创建页面文件夹
   - 自动生成 `.js`, `.wxml`, `.wxss`, `.json` 四个文件

2. **编写JS逻辑**
   - 定义 `data` 数据结构
   - 实现 `onLoad` 加载数据
   - 编写事件处理函数
   - 准备 Mock 数据
   - 注释真实 API 调用

3. **编写WXML结构**
   - 使用语义化标签
   - 避免复杂的JavaScript表达式
   - 为循环添加 `wx:key`
   - 为事件传递必要的 `data-*` 参数

4. **编写WXSS样式**
   - 使用 `rpx` 单位（响应式）
   - 引用全局CSS变量
   - 遵循间距和字体规范
   - 添加适当的动画效果

5. **配置页面JSON**
   ```json
   {
     "navigationBarTitleText": "页面标题",
     "enablePullDownRefresh": false,
     "backgroundTextStyle": "dark"
   }
   ```

6. **注册到app.json**
   ```json
   {
     "pages": [
       "pages/xxx/xxx/xxx"
     ]
   }
   ```

---

## 🔍 调试技巧

### 1. 控制台输出

```javascript
console.log('普通日志', data);
console.warn('警告信息', warning);
console.error('错误信息', error);

// 查看完整对象
console.log('对象:', JSON.stringify(data, null, 2));
```

### 2. 页面调试

- 使用微信开发者工具的 **调试器**
- 查看 **AppData** 查看页面数据
- 使用 **Network** 查看网络请求
- 使用 **Storage** 查看本地存储

### 3. 真机调试

- 点击"真机调试"按钮
- 扫码在手机上测试
- 查看手机微信开发工具进行调试

---

## 📦 版本控制规范

### Git提交信息格式

```
<type>: <subject>

<body>

<footer>
```

**Type类型**:
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建/工具相关

**示例**:
```
feat: 完成比赛记录录入页面

- 添加比分输入功能
- 实现事件管理（进球、黄牌、红牌、换人）
- 支持MVP选择和照片上传
- 使用Mock数据测试

Closes #25
```

---

## 🎓 学习资源

- **微信小程序官方文档**: https://developers.weixin.qq.com/miniprogram/dev/framework/
- **小程序组件库**: https://developers.weixin.qq.com/miniprogram/dev/component/
- **小程序API**: https://developers.weixin.qq.com/miniprogram/dev/api/

---

## 📝 代码审查清单

在提交代码前，请检查以下项目：

- [ ] 代码符合命名规范
- [ ] 添加了必要的注释
- [ ] 移除了 `console.log` 调试代码
- [ ] Mock 数据完整且结构正确
- [ ] 真实 API 调用已注释
- [ ] WXML 中没有复杂的 JavaScript 表达式
- [ ] 使用了 CSS 变量（而非硬编码颜色）
- [ ] 圆形按钮使用 `<view>`，矩形按钮使用 `<button>`
- [ ] 添加了适当的过渡动画
- [ ] 适配了 iPhone X+ 的安全区域
- [ ] 列表渲染使用了 `wx:key`
- [ ] 测试了不同屏幕尺寸的显示效果

---

## 🚀 下次开发建议

### 继续开发Week 6剩余页面

1. **排行榜详情页** (`pages/stats/ranking/ranking`)
   - Tab切换（射手榜/助攻榜/MVP榜/出勤榜）
   - 完整排行列表（不只是前3名）
   - 支持筛选（本月/本赛季/全部）
   - 点击查看球员详情

2. **个人统计详情页** (`pages/user/stats/stats`)
   - 个人数据总览（雷达图/柱状图）
   - 历史比赛记录
   - 数据趋势图
   - 成就徽章

3. **队伍对比页** (`pages/stats/team-compare/team-compare`)
   - 选择两个队伍
   - 对比各项数据
   - 雷达图展示
   - 历史交锋记录

### 参考已完成页面

- 参考 **数据总览页面** 的卡片布局设计
- 参考 **比赛记录页面** 的弹窗和表单设计
- 参考 **比赛列表页面** 的Tab切换实现

---

**文档版本**: v1.0
**创建日期**: 2025-10-16
**最后更新**: 2025-10-16
**维护者**: 前端开发团队

**说明**: 本文档将持续更新，记录开发过程中的最佳实践和注意事项。如有疑问或需要补充，请随时更新本文档。
