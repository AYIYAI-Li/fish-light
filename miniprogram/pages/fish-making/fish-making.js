Page({
  data: {
    nextStepIndex: 0,
    currentResult: null,
    finished: false,
    components: [
      {
        name: '灯具',
        step: 2,
        componentImage: 'cloud://cloud1-4g4nzi8a994f009b.636c-cloud1-4g4nzi8a994f009b-1411647226/games/灯具.png',
        resultTitle: '点灯',
        resultImage: 'cloud://cloud1-4g4nzi8a994f009b.636c-cloud1-4g4nzi8a994f009b-1411647226/games/点灯.png',
        resultWidth: '100%',
        resultHeight: '320rpx',
        resultOffsetTop: '0rpx',
        resultOffsetLeft: '0rpx',
        dragWidth: '150rpx',
        dragHeight: '150rpx'
      },
      {
        name: '骨架',
        step: 0,
        componentImage: 'cloud://cloud1-4g4nzi8a994f009b.636c-cloud1-4g4nzi8a994f009b-1411647226/games/骨架.png',
        resultTitle: '骨架',
        resultImage: 'cloud://cloud1-4g4nzi8a994f009b.636c-cloud1-4g4nzi8a994f009b-1411647226/games/骨架.png',
        resultWidth: '105%',
        resultHeight: '345rpx',
        resultOffsetTop: '-30rpx',
        resultOffsetLeft: '0rpx',
        dragWidth: '350rpx',
        dragHeight: '350rpx'
      },
      {
        name: '眼睛',
        step: 4,
        componentImage: 'cloud://cloud1-4g4nzi8a994f009b.636c-cloud1-4g4nzi8a994f009b-1411647226/games/眼睛.png',
        resultTitle: '装眼',
        resultImage: 'cloud://cloud1-4g4nzi8a994f009b.636c-cloud1-4g4nzi8a994f009b-1411647226/games/装眼.png',
        resultWidth: '110%',
        resultHeight: '295rpx',
        resultOffsetTop: '14rpx',
        resultOffsetLeft: '7rpx',
        dragWidth: '100rpx',
        dragHeight: '100rpx'
      },
      {
        name: '纸',
        step: 1,
        componentImage: 'cloud://cloud1-4g4nzi8a994f009b.636c-cloud1-4g4nzi8a994f009b-1411647226/games/纸.png',
        resultTitle: '糊纸',
        resultImage: 'cloud://cloud1-4g4nzi8a994f009b.636c-cloud1-4g4nzi8a994f009b-1411647226/games/糊纸.png',
        resultWidth: '100%',
        resultHeight: '320rpx',
        resultOffsetTop: '0rpx',
        resultOffsetLeft: '0rpx',
        dragWidth: '330rpx',
        dragHeight: '330rpx'
      },
      {
        name: '颜料',
        step: 3,
        componentImage: 'cloud://cloud1-4g4nzi8a994f009b.636c-cloud1-4g4nzi8a994f009b-1411647226/games/颜料.png',
        resultTitle: '上色',
        resultImage: 'cloud://cloud1-4g4nzi8a994f009b.636c-cloud1-4g4nzi8a994f009b-1411647226/games/上色.png',
        resultWidth: '105%',
        resultHeight: '290rpx',
        resultOffsetTop: '14rpx',
        resultOffsetLeft: '8rpx',
        dragWidth: '300rpx',
        dragHeight: '300rpx'
      },
      {
        name: '吊坠',
        step: 5,
        componentImage: 'cloud://cloud1-4g4nzi8a994f009b.636c-cloud1-4g4nzi8a994f009b-1411647226/games/吊坠.png',
        resultTitle: '成品图',
        resultImage: 'cloud://cloud1-4g4nzi8a994f009b.636c-cloud1-4g4nzi8a994f009b-1411647226/games/成品1.png',
        resultWidth: '100%',
        resultHeight: '400rpx',
        resultOffsetTop: '30rpx',
        resultOffsetLeft: '20rpx',
        dragWidth: '260rpx',
        dragHeight: '260rpx'
      }
    ],
    dragging: false,
    dragImage: '',
    dragStep: null,
    dragX: 0,
    dragY: 0,
    dragWidth: '240rpx',
    dragHeight: '240rpx'
  },

  handleStep(step) {
    const { nextStepIndex, components } = this.data;

    if (nextStepIndex >= components.length) {
      wx.showToast({
        title: '已完成，点击重置可重新制作',
        icon: 'none'
      });
      return;
    }

    if (step !== nextStepIndex) {
      wx.showToast({
        title: '顺序好像有点不对噢',
        icon: 'none'
      });
      return;
    }

    const currentComponent = components.find(item => item.step === step);
    if (!currentComponent) {
      return;
    }

    const newNextStep = nextStepIndex + 1;
    const finished = newNextStep >= components.length;

    this.setData({
      nextStepIndex: newNextStep,
      currentResult: {
        title: currentComponent.resultTitle,
        image: currentComponent.resultImage,
        width: currentComponent.resultWidth || '100%',
        height: currentComponent.resultHeight || '320rpx',
        offsetTop: currentComponent.resultOffsetTop || '0rpx',
        offsetLeft: currentComponent.resultOffsetLeft || '0rpx'
      },
      finished
    });
  },

  onComponentTouchStart(e) {
    const step = Number(e.currentTarget.dataset.step);
    const image = e.currentTarget.dataset.image;
    const dragWidth = e.currentTarget.dataset.dragWidth || '240rpx';
    const dragHeight = e.currentTarget.dataset.dragHeight || '240rpx';
    const touch = e.touches[0];

    this.dragDropZone = null;

    wx.createSelectorQuery()
      .select('.assemble-box')
      .boundingClientRect(rect => {
        if (rect) {
          this.dragDropZone = rect;
        }
      })
      .exec();

    this.setData({
      dragging: true,
      dragStep: step,
      dragImage: image,
      dragX: touch.clientX,
      dragY: touch.clientY,
      dragWidth,
      dragHeight
    });
  },

  onComponentTouchMove(e) {
    if (!this.data.dragging) return;
    const touch = e.touches[0];
    this.setData({
      dragX: touch.clientX,
      dragY: touch.clientY
    });
  },

  onComponentTouchEnd(e) {
    if (!this.data.dragging) return;

    const touch = e.changedTouches[0];
    const x = touch.clientX;
    const y = touch.clientY;
    const zone = this.dragDropZone;
    const step = this.data.dragStep;

    this.setData({
      dragging: false,
      dragImage: '',
      dragStep: null
    });

    if (!zone || step === null) return;

    const inside =
      x >= zone.left &&
      x <= zone.right &&
      y >= zone.top &&
      y <= zone.bottom;

    if (inside) {
      this.handleStep(step);
    }
  },

  onResetTap() {
    this.setData({
      nextStepIndex: 0,
      currentResult: null,
      finished: false,
      dragging: false,
      dragImage: '',
      dragStep: null,
      dragWidth: '240rpx',
      dragHeight: '240rpx'
    });
  }
});
