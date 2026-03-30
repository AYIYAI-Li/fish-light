Page({
  data: {
    appInfo: {
       contact: {
         email: '1154998100@qq.com',
         wechat: '18344400033'
       }
    }
  },

  onPullDownRefresh() {
    wx.stopPullDownRefresh();
  },

  onShareAppMessage() {
    return {
      title: '鱼灯非遗文化 - 传承千年工艺，体验AR科技',
      path: '/pages/index/index',
      imageUrl: '/images/Fish.png'
    };
  },

  copyContact(e) {
    const type = e.currentTarget.dataset.type;
    let content = '';
    
    if (type === 'email') {
      content = this.data.appInfo.contact.email;
    } else if (type === 'wechat') {
      content = this.data.appInfo.contact.wechat;
    }

    wx.setClipboardData({
      data: content,
      success: () => {
        wx.showToast({
          title: '已复制到剪贴板',
          icon: 'success'
        });
      }
    });
  }
});