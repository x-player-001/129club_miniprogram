/**
 * 比赛相关 Mock 数据
 */

const { mockUsers } = require('./user');

// Mock 比赛列表
const mockMatches = [
  {
    id: '1',
    title: '周末友谊赛',
    date: '2025-10-25',
    time: '14:00',
    location: '嘉陵体育中心',
    status: 'upcoming',
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
    maxPlayers: 22,
    currentPlayers: 15,
    fee: 30,
    description: '周末友谊赛，欢迎参加！'
  },
  {
    id: '2',
    title: '129杯第一轮',
    date: '2025-10-20',
    time: '15:00',
    location: '渝北体育场',
    status: 'finished',
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
    team1Score: 3,
    team2Score: 2,
    maxPlayers: 22,
    currentPlayers: 20,
    fee: 30,
    result: {
      team1FinalScore: 3,
      team2FinalScore: 3,
      team1TotalGoals: 2,
      team2TotalGoals: 3,
      quarters: [
        { quarter: 1, team1Score: 1, team2Score: 0 },
        { quarter: 2, team1Score: 0, team2Score: 1 },
        { quarter: 3, team1Score: 0, team2Score: 1 },
        { quarter: 4, team1Score: 1, team2Score: 1 }
      ],
      events: [
        {
          id: 'e1',
          quarter: 1,
          minute: 5,
          type: 'goal',
          team: 'team1',
          player: { id: '1', name: '张三', jerseyNumber: 10 },
          assistPlayer: { id: '2', name: '球员2', jerseyNumber: 2 }
        },
        {
          id: 'e2',
          quarter: 2,
          minute: 12,
          type: 'goal',
          team: 'team2',
          player: { id: '3', name: '球员3', jerseyNumber: 3 }
        }
      ],
      mvp: {
        id: '1',
        name: '张三',
        jerseyNumber: 10,
        avatar: '/static/images/avatar/1.png',
        stats: {
          goals: 2,
          assists: 1
        }
      },
      attendance: {
        team1: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
        team2: ['11', '12', '13', '14', '15', '16', '17', '18', '19', '20']
      },
      summary: '这是一场精彩的比赛！双方势均力敌，最终以3:3握手言和。'
    }
  }
];

/**
 * 获取比赛列表
 */
function getMatchList(params) {
  const { status, page = 1, pageSize = 10 } = params;

  let filteredMatches = [...mockMatches];

  // 按状态筛选
  if (status) {
    filteredMatches = filteredMatches.filter(m => m.status === status);
  }

  console.log(`[Mock Match] 获取比赛列表: ${filteredMatches.length}场`);

  return {
    list: filteredMatches,
    total: filteredMatches.length,
    page: page,
    pageSize: pageSize
  };
}

/**
 * 获取比赛详情
 */
function getMatchDetail(params) {
  const { matchId, id } = params;
  const match = mockMatches.find(m => m.id === (matchId || id)) || mockMatches[0];

  console.log('[Mock Match] 获取比赛详情:', match.title);
  return match;
}

/**
 * 报名比赛
 */
function registerMatch(params) {
  const { matchId, teamId } = params;

  console.log(`[Mock Match] 报名比赛: matchId=${matchId}, teamId=${teamId}`);

  return {
    success: true,
    message: '报名成功'
  };
}

/**
 * 创建比赛
 */
function createMatch(params) {
  console.log('[Mock Match] 创建比赛:', params);

  return {
    matchId: 'mock_match_' + Date.now(),
    ...params
  };
}

/**
 * 提交比赛记录
 */
function submitMatchRecord(params) {
  console.log('[Mock Match] 提交比赛记录:', params);

  return {
    success: true,
    message: '提交成功'
  };
}

module.exports = {
  getMatchList,
  getMatchDetail,
  registerMatch,
  createMatch,
  submitMatchRecord,
  mockMatches
};
