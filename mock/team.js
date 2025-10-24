/**
 * 队伍相关 Mock 数据
 */

const { mockUsers } = require('./user');

// Mock 队伍数据
const mockTeams = [
  {
    id: '1',
    name: '嘉陵摩托',
    logo: '/static/images/logoa.png',
    color: '#f20810',
    captain: {
      id: '1',
      name: '张三',
      avatar: '/static/images/avatar/1.png'
    },
    memberCount: 11,
    stats: {
      matchesPlayed: 15,
      wins: 8,
      draws: 3,
      losses: 4,
      goalsFor: 32,
      goalsAgainst: 25
    }
  },
  {
    id: '2',
    name: '长江黄河',
    logo: '/static/images/logob.png',
    color: '#924ab0',
    captain: {
      id: '11',
      name: '球员11',
      avatar: '/static/images/avatar/11.png'
    },
    memberCount: 10,
    stats: {
      matchesPlayed: 15,
      wins: 7,
      draws: 4,
      losses: 4,
      goalsFor: 28,
      goalsAgainst: 23
    }
  }
];

/**
 * 获取队伍列表
 */
function getTeamList(params) {
  console.log('[Mock Team] 获取队伍列表');
  return {
    list: mockTeams,
    total: mockTeams.length
  };
}

/**
 * 获取队伍详情
 */
function getTeamDetail(params) {
  const { teamId, id } = params;
  const team = mockTeams.find(t => t.id === (teamId || id)) || mockTeams[0];

  console.log('[Mock Team] 获取队伍详情:', team.name);
  return team;
}

/**
 * 获取队伍成员
 */
function getTeamMembers(params) {
  const { teamId } = params;
  const members = mockUsers.filter(u => u.currentTeam.id === teamId);

  console.log(`[Mock Team] 获取队伍成员: ${members.length}人`);
  return {
    list: members,
    total: members.length
  };
}

module.exports = {
  getTeamList,
  getTeamDetail,
  getTeamMembers,
  mockTeams
};
