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
        img: 'cloud://cloud1-4g4nzi8a994f009b.636c-cloud1-4g4nzi8a994f009b-1411647226/icon/index.png',
        url: '/pages/index/index'
      },
      {
        key: 'ar-experience',
        text: 'AR体验展示',
        img: 'cloud://cloud1-4g4nzi8a994f009b.636c-cloud1-4g4nzi8a994f009b-1411647226/icon/AR.png',
        url: '/pages/ar-experience/ar-experience'
      },
      {
        key: 'fish-making',
        text: '鱼灯制作',
        img: 'cloud://cloud1-4g4nzi8a994f009b.636c-cloud1-4g4nzi8a994f009b-1411647226/icon/making.png',
        url: '/pages/fish-making/fish-making'
      },
      {
        key: 'classroom',
        text: '非遗课堂',
        img: 'cloud://cloud1-4g4nzi8a994f009b.636c-cloud1-4g4nzi8a994f009b-1411647226/icon/class.png',
        url: '/pages/classroom/classroom'
      },
      {
        key: 'guide',
        text: '景区导览',
        img: 'cloud://cloud1-4g4nzi8a994f009b.636c-cloud1-4g4nzi8a994f009b-1411647226/icon/guide.png',
        url: '/pages/guide/guide'
      },

      {
        key: 'community',
        text: '社区交流',
        img: 'cloud://cloud1-4g4nzi8a994f009b.636c-cloud1-4g4nzi8a994f009b-1411647226/icon/community.png',
        url: '/pages/community/community'
      },
      {
        key: 'my',
        text: '我的',
        img: 'cloud://cloud1-4g4nzi8a994f009b.636c-cloud1-4g4nzi8a994f009b-1411647226/icon/my.png',
        url: '/pages/my/my'
      },
    ]
  },
  methods: {
    onTabTap(e) {
      const { key, url, type } = e.currentTarget.dataset;
      if (key === this.data.current) return;

      if (type === 'tab') {
        wx.switchTab({ url });
      } 
      else {
        wx.redirectTo({ url });
      }
    }
  }
}); 