Page({
    data: {
      spots: [
        {
          id: 1,
          title: '祖庙',
          address: '广东省佛山市禅城区祖庙路21号',
          description: '千年古刹，岭南建筑艺术瑰宝，是佛山历史文化的象征。',
          desc: '千年古刹，岭南建筑艺术瑰宝',
          top: 48,
          left: 65,
          icon: '📍',
          lat:23.028970711340012,
          lng:113.11290063176831
        },
        {
          id: 2,
          title: '千灯湖',
          address: '广东省佛山市南海区灯湖西路28号',
          description: '佛山现代化城市地标，夜景璀璨。每年元宵期间，千灯湖沿岸悬挂百盏非遗鱼灯，光影交织，是新晋的鱼灯文化打卡地。',
          desc: '现代地标，元宵鱼灯夜景胜地',
          top: 35,
          left: 65,
          icon: '📍',
          lat:23.051075042370183,
          lng:113.14727161843773
        },
        {
          id: 3,
          title: '西樵山',
          address: '广东省佛山市南海区西樵镇环山大道',
          description: '岭南名山，国家级风景名胜区。西樵山非遗鱼灯融合桑基鱼塘文化，扎作技艺独树一帜，山中天湖公园常展鱼灯民俗展。',
          desc: '岭南名山，桑基鱼灯文化传承地',
          top:80,
          left: 25,
          icon: '📍',
          lat:22.929586,
          lng:112.972436
        },
        {
          id: 4,
          title: '中山公园',
          address: '广东省佛山市禅城区中山路12号',
          description: '佛山老牌城市公园，承载几代佛山人记忆。每年中秋、元宵，公园内举办鱼灯游园会，传统手工鱼灯与湖景相映成趣。',
          desc: '老牌公园，鱼灯游园会举办地',
          top: 70,
          left: 53,
          icon: '📍',
          lat:23.042243096897664,
          lng:113.11921939054626
        },
        {
          id: 5,
          title: '大良钟楼',
          address: '广东省佛山市顺德区大良街道凤山东路钟楼公园',
          description: '顺德地标性建筑，百年钟楼见证城市变迁。钟楼商圈常年展陈顺德鱼灯，其扎作工艺融入广绣元素，是顺德非遗代表之一。',
          desc: '百年钟楼，顺德鱼灯工艺展示地',
          top: 81,
          left: 78,
          icon: '📍',
          lat:22.839389519328098,
          lng:113.25306476287037
        }
      ],
      activeSpotId: 1,
      activeSpot: {}
    },
    onLoad(options) {
        let activeSpotId=1;
        if(options.id){
            activeSpotId=Number(options.id);
        }
        const activeSpot=this.data.spots.find(s=>s.id===activeSpotId)||this.data.spots[0];
      this.setData({
        activeSpotId,activeSpot
      });
    },
    onSelectSpot(e) {
      const id = Number(e.currentTarget.dataset.id);
      const spot = this.data.spots.find(s => s.id === id);
      this.setData({
        activeSpotId: id,
        activeSpot: spot
      });
    },
    onNavigate() {
      const { activeSpot } = this.data;
      if (!activeSpot || !activeSpot.lat || !activeSpot.lng) {
        wx.showToast({ title: '景点坐标未配置', icon: 'error' });
        return;
      }
  
      wx.openLocation({
        latitude: activeSpot.lat,
        longitude: activeSpot.lng,
        name: activeSpot.title,
        address: activeSpot.address,
        scale: 18,
        success: () => {
          console.log('唤起地图成功');
        },
        fail: (err) => {
          console.log('唤起地图失败', err);
          wx.showToast({ title: '请打开手机地图APP', icon: 'none' });
        }
      });
    },
    // 修改后的分享按钮点击事件
    onShare() {
      const { activeSpot } = this.data;
      if (!activeSpot) {
        wx.showToast({ title: '暂无可分享的打卡点', icon: 'error' });
        return;
      }
      // 主动触发分享界面（微信小程序需要通过 button open-type="share" 或此方式触发）
      wx.showShareMenu({
        withShareTicket: true, // 是否带分享票据
        menus: ['shareAppMessage', 'shareTimeline'] // 支持分享给好友、朋友圈
      });
    },
    // 新增：配置分享内容（核心）
    onShareAppMessage() {
        const { activeSpot } = this.data;
        return {
          title: `推荐打卡：${activeSpot.title}`,
          path: `/pages/guide/guide?id=${activeSpot.id}`,
          // 重点：自动用当前景点的图片当封面
          imageUrl: `/images/spots/${activeSpot.id}.png`
        };
      },
      
      onShareTimeline() {
        const { activeSpot } = this.data;
        return {
          title: `打卡佛山美景：${activeSpot.title}`,
          // 朋友圈封面也用当前景点图
          imageUrl: `/images/spots/${activeSpot.id}.png`
        };
      }
  });