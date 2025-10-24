# 🔄 Mock 和 API 一键切换使用指南

## 📖 快速开始

### 一键切换模式

打开 `utils/config.js`，修改第 16 行：

```javascript
// ========== 关键配置：一键切换 ==========
const USE_MOCK = true; // ✅ true = Mock模式  ❌ false = API模式
```

- **`USE_MOCK = true`**: 使用 Mock 数据（适合体验版、开发调试）
- **`USE_MOCK = false`**: 使用真实 API（适合生产环境）

**就这么简单！** 修改后重新编译小程序即可生效。

---

## 🎯 使用场景

### 场景 1: 体验版测试（推荐 Mock 模式）

**问题**: 体验版必须配置 HTTPS 合法域名，但你还没有配置。

**解决方案**:
```javascript
const USE_MOCK = true; // 使用 Mock 模式
```

**优点**:
- ✅ 不需要配置域名
- ✅ 不需要后端服务器
- ✅ 可以正常测试所有功能
- ✅ 数据稳定，不会因网络问题失败

---

### 场景 2: 开发调试（可选 Mock 或 API）

**开发初期** - 使用 Mock:
```javascript
const USE_MOCK = true;
```

**后端接口就绪后** - 切换到 API:
```javascript
const USE_MOCK = false;
const ENV = 'dev'; // 使用开发环境配置
```

---

### 场景 3: 生产环境（使用 API）

**前提条件**:
1. 已配置 HTTPS 域名（如 `https://api.129club.com`）
2. 域名已备案
3. 已在微信公众平台配置服务器域名

**配置**:
```javascript
const USE_MOCK = false;
const ENV = 'prod'; // 使用生产环境配置

const API_CONFIG = {
  prod: {
    baseUrl: 'https://api.129club.com/api', // 你的 HTTPS 域名
    timeout: 10000
  }
};
```

---

## 📁 文件结构

```
utils/
  ├── config.js          # ⚙️ 配置文件（一键切换在这里）
  └── request.js         # 网络请求封装（自动适配 Mock/API）

mock/
  ├── index.js           # Mock 路由（URL 匹配）
  ├── user.js            # 用户相关 Mock 数据
  ├── match.js           # 比赛相关 Mock 数据
  ├── team.js            # 队伍相关 Mock 数据
  ├── stats.js           # 统计相关 Mock 数据
  └── season.js          # 赛季相关 Mock 数据
```

---

## 🔍 工作原理

### Mock 模式下的请求流程

```
页面调用 API
  ↓
request.js 检测到 useMock = true
  ↓
拦截请求，不发送网络请求
  ↓
根据 URL 匹配 Mock 数据
  ↓
模拟 300ms 延迟
  ↓
返回 Mock 数据
```

### API 模式下的请求流程

```
页面调用 API
  ↓
request.js 检测到 useMock = false
  ↓
发送真实网络请求到后端
  ↓
返回后端数据
```

---

## 🛠️ 添加新的 Mock 数据

### 1. 在对应模块添加 Mock 方法

例如，添加「获取比赛评论」接口：

**`mock/match.js`**:
```javascript
/**
 * 获取比赛评论
 */
function getMatchComments(params) {
  const { matchId } = params;

  return {
    list: [
      {
        id: '1',
        userId: '1',
        userName: '张三',
        avatar: '/static/images/avatar/1.png',
        content: '这场比赛太精彩了！',
        createdAt: '2025-10-20 15:30'
      }
    ],
    total: 1
  };
}

module.exports = {
  // ... 其他方法
  getMatchComments
};
```

### 2. 在 Mock 路由中添加匹配规则

**`mock/index.js`**:
```javascript
// ========== 比赛相关 ==========
if (url.includes('/match/comments')) {
  return successResponse(matchMock.getMatchComments(data));
}
```

**完成！** 现在这个接口就可以在 Mock 模式下工作了。

---

## 📊 Mock 数据说明

### 当前 Mock 数据包含：

- **用户**: 21 个测试用户（ID: 1-21）
- **队伍**: 2 个队伍（嘉陵摩托、长江黄河）
- **比赛**: 2 场比赛（1场未开始，1场已完成）
- **赛季**: 2 个赛季（1个进行中，1个已结束）
- **统计数据**: 排行榜、个人统计、成就系统

### Mock 用户说明：

- **用户 1**: 张三（嘉陵摩托，10号）
- **用户 2-10**: 嘉陵摩托队员（单数ID）
- **用户 11-21**: 长江黄河队员（双数ID）

所有用户头像路径: `/static/images/avatar/[1-21].png`

---

## ⚠️ 注意事项

### 1. Mock 模式限制

- 数据不会持久化（刷新后重置）
- 不会真正上传文件（但可以模拟上传成功）
- 不会真正发送通知

### 2. 切换模式后需要重新编译

修改 `config.js` 后，需要：
1. 保存文件
2. 重新编译小程序（微信开发者工具会自动编译）
3. 如果未生效，尝试「清除缓存 → 重新编译」

### 3. 日志查看

打开控制台，可以看到：
- `[Mock] GET /user/list` - Mock 模式请求日志
- `[Mock] 返回数据: {...}` - Mock 数据内容
- 如果是 API 模式，会显示正常的网络请求日志

---

## 🚀 推荐配置流程

### 阶段 1: 开发初期
```javascript
const USE_MOCK = true; // 使用 Mock 快速开发
```

### 阶段 2: 后端联调
```javascript
const USE_MOCK = false; // 切换到 API 测试
const ENV = 'dev';
```

### 阶段 3: 体验版测试
```javascript
const USE_MOCK = true; // 回到 Mock（体验版无法访问 HTTP API）
```

### 阶段 4: 正式上线
```javascript
const USE_MOCK = false; // 使用正式 API
const ENV = 'prod';
// 确保配置了 HTTPS 域名
```

---

## 🎓 常见问题

### Q1: 我改了 `USE_MOCK` 但没生效？

**A**: 确保微信开发者工具已重新编译。可以尝试：
1. 点击「编译」按钮
2. 或者「工具 → 清除缓存 → 编译」

### Q2: Mock 模式下还是显示「网络请求失败」？

**A**: 检查控制台是否有报错。可能原因：
1. Mock 数据文件有语法错误
2. URL 未匹配到 Mock 数据（检查 `mock/index.js`）

### Q3: 如何知道当前是 Mock 还是 API 模式？

**A**: 打开控制台查看日志：
- Mock 模式: `[Mock] GET /xxx`
- API 模式: 正常的 `wx.request` 日志

### Q4: 可以部分接口用 Mock，部分用 API 吗？

**A**: 当前方案是全局切换。如需精细控制，可以修改 `request.js`，根据 URL 判断是否使用 Mock。

---

## 📝 总结

✅ **一键切换**: 只需修改 `utils/config.js` 第 16 行
✅ **Mock 模式**: 适合体验版、开发调试
✅ **API 模式**: 适合生产环境
✅ **易于扩展**: 添加新接口只需在 `mock/` 目录添加数据

**现在就开始使用吧！** 🎉
