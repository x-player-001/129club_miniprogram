/**
 * 统计数据 Mock 数据
 */

const { mockUsers } = require('./user');

/**
 * 获取数据总览
 */
function getStatsOverview(params) {
  const { userId, seasonId } = params;

  console.log('[Mock Stats] 获取数据总览');

  return {
    // 整体统计
    summary: {
      totalMatches: 18,
      totalGoals: 95,
      totalAssists: 85
    },
    // 个人数据
    myStats: {
      matches: 15,
      goals: 12,
      assists: 8,
      mvp: 3,
      winRate: 66.7,
      attendance: 93.3
    },
    // 个人排名
    myRanking: {
      goalsRank: 2,
      assistsRank: 3,
      attendanceRank: 1
    },
    // 队伍数据
    teamStats: {
      name: '嘉陵摩托',
      logo: '/static/images/logoa.png',
      color: '#f20810',
      matchesPlayed: 18,
      wins: 12,
      draws: 3,
      losses: 3,
      winRate: 66.7,
      goalsFor: 48,
      goalsAgainst: 32
    },
    // 近期比赛（最近5场）
    recentMatches: [
      {
        id: '5',
        matchDate: '2025-10-20',
        team1Id: '1',
        team2Id: '2',
        team1: { id: '1', name: '嘉陵摩托' },
        team2: { id: '2', name: '长江黄河' },
        result: {
          team1FinalScore: 5,
          team2FinalScore: 3,
          team1TotalGoals: 4,
          team2TotalGoals: 3
        },
        myStats: { goals: 2, assists: 1 },
        mvpUserIds: ['1']
      },
      {
        id: '4',
        matchDate: '2025-10-13',
        team1Id: '1',
        team2Id: '2',
        team1: { id: '1', name: '嘉陵摩托' },
        team2: { id: '2', name: '长江黄河' },
        result: {
          team1FinalScore: 4,
          team2FinalScore: 2,
          team1TotalGoals: 3,
          team2TotalGoals: 2
        },
        myStats: { goals: 1, assists: 2 },
        mvpUserIds: []
      },
      {
        id: '3',
        matchDate: '2025-10-06',
        team1Id: '1',
        team2Id: '2',
        team1: { id: '1', name: '嘉陵摩托' },
        team2: { id: '2', name: '长江黄河' },
        result: {
          team1FinalScore: 2,
          team2FinalScore: 4,
          team1TotalGoals: 2,
          team2TotalGoals: 3
        },
        myStats: { goals: 0, assists: 1 },
        mvpUserIds: []
      },
      {
        id: '2',
        matchDate: '2025-09-29',
        team1Id: '1',
        team2Id: '2',
        team1: { id: '1', name: '嘉陵摩托' },
        team2: { id: '2', name: '长江黄河' },
        result: {
          team1FinalScore: 6,
          team2FinalScore: 3,
          team1TotalGoals: 5,
          team2TotalGoals: 3
        },
        myStats: { goals: 3, assists: 0 },
        mvpUserIds: ['1']
      },
      {
        id: '1',
        matchDate: '2025-09-22',
        team1Id: '1',
        team2Id: '2',
        team1: { id: '1', name: '嘉陵摩托' },
        team2: { id: '2', name: '长江黄河' },
        result: {
          team1FinalScore: 3,
          team2FinalScore: 3,
          team1TotalGoals: 2,
          team2TotalGoals: 3
        },
        myStats: { goals: 1, assists: 1 },
        mvpUserIds: []
      }
    ]
  };
}

/**
 * 获取排行榜
 */
function getRankingList(params) {
  const { type = 'goals', seasonId } = params;

  console.log(`[Mock Stats] 获取排行榜: ${type}`);

  // 根据类型排序
  let sortedUsers = [...mockUsers];
  if (type === 'goals') {
    sortedUsers.sort((a, b) => b.stats.goals - a.stats.goals);
  } else if (type === 'assists') {
    sortedUsers.sort((a, b) => b.stats.assists - a.stats.assists);
  } else if (type === 'mvp') {
    sortedUsers.sort((a, b) => b.stats.mvpCount - a.stats.mvpCount);
  } else if (type === 'attendance') {
    sortedUsers.sort((a, b) => b.stats.matchesPlayed - a.stats.matchesPlayed);
  }

  return {
    list: sortedUsers.slice(0, 10).map((user, index) => ({
      rank: index + 1,
      userId: user.id,
      nickname: user.nickname,
      realName: user.realName,
      avatar: user.avatar,
      team: user.currentTeam,
      value: type === 'goals' ? user.stats.goals :
             type === 'assists' ? user.stats.assists :
             type === 'mvp' ? user.stats.mvpCount :
             user.stats.matchesPlayed
    })),
    total: 10
  };
}

/**
 * 获取球员统计
 */
function getPlayerStats(params) {
  const { userId, seasonId } = params;
  const user = mockUsers.find(u => u.id === userId) || mockUsers[0];

  console.log('[Mock Stats] 获取球员统计:', user.nickname);

  return {
    userId: user.id,
    nickname: user.nickname,
    avatar: user.avatar,
    stats: user.stats,
    recentMatches: [
      {
        matchId: '1',
        date: '2025-10-20',
        opponent: '长江黄河',
        result: 'win',
        goals: 2,
        assists: 1
      }
    ]
  };
}

/**
 * 获取成就列表
 */
function getAchievements(params) {
  const { userId } = params;

  console.log('[Mock Stats] 获取成就列表');

  return {
    unlocked: [
      {
        id: '1',
        name: '帽子戏法',
        icon: '🎩',
        description: '单场进3球',
        unlockedAt: '2025-10-15'
      }
    ],
    locked: [
      {
        id: '2',
        name: '进球机器',
        icon: '⚽',
        description: '单赛季进10球'
      }
    ]
  };
}

module.exports = {
  getStatsOverview,
  getRankingList,
  getPlayerStats,
  getAchievements
};
