# 129俱乐部小程序 - API对接完成说明

**更新时间**: 2025-10-16
**版本**: v1.0

---

## 📋 已完成的工作

### ✅ 1. 基础配置更新

#### app.js 配置
- ✅ 更新API基础URL为 `http://localhost:3000/api`
- ✅ 移除硬编码的测试登录状态
- ✅ 添加 `checkLoginStatus()` 方法，从本地存储读取token和用户信息
- ✅ 小程序启动时自动检查登录状态

#### API接口文件完善
- ✅ **api/team.js**: 添加 `getCurrentTeam()` 方法
- ✅ **api/stats.js**: 添加 `getPersonalStats()` 方法
- ✅ **api/match.js**: 已完整实现所有方法
- ✅ **api/user.js**: 已完整实现所有方法
- ✅ **api/notice.js**: 已完整实现所有方法

---

### ✅ 2. 登录流程实现

#### 完整的登录逻辑

**流程图**:
```
用户打开小程序
    ↓
app.onLaunch() 检查本地token
    ↓
├─ 有token → 设置为已登录 → 进入首页
└─ 无token → 未登录 → 跳转登录页
    ↓
login页面自动调用 silentLogin()
    ↓
wx.login() 获取code
    ↓
调用 POST /api/user/login
    ↓
├─ 成功 → 保存token → 跳转首页/信息完善页
└─ 失败 → 显示登录按钮 → 等待用户授权
```

#### 关键代码位置

**app.js** ([app.js:10-25](app.js#L10-L25))
```javascript
checkLoginStatus() {
  const token = wx.getStorageSync('token');
  const userInfo = wx.getStorageSync('userInfo');

  if (token && userInfo) {
    this.globalData.isLogin = true;
    this.globalData.userInfo = userInfo;
  } else {
    this.globalData.isLogin = false;
  }
}
```

**pages/user/login/login.js** ([login.js:27-59](pages/user/login/login.js#L27-L59))
- `silentLogin()`: 静默登录，自动调用微信登录API
- `handleLoginSuccess()`: 统一处理登录成功逻辑
- `loginToServer()`: 手动授权后的登录处理

---

### ✅ 3. 首页API对接

#### 已实现的API调用

**pages/index/index.js** ([index.js:46-77](pages/index/index.js#L46-L77))

| API方法 | 接口 | 说明 |
|---------|------|------|
| `loadUserInfo()` | GET /user/info | 获取当前用户信息 |
| `loadCurrentTeam()` | GET /team/current | 获取用户所在队伍 |
| `loadRecentMatches()` | GET /match/list?page=1&pageSize=3 | 获取近期比赛 |
| `loadPersonalStats()` | GET /stats/personal | 获取个人统计数据 |
| `loadUnreadCount()` | - | 未读消息数（待实现） |

#### 防抖和缓存机制

**关键特性**:
- ✅ 添加 `isLoading` 状态，防止重复请求
- ✅ 添加 `hasLoaded` 标记，避免onShow时重复加载
- ✅ 缓存优先策略：先显示缓存数据，再请求最新数据
- ✅ 失败时自动降级到Mock数据
- ✅ 下拉刷新时重置状态，允许重新加载

---

### ✅ 4. 队伍模块API对接

**pages/team/list/list.js** ([team/list/list.js:39-165](pages/team/list/list.js#L39-L165))

| 方法 | 接口 | 说明 |
|------|------|------|
| `loadActiveTeams()` | GET /team/list?status=active | 获取当前队伍列表 |
| `loadHistoryTeams()` | GET /team/list?status=archived | 获取历史队伍列表 |

**数据格式化**:
- 自动处理队长信息（支持多种字段名）
- 自动填充默认logo
- 计算colorDark（颜色加深）
- 格式化时间段

---

### ✅ 5. 数据格式化工具

**utils/dataFormatter.js** (新创建)

提供了统一的数据格式转换方法，将API返回的数据转换为组件需要的格式：

| 方法 | 用途 |
|------|------|
| `formatMatchData()` | 格式化比赛数据为match-card组件格式 |
| `formatTeamData()` | 格式化队伍数据为team-card组件格式 |
| `formatPlayerData()` | 格式化球员数据为player-card组件格式 |
| `formatStatsGrid()` | 格式化统计数据为stats-grid组件格式 |
| `formatTeamStatsBar()` | 格式化战绩数据为team-stats-bar组件格式 |
| `formatRankingItem()` | 格式化排行榜数据为ranking-item组件格式 |

**使用示例**:
```javascript
const formatter = require('../../utils/dataFormatter.js');

// 在页面中使用
matchAPI.getMatchList().then(res => {
  const matches = res.data.list.map(m => formatter.formatMatchData(m));
  this.setData({ matchList: matches });
});
```

---

## 🔄 当前登录流程说明

### 场景1: 首次打开小程序

```
1. 小程序启动 (app.onLaunch)
2. checkLoginStatus() 检查 → 无token
3. 首页 onLoad() → 检测未登录 → redirectTo 登录页
4. 登录页 onLoad() → 自动调用 silentLogin()
5. wx.login() 获取code
6. POST /api/user/login { code }
7. 后端返回 { token, user }
8. 保存token到本地存储
9. 跳转到首页或信息完善页
```

### 场景2: 已登录用户再次打开

```
1. 小程序启动 (app.onLaunch)
2. checkLoginStatus() → 发现本地有token
3. 设置 globalData.isLogin = true
4. 首页 onLoad() → 检测已登录 → 直接加载数据
5. 调用各个API接口（携带token）
```

### 场景3: Token过期

```
1. API请求返回 401
2. request.js 拦截 401 错误
3. 显示"请先登录"提示
4. 1.5秒后跳转到登录页
5. 重新走登录流程
```

---

## 📝 待完成的工作

### 🔜 其他页面API对接

以下页面还在使用Mock数据，需要对接真实API：

#### 比赛模块
- ⏸️ **pages/match/list/list.js** - 比赛列表
- ⏸️ **pages/match/detail/detail.js** - 比赛详情
- ⏸️ **pages/match/create/create.js** - 创建比赛
- ⏸️ **pages/match/register/register.js** - 比赛报名
- ⏸️ **pages/match/record/record.js** - 比赛记录录入

#### 统计模块
- ⏸️ **pages/stats/overview/overview.js** - 数据总览
- ⏸️ **pages/stats/ranking/ranking.js** - 排行榜
- ⏸️ **pages/stats/team-compare/team-compare.js** - 队伍对比

#### 用户模块
- ⏸️ **pages/user/members/members.js** - 成员列表
- ⏸️ **pages/user/stats/stats.js** - 个人统计
- ⏸️ **pages/user/profile/profile.js** - 个人中心

#### 队伍模块
- ⏸️ **pages/team/detail/detail.js** - 队伍详情
- ⏸️ **pages/team/vs/vs.js** - 队伍对战记录
- ⏸️ **pages/team/reshuffle/reshuffle.js** - 队伍重组（Draft）

---

## 🛠️ 如何对接其他页面

### 标准对接步骤

以**比赛列表页**为例：

#### 1. 找到Mock数据加载代码
```javascript
// pages/match/list/list.js
loadMatchData() {
  // 使用Mock数据
  const mockMatches = [...];
  this.setData({ matchList: mockMatches });
  return Promise.resolve();
}
```

#### 2. 改为真实API调用
```javascript
const matchAPI = require('../../../api/match.js');
const formatter = require('../../../utils/dataFormatter.js');

loadMatchData() {
  // 防止重复加载
  if (this.data.isLoading) return Promise.resolve();
  this.setData({ isLoading: true });

  // 调用真实API
  return matchAPI.getMatchList({
    status: this.getStatusByTab(),
    page: 1,
    pageSize: 20
  }).then(res => {
    const matches = (res.data?.list || res.data || [])
      .map(m => formatter.formatMatchData(m));

    this.setData({
      matchList: matches,
      isLoading: false,
      hasLoaded: true
    });
  }).catch(err => {
    console.error('加载比赛列表失败:', err);
    // 失败时使用Mock数据
    this.loadMockData();
    this.setData({ isLoading: false, hasLoaded: true });
  });
}

// 保留Mock数据作为fallback
loadMockData() {
  const mockMatches = [...];
  this.setData({ matchList: mockMatches });
}
```

#### 3. 添加状态管理
```javascript
Page({
  data: {
    matchList: [],
    isLoading: false,
    hasLoaded: false
  },

  onLoad() {
    this.loadMatchData();
  },

  onShow() {
    // 只在未加载时加载，避免重复请求
    if (!this.data.hasLoaded && !this.data.isLoading) {
      this.loadMatchData();
    }
  },

  onPullDownRefresh() {
    // 下拉刷新时重置状态
    this.setData({ isLoading: false, hasLoaded: false });
    this.loadMatchData().then(() => {
      wx.stopPullDownRefresh();
    });
  }
});
```

---

## 🔍 调试技巧

### 1. 查看请求日志
在微信开发者工具的Console中查看：
```
首页 loadPageData 开始执行
加载用户信息失败: {code: 401, message: "请先登录"}
加载API数据失败，使用Mock数据
使用Mock数据
```

### 2. 检查网络请求
在**调试器 → Network**中查看：
- 请求URL是否正确
- Header中是否携带Authorization
- 响应状态码和数据

### 3. 检查Storage
在**调试器 → Storage**中查看：
- `token`: 是否存在
- `userInfo`: 是否有值

### 4. 测试登录流程
```
1. 清除Storage (右键 → Clear)
2. 重启小程序
3. 观察是否自动跳转到登录页
4. 观察是否自动调用登录API
5. 检查登录成功后是否保存token
```

---

## ⚠️ 注意事项

### 1. API响应格式适配
后端可能返回不同的格式：
- `res.data.list` - 分页列表
- `res.data` - 直接数据
- `res.data.user` 或 `res.data.userInfo` - 用户信息

建议使用可选链和默认值：
```javascript
const list = res.data?.list || res.data || [];
const userInfo = res.data?.user || res.data?.userInfo || {};
```

### 2. 错误处理
每个API调用都应该有错误处理：
```javascript
.catch(err => {
  console.error('API调用失败:', err);
  // 降级到Mock数据或显示错误提示
})
```

### 3. 防止重复请求
使用 `isLoading` 标记：
```javascript
if (this.data.isLoading) {
  return Promise.resolve();
}
this.setData({ isLoading: true });
```

### 4. Token刷新
如果后端支持token刷新，可以在401错误时：
```javascript
// utils/request.js
if (res.statusCode === 401) {
  // 尝试刷新token
  return refreshToken().then(() => {
    // 重试原请求
  });
}
```

---

## 📊 对接进度

| 模块 | 总页面数 | 已对接 | 进度 |
|------|---------|--------|------|
| 登录流程 | 1 | 1 | 100% ✅ |
| 首页 | 1 | 1 | 100% ✅ |
| 队伍列表 | 1 | 1 | 100% ✅ |
| 队伍详情 | 3 | 0 | 0% ⏸️ |
| 比赛模块 | 5 | 0 | 0% ⏸️ |
| 统计模块 | 3 | 0 | 0% ⏸️ |
| 用户模块 | 3 | 0 | 0% ⏸️ |
| **总计** | **17** | **3** | **18%** |

---

## 📚 相关文档

- [API.md](API.md) - 后端API接口文档
- [utils/dataFormatter.js](utils/dataFormatter.js) - 数据格式化工具
- [utils/request.js](utils/request.js) - 网络请求封装

---

**文档维护**: 前端开发团队
**最后更新**: 2025-10-16
