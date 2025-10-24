/**
 * 用户相关 Mock 数据
 */

// Mock 用户数据
const mockUsers = [
  {
    id: '1',
    nickname: '张三',
    realName: '张三',
    phone: '13800138000',
    avatar: '/static/images/avatar/1.png',
    position: 'forward',
    jerseyNumber: 10,
    currentTeam: {
      id: '1',
      name: '嘉陵摩托',
      logo: '/static/images/logoa.png'
    },
    stats: {
      matchesPlayed: 15,
      goals: 8,
      assists: 5,
      mvpCount: 2
    }
  },
  // ... 更多用户
];

// 生成21个测试用户
for (let i = 2; i <= 21; i++) {
  mockUsers.push({
    id: String(i),
    nickname: `球员${i}`,
    realName: `真实姓名${i}`,
    phone: `1380013800${i}`,
    avatar: `/static/images/avatar/${i}.png`,
    position: ['forward', 'midfielder', 'defender', 'goalkeeper'][i % 4],
    jerseyNumber: i,
    currentTeam: {
      id: i % 2 === 0 ? '2' : '1',
      name: i % 2 === 0 ? '长江黄河' : '嘉陵摩托',
      logo: i % 2 === 0 ? '/static/images/logob.png' : '/static/images/logoa.png'
    },
    stats: {
      matchesPlayed: Math.floor(Math.random() * 20) + 1,
      goals: Math.floor(Math.random() * 10),
      assists: Math.floor(Math.random() * 8),
      mvpCount: Math.floor(Math.random() * 3)
    }
  });
}

/**
 * 登录
 */
function login(params) {
  const { code } = params;
  console.log('[Mock User] 登录:', code);

  return {
    token: 'mock_token_' + Date.now(),
    userInfo: mockUsers[0]
  };
}

/**
 * 获取用户信息
 */
function getUserInfo(params) {
  const { userId } = params;
  const user = mockUsers.find(u => u.id === userId) || mockUsers[0];

  console.log('[Mock User] 获取用户信息:', user.nickname);
  return user;
}

/**
 * 更新用户信息
 */
function updateProfile(params) {
  console.log('[Mock User] 更新用户信息:', params);

  return {
    ...mockUsers[0],
    ...params
  };
}

/**
 * 获取成员列表
 */
function getMemberList(params) {
  const { status, pageSize = 20, page = 1, teamId } = params;

  let filteredUsers = [...mockUsers];

  // 按队伍筛选
  if (teamId) {
    filteredUsers = filteredUsers.filter(u => u.currentTeam.id === teamId);
  }

  console.log(`[Mock User] 获取成员列表: ${filteredUsers.length}人`);

  return {
    list: filteredUsers,
    total: filteredUsers.length,
    page: page,
    pageSize: pageSize
  };
}

module.exports = {
  login,
  getUserInfo,
  updateProfile,
  getMemberList,
  mockUsers
};
