/**
 * 赛季相关 Mock 数据
 */

// Mock 赛季数据
const mockSeasons = [
  {
    id: '1',
    name: '2025春季赛',
    startDate: '2025-03-01',
    endDate: '2025-05-31',
    status: 'active',
    matchCount: 15,
    description: '2025年春季联赛'
  },
  {
    id: '2',
    name: '2024秋季赛',
    startDate: '2024-09-01',
    endDate: '2024-11-30',
    status: 'finished',
    matchCount: 20,
    description: '2024年秋季联赛'
  }
];

/**
 * 获取赛季列表
 */
function getSeasonList(params) {
  const { status, limit } = params;

  let filteredSeasons = [...mockSeasons];

  // 按状态筛选
  if (status) {
    filteredSeasons = filteredSeasons.filter(s => s.status === status);
  }

  // 限制数量
  if (limit) {
    filteredSeasons = filteredSeasons.slice(0, limit);
  }

  console.log(`[Mock Season] 获取赛季列表: ${filteredSeasons.length}个`);

  return {
    list: filteredSeasons,
    total: filteredSeasons.length
  };
}

/**
 * 获取当前赛季
 */
function getCurrentSeason(params) {
  const currentSeason = mockSeasons.find(s => s.status === 'active') || mockSeasons[0];

  console.log('[Mock Season] 获取当前赛季:', currentSeason.name);
  return currentSeason;
}

/**
 * 获取赛季详情（包含比赛列表）
 */
function getDetail(params) {
  const { seasonId } = params;
  const season = mockSeasons.find(s => s.id === seasonId) || mockSeasons[0];

  console.log('[Mock Season] 获取赛季详情:', season.name);

  // 返回赛季信息和比赛列表
  return {
    ...season,
    matches: [
      {
        id: '2',
        title: '第一届两江超级联赛 第2场',
        team1Id: '1',
        team2Id: '2',
        matchDate: '2025-10-23T00:00:00.000Z',
        location: '轨道基地',
        status: 'registration',
        quarterSystem: true,
        finalTeam1Score: 0,
        finalTeam2Score: 0,
        seasonId: season.id,
        team1: {
          id: '1',
          name: '嘉陵摩托',
          logo: '/static/images/logoa.png'
        },
        team2: {
          id: '2',
          name: '长江黄河',
          logo: '/static/images/logob.png'
        }
      },
      {
        id: '1',
        title: '第一届两江超级联赛 第1场',
        team1Id: '1',
        team2Id: '2',
        matchDate: '2025-10-22T00:00:00.000Z',
        location: '轨道基地',
        status: 'completed',
        quarterSystem: true,
        finalTeam1Score: 3,
        finalTeam2Score: 3,
        seasonId: season.id,
        team1: {
          id: '1',
          name: '嘉陵摩托',
          logo: '/static/images/logoa.png'
        },
        team2: {
          id: '2',
          name: '长江黄河',
          logo: '/static/images/logob.png'
        },
        result: {
          team1FinalScore: 3,
          team2FinalScore: 3,
          team1TotalGoals: 2,
          team2TotalGoals: 3
        }
      }
    ]
  };
}

/**
 * 获取赛季统计数据
 */
function getStatistics(params) {
  const { seasonId } = params;

  console.log('[Mock Season] 获取赛季统计:', seasonId);

  return {
    rankings: [
      {
        rank: 1,
        userId: '1',
        nickname: '张三',
        avatar: '/static/images/avatar/1.png',
        goals: 12,
        assists: 8,
        mvp: 3
      },
      {
        rank: 2,
        userId: '2',
        nickname: '球员2',
        avatar: '/static/images/avatar/2.png',
        goals: 10,
        assists: 6,
        mvp: 2
      }
    ]
  };
}

/**
 * 完成赛季
 */
function complete(params) {
  const { seasonId } = params;

  console.log('[Mock Season] 完成赛季:', seasonId);

  return {
    success: true,
    message: '赛季已完成'
  };
}

module.exports = {
  getSeasonList,
  getCurrentSeason,
  getDetail,
  getStatistics,
  complete,
  mockSeasons
};
