const db = wx.cloud.database();
Page({
  data: {
    posts: []
  },

  onShow() {
    this.getMyPosts();
  },

  getMyPosts() {
    wx.showLoading({ title: '加载中...' });

    // 获取本地存储的用户信息
    const storedOpenId = wx.getStorageSync('user_openid');
    const customUserInfo = wx.getStorageSync('custom_user_info');
    console.log('本地存储的用户信息:', { storedOpenId, customUserInfo });

    // 调用云函数来获取当前用户的openid
    wx.cloud.callFunction({
      name: 'getOpenId',
      success: res => {
        const openid = res.result.openid;
        console.log('云函数获取的当前用户openid:', openid);
        
        // 获取所有帖子
        db.collection('posts')
        .orderBy('createdAt', 'desc')
        .get({
          success: res => {
            console.log('获取到的所有帖子数量:', res.data.length);
            
            // 尝试多种方式筛选用户的帖子
            const myPosts = [];
            
            res.data.forEach(post => {
              // 打印每个帖子的关键信息，帮助调试
              console.log('帖子信息:', {
                id: post._id,
                userOpenId: post.userOpenId,
                _openid: post._openid,
                user: post.user,
                createdAt: post.createdAt
              });
              
              // 尝试多种匹配方式
              const matchByUserOpenId = post.userOpenId === openid;
              const matchByOpenId = post._openid === openid;
              const matchByStoredOpenId = storedOpenId && (post.userOpenId === storedOpenId || post._openid === storedOpenId);
              
              console.log('匹配结果:', {
                matchByUserOpenId,
                matchByOpenId,
                matchByStoredOpenId
              });
              
              // 只要有一种方式匹配成功，就认为是用户的帖子
              if (matchByUserOpenId || matchByOpenId || matchByStoredOpenId) {
                myPosts.push(post);
              }
            });
            
            console.log('筛选后的我的帖子数量:', myPosts.length);
            
            // 格式化日期
            const posts = myPosts.map(post => {
              post.formattedDate = this.formatDate(post.createdAt);
              return post;
            });
            
            this.setData({ posts });
            wx.hideLoading();
          },
          fail: err => {
            console.error('查询帖子失败', err);
            wx.hideLoading();
            wx.showToast({ title: '加载失败', icon: 'error' });
          }
        });
      },
      fail: err => {
        console.error('获取openid失败', err);
        wx.hideLoading();
        wx.showToast({ title: '用户未登录', icon: 'error' });
      }
    });
  },

  formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    return `${year}-${month}-${day}`;
  },

  deletePost(e) {
    const postId = e.currentTarget.dataset.id;
  
    wx.showModal({
      title: '确认删除',
      content: '您确定要删除这条帖子吗？',
      success: res => {
        if (res.confirm) {
          // 先获取当前用户 openid
          wx.cloud.callFunction({
            name: 'getOpenId',
            success: userRes => {
              const currentUserOpenId = userRes.result.openid;
              console.log('删除操作 - 当前用户openid:', currentUserOpenId);
  
              // 查询该帖子，验证是否为本人发布
              db.collection('posts').doc(postId).get({
                success: postRes => {
                  const post = postRes.data;
                  console.log('要删除的帖子信息:', post);
  
                  // 获取本地存储的用户信息用于多种匹配方式
                  const storedOpenId = wx.getStorageSync('user_openid');
                  
                  // 尝试多种匹配方式
                  const matchByUserOpenId = post.userOpenId === currentUserOpenId;
                  const matchByOpenId = post._openid === currentUserOpenId;
                  const matchByStoredOpenId = storedOpenId && (post.userOpenId === storedOpenId || post._openid === storedOpenId);
                  
                  console.log('删除权限验证 - 匹配结果:', {
                    matchByUserOpenId,
                    matchByOpenId,
                    matchByStoredOpenId
                  });
                  
                  // 只要有一种方式匹配成功，就认为有权限删除
                  if (post && (matchByUserOpenId || matchByOpenId || matchByStoredOpenId)) {
                    console.log('验证通过，允许删除');
                    db.collection('posts').doc(postId).remove({
                      success: () => {
                        wx.showToast({ title: '删除成功' });
                        this.getMyPosts(); 
                      },
                      fail: err => {
                        wx.showToast({ title: '删除失败', icon: 'error' });
                        console.error('删除帖子失败', err);
                      }
                    });
                  } else {
                    console.log('验证失败，无权限删除');
                    wx.showToast({ title: '无权限删除此动态', icon: 'error' });
                  }
                },
                fail: err => {
                  console.error('查询帖子失败', err);
                  wx.showToast({ title: '操作失败', icon: 'error' });
                }
              });
            },
            fail: err => {
              console.error('获取openid失败', err);
              wx.showToast({ title: '用户未登录', icon: 'error' });
            }
          });
        }
      }
    });
  }
})
