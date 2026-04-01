Page({
  data: {
    content: '',
    contentLength: 0,
    contact: ''
  },

  handleInput(e) {
    this.setData({
      content: e.detail.value,
      contentLength: e.detail.value.length
    });
  },

  handleContactInput(e) {
    this.setData({
      contact: e.detail.value
    });
  },

  submitFeedback() {
    if (this.data.content.length < 10) {
      wx.showToast({
        title: '请至少输入10个字',
      });
      return;
    }

    wx.showLoading({
      title: '正在提交...',
    });

    const db = wx.cloud.database();
    db.collection('feedback').add({
      data: {
        content: this.data.content,
        contact: this.data.contact,
        createdAt: new Date()
      },
      success: res => {
        wx.hideLoading();
        wx.showToast({
          title: '提交成功',
          icon: 'success'
        });
        console.log('[数据库] [新增记录] 成功，记录 _id: ', res._id);
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      },
      fail: err => {
        wx.hideLoading();
        wx.showToast({
          title: '提交失败，请重试',
          icon: 'error'
        });
        console.error('[数据库] [新增记录] 失败：', err);
      }
    });
  }
})