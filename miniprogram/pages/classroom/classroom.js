Page({
  data: {
    activeSection: 'making',
    makingVideos: [
      {
        title: '鱼灯制作全过程',
        videoUrl: 'cloud://cloud1-4g4nzi8a994f009b.636c-cloud1-4g4nzi8a994f009b-1411647226/production_process/全过程.mp4',
        poster: 'cloud://cloud1-4g4nzi8a994f009b.636c-cloud1-4g4nzi8a994f009b-1411647226/production_process/all.jpg',   
        isFull: true
      },
      {
        title: '第一步：制作骨架',
        videoUrl: 'cloud://cloud1-4g4nzi8a994f009b.636c-cloud1-4g4nzi8a994f009b-1411647226/production_process/第三步-制作骨架.mp4',
        poster: 'cloud://cloud1-4g4nzi8a994f009b.636c-cloud1-4g4nzi8a994f009b-1411647226/production_process/1.jpg',   // 新增
        step: 1
      },
      {
        title: '第二步：粘胶',
        videoUrl: 'cloud://cloud1-4g4nzi8a994f009b.636c-cloud1-4g4nzi8a994f009b-1411647226/production_process/第一步-糊布：贴胶（1）.mp4',
        poster: 'cloud://cloud1-4g4nzi8a994f009b.636c-cloud1-4g4nzi8a994f009b-1411647226/production_process/2.jpg',   
        step: 2
      },
      {
        title: '第三步：糊布',
        videoUrl: 'cloud://cloud1-4g4nzi8a994f009b.636c-cloud1-4g4nzi8a994f009b-1411647226/production_process/第一步-糊布（2）.mp4',
        poster: 'cloud://cloud1-4g4nzi8a994f009b.636c-cloud1-4g4nzi8a994f009b-1411647226/production_process/3.jpg',   
        step: 3
      },
      {
        title: '第四步：装配',
        videoUrl: 'cloud://cloud1-4g4nzi8a994f009b.636c-cloud1-4g4nzi8a994f009b-1411647226/production_process/第四步-装配.mp4',
        poster: 'cloud://cloud1-4g4nzi8a994f009b.636c-cloud1-4g4nzi8a994f009b-1411647226/production_process/4.jpg',   
        step: 4
      }
    ],
    qaVideos: [
      {
        title: '鱼灯制作需要哪些材料？',
        videoUrl: 'cloud://cloud1-4g4nzi8a994f009b.636c-cloud1-4g4nzi8a994f009b-1411647226/Quick_Q&A/快问快答 (1).mp4',
        question: 1
      },
      {
        title: '初学者如何入门鱼灯制作？',
        videoUrl: 'cloud://cloud1-4g4nzi8a994f009b.636c-cloud1-4g4nzi8a994f009b-1411647226/Quick_Q&A/快问快答 (3).mp4',
        question: 2
      },
      {
        title: '鱼灯制作需要多长时间？',
        videoUrl: 'cloud://cloud1-4g4nzi8a994f009b.636c-cloud1-4g4nzi8a994f009b-1411647226/Quick_Q&A/快问快答 (2).mp4',
        question: 3
      }
    ],

    // 只记录最后播放的ID
    lastPlayId: ''
  },

  // 标签切换
  onSectionTap(e) {
    const section = e.currentTarget.dataset.section;

    // 【关键】立即停止所有视频，不等待
    this.stopAll();

    // 延迟100ms再切换页面 → 彻底解决冲突
    setTimeout(() => {
      this.setData({
        activeSection: section,
        lastPlayId: ''
      });
    }, 100);
  },

  // 播放视频（修复版）
  onVideoPlay(e) {
    const { section, index } = e.currentTarget.dataset;
    const videoId = `video-${section}-${index}`;

    // 【最关键】如果和上一个相同，不执行任何操作
    if (this.data.lastPlayId === videoId) {
      return;
    }

    // 停止所有其他视频
    this.stopAll();

    // 更新记录
    this.setData({
      lastPlayId: videoId
    });

    // 延迟100ms再全屏 → 绝对不会冲突
    setTimeout(() => {
      const ctx = wx.createVideoContext(videoId, this);
      ctx.play();
      ctx.requestFullScreen({ direction: 90 });
    }, 100);
  },

  // 停止所有视频（最干净）
  stopAll() {
    // 停止 making
    this.data.makingVideos.forEach((_, i) => {
      let ctx = wx.createVideoContext(`video-making-${i}`, this);
      ctx.stop();
    });
    // 停止 qa
    this.data.qaVideos.forEach((_, i) => {
      let ctx = wx.createVideoContext(`video-qa-${i}`, this);
      ctx.stop();
    });
  },

  // 错误提示
  onVideoError(e) {
    console.error('视频错误', e);
  },

  onHide() { this.stopAll() },
  onUnload() { this.stopAll() }
});