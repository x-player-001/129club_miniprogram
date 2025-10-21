# 129俱乐部后端API接口文档

## 基础信息

- **Base URL**: `http://localhost:3000/api`
- **认证方式**: JWT Token (Header: `Authorization: Bearer {token}`)
- **数据格式**: JSON

## 统一响应格式

```json
{
  "code": 0,           // 0=成功, 1=失败, 401=未认证, 403=无权限, 404=不存在
  "success": true,     // 是否成功
  "message": "操作成功", // 提示信息
  "data": {},          // 响应数据（可能为null）
  "timestamp": 1760625352165
}
```

---

## 1. 用户模块 `/api/user`

### 1.1 用户登录
- **接口**: `POST /user/login`
- **权限**: 无需认证
- **请求参数**:
```json
{
  "code": "微信登录code",
  "userInfo": {
    "nickname": "昵称",
    "avatar": "头像URL"
  }
}
```
- **响应示例**:
```json
{
  "code": 0,
  "success": true,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userInfo": {
      "id": "b7b291ec-05a8-4a2a-8504-53d789ef8d4c",
      "nickname": "微信用户",
      "realName": null,
      "avatar": "https://thirdwx.qlogo.cn/...",
      "role": "member",
      "memberType": "temporary",
      "status": "active",
      "currentTeamId": null,
      "jerseyNumber": null,
      "position": [],
      "isNewUser": true
    }
  },
  "timestamp": 1760617241357
}
```

### 1.2 获取用户信息
- **接口**: `GET /user/info`
- **权限**: 需要登录
- **响应示例**:
```json
{
  "code": 0,
  "success": true,
  "message": "操作成功",
  "data": {
    "id": "5bc76f4f-a2a3-450a-9bee-6d0af2e9333e",
    "nickname": "微信用户",
    "realName": "张三",
    "avatar": "https://...",
    "phone": "13800138000",
    "jerseyNumber": 10,
    "position": ["LB", "CB"],
    "role": "member",
    "memberType": "temporary",
    "status": "active",
    "currentTeamId": null,
    "joinDate": null,
    "createdAt": "2025-10-16T12:20:41.000Z",
    "updatedAt": "2025-10-16T12:27:37.000Z",
    "currentTeam": null,
    "stats": null
  },
  "timestamp": 1760624506789
}
```

### 1.3 更新用户信息
- **接口**: `PUT /user/info`
- **权限**: 需要登录
- **请求参数**:
```json
{
  "nickname": "新昵称",
  "realName": "真实姓名",
  "phone": "13800138000",
  "position": ["LB", "CB"],
  "jerseyNumber": 10,
  "memberType": "temporary",
  "avatar": "https://..."
}
```
- **响应示例**:
```json
{
  "code": 0,
  "success": true,
  "message": "更新成功",
  "data": {
    "id": "5bc76f4f-a2a3-450a-9bee-6d0af2e9333e",
    "nickname": "新昵称",
    "realName": "真实姓名",
    "avatar": "https://...",
    "phone": "13800138000",
    "jerseyNumber": 10,
    "position": ["LB", "CB"],
    "role": "member",
    "memberType": "temporary",
    "status": "active",
    "currentTeamId": null,
    "createdAt": "2025-10-16T12:20:41.000Z",
    "updatedAt": "2025-10-16T14:35:22.000Z"
  },
  "timestamp": 1760625322456
}
```

### 1.4 获取成员列表
- **接口**: `GET /user/members?status=active&teamId=xxx&page=1&pageSize=20`
- **权限**: 需要登录
- **查询参数**:
  - `status`: 状态筛选(active/inactive/leave)
  - `teamId`: 队伍ID筛选
  - `role`: 角色筛选(super_admin/captain/member)
  - `position`: 位置筛选(GK/CB/LB等，参考位置编码)
  - `keyword`: 关键词搜索(昵称/真实姓名)
  - `page`: 页码(默认1)
  - `pageSize`: 每页数量(默认20)
- **响应示例**:
```json
{
  "code": 0,
  "success": true,
  "message": "操作成功",
  "data": {
    "list": [
      {
        "id": "user-uuid",
        "nickname": "球员A",
        "realName": "张三",
        "avatar": "https://...",
        "phone": "138****8000",
        "jerseyNumber": 10,
        "position": ["LB", "RB"],
        "role": "member",
        "memberType": "regular",
        "status": "active",
        "currentTeamId": "team-uuid",
        "currentTeam": {
          "id": "team-uuid",
          "name": "红队",
          "logo": "https://..."
        },
        "stats": {
          "matchesPlayed": 15,
          "goals": 8,
          "assists": 5,
          "winRate": "60.00"
        }
      }
    ],
    "total": 50,
    "page": 1,
    "pageSize": 20,
    "totalPages": 3
  },
  "timestamp": 1760625400123
}
```

### 1.5 获取成员详情
- **接口**: `GET /user/members/:userId`
- **权限**: 需要登录
- **响应示例**: 同 1.2，但包含更详细的队伍成员关系信息

---

## 2. 队伍模块 `/api/team`

### 2.1 获取队伍列表
- **接口**: `GET /team/list?status=active&season=2025-S1&page=1&pageSize=20`
- **权限**: 需要登录
- **查询参数**:
  - `status`: 状态(active/disbanded)
  - `season`: 赛季
  - `page`, `pageSize`: 分页参数
- **响应示例**:
```json
{
  "code": 0,
  "success": true,
  "message": "操作成功",
  "data": {
    "list": [
      {
        "id": "6996d579-431f-4281-acf6-4c8bd0f76a20",
        "name": "红队",
        "logo": "https://...",
        "captainId": "captain-uuid",
        "color": "#FF0000",
        "season": "2025-S1",
        "status": "active",
        "createdAt": "2025-10-16T08:00:00.000Z",
        "captain": {
          "id": "captain-uuid",
          "nickname": "队长A",
          "avatar": "https://..."
        },
        "memberCount": 12,
        "stats": {
          "matchesPlayed": 10,
          "wins": 6,
          "draws": 2,
          "losses": 2,
          "winRate": "60.00"
        }
      }
    ],
    "total": 4,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1
  },
  "timestamp": 1760625500000
}
```

### 2.2 获取当前队伍（特殊接口）
- **接口**: `GET /team/current`
- **权限**: 需要登录
- **说明**: 获取当前用户所属队伍，如未加入队伍返回null
- **响应示例（未加入队伍）**:
```json
{
  "code": 0,
  "success": true,
  "message": "操作成功",
  "data": null,
  "timestamp": 1760625190878
}
```
- **响应示例（已加入队伍）**:
```json
{
  "code": 0,
  "success": true,
  "message": "操作成功",
  "data": {
    "id": "team-uuid",
    "name": "红队",
    "logo": "https://...",
    "color": "#FF0000",
    "season": "2025-S1",
    "status": "active",
    "captain": {
      "id": "captain-uuid",
      "nickname": "队长",
      "realName": "李四",
      "avatar": "https://..."
    },
    "members": [...],
    "stats": {...}
  },
  "timestamp": 1760625200000
}
```

### 2.3 获取队伍详情
- **接口**: `GET /team/:teamId`
- **权限**: 需要登录
- **响应示例**: 同 2.2 已加入队伍的示例

### 2.4 创建队伍
- **接口**: `POST /team`
- **权限**: 超级管理员
- **请求参数**:
```json
{
  "name": "红队",
  "captainId": "captain-user-uuid",
  "color": "#FF0000",
  "season": "2025-S1",
  "logo": "https://..."
}
```

### 2.5 更新队伍信息
- **接口**: `PUT /team/:teamId`
- **权限**: 队长或管理员
- **请求参数**: (所有字段可选)
```json
{
  "name": "新队名",
  "logo": "新队标URL",
  "color": "#0000FF",
  "captainId": "新队长ID"
}
```

### 2.6 获取队伍成员
- **接口**: `GET /team/:teamId/members`
- **权限**: 需要登录
- **响应示例**:
```json
{
  "code": 0,
  "success": true,
  "message": "操作成功",
  "data": [
    {
      "id": 1,
      "teamId": "team-uuid",
      "userId": "user-uuid-1",
      "role": "captain",
      "isActive": true,
      "joinedAt": "2025-10-15T08:00:00.000Z",
      "user": {
        "id": "user-uuid-1",
        "nickname": "队长张三",
        "realName": "张三",
        "avatar": "https://...",
        "jerseyNumber": 10,
        "position": ["CAM", "CM"],
        "stats": {
          "matchesPlayed": 15,
          "goals": 8,
          "assists": 12,
          "winRate": "66.67"
        }
      }
    },
    {
      "id": 2,
      "teamId": "team-uuid",
      "userId": "user-uuid-2",
      "role": "member",
      "isActive": true,
      "joinedAt": "2025-10-15T09:30:00.000Z",
      "user": {
        "id": "user-uuid-2",
        "nickname": "李四",
        "realName": "李四",
        "avatar": "https://...",
        "jerseyNumber": 7,
        "position": ["LW", "ST"],
        "stats": {
          "matchesPlayed": 12,
          "goals": 5,
          "assists": 3,
          "winRate": "58.33"
        }
      }
    }
  ],
  "timestamp": 1760626000000
}
```

### 2.7 获取队伍对战记录
- **接口**: `GET /team/vs?team1Id=xxx&team2Id=yyy`
- **权限**: 需要登录
- **查询参数**:
  - `team1Id`: 队伍1 ID (必填)
  - `team2Id`: 队伍2 ID (可选，不填则返回队伍1所有比赛)
- **响应示例**:
```json
{
  "code": 0,
  "success": true,
  "message": "操作成功",
  "data": {
    "matches": [
      {
        "id": "match-uuid-1",
        "title": "红队 vs 蓝队",
        "team1Id": "team-uuid-1",
        "team2Id": "team-uuid-2",
        "matchDate": "2025-10-15T14:00:00.000Z",
        "location": "129足球场",
        "status": "completed",
        "team1": {
          "id": "team-uuid-1",
          "name": "红队",
          "logo": "https://...",
          "color": "#FF0000"
        },
        "team2": {
          "id": "team-uuid-2",
          "name": "蓝队",
          "logo": "https://...",
          "color": "#0000FF"
        },
        "result": {
          "id": "result-uuid-1",
          "matchId": "match-uuid-1",
          "team1Score": 5,
          "team2Score": 3,
          "mvpUserId": "user-uuid-1",
          "summary": "精彩的进攻对决",
          "createdAt": "2025-10-15T16:00:00.000Z"
        }
      },
      {
        "id": "match-uuid-2",
        "title": "红队 vs 蓝队",
        "team1Id": "team-uuid-2",
        "team2Id": "team-uuid-1",
        "matchDate": "2025-10-08T14:00:00.000Z",
        "location": "129足球场",
        "status": "completed",
        "team1": {
          "id": "team-uuid-2",
          "name": "蓝队",
          "logo": "https://...",
          "color": "#0000FF"
        },
        "team2": {
          "id": "team-uuid-1",
          "name": "红队",
          "logo": "https://...",
          "color": "#FF0000"
        },
        "result": {
          "id": "result-uuid-2",
          "matchId": "match-uuid-2",
          "team1Score": 2,
          "team2Score": 2,
          "mvpUserId": "user-uuid-3",
          "summary": "势均力敌的平局",
          "createdAt": "2025-10-08T16:00:00.000Z"
        }
      }
    ],
    "summary": {
      "totalMatches": 2,
      "wins": 1,
      "draws": 1,
      "losses": 0,
      "goalsFor": 7,
      "goalsAgainst": 5,
      "goalDifference": 2,
      "winRate": "50.00"
    }
  },
  "timestamp": 1760626100000
}
```

---

## 3. 比赛模块 `/api/match`

### 3.1 获取比赛列表
- **接口**: `GET /match/list?status=registration&page=1&pageSize=20`
- **权限**: 需要登录
- **查询参数**:
  - `status`: 比赛状态(registration/in_progress/completed/cancelled)
  - `page`, `pageSize`: 分页
- **响应示例**:
```json
{
  "code": 0,
  "success": true,
  "message": "操作成功",
  "data": {
    "list": [
      {
        "id": "match-uuid",
        "title": "红队 vs 蓝队",
        "team1Id": "team1-uuid",
        "team2Id": "team2-uuid",
        "matchDate": "2025-10-20T14:00:00.000Z",
        "location": "129足球场",
        "status": "registration",
        "registrationDeadline": "2025-10-19T12:00:00.000Z",
        "maxPlayersPerTeam": 11,
        "team1": {
          "id": "team1-uuid",
          "name": "红队",
          "logo": "https://...",
          "color": "#FF0000"
        },
        "team2": {
          "id": "team2-uuid",
          "name": "蓝队",
          "logo": "https://...",
          "color": "#0000FF"
        },
        "result": null,
        "team1RegisteredCount": 8,
        "team2RegisteredCount": 9
      }
    ],
    "total": 15,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1
  },
  "timestamp": 1760625600000
}
```

### 3.2 获取比赛详情
- **接口**: `GET /match/:matchId`
- **权限**: 需要登录
- **响应示例**: 同 3.1 list 中的单个元素结构

### 3.3 创建比赛
- **接口**: `POST /match`
- **权限**: 管理员或队长
- **请求参数**:
```json
{
  "title": "红队 vs 蓝队 - 周末友谊赛",
  "team1Id": "team1-uuid",
  "team2Id": "team2-uuid",
  "matchDate": "2025-10-20T14:00:00Z",
  "location": "129足球场",
  "registrationDeadline": "2025-10-19T12:00:00Z",
  "maxPlayersPerTeam": 11,
  "quarterSystem": false
}
```
- **参数说明**:
  - `quarterSystem`: 是否为4节制比赛（可选，默认false）。设为true时，比赛将采用4节制计分规则，需使用4节制录入接口（详见第4章节）

### 3.4 更新比赛信息
- **接口**: `PUT /match/:matchId`
- **权限**: 创建者或管理员

### 3.5 报名比赛
- **接口**: `POST /match/:matchId/register`
- **权限**: 需要登录且属于参赛队伍

### 3.6 取消报名
- **接口**: `DELETE /match/:matchId/register`
- **权限**: 需要登录

### 3.7 获取报名列表
- **接口**: `GET /match/:matchId/registration`
- **权限**: 需要登录
- **响应示例**:
```json
{
  "code": 0,
  "success": true,
  "message": "操作成功",
  "data": {
    "team1": [
      {
        "id": "registration-uuid",
        "matchId": "match-uuid",
        "userId": "user-uuid",
        "teamId": "team1-uuid",
        "status": "registered",
        "notes": "",
        "user": {
          "id": "user-uuid",
          "nickname": "球员A",
          "avatar": "https://...",
          "jerseyNumber": 10,
          "position": ["LB", "CB"]
        }
      }
    ],
    "team2": [...],
    "team1Count": 8,
    "team2Count": 9
  },
  "timestamp": 1760625700000
}
```

### 3.8 设置比赛阵容
- **接口**: `POST /match/:matchId/lineup`
- **权限**: 队长

### 3.9 记录比赛事件
- **接口**: `POST /match/:matchId/event`
- **权限**: 需要登录
- **请求参数**:
```json
{
  "teamId": "team-uuid",
  "userId": "player-uuid",
  "eventType": "goal",
  "eventSubtype": "own_goal",
  "minute": 35,
  "assistUserId": "assist-player-uuid",
  "notes": "备注信息"
}
```
- **参数说明**:
  - `eventType`: 事件类型 (`goal` / `assist` / `yellow_card` / `red_card` / `substitution_in` / `substitution_out`)
  - `eventSubtype`: 事件子类型（可选），支持的值见下表
  - **乌龙球记录**：当 `eventType = 'goal'` 且 `eventSubtype = 'own_goal'` 时，`teamId` 必须是踢乌龙球球员**自己的队伍ID**，比分计入对方

**支持的事件子类型 (eventSubtype)**:

| event_type | eventSubtype | 说明 |
|-----------|--------------|------|
| `goal` | `null` 或不传 | 普通进球 |
| `goal` | `own_goal` | ⚠️ 乌龙球（不计入球员进球数） |
| `goal` | `penalty` | 点球 |
| `goal` | `free_kick` | 任意球破门 |
| `goal` | `corner_kick` | 角球破门 |
| `goal` | `header` | 头球 |
| `goal` | `volley` | 凌空抽射 |
| `goal` | `bicycle_kick` | 倒钩 |
| `goal` | `long_shot` | 远射 |
| `yellow_card` / `red_card` | `foul` | 犯规 |
| `yellow_card` / `red_card` | `diving` | 假摔 |
| `yellow_card` / `red_card` | `dissent` | 异议 |
| `yellow_card` / `red_card` | `violent_conduct` | 暴力行为 |
| `red_card` | `second_yellow` | 两黄变红 |

**示例 - 记录乌龙球**:
```json
{
  "teamId": "red-team-uuid",        // 踢乌龙球球员自己的队伍
  "userId": "player-uuid",           // 踢乌龙球的球员
  "eventType": "goal",
  "eventSubtype": "own_goal",        // 标记为乌龙球
  "minute": 35,
  "notes": "禁区内解围失误"
}
```

**示例 - 记录点球**:
```json
{
  "teamId": "red-team-uuid",
  "userId": "player-uuid",
  "eventType": "goal",
  "eventSubtype": "penalty",         // 标记为点球
  "minute": 78,
  "notes": "12码点球命中"
}
```

### 3.10 提交比赛结果
- **接口**: `POST /match/:matchId/result`
- **权限**: 需要登录

### 3.11 取消比赛
- **接口**: `PUT /match/:matchId/cancel`
- **权限**: 创建者或管理员

---

## 4. 4节制比赛录入模块 `/api/match/:matchId/quarter`

### 4.1 录入单个节次（支持碎片化录入）
- **接口**: `POST /match/:matchId/quarter`
- **权限**: 需要登录
- **说明**: 支持三种录入模式，满足不同场景需求
- **请求参数**:
```json
{
  "quarterNumber": 1,
  "team1Goals": 3,
  "team2Goals": 1,
  "mode": "overwrite",
  "summary": "第1节比赛精彩，红队3:1领先",
  "events": [
    {
      "teamId": "team1-uuid",
      "userId": "player1-uuid",
      "eventType": "goal",
      "eventSubtype": "long_shot",
      "minute": 5,
      "notes": "远射破门"
    },
    {
      "teamId": "team1-uuid",
      "userId": "player2-uuid",
      "eventType": "goal",
      "minute": 10,
      "assistUserId": "player1-uuid",
      "notes": "头球"
    },
    {
      "teamId": "team2-uuid",
      "userId": "player3-uuid",
      "eventType": "goal",
      "minute": 15
    }
  ]
}
```

**参数说明**:
- `quarterNumber`: 节次编号（1-4）**必填**
- `team1Goals`: 队伍1在本节的进球数（mode为auto时可选）
- `team2Goals`: 队伍2在本节的进球数（mode为auto时可选）
- `mode`: 录入模式（可选，默认 `overwrite`）
  - `overwrite` - **覆盖模式**（默认）：清空该节次所有旧事件，重新录入，**自动标记为已完成**。适用场景：批量录入、修正错误数据
  - `append` - **追加模式**：保留旧事件，只添加新事件，**默认标记为进行中**（需配合 `isCompleted` 参数）。适用场景：实时碎片化录入（边比赛边记录）
  - `auto` - **自动模式**：根据事件自动统计比分，无需手动传 `team1Goals`/`team2Goals`，**默认标记为进行中**（需配合 `isCompleted` 参数）。适用场景：只记录事件，系统自动计分
- `isCompleted`: 是否标记该节次为已完成（可选，默认false）
  - `true` - 标记为已完成（completed），表示该节次比赛结束
  - `false` - 标记为进行中（in_progress），表示该节次还在进行中
  - **注意**：`overwrite` 模式会忽略此参数，自动标记为已完成；`append`/`auto` 模式可通过此参数控制节次状态
- `deleteEventIds`: 要删除的事件ID列表（可选，默认[]），**仅在 `append`/`auto` 模式下生效**
  - 用于碎片化录入时删除特定的事件记录
  - 示例：`["event-uuid-1", "event-uuid-2"]`
  - **注意**：`overwrite` 模式会删除所有旧事件，无需此参数
- `summary`: 本节总结（可选）
- `events`: 事件列表（可选），每个事件支持的字段：
  - `teamId`: 队伍ID **必填**
  - `userId`: 球员ID **必填**
  - `eventType`: 事件类型 **必填** (`goal` / `assist` / `yellow_card` / `red_card` / `substitution_in` / `substitution_out`)
  - `eventSubtype`: 事件子类型（可选，如 `own_goal`、`penalty`、`free_kick` 等，详见 3.9 事件子类型表）
  - `minute`: 发生时间（分钟）
  - `assistUserId`: 助攻者ID（仅进球事件）
  - `notes`: 备注

**响应示例**:
```json
{
  "code": 0,
  "success": true,
  "message": "操作成功",
  "data": {
    "quarter": {
      "id": "quarter-uuid",
      "matchId": "match-uuid",
      "quarterNumber": 1,
      "team1Goals": 3,
      "team2Goals": 1,
      "team1Points": 1,
      "team2Points": 0,
      "summary": "第1节比赛精彩，红队3:1领先",
      "createdAt": "2025-10-17T10:00:00.000Z",
      "updatedAt": "2025-10-17T10:15:00.000Z"
    },
    "events": [
      {
        "id": "event-uuid-1",
        "matchId": "match-uuid",
        "quarterNumber": 1,
        "teamId": "team1-uuid",
        "userId": "player1-uuid",
        "eventType": "goal",
        "eventSubtype": "long_shot",
        "minute": 5,
        "notes": "远射破门",
        "recordedBy": "recorder-uuid",
        "recordedAt": "2025-10-17T10:05:00.000Z"
      }
    ],
    "mode": "overwrite",
    "currentScore": {
      "team1FinalScore": 1,
      "team2FinalScore": 0,
      "team1TotalGoals": 3,
      "team2TotalGoals": 1,
      "quartersCompleted": 1
    }
  },
  "timestamp": 1760627000000
}
```

**响应字段说明**:
- `quarter`: 节次记录
  - `team1Points` / `team2Points`: 本节得分（第1、2节获胜得1分，第3、4节获胜得2分，平局得0分）
  - `status`: 节次状态（`in_progress` = 进行中，`completed` = 已完成）
- `events`: 本次创建的事件列表
- `deletedEventCount`: 本次删除的事件数量（仅在使用 `deleteEventIds` 参数时有值）
- `mode`: 实际使用的录入模式
- `currentScore`: 比赛当前累计得分
  - `team1FinalScore` / `team2FinalScore`: 累计得分（根据4节制规则计算）
  - `team1TotalGoals` / `team2TotalGoals`: 累计进球数
  - `quartersCompleted`: **已完成**的节次数（只统计status='completed'的节次）

### 4.2 批量录入完整4节比赛
- **接口**: `POST /match/:matchId/complete-quarters`
- **权限**: 需要登录
- **说明**: 一次性录入完整4节比赛数据（适合赛后批量录入）
- **请求参数**:
```json
{
  "quarters": [
    {
      "quarterNumber": 1,
      "team1Goals": 2,
      "team2Goals": 1,
      "summary": "第1节红队领先",
      "events": [
        {
          "teamId": "team1-uuid",
          "userId": "player1-uuid",
          "eventType": "goal",
          "minute": 5
        }
      ]
    },
    {
      "quarterNumber": 2,
      "team1Goals": 1,
      "team2Goals": 1,
      "summary": "第2节势均力敌"
    },
    {
      "quarterNumber": 3,
      "team1Goals": 2,
      "team2Goals": 0,
      "summary": "第3节红队扩大优势"
    },
    {
      "quarterNumber": 4,
      "team1Goals": 1,
      "team2Goals": 2,
      "summary": "第4节蓝队追分"
    }
  ],
  "participants": {
    "team1": ["player1-uuid", "player2-uuid"],
    "team2": ["player3-uuid", "player4-uuid"]
  },
  "mvpUserIds": ["player1-uuid"],
  "summary": "比赛总结"
}
```

**响应示例**:
```json
{
  "code": 0,
  "success": true,
  "message": "操作成功",
  "data": {
    "quarters": [...],
    "result": {
      "id": "result-uuid",
      "matchId": "match-uuid",
      "team1Score": 6,
      "team2Score": 4,
      "quarterSystem": true,
      "team1FinalScore": 4,
      "team2FinalScore": 2,
      "winnerTeamId": "team1-uuid",
      "mvpUserId": "player1-uuid"
    },
    "finalScore": {
      "team1FinalScore": 4,
      "team2FinalScore": 2,
      "team1TotalGoals": 6,
      "team2TotalGoals": 4
    }
  },
  "timestamp": 1760627100000
}
```

### 4.3 获取比赛详情（含节次数据）
- **接口**: `GET /match/:matchId/detail`
- **权限**: 需要登录
- **响应示例**:
```json
{
  "code": 0,
  "success": true,
  "message": "操作成功",
  "data": {
    "id": "match-uuid",
    "title": "红队 vs 蓝队",
    "quarterSystem": true,
    "finalTeam1Score": 4,
    "finalTeam2Score": 2,
    "status": "completed",
    "team1": {...},
    "team2": {...},
    "quarters": [
      {
        "quarterNumber": 1,
        "team1Goals": 2,
        "team2Goals": 1,
        "team1Points": 1,
        "team2Points": 0,
        "summary": "第1节红队领先"
      },
      {
        "quarterNumber": 2,
        "team1Goals": 1,
        "team2Goals": 1,
        "team1Points": 0,
        "team2Points": 0,
        "summary": "第2节势均力敌"
      }
    ],
    "events": [...],
    "participants": {
      "team1": [...],
      "team2": [...]
    },
    "result": {...}
  },
  "timestamp": 1760627200000
}
```

### 4.4 获取球员比赛统计
- **接口**: `GET /match/:matchId/player-stats`
- **权限**: 需要登录
- **说明**: 获取本场比赛各球员的事件统计
- **响应示例**:
```json
{
  "code": 0,
  "success": true,
  "message": "操作成功",
  "data": [
    {
      "userId": "player1-uuid",
      "user": {
        "id": "player1-uuid",
        "nickname": "张三",
        "realName": "张三",
        "avatar": "https://..."
      },
      "goals": 3,
      "assists": 2,
      "saves": 0,
      "refereeCount": 0,
      "yellowCards": 0,
      "redCards": 0,
      "quarters": [1, 2, 3]
    }
  ],
  "timestamp": 1760627300000
}
```

### 4.5 解析比赛简报（AI）- 异步任务
- **接口**: `POST /match/parse-report`
- **权限**: 需要登录
- **说明**: 使用AI解析比赛简报文本，自动提取比赛数据。由于AI处理耗时较长(20-30秒)，采用异步任务模式，立即返回任务ID，前端通过轮询查询任务状态
- **请求参数**:
```json
{
  "reportText": "2025年10月15日，在129足球场进行了一场精彩的比赛...",
  "autoCreate": false,
  "useAI": true,
  "fallbackToRegex": true
}
```
- **参数说明**:
  - `reportText`: 简报文本内容 **必填**
  - `autoCreate`: 是否自动创建比赛（默认false）。当设为true且匹配无误时，自动创建比赛并录入数据
  - `useAI`: 是否使用AI解析（默认true）
  - `fallbackToRegex`: AI失败时是否回退到正则解析（默认true）

**响应示例 - 任务创建成功**:
```json
{
  "code": 0,
  "success": true,
  "message": "操作成功",
  "data": {
    "taskId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "pending",
    "message": "解析任务已创建，请通过任务ID查询进度"
  },
  "timestamp": 1760627400000
}
```

### 4.6 查询解析任务状态
- **接口**: `GET /match/parse-report/:taskId`
- **权限**: 需要登录
- **说明**: 查询AI解析任务的状态和结果，建议前端每1-2秒轮询一次，直到状态变为completed或failed
- **响应示例 - 任务处理中**:
```json
{
  "code": 0,
  "success": true,
  "message": "操作成功",
  "data": {
    "taskId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "processing",
    "progress": 60,
    "progressMessage": "正在匹配参赛人员...",
    "createdAt": "2025-10-17T10:00:00.000Z",
    "startedAt": "2025-10-17T10:00:01.000Z",
    "completedAt": null
  },
  "timestamp": 1760627410000
}
```

**响应示例 - 任务完成**:
```json
{
  "code": 0,
  "success": true,
  "message": "操作成功",
  "data": {
    "taskId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "completed",
    "progress": 100,
    "progressMessage": "解析完成",
    "createdAt": "2025-10-17T10:00:00.000Z",
    "startedAt": "2025-10-17T10:00:01.000Z",
    "completedAt": "2025-10-17T10:00:28.000Z",
    "result": {
      "parsed": {
        "basicInfo": {
          "date": "2025-10-15",
          "location": "129足球场",
          "team1Name": "红队",
          "team2Name": "蓝队"
        },
        "quarters": [...],
        "participants": {...}
      },
      "matched": {
        "team1": {...},
        "team2": {...},
        "team1Participants": [...],
        "team2Participants": [...]
      },
      "warnings": [],
      "created": false,
      "matchId": "match-uuid-if-auto-created"
    }
  },
  "timestamp": 1760627428000
}
```

**响应示例 - 任务失败**:
```json
{
  "code": 0,
  "success": true,
  "message": "操作成功",
  "data": {
    "taskId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "failed",
    "progress": 30,
    "progressMessage": "解析失败",
    "createdAt": "2025-10-17T10:00:00.000Z",
    "startedAt": "2025-10-17T10:00:01.000Z",
    "completedAt": "2025-10-17T10:00:10.000Z",
    "error": "AI返回的JSON格式无效"
  },
  "timestamp": 1760627410000
}
```

**任务状态说明**:
- `pending`: 等待处理
- `processing`: 处理中
- `completed`: 已完成
- `failed`: 失败

**前端轮询示例**:
```javascript
// 1. 提交解析任务
const submitRes = await wx.request({
  url: '/api/match/parse-report',
  method: 'POST',
  data: { reportText: '...' }
});

const taskId = submitRes.data.data.taskId;

// 2. 轮询查询任务状态
const pollTask = setInterval(async () => {
  const statusRes = await wx.request({
    url: `/api/match/parse-report/${taskId}`,
    method: 'GET'
  });

  const task = statusRes.data.data;

  // 更新进度UI
  updateProgress(task.progress, task.progressMessage);

  // 任务完成
  if (task.status === 'completed') {
    clearInterval(pollTask);
    handleSuccess(task.result);
  }

  // 任务失败
  if (task.status === 'failed') {
    clearInterval(pollTask);
    handleError(task.error);
  }
}, 2000); // 每2秒轮询一次
```

### 4节制计分规则说明

**得分规则**:
- 第1节：获胜得1分，平局得0分
- 第2节：获胜得1分，平局得0分
- 第3节：获胜得2分，平局得0分
- 第4节：获胜得2分，平局得0分

**示例**:
```
第1节: 红队 2-1 蓝队  →  红队 +1分
第2节: 红队 1-1 蓝队  →  平局，双方 +0分
第3节: 红队 2-0 蓝队  →  红队 +2分
第4节: 红队 1-2 蓝队  →  蓝队 +2分

最终得分: 红队 3分，蓝队 2分
最终进球: 红队 6球，蓝队 4球
```

### 碎片化录入使用场景

#### 场景1: 实时边比赛边记录
```bash
# 第1节第5分钟，player1进球
POST /api/match/{matchId}/quarter
{
  "quarterNumber": 1,
  "mode": "append",
  "team1Goals": 1,
  "team2Goals": 0,
  "events": [{"teamId": "team1", "userId": "player1", "eventType": "goal", "minute": 5}]
}

# 第1节第10分钟，player2又进球
POST /api/match/{matchId}/quarter
{
  "quarterNumber": 1,
  "mode": "append",
  "team1Goals": 2,
  "team2Goals": 0,
  "events": [{"teamId": "team1", "userId": "player2", "eventType": "goal", "minute": 10}]
}

# 第1节第15分钟，player3进球
POST /api/match/{matchId}/quarter
{
  "quarterNumber": 1,
  "mode": "append",
  "team1Goals": 2,
  "team2Goals": 1,
  "events": [{"teamId": "team2", "userId": "player3", "eventType": "goal", "minute": 15}]
}
```

#### 场景2: 返回修改历史节次
```bash
# 正在录入第3节时，发现第1节数据有误，需要返回修改
POST /api/match/{matchId}/quarter
{
  "quarterNumber": 1,
  "mode": "overwrite",
  "team1Goals": 3,
  "team2Goals": 1,
  "summary": "第1节比赛精彩，红队3:1领先（已修正）",
  "events": [
    {"teamId": "team1", "userId": "player1", "eventType": "goal", "minute": 5},
    {"teamId": "team1", "userId": "player2", "eventType": "goal", "minute": 10},
    {"teamId": "team2", "userId": "player3", "eventType": "goal", "minute": 15},
    {"teamId": "team1", "userId": "player1", "eventType": "goal", "minute": 18, "notes": "补录的进球"}
  ]
}
```

#### 场景3: 自动统计比分
```bash
# 只记录事件，系统自动计算比分（支持乌龙球等特殊情况）
POST /api/match/{matchId}/quarter
{
  "quarterNumber": 3,
  "mode": "auto",
  "events": [
    {"teamId": "team1", "userId": "player2", "eventType": "goal", "minute": 45},
    {"teamId": "team2", "userId": "player4", "eventType": "goal", "eventSubtype": "own_goal", "minute": 50}
  ]
}
# 系统自动计算: team1 = 2球, team2 = 0球（乌龙球计入对方）
```

---

## 5. 统计模块 `/api/stats`

### 5.1 获取球员统计
- **接口**: `GET /stats/player/:userId?season=2025-S1&teamId=xxx`
- **权限**: 需要登录

### 5.2 获取队伍统计
- **接口**: `GET /stats/team/:teamId?season=2025-S1`
- **权限**: 需要登录

### 5.3 获取排行榜
- **接口**: `GET /stats/ranking/:type?season=2025-S1&teamId=xxx&page=1&pageSize=20`
- **权限**: 需要登录
- **路径参数**:
  - `type`: goals(射手榜) | assists(助攻榜) | mvp(MVP榜) | attendance(出勤榜)

### 5.4 获取数据总览
- **接口**: `GET /stats/overview`
- **权限**: 需要登录

### 5.5 队伍对比
- **接口**: `GET /stats/team-compare?team1Id=xxx&team2Id=yyy`
- **权限**: 需要登录

---

## 6. 通知公告模块 `/api/notice`

### 6.1 获取公告列表
- **接口**: `GET /notice/list?type=announcement&page=1&pageSize=20`
- **权限**: 需要登录
- **查询参数**:
  - `type`: 类型筛选(announcement/match/team/system)
  - `page`, `pageSize`: 分页
- **响应示例**:
```json
{
  "code": 0,
  "success": true,
  "message": "操作成功",
  "data": {
    "list": [
      {
        "id": "notice-uuid",
        "title": "欢迎加入129俱乐部",
        "content": "欢迎各位球友...",
        "type": "announcement",
        "priority": "high",
        "isPinned": true,
        "viewCount": 156,
        "publishedAt": "2025-10-16T08:00:00.000Z",
        "expiresAt": null,
        "publisher": {
          "id": "admin-uuid",
          "nickname": "管理员",
          "avatar": "https://..."
        }
      }
    ],
    "total": 10,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1
  },
  "timestamp": 1760625800000
}
```

### 6.2 获取公告详情
- **接口**: `GET /notice/:noticeId`
- **权限**: 需要登录
- **说明**: 自动增加查看次数+1

### 6.3 发布公告
- **接口**: `POST /notice`
- **权限**: 管理员或队长
- **请求参数**:
```json
{
  "title": "重要通知",
  "content": "本周六14:00进行队内对抗赛...",
  "type": "announcement",
  "priority": "high",
  "isPinned": false,
  "expiresAt": "2025-10-30T23:59:59Z"
}
```

### 6.4 更新公告
- **接口**: `PUT /notice/:noticeId`
- **权限**: 发布者或管理员

### 6.5 删除公告
- **接口**: `DELETE /notice/:noticeId`
- **权限**: 发布者或管理员

---

## 7. 位置字典模块 `/api/position`

### 7.1 获取位置列表
- **接口**: `GET /position/list?category=DF`
- **权限**: 无需认证
- **查询参数**:
  - `category`: 位置类别(GK/DF/MF/FW，可选)
  - `isActive`: 是否启用(默认true)
- **响应示例**:
```json
{
  "code": 0,
  "success": true,
  "message": "操作成功",
  "data": [
    {
      "id": 1,
      "code": "GK",
      "name": "守门员",
      "nameEn": "Goalkeeper",
      "category": "GK",
      "sortOrder": 1,
      "isActive": true,
      "description": "守门员"
    },
    {
      "id": 5,
      "code": "LB",
      "name": "左后卫",
      "nameEn": "Left Back",
      "category": "DF",
      "sortOrder": 13,
      "isActive": true,
      "description": "左路防守"
    }
  ],
  "timestamp": 1760624558304
}
```

### 7.2 按类别分组获取位置
- **接口**: `GET /position/grouped`
- **权限**: 无需认证
- **说明**: 返回按GK/DF/MF/FW分组的位置列表
- **响应示例**:
```json
{
  "code": 0,
  "success": true,
  "message": "操作成功",
  "data": {
    "GK": [
      {
        "id": 1,
        "code": "GK",
        "name": "守门员",
        "nameEn": "Goalkeeper",
        "category": "GK",
        "sortOrder": 1,
        "isActive": true,
        "description": "守门员"
      }
    ],
    "DF": [
      {
        "id": 2,
        "code": "CB",
        "name": "中后卫",
        "nameEn": "Center Back",
        "category": "DF",
        "sortOrder": 10,
        "isActive": true,
        "description": "中路防守核心"
      },
      {
        "id": 5,
        "code": "LB",
        "name": "左后卫",
        "nameEn": "Left Back",
        "category": "DF",
        "sortOrder": 13,
        "isActive": true,
        "description": "左路防守"
      }
    ],
    "MF": [...],
    "FW": [...]
  },
  "timestamp": 1760624566562
}
```

### 位置编码说明

| 分类 | 编码 | 中文名称 | 英文名称 |
|------|------|---------|---------|
| **守门员** | GK | 守门员 | Goalkeeper |
| **后卫** | CB | 中后卫 | Center Back |
| | LCB | 左中卫 | Left Center Back |
| | RCB | 右中卫 | Right Center Back |
| | LB | 左后卫 | Left Back |
| | RB | 右后卫 | Right Back |
| | LWB | 左边后卫 | Left Wing Back |
| | RWB | 右边后卫 | Right Wing Back |
| | SW | 清道夫 | Sweeper |
| **中场** | CDM | 后腰 | Defensive Midfielder |
| | CM | 中前卫 | Central Midfielder |
| | CAM | 前腰 | Attacking Midfielder |
| | LM | 左前卫 | Left Midfielder |
| | RM | 右前卫 | Right Midfielder |
| | LW | 左边锋 | Left Winger |
| | RW | 右边锋 | Right Winger |
| **前锋** | CF | 中锋 | Center Forward |
| | ST | 前锋 | Striker |
| | LF | 左前锋 | Left Forward |
| | RF | 右前锋 | Right Forward |
| | SS | 影锋 | Second Striker |

---

## 常见错误码

| code | 说明 |
|------|------|
| 0 | 操作成功 |
| 1 | 业务错误(message中包含详细错误信息) |
| 400 | 请求参数错误 |
| 401 | 未登录或Token无效 |
| 403 | 无权限访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 角色权限说明

### super_admin (超级管理员)
- 所有权限
- 可创建队伍、发起重组

### captain (队长)
- 发布公告
- 创建比赛
- 设置阵容
- 更新队伍信息

### member (普通成员)
- 查看信息
- 报名比赛
- 更新个人信息

---

## 使用示例

### 示例1: 用户登录流程

```javascript
// 1. 前端调用微信登录
wx.login({
  success: (res) => {
    const code = res.code;

    // 2. 获取用户信息
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (userRes) => {
        // 3. 发送登录请求
        wx.request({
          url: 'http://localhost:3000/api/user/login',
          method: 'POST',
          data: {
            code: code,
            userInfo: {
              nickname: userRes.userInfo.nickName,
              avatar: userRes.userInfo.avatarUrl
            }
          },
          success: (loginRes) => {
            // 4. 保存token
            wx.setStorageSync('token', loginRes.data.data.token);
          }
        });
      }
    });
  }
});
```

### 示例2: 更新用户位置

```javascript
// 1. 获取位置列表
wx.request({
  url: 'http://localhost:3000/api/position/grouped',
  success: (res) => {
    // res.data.data.DF 包含所有后卫位置
    // 用户选择 "左后卫" (code: "LB")
  }
});

// 2. 更新用户位置
wx.request({
  url: 'http://localhost:3000/api/user/info',
  method: 'PUT',
  header: {
    'Authorization': 'Bearer ' + wx.getStorageSync('token')
  },
  data: {
    position: ['LB', 'CB'],  // 使用位置编码数组，支持多选
    jerseyNumber: 3,
    realName: '张三'
  }
});
```

### 示例3: 完整的比赛流程

```bash
# 1. 队长创建比赛
POST /api/match
{
  "title": "红队 vs 蓝队",
  "team1Id": "red_team_id",
  "team2Id": "blue_team_id",
  "matchDate": "2025-10-20T14:00:00Z",
  "location": "129足球场"
}

# 2. 球员报名
POST /api/match/{matchId}/register

# 3. 查看报名情况
GET /api/match/{matchId}/registration

# 4. 队长设置阵容
POST /api/match/{matchId}/lineup
{
  "teamId": "red_team_id",
  "lineups": [...]
}

# 5. 比赛开始，更新状态
PUT /api/match/{matchId}
{ "status": "in_progress" }

# 6. 记录进球
POST /api/match/{matchId}/event
{
  "type": "goal",
  "userId": "player_id",
  "teamId": "red_team_id",
  "minute": 15,
  "assistUserId": "assist_player_id"
}

# 7. 提交比赛结果
POST /api/match/{matchId}/result
{
  "team1Score": 5,
  "team2Score": 3,
  "mvpUserId": "mvp_player_id"
}

# 8. 查看统计数据
GET /api/stats/player/{userId}
GET /api/stats/ranking/goals
```

---

## 注意事项

1. **认证**: 大部分接口需要在请求头中携带JWT Token
2. **时间格式**: 所有时间字段使用ISO 8601格式 (如: `2025-10-20T14:00:00Z`)
3. **位置字段**: 用户的 `position` 字段为数组格式，支持多选位置 (如: `["LB", "CB"]`, `["CAM", "CM", "CDM"]`)，需要通过 `/api/position/list` 获取完整位置列表
4. **队员类型**: 用户的 `memberType` 字段为枚举类型，`temporary` 表示临时队员（默认值），`regular` 表示正式队员
5. **队伍查询**: `GET /api/team/current` 查询不到队伍时返回 `null`，不是错误
6. **分页**: 默认 `page=1`, `pageSize=20`，最大 `pageSize=100`
7. **UUID**: 所有ID字段均为UUID格式

---

**文档版本**: v1.7
**更新日期**: 2025-10-17
**已实现接口**: 38个
**更新内容**:
- v1.7 (2025-10-17): 增加节次状态管理（status字段），支持标记节次为进行中/已完成，修正quartersCompleted统计逻辑，新增isCompleted参数
- v1.6 (2025-10-17): AI简报解析改为异步任务模式，解决超时问题，新增任务状态查询接口，新增2个API接口
- v1.5 (2025-10-17): 新增4节制比赛录入模块，支持碎片化录入（3种模式：overwrite/append/auto），新增5个API接口
- v1.4 (2025-10-17): 队员类型默认值修改为 temporary（临时队员）
- v1.3 (2025-10-17): 新增队员类型字段 (memberType)，区分正式队员和临时队员
- v1.2 (2025-10-16): 位置字段支持多选，存储格式改为JSON数组
