// pages/user/jersey-wall/jersey-wall.js
const app = getApp();
const userAPI = require('../../../api/user.js');
const config = require('../../../utils/config.js');

Page({
  data: {
    jerseyList: [], // 球衣号码列表
    honoraryPlayers: [], // 荣誉球员列表
    isLogin: false,
    currentUser: null,
    teamColor: '#f20810', // 主题红色
    maxJerseyNumber: 999, // 最大号码（从API获取）
    minJerseyNumber: 0, // 最小号码（从API获取）

    // 筛选条件
    filterType: 'all', // all: 全部, used: 已使用, available: 可用

    // 统计数据
    totalCount: 0,
    usedCount: 0,
    availableCount: 0,

    images: {
      defaultAvatar: config.getImageUrl('default-avatar.png')
    }
  },

  onLoad() {
    this.checkLogin();
    this.loadJerseyData();
  },

  onShow() {
    // 每次显示时刷新数据
    this.loadJerseyData();
  },

  // 检查登录状态
  checkLogin() {
    const isLogin = app.globalData.isLogin;
    const currentUser = app.globalData.userInfo;
    this.setData({
      isLogin,
      currentUser
    });
  },

  // 加载球衣数据
  loadJerseyData() {
    wx.showLoading({
      title: '加载中...'
    });

    // 真实API调用
    userAPI.getJerseyNumbers().then(res => {
      const data = res.data;

      // 更新号码范围
      if (data.range) {
        this.setData({
          minJerseyNumber: data.range.min || 0,
          maxJerseyNumber: data.range.max || 999
        });
      }

      // 处理荣誉球员数据
      const honoraryPlayers = (data.honoraryPlayers || []).map(player => ({
        number: player.number,
        user: {
          id: player.userId,
          realName: player.realName,
          nickname: player.nickname,
          avatar: player.avatar ? config.getStaticUrl(player.avatar, 'avatars') : this.data.images.defaultAvatar,
          teamId: player.teamId,
          teamName: player.teamName,
          teamLogo: player.teamLogo
        }
      }));

      // 构建完整的球衣列表
      const jerseyList = this.buildJerseyList(data.usedNumbers || [], data.availableNumbers || []);

      // 计算统计数据
      const usedCount = jerseyList.filter(item => item.isUsed).length;
      const availableCount = jerseyList.filter(item => !item.isUsed).length;

      this.setData({
        honoraryPlayers,
        jerseyList,
        totalCount: jerseyList.length,
        usedCount,
        availableCount
      });
      wx.hideLoading();
    }).catch(err => {
      wx.hideLoading();
      console.error('加载号码墙数据失败:', err);

      // 失败时使用Mock数据
      const mockData = this.generateMockJerseyData();

      // 计算统计数据
      const usedCount = mockData.filter(item => item.isUsed).length;
      const availableCount = mockData.filter(item => !item.isUsed).length;

      this.setData({
        jerseyList: mockData,
        totalCount: mockData.length,
        usedCount,
        availableCount
      });

      wx.showToast({
        title: '加载失败，显示示例数据',
        icon: 'none'
      });
    });
  },

  // 构建球衣列表（从API数据）
  buildJerseyList(usedNumbers, availableNumbers) {
    const jerseyList = [];
    const usedNumbersMap = new Map();

    // 建立已使用号码的映射（支持一个号码多个用户）
    usedNumbers.forEach(item => {
      if (!usedNumbersMap.has(item.number)) {
        usedNumbersMap.set(item.number, []);
      }
      usedNumbersMap.get(item.number).push(item);
    });

    // 生成完整列表（从min到max）
    for (let i = this.data.minJerseyNumber; i <= this.data.maxJerseyNumber; i++) {
      const usedInfoList = usedNumbersMap.get(i);

      if (usedInfoList && usedInfoList.length > 0) {
        // 已使用的号码 - 如果有多个用户，每个用户创建一个球衣卡片
        usedInfoList.forEach(usedInfo => {
          jerseyList.push({
            number: i,
            isUsed: true,
            user: {
              id: usedInfo.userId,
              realName: usedInfo.realName,
              nickname: usedInfo.nickname,
              avatar: usedInfo.avatar ? config.getStaticUrl(usedInfo.avatar, 'avatars') : this.data.images.defaultAvatar,
              teamId: usedInfo.teamId,
              teamName: usedInfo.teamName,
              teamLogo: usedInfo.teamLogo
            },
            canSelect: false
          });
        });
      } else if (availableNumbers.includes(i)) {
        // 可用的号码
        jerseyList.push({
          number: i,
          isUsed: false,
          user: null,
          canSelect: this.data.isLogin
        });
      }
    }

    return jerseyList;
  },

  // 生成Mock数据
  generateMockJerseyData() {
    const usedNumbers = [7, 10, 11, 9, 8, 23, 6, 3, 5, 15, 18, 20, 21, 14, 2, 4, 19, 22, 25, 27];
    const mockUsers = [
      { id: '1', realName: '梅西', nickname: 'Messi', avatar: config.getImageUrl('avatar/1.png'), jerseyNumber: 10 },
      { id: '2', realName: 'C罗', nickname: 'CR7', avatar: config.getImageUrl('avatar/2.png'), jerseyNumber: 7 },
      { id: '3', realName: '内马尔', nickname: 'Neymar', avatar: config.getImageUrl('avatar/3.png'), jerseyNumber: 11 },
      { id: '4', realName: '本泽马', nickname: 'Benzema', avatar: config.getImageUrl('avatar/4.png'), jerseyNumber: 9 },
      { id: '5', realName: '克罗斯', nickname: 'Kroos', avatar: config.getImageUrl('avatar/5.png'), jerseyNumber: 8 },
      { id: '6', realName: '德布劳内', nickname: 'KDB', avatar: config.getImageUrl('avatar/6.png'), jerseyNumber: 23 },
      { id: '7', realName: '萨拉赫', nickname: 'Salah', avatar: config.getImageUrl('avatar/7.png'), jerseyNumber: 6 },
      { id: '8', realName: '莱万', nickname: 'Lewandowski', avatar: config.getImageUrl('avatar/8.png'), jerseyNumber: 3 },
      { id: '9', realName: '姆巴佩', nickname: 'Mbappe', avatar: config.getImageUrl('avatar/9.png'), jerseyNumber: 5 },
      { id: '10', realName: '哈兰德', nickname: 'Haaland', avatar: config.getImageUrl('avatar/10.png'), jerseyNumber: 15 },
      { id: '11', realName: '维尼修斯', nickname: 'Vinicius', avatar: config.getImageUrl('avatar/11.png'), jerseyNumber: 18 },
      { id: '12', realName: '罗德里', nickname: 'Rodri', avatar: config.getImageUrl('avatar/12.png'), jerseyNumber: 20 },
      { id: '13', realName: '贝林厄姆', nickname: 'Bellingham', avatar: config.getImageUrl('avatar/13.png'), jerseyNumber: 21 },
      { id: '14', realName: '格拉利什', nickname: 'Grealish', avatar: config.getImageUrl('avatar/14.png'), jerseyNumber: 14 },
      { id: '15', realName: '萨卡', nickname: 'Saka', avatar: config.getImageUrl('avatar/15.png'), jerseyNumber: 2 },
      { id: '16', realName: '福登', nickname: 'Foden', avatar: config.getImageUrl('avatar/16.png'), jerseyNumber: 4 },
      { id: '17', realName: '哈弗茨', nickname: 'Havertz', avatar: config.getImageUrl('avatar/17.png'), jerseyNumber: 19 },
      { id: '18', realName: '加维', nickname: 'Gavi', avatar: config.getImageUrl('avatar/18.png'), jerseyNumber: 22 },
      { id: '19', realName: '佩德里', nickname: 'Pedri', avatar: config.getImageUrl('avatar/19.png'), jerseyNumber: 25 },
      { id: '20', realName: '琼阿梅尼', nickname: 'Tchouameni', avatar: config.getImageUrl('avatar/20.png'), jerseyNumber: 27 }
    ];

    const jerseyList = [];

    for (let i = 0; i <= 99; i++) {
      const user = mockUsers.find(u => u.jerseyNumber === i);

      jerseyList.push({
        number: i,
        isUsed: !!user,
        user: user || null,
        canSelect: !user && this.data.isLogin
      });
    }

    return jerseyList;
  },

  // 切换筛选类型
  onFilterChange(e) {
    const filterType = e.currentTarget.dataset.type;
    this.setData({
      filterType
    });
  },

  // 获取筛选后的列表
  getFilteredList() {
    const { jerseyList, filterType } = this.data;

    if (filterType === 'used') {
      return jerseyList.filter(item => item.isUsed);
    } else if (filterType === 'available') {
      return jerseyList.filter(item => !item.isUsed);
    }

    return jerseyList;
  },

  // 点击球衣
  onJerseyTap(e) {
    const { index, isused, userid } = e.currentTarget.dataset;
    const jersey = this.data.jerseyList[index];

    if (!jersey) return;

    if (isused) {
      // 已使用号码 - 直接跳转到球员数据详情页
      if (userid) {
        wx.navigateTo({
          url: `/pages/user/stats/stats?id=${userid}`  // 参数名改为 id
        });
      }
    }
    // 可选择号码不做任何操作，仅展示
  },

  // 选择号码
  selectJerseyNumber(number) {
    if (!this.data.isLogin) {
      wx.showModal({
        title: '需要登录',
        content: '请先登录后再选择号码',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/user/login/login'
            });
          }
        }
      });
      return;
    }

    // 检查当前用户是否已有号码
    const currentUser = this.data.currentUser;
    if (currentUser && currentUser.jerseyNumber) {
      wx.showModal({
        title: '更换号码',
        content: `您当前使用的是${currentUser.jerseyNumber}号，确定要更换为${number}号吗？`,
        confirmText: '确认更换',
        confirmColor: '#f20810',
        success: (res) => {
          if (res.confirm) {
            this.updateJerseyNumber(number);
          }
        }
      });
    } else {
      wx.showModal({
        title: '选择号码',
        content: `确定要选择${number}号球衣吗？`,
        confirmText: '确认',
        confirmColor: '#f20810',
        success: (res) => {
          if (res.confirm) {
            this.updateJerseyNumber(number);
          }
        }
      });
    }
  },

  // 更新球衣号码
  updateJerseyNumber(number) {
    wx.showLoading({
      title: '更新中...',
      mask: true
    });

    // 真实API调用
    userAPI.updateUserInfo({ jerseyNumber: number }).then(res => {
      wx.hideLoading();
      wx.showToast({
        title: '更新成功',
        icon: 'success'
      });

      // 更新本地用户信息
      if (app.globalData.userInfo) {
        app.globalData.userInfo.jerseyNumber = number;
        wx.setStorageSync('userInfo', app.globalData.userInfo);
      }

      // 刷新数据
      this.loadJerseyData();
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({
        title: err.message || '更新失败',
        icon: 'none'
      });
    });
  },

  onPullDownRefresh() {
    this.loadJerseyData();
    wx.stopPullDownRefresh();
  }
});
