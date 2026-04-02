Page({
  data: {
    activeSection: 'steps',
    showActionModal: false,
    showPosterTip: false,
    currentPosterIndex: 0,
    imageType: 'poster',
    steps: [
      {
        title: '处理竹筏',
        imageUrl: 'cloud://cloud1-4g4nzi8a994f009b.636c-cloud1-4g4nzi8a994f009b-1411647226/AR效果展示部分图片+视频/鱼灯透卡/1处理竹篾.png'
      },
      {
        title: '扎骨架',
        imageUrl: 'cloud://cloud1-4g4nzi8a994f009b.636c-cloud1-4g4nzi8a994f009b-1411647226/AR效果展示部分图片+视频/鱼灯透卡/2扎骨架.png'
      },
      {
        title: '扪纱贴纸',
        imageUrl: 'cloud://cloud1-4g4nzi8a994f009b.636c-cloud1-4g4nzi8a994f009b-1411647226/AR效果展示部分图片+视频/鱼灯透卡/3扪纱贴纸.png'
      },
      {
        title: '上色',
        imageUrl: 'cloud://cloud1-4g4nzi8a994f009b.636c-cloud1-4g4nzi8a994f009b-1411647226/AR效果展示部分图片+视频/鱼灯透卡/4上色.png'
      },
      {
        title: '装灯',
        imageUrl: 'cloud://cloud1-4g4nzi8a994f009b.636c-cloud1-4g4nzi8a994f009b-1411647226/AR效果展示部分图片+视频/鱼灯透卡/5装灯.png'
      },
      {
        title: '装配件',
        imageUrl: 'cloud://cloud1-4g4nzi8a994f009b.636c-cloud1-4g4nzi8a994f009b-1411647226/AR效果展示部分图片+视频/鱼灯透卡/6装配件.png'
      }
    ],
    posters: [
      {
        id: 1,
        title: '红色鱼灯AR海报',
        qrImage: 'cloud://cloud1-4g4nzi8a994f009b.636c-cloud1-4g4nzi8a994f009b-1411647226/AR效果展示部分图片+视频/二维码.jpg',
        posterImage: 'cloud://cloud1-4g4nzi8a994f009b.636c-cloud1-4g4nzi8a994f009b-1411647226/AR效果展示部分图片+视频/红色海报.png',
        videoUrl: 'cloud://cloud1-4g4nzi8a994f009b.636c-cloud1-4g4nzi8a994f009b-1411647226/AR效果展示部分图片+视频/红色海报视频.mp4'
      },
      {
        id: 2,
        title: '蓝色鱼灯AR海报',
        qrImage: 'cloud://cloud1-4g4nzi8a994f009b.636c-cloud1-4g4nzi8a994f009b-1411647226/AR效果展示部分图片+视频/蓝色海报二维码.png',
        posterImage: 'cloud://cloud1-4g4nzi8a994f009b.636c-cloud1-4g4nzi8a994f009b-1411647226/AR效果展示部分图片+视频/蓝色海报.png',
        videoUrl: 'cloud://cloud1-4g4nzi8a994f009b.636c-cloud1-4g4nzi8a994f009b-1411647226/AR效果展示部分图片+视频/蓝色海报视频.mp4'
      }
    ]
  },

  onSectionTap(e) {
    const section = e.currentTarget.dataset.section;
    this.setData({
      activeSection: section,
      showPosterTip: section === 'poster'
    });
  },

  onStepTap(e) {
    const idx = e.currentTarget.dataset.index;
    const step = this.data.steps[idx];
    wx.previewImage({
      current: step.imageUrl,
      urls: [step.imageUrl]
    });
  },

  onQrTap(e) {
    const idx = e.currentTarget.dataset.index;
    const poster = this.data.posters[idx];
    console.log('点击二维码，idx:', idx, 'qrImage:', poster.qrImage);
    wx.previewImage({
      current: poster.qrImage,
      urls: [poster.qrImage]
    });
  },

  onQrLongPress(e) {
    const idx = e.currentTarget.dataset.index;
    this.setData({
      showActionModal: true,
      currentPosterIndex: idx,
      imageType: 'qr'
    });
  },

  onPosterTap(e) {
    const idx = e.currentTarget.dataset.index;
    const poster = this.data.posters[idx];
    wx.previewImage({
      current: poster.posterImage,
      urls: [poster.posterImage]
    });
  },

  onPosterLongPress(e) {
    const idx = e.currentTarget.dataset.index;
    this.setData({
      showActionModal: true,
      currentPosterIndex: idx,
      imageType: 'poster'
    });
  },

  onVideoPlay(e) {
    const idx = e.currentTarget.dataset.index;
    const videoId = `poster-video-${idx}`;
    const videoContext = wx.createVideoContext(videoId, this);
    videoContext.requestFullScreen({ direction: 90 });
  },

  onVideoError(e) {
    const idx = e.currentTarget.dataset.index;
    console.error('视频加载错误:', idx, e.detail);
    wx.showToast({
      title: '视频加载失败',
      icon: 'none'
    });
  },

  closeActionModal() {
    this.setData({
      showActionModal: false
    });
  },

  saveImage() {
    const idx = this.data.currentPosterIndex;
    const poster = this.data.posters[idx];
    const imageType = this.data.imageType;
    const imageUrl = imageType === 'qr' ? poster.qrImage : poster.posterImage;

    wx.showLoading({
      title: '保存中...'
    });

    wx.downloadFile({
      url: imageUrl,
      success: (res) => {
        if (res.statusCode === 200) {
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              wx.hideLoading();
              wx.showToast({
                title: '保存成功',
                icon: 'success'
              });
              this.closeActionModal();
            },
            fail: (err) => {
              wx.hideLoading();
              wx.showToast({
                title: '保存失败',
                icon: 'none'
              });
            }
          });
        } else {
          wx.hideLoading();
          wx.showToast({
            title: '下载失败',
            icon: 'none'
          });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({
          title: '下载失败',
          icon: 'none'
        });
      }
    });
  }
});