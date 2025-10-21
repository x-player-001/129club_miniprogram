# Achievement System API

## Overview

The achievement system automatically checks and unlocks achievements when match results are submitted. Users receive notifications when they unlock achievements.

## Available Achievements

| Icon | Name | Condition | Season Bound | Repeatable |
|------|------|-----------|--------------|------------|
| <© | Hat Trick | 3 goals in a single match | Yes | Yes |
| <¯ | Assist King | 3 assists in a single match | Yes | Yes |
| =Å | Perfect Attendance | 100% attendance rate | Yes | No |
| P | MVP Collector | 5 MVP awards in season | Yes | No |
| ½ | Goal Machine | 10 goals in season | Yes | No |
| =% | Winning Streak | 3 consecutive wins | Yes | Yes |

---

## Achievement APIs

### 1. Get All Achievements

Get all available achievements.

**Endpoint:** `GET /api/achievement/list`

**Response:**
```json
{
  "code": 0,
  "success": true,
  "data": [
    {
      "id": "xxx",
      "code": "hat_trick",
      "name": "Hat Trick",
      "description": "Score 3 goals in a single match",
      "icon": "<©",
      "isSeasonBound": true,
      "isRepeatable": true
    }
  ]
}
```

---

### 2. Get My Achievement Progress

Get current user's achievement progress (locked + unlocked).

**Endpoint:** `GET /api/achievement/my/progress?seasonId=xxx`

**Query Parameters:**
- `seasonId` (optional): Filter by season ID

**Response:**
```json
{
  "code": 0,
  "success": true,
  "data": [
    {
      "id": "xxx",
      "code": "hat_trick",
      "name": "Hat Trick",
      "icon": "<©",
      "unlocked": true,
      "unlockCount": 2,
      "unlockedAt": "2025-10-20T10:30:00.000Z"
    },
    {
      "id": "yyy",
      "code": "assist_king",
      "name": "Assist King",
      "icon": "<¯",
      "unlocked": false,
      "unlockCount": 0,
      "unlockedAt": null
    }
  ]
}
```

---

### 3. Get My Unlocked Achievements

Get only unlocked achievements.

**Endpoint:** `GET /api/achievement/my?seasonId=xxx`

**Query Parameters:**
- `seasonId` (optional): Filter by season ID

**Response:**
```json
{
  "code": 0,
  "success": true,
  "data": [
    {
      "id": "xxx",
      "code": "hat_trick",
      "name": "Hat Trick",
      "icon": "<©",
      "unlockCount": 2,
      "unlockedAt": "2025-10-20T10:30:00.000Z",
      "matchId": "match-id-123"
    }
  ]
}
```

---

## Notification APIs

### 1. Get Notifications

Get user notifications.

**Endpoint:** `GET /api/notification/list`

**Query Parameters:**
- `isRead` (optional): Filter by read status (`true`/`false`)
- `isShown` (optional): Filter by shown status (`true`/`false`)
- `type` (optional): Filter by type (`achievement`/`match`/`system`)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "code": 0,
  "success": true,
  "data": {
    "list": [
      {
        "id": "xxx",
        "type": "achievement",
        "title": "Achievement Unlocked!",
        "content": "Congratulations! You have unlocked the achievement: Hat Trick!",
        "data": {
          "achievementId": "xxx",
          "achievementCode": "hat_trick",
          "achievementName": "Hat Trick",
          "achievementIcon": "<©",
          "unlockCount": 1
        },
        "isRead": false,
        "isShown": false,
        "createdAt": "2025-10-20T10:30:00.000Z"
      }
    ],
    "total": 10,
    "page": 1,
    "limit": 20
  }
}
```

---

### 2. Get Unread Count

Get count of unread notifications.

**Endpoint:** `GET /api/notification/unread-count`

**Response:**
```json
{
  "code": 0,
  "success": true,
  "data": {
    "count": 3
  }
}
```

---

### 3. Mark as Read

Mark a notification as read.

**Endpoint:** `POST /api/notification/:id/read`

**Response:**
```json
{
  "code": 0,
  "success": true,
  "message": "Marked as read"
}
```

---

### 4. Mark as Shown

Mark a notification as shown (after displaying celebration animation).

**Endpoint:** `POST /api/notification/:id/shown`

**Response:**
```json
{
  "code": 0,
  "success": true,
  "message": "Marked as shown"
}
```

---

### 5. Delete Notification

Delete a notification.

**Endpoint:** `DELETE /api/notification/:id`

**Response:**
```json
{
  "code": 0,
  "success": true,
  "message": "Notification deleted"
}
```

---

## Usage Flow

### 1. After Match Result Submission

When a user submits match result via `/api/match/:matchId/supplement-result`, the system:
1. Automatically checks achievements for all participants
2. Creates notifications for newly unlocked achievements
3. Returns new achievements in the response

**Response includes:**
```json
{
  "code": 0,
  "success": true,
  "data": {
    "result": { ... },
    "newAchievements": {
      "user-id-1": [
        {
          "id": "xxx",
          "code": "hat_trick",
          "name": "Hat Trick",
          "icon": "<©",
          "unlockCount": 1,
          "isNew": true
        }
      ]
    }
  }
}
```

### 2. Display Achievement Notification

When user receives `newAchievements`:
1. Show celebration animation
2. Call `POST /api/notification/:id/shown` after animation
3. Update local achievement cache

### 3. Show Achievement Badge

On profile/stats page:
1. Call `GET /api/achievement/my/progress?seasonId=current`
2. Display all achievements with unlock status
3. Show unlock count for repeatable achievements

---

## Notes

- All endpoints require authentication
- Season-bound achievements are tracked per season
- Repeatable achievements can be unlocked multiple times
- Notifications are created automatically when achievements are unlocked
- Use `isShown` flag to prevent showing the same celebration animation multiple times
