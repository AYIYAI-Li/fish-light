Component({
  properties: {
    current: {
      type: String,
      value: 'index'
    }
  },
  data: {
    tabs: [
      {
        key: 'index',
        text: '首页',
        img: '/images/index.png',
        url: '/pages/index/index'
      },
      {
        key: 'ar-experience',
        text: 'AR效果展示',
        img: '/images/AR.png',
        url: '/pages/ar-experience/ar-experience'
      },
      {
        key: 'classroom',
        text: '非遗课堂',
        img: '/images/class.png',
        url: '/pages/classroom/classroom'
      },
      {
        key: 'guide',
        text: '景区导览',
        img: '/images/guide.png',
        url: '/pages/guide/guide'
      },

      {
        key: 'community',
        text: '社区交流',
        img: '/images/community.png',
        url: '/pages/community/community'
      },
      {
        key: 'my',
        text: '我的',
        img: '/images/my.png',
        url: '/pages/my/my'
      },
    ]
  },
  methods: {
    onTabTap(e) {
      const { key, url } = e.currentTarget.dataset;
      if (key === this.data.current) return;
      
      wx.switchTab({
        url: url,
        fail: () => {
          wx.navigateTo({
            url: url
          });
        }
      });
    }
  }
}); 