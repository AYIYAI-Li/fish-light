const db = wx.cloud.database();
const _ = db.command;

Page({
  data: {
    user: '我',
    userNickname: '匿名用户', 
    userAvatar: '/images/default-avatar.png', 
    userOpenId: null, 
    posts: [],
    comments: {},

    showPostModal: false,
    postContent: '',
    postImages: [],

    showCommentModal: false,
    commentInput: '',
    commentPostId: null,
    replyToCommentId: null,
    replyToUser: '',

    groups: [
      { title: '鱼灯非遗文化交流群', desc: '交流鱼灯相关信息', qq: '1092507256' }
    ],
    showGroupModal: false,
    groupModalInfo: null
  },

  onLoad() {
    this.syncCurrentUserInfo();
    this.fetchPosts();
  },

  onShow() {
    this.syncCurrentUserInfo();
    this.fetchPosts();
  },

  // 同步当前用户信息 
  syncCurrentUserInfo() {
    try {
      const app = getApp();
      
      // 优先从本地存储获取自定义用户信息
      const customUserInfo = wx.getStorageSync('custom_user_info');
      const storedOpenId = wx.getStorageSync('user_openid');
      
      if (customUserInfo && customUserInfo.nickName && storedOpenId) {
        this.setData({ 
          user: customUserInfo.nickName,
          userNickname: customUserInfo.nickName,
          userAvatar: customUserInfo.avatarUrl || '/images/default-avatar.png',
          userOpenId: storedOpenId
        });
        console.log('[community] 从自定义用户信息获取成功');
        return;
      }
      
      // 从全局状态获取用户信息
      if (app.globalData.isLogin && app.globalData.userInfo) {
        const userInfo = app.globalData.userInfo;
        this.setData({ 
          user: userInfo.nickName || '我',
          userNickname: userInfo.nickName || '匿名用户',
          userAvatar: userInfo.avatarUrl || '/images/default-avatar.png',
          userOpenId: app.globalData.openid
        });
        console.log('[community] 用户信息同步成功:', userInfo);
      } else {
        // 尝试从其他本地存储获取
        const storedUserInfo = wx.getStorageSync('user_info');
        
        if (storedUserInfo && storedUserInfo.nickName) {
          this.setData({ 
            user: storedUserInfo.nickName,
            userNickname: storedUserInfo.nickName,
            userAvatar: storedUserInfo.avatarUrl || '/images/default-avatar.png',
            userOpenId: storedOpenId
          });
          console.log('[community] 从本地存储获取用户信息成功');
        } else {
          // 未登录状态
          this.setData({ 
            user: '我',
            userNickname: '匿名用户',
            userAvatar: '/images/default-avatar.png',
            userOpenId: null
          });
          console.log('[community] 用户未登录，使用默认信息');
        }
      }
    } catch (e) { 
      console.error('[community] 同步用户信息失败', e);
      // 默认状态
      this.setData({ 
        user: '我',
        userNickname: '匿名用户',
        userAvatar: '/images/default-avatar.png',
        userOpenId: null
      });
    }
  },

  // 加载动态
  fetchPosts() {
    wx.showLoading({ title: '加载中' });
    return db.collection('posts')
      .orderBy('createdAt', 'desc')
      .get()
      .then(res => {
        const currentOpenId = this.data.userOpenId;
        const currentName = this.data.userNickname;
        const currentAvatar = this.data.userAvatar;

        const posts = (res.data || []).map(p => {
          const isMine = currentOpenId && p.userOpenId === currentOpenId;
          return {
            ...p,
            id: p._id,
            time: this.formatTime(p.createdAt),
            user: isMine ? currentName : (p.user || '匿名用户'),
            avatar: isMine ? currentAvatar : (p.avatar || '/images/default-avatar.png'),
            comments: Math.max(0, Number(p.comments) || 0)
          };
        });
        this.setData({ posts });
        const postIds = posts.map(p => p.id);
        wx.hideLoading();
        if (postIds.length) this.fetchCommentsForPosts(postIds);
      })
      .catch(err => {
        console.error('获取动态失败', err);
        wx.hideLoading();
        wx.showToast({ title: '加载动态失败', icon: 'error' });
      });
  },

  // 批量加载评论
  fetchCommentsForPosts(postIds) {
    db.collection('comments')
      .where({ postId: _.in(postIds) })
      .orderBy('createdAt', 'asc')
      .get()
      .then(res => {
        const currentOpenId = this.data.userOpenId;
        const currentName = this.data.userNickname;
        const currentAvatar = this.data.userAvatar;

        const map = {};
        (res.data || []).forEach(c => {
          const pid = c.postId;
          if (!map[pid]) map[pid] = [];
          const isMine = currentOpenId && c.userOpenId === currentOpenId;
          map[pid].push({
            ...c,
            id: c._id,
            time: this.formatTime(c.createdAt),
            user: isMine ? currentName : (c.user || '匿名用户'),
            avatar: isMine ? currentAvatar : (c.avatar || '/images/default-avatar.png')
          });
        });
        this.setData({ comments: map });
      })
      .catch(err => console.error('获取评论失败', err));
  },

  // 时间格式化
  formatTime(ts) {
    if (!ts) return '';
    const date = new Date(ts);
    const now = new Date();
    const diff = now - date;
    const m = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (m < 1) return '刚刚';
    if (m < 60) return `${m}分钟前`;
    if (h < 24) return `${h}小时前`;
    if (d < 30) return `${d}天前`;
    const y = date.getFullYear();
    const mo = String(date.getMonth() + 1).padStart(2, '0');
    const da = String(date.getDate()).padStart(2, '0');
    return `${y}-${mo}-${da}`;
  },

  // 发布弹窗
  onShowPostModal() {
    // 检查是否登录
    if (!this.data.userOpenId) {
      wx.showModal({
        title: '当前未登录',
        content: '登录后即可发布动态，是否前往“我的”进行登录？',
        confirmText: '登录',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            wx.switchTab({
              url: '/pages/my/my'
            });
          }
        }
      });
      return;
    }
    this.setData({ showPostModal: true });
  },

  onHidePostModal() {
    this.setData({ showPostModal: false, postContent: '', postImages: [] });
  },

  onPostContentInput(e) {
    this.setData({ postContent: e.detail.value });
  },

  // 选择/移除图片
  onChooseImage() {
    const that = this;
    wx.chooseImage({
      count: Math.max(0, 9 - that.data.postImages.length),
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success(res) {
        that.setData({ postImages: that.data.postImages.concat(res.tempFilePaths) });
      }
    });
  },

  onRemoveImage(e) {
    const idx = e.currentTarget.dataset.idx;
    const imgs = this.data.postImages.slice();
    imgs.splice(idx, 1);
    this.setData({ postImages: imgs });
  },

  // 发布动态 - 修改为使用当前用户信息
  async onSubmitPost() {
    const { postContent, postImages, userNickname, userAvatar, userOpenId } = this.data;
    
    if (!userOpenId) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    if (!postContent.trim()) {
      wx.showToast({ title: '内容不能为空', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '发布中' });
    try {
      const secRes = await wx.cloud.callFunction({
        name: 'userLogin',
        data: {
          action: 'checkContentSafety',
          content: postContent,
          scene: 2
        }
      });
      const secResult = secRes.result || {};
      if (!secResult.pass) {
        wx.hideLoading();
        wx.showToast({ title: secResult.message || '内容不符合平台规范', icon: 'none' });
        return;
      }

      const fileIDs = [];
      for (let i = 0; i < postImages.length; i++) {
        const filePath = postImages[i];
        const ext = (filePath.match(/\.[^.]+?$/) || [''])[0] || '.jpg';
        const cloudPath = `community_posts/${Date.now()}-${i}-${Math.random().toString(36).slice(2)}${ext}`;
        const { fileID } = await wx.cloud.uploadFile({ cloudPath, filePath });
        fileIDs.push(fileID);
      }

      const customUserInfo = wx.getStorageSync('custom_user_info') || {};
      const avatarFileId = customUserInfo.avatarFileId || '';

      const newDoc = {
        user: userNickname,
        avatar: userAvatar,
        avatarFileId: avatarFileId, 
        userOpenId: userOpenId,
        content: postContent,
        images: fileIDs,
        comments: 0,
        createdAt: db.serverDate(),
      };
      await db.collection('posts').add({ data: newDoc });

      this.setData({ showPostModal: false, postContent: '', postImages: [] });
      wx.hideLoading();
      wx.showToast({ title: '发布成功', icon: 'success' });
      this.fetchPosts();
    } catch (e) {
      console.error('发布失败', e);
      wx.hideLoading();
      wx.showToast({ title: '发布失败', icon: 'error' });
    }
  },



  // 评论弹窗
  onShowCommentModal(e) {
    if (!this.data.userOpenId) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    const postId = e.currentTarget.dataset.id;
    this.setData({
      showCommentModal: true,
      commentInput: '',
      commentPostId: postId,
      replyToCommentId: null,
      replyToUser: ''
    });
  },

  onHideCommentModal() {
    this.setData({ showCommentModal: false, commentInput: '', replyToCommentId: null, replyToUser: '' });
  },

  onCommentInput(e) {
    this.setData({ commentInput: e.detail.value });
  },

  // 发送评论回复
  async onSendComment() {
    const { commentInput, commentPostId, replyToCommentId, replyToUser, userNickname, userAvatar, userOpenId } = this.data;
    const text = (commentInput || '').trim();
    if (!text) {
      wx.showToast({ title: '评论不能为空', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '发送中' });
    try {
      const secRes = await wx.cloud.callFunction({
        name: 'userLogin',
        data: {
          action: 'checkContentSafety',
          content: text,
          scene: 2
        }
      });
      const secResult = secRes.result || {};
      if (!secResult.pass) {
        wx.hideLoading();
        wx.showToast({ title: secResult.message || '内容不符合平台规范', icon: 'none' });
        return;
      }

      await db.collection('comments').add({
        data: {
          postId: commentPostId,
          user: userNickname,
          text: text, 
          avatar: userAvatar,
          userOpenId: userOpenId,
          replyTo: replyToCommentId || null,
          replyToUser: replyToUser || '',
          createdAt: db.serverDate(),
        }
      });

      // 改为重新统计真实评论数，避免并发或脏数据导致的负数
      await this.recomputePostCommentCount(commentPostId);

      this.setData({ showCommentModal: false, commentInput: '', replyToCommentId: null, replyToUser: '' });
      wx.hideLoading();
      wx.showToast({ title: '评论成功', icon: 'success' });
      this.fetchPosts();
    } catch (e) {
      console.error('发送评论失败', e);
      wx.hideLoading();
      wx.showToast({ title: '发送失败', icon: 'error' });
    }
  },

  // 删除动态 - 添加权限验证
  onDeletePost(e) {
    const postId = e.currentTarget.dataset.id;
    const { posts, userOpenId } = this.data;
    const post = posts.find(p => p.id === postId);

    if (!post || post.userOpenId !== userOpenId) {
      wx.showToast({ title: '只能删除自己的动态', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条动态吗？删除后不可恢复。',
      confirmText: '删除',
      confirmColor: '#e53e3e',
      success: async (res) => {
        if (!res.confirm) return;
        wx.showLoading({ title: '删除中' });
        try {
          if (post && Array.isArray(post.images) && post.images.length) {
            await wx.cloud.deleteFile({ fileList: post.images });
          }
          await db.collection('comments').where({ postId }).remove();
          await db.collection('posts').doc(postId).remove();

          this.setData({
            posts: posts.filter(p => p.id !== postId),
            comments: Object.keys(this.data.comments).reduce((acc, k) => {
              if (k !== postId) acc[k] = this.data.comments[k];
              return acc;
            }, {})
          });

          wx.hideLoading();
          wx.showToast({ title: '已删除', icon: 'success' });
        } catch (e) {
          console.error('删除动态失败', e);
          wx.hideLoading();
          wx.showToast({ title: '删除失败', icon: 'error' });
        }
      }
    });
  },

  // 点击"回复"
  onReplyComment(e) {
    if (!this.data.userOpenId) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    const { postid, id, user } = e.currentTarget.dataset;
    this.setData({
      showCommentModal: true,
      commentInput: `@${user} `,
      commentPostId: postid,
      replyToCommentId: id,
      replyToUser: user
    });
  },

  // 删除评论/回复 - 添加权限验证
  onDeleteComment(e) {
    const { postid, id } = e.currentTarget.dataset;
    const { comments, userOpenId } = this.data;

    const list = comments[postid] || [];
    const target = list.find(c => c.id === id);
    if (!target || !target.userOpenId || target.userOpenId !== userOpenId) {
      wx.showToast({ title: '只能删除自己的评论', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条评论吗？',
      confirmText: '删除',
      confirmColor: '#e53e3e',
      success: async (res) => {
        if (!res.confirm) return;
        wx.showLoading({ title: '删除中' });
        try {
          const all = comments[postid] || [];
          const toDelete = [id];
          let changed = true;
          while (changed) {
            changed = false;
            all.forEach(c => {
              if (c.replyTo && toDelete.includes(c.replyTo) && !toDelete.includes(c.id)) {
                toDelete.push(c.id);
                changed = true;
              }
            });
          }

          for (const cid of toDelete) {
            await db.collection('comments').doc(cid).remove();
          }
          await db.collection('posts').doc(postid).update({ data: { comments: _.inc(-toDelete.length) } });

          const newMap = { ...comments };
          newMap[postid] = (newMap[postid] || []).filter(c => !toDelete.includes(c.id));
          this.setData({ comments: newMap });

          wx.hideLoading();
          wx.showToast({ title: '已删除', icon: 'success' });
          this.fetchPosts();
        } catch (e) {
          console.error('删除评论失败', e);
          wx.hideLoading();
          wx.showToast({ title: '删除失败', icon: 'error' });
        }
      }
    });
  },

  // 交流群弹窗
  onShowGroupModal(e) {
    const idx = e.currentTarget.dataset.idx;
    const group = this.data.groups[idx];
    this.setData({ showGroupModal: true, groupModalInfo: group });
  },

  onHideGroupModal() {
    this.setData({ showGroupModal: false, groupModalInfo: null });
  },
  
  // 下拉刷新
  onPullDownRefresh() {
    console.log('下拉刷新');
    this.syncCurrentUserInfo();
    
    this.fetchPosts()
      .then(() => {
        wx.stopPullDownRefresh();
      })
      .catch(err => {
        console.error('刷新数据失败', err);
        wx.stopPullDownRefresh();
        wx.showToast({ title: '刷新失败', icon: 'error' });
      });
  },
  
  // 重新统计真实评论数并写回帖子
  async recomputePostCommentCount(postId) {
    try {
      const { total } = await db.collection('comments').where({ postId }).count();
      await db.collection('posts').doc(postId).update({ data: { comments: total } });
      const newPosts = (this.data.posts || []).map(p => p.id === postId ? { ...p, comments: total } : p);
      this.setData({ posts: newPosts });
    } catch (err) {
      console.error('重新统计评论数失败', err);
    }
  }, 

  // 头像加载失败时：尝试用 fileID 刷新临时URL，不行则回退默认头像
  async onAvatarError(e) {
    const { type, id, idx } = e.currentTarget.dataset;
    try {
      if (type === 'post') {
        const posts = this.data.posts || [];
        const post = posts.find(p => p.id === id);
        if (!post) return;
        if (post.avatarFileId) {
          const { fileList } = await wx.cloud.getTempFileURL({ fileList: [post.avatarFileId] });
          const url = fileList && fileList[0] && fileList[0].tempFileURL;
          const newPosts = posts.map(p => p.id === id ? { ...p, avatar: url || '/images/default-avatar.png' } : p);
          this.setData({ posts: newPosts });
        } else {
          const newPosts = posts.map(p => p.id === id ? { ...p, avatar: '/images/default-avatar.png' } : p);
          this.setData({ posts: newPosts });
        }
      }
    } catch (err) {
      console.error('刷新头像失败', err);
      if (type === 'post') {
        const posts = (this.data.posts || []).map(p => p.id === id ? { ...p, avatar: '/images/default-avatar.png' } : p);
        this.setData({ posts });
      }
    }
  }
});
