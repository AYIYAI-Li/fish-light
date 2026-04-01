Page({
  data: {
    userInfo: {},
    isLoggedIn: false,
    profileSource: 'custom', 
    wechatUserInfo: {},
    showEditDialog: false,
    tempNickname: '',
    tempAvatarUrl: '',
    hasUserInfo: false,
    canIUseNicknameComp: wx.canIUse && wx.canIUse('input.type.nickname'),
    userOpenId: '',
    isInitializing: true,
    showFirstLoginDialog: false,
    hasCustomProfile: false,
    gridItems: [
      {
        title: '我的动态',
        icon: 'cloud://cloud1-4g4nzi8a994f009b.636c-cloud1-4g4nzi8a994f009b-1411647226/icon/comment.png',
        url: '/pages/my-posts/my-posts'
      },
    ],
    listItems: [
      {
        title: '关于我们',
        url: '/pages/about/about'
      },
      {
        title: '联系客服',
        url: '/pages/contact/contact'
      },
      {
        title: '意见反馈',
        url: '/pages/feedback/feedback'
      }
    ]
  },


  
  onLoad(options) {
    console.log('[my] 页面加载，开始初始化用户账号');
    const app = getApp();
    this.initializeUserAccount();
    console.log('[my] 页面加载完成');
  },
  
  onShow() {
    console.log('[my] 页面显示，检查登录状态');
    const app = getApp();
    app.checkAndSyncLocalUserState();
    
    // 检查头像显示问题
    this.fixAvatarDisplay();
    
    // 检查是否有自定义用户信息
    const customUserInfo = wx.getStorageSync('custom_user_info');
    const storedOpenId = wx.getStorageSync('user_openid');
    
    if (customUserInfo && storedOpenId && customUserInfo.nickName && customUserInfo.avatarUrl) {
      const hasCustom = !!(customUserInfo.nickName && customUserInfo.avatarUrl && customUserInfo.nickName !== '微信用户');
      
      if (!this.data.isLoggedIn || !this.data.hasCustomProfile) {
        this.setData({
          userInfo: customUserInfo,
          isLoggedIn: true,
          userOpenId: storedOpenId,
          hasUserInfo: true,
          hasCustomProfile: hasCustom
        });
        
        app.syncUserLoginStatus(customUserInfo, true, storedOpenId, 'custom');
      }
    }
    
    this.updateHasUserInfo();
  },


  
  // 统一头像点击路由
  onAvatarTap() {
    console.log('[my] avatar tapped, isLoggedIn=', this.data.isLoggedIn);
    if (this.data.isLoggedIn) {
      return;
    } else {
      try {
        const customUserInfo = wx.getStorageSync('custom_user_info');
        const storedOpenId = wx.getStorageSync('user_openid');
        const hasCustom =
          !!customUserInfo &&
          !!storedOpenId &&
          !!customUserInfo.nickName &&
          !!customUserInfo.avatarUrl;

        if (hasCustom) {
          this.performCloudLogin();
        } else {
          this.setData({ showFirstLoginDialog: true });
        }
      } catch (e) {
        console.error('[my] 头像点击检查本地资料失败，使用首次登录流程:', e);
        this.setData({ showFirstLoginDialog: true });
      }
    }
  },

  //  用户登录与初始化 
  // 初始化用户账号
  async initializeUserAccount() {
    try {
      const app = getApp();
      
      // 首先检查是否有自定义资料
      const customUserInfo = wx.getStorageSync('custom_user_info');
      const storedOpenId = wx.getStorageSync('user_openid');
      
      if (customUserInfo && storedOpenId && customUserInfo.nickName && customUserInfo.avatarUrl) {
        console.log('[my] 找到已设置的自定义用户信息');
        
        // 检查头像路径是否为有效路径
        let avatarUrl = customUserInfo.avatarUrl;
        if (this.isTempFilePath(avatarUrl) || !this.isValidAvatarUrl(avatarUrl)) {
          console.warn('[my] 检测到无效的头像路径，使用默认头像');
          avatarUrl = 'cloud://cloud1-4g4nzi8a994f009b.636c-cloud1-4g4nzi8a994f009b-1411647226/icon/default-avatar.png';
          customUserInfo.avatarUrl = avatarUrl;
          
          // 更新本地存储
          wx.setStorageSync('custom_user_info', customUserInfo);
        }
        
        this.setData({
          userInfo: customUserInfo,
          isLoggedIn: true,
          userOpenId: storedOpenId,
          isInitializing: false,
          hasUserInfo: !!(customUserInfo.nickName && customUserInfo.avatarUrl),
          hasCustomProfile: true
        });
        
        app.syncUserLoginStatus(customUserInfo, true, storedOpenId, 'custom');
        return;
      }

      // 如果没有自定义资料，尝试从全局状态恢复
      if (app.globalData.isLogin && app.globalData.userInfo) {
        const openid = app.globalData.openid;
        const userInfo = app.globalData.userInfo || {};
        const hasCustom = !!(userInfo.nickName && userInfo.avatarUrl && userInfo.nickName !== '微信用户');
        
        // 检查头像有效性
        let avatarUrl = userInfo.avatarUrl;
        if (this.isTempFilePath(avatarUrl) || !this.isValidAvatarUrl(avatarUrl)) {
          avatarUrl = 'cloud://cloud1-4g4nzi8a994f009b.636c-cloud1-4g4nzi8a994f009b-1411647226/icon/default-avatar.png';
          userInfo.avatarUrl = avatarUrl;
        }
        
        this.setData({
          userInfo: userInfo,
          isLoggedIn: true,
          userOpenId: openid,
          isInitializing: false,
          hasUserInfo: !!(userInfo.nickName && userInfo.avatarUrl),
          hasCustomProfile: hasCustom
        });
        
        this.updateHasUserInfo();
        return;
      }

      // 尝试从旧的存储格式恢复
      const storedUserInfo = wx.getStorageSync('user_info');
      
      if (storedOpenId && storedUserInfo && storedUserInfo.nickName) {
        const hasCustom = !!(storedUserInfo.nickName && storedUserInfo.avatarUrl && storedUserInfo.nickName !== '微信用户');
        
        // 检查头像有效性
        let avatarUrl = storedUserInfo.avatarUrl;
        if (this.isTempFilePath(avatarUrl) || !this.isValidAvatarUrl(avatarUrl)) {
          avatarUrl = 'cloud://cloud1-4g4nzi8a994f009b.636c-cloud1-4g4nzi8a994f009b-1411647226/icon/default-avatar.png';
          storedUserInfo.avatarUrl = avatarUrl;
        }
        
        this.setData({
          userInfo: storedUserInfo,
          isLoggedIn: true,
          userOpenId: storedOpenId,
          isInitializing: false,
          hasUserInfo: !!(storedUserInfo.nickName && storedUserInfo.avatarUrl),
          hasCustomProfile: hasCustom
        });
        
        app.syncUserLoginStatus(storedUserInfo, true, storedOpenId, 'custom');
        return;
      }

      // 无登录状态
      this.setData({
        isInitializing: false,
        isLoggedIn: false,
        hasCustomProfile: false
      });
      
    } catch (error) {
      console.error('[my] 初始化用户账号失败:', error);
      this.setData({ isInitializing: false });
    }
  },

  // 执行云开发登录
  async performCloudLogin() {
    return new Promise((resolve, reject) => {
      const app = getApp();
      
      app.globalData.userLoginSuccess = (data) => {
        try {
          const userInfo = data.userInfo || {};
          const openid = data.openid;
          const hasCustom = !!(userInfo.nickName && userInfo.avatarUrl && userInfo.nickName !== '微信用户');
          
          // 检查头像有效性
          let avatarUrl = userInfo.avatarUrl;
          if (this.isTempFilePath(avatarUrl) || !this.isValidAvatarUrl(avatarUrl)) {
            avatarUrl = 'cloud://cloud1-4g4nzi8a994f009b.636c-cloud1-4g4nzi8a994f009b-1411647226/icon/default-avatar.png';
            userInfo.avatarUrl = avatarUrl;
          }
          
          this.setData({
            userInfo: userInfo,
            isLoggedIn: true,
            userOpenId: openid,
            hasUserInfo: !!(userInfo.nickName && userInfo.avatarUrl),
            hasCustomProfile: hasCustom
          });
          
          this.updateHasUserInfo();
          resolve(data);
        } catch (e) {
          reject(e);
        }
      };
      app.cloudLogin();
    });
  },
  
  // 处理首次登录弹窗的确认按钮
  async handleFirstLoginConfirm() {
    const app = getApp();
    
    // 先检查是否已有自定义资料（包含历史登录用户）
    let hasCustom = this.data.hasCustomProfile;
    if (!hasCustom) {
      try {
        const customUserInfo = wx.getStorageSync('custom_user_info');
        const storedOpenId = wx.getStorageSync('user_openid');
        hasCustom =
          !!customUserInfo &&
          !!storedOpenId &&
          !!customUserInfo.nickName &&
          !!customUserInfo.avatarUrl &&
          customUserInfo.nickName !== '微信用户';
      } catch (e) {
        console.warn('[my] 检查历史自定义资料失败:', e);
      }
    }

    if (hasCustom) {
      await this.performCloudLogin();
      this.setData({
        showFirstLoginDialog: false,
        showEditDialog: false
      });
    } else {
      // 完全新的用户：登录后引导设置头像昵称
      await this.performCloudLogin();
      this.setData({
        showFirstLoginDialog: false,
        showEditDialog: true,
        tempNickname: '',
        tempAvatarUrl: ''
      });
    }
  },

  // 首次登录弹窗的取消按钮
  handleFirstLoginCancel() {
    this.setData({ showFirstLoginDialog: false });
  },
  
  // 退出登录
  handleLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      confirmText: '确认退出',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          const app = getApp();
          app.cloudLogout();
          
          this.setData({
            userInfo: {},
            isLoggedIn: false,
            hasUserInfo: false,
            showEditDialog: false,
            showFirstLoginDialog: false,
            hasCustomProfile: false
          });
          
          wx.showToast({ title: '已退出登录', icon: 'success' });
        }
      }
    });
  },
  
  // 用户资料编辑 
  
  // 已登录用户点击头像
  handleAvatarTap() {
    const current = this.data.userInfo || {};
    this.setData({
      showEditDialog: true,
      tempNickname: current.nickName || '',
      tempAvatarUrl: current.avatarUrl || ''
    });
  },

  // 资料设置选项
  handleSettingsTap() {
    if (!this.data.isLoggedIn) {
      this.setData({ showFirstLoginDialog: true });
      return;
    }
    
    wx.showActionSheet({
      itemList: ['修改头像昵称', '退出登录'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.handleAvatarTap();
        } else if (res.tapIndex === 1) {
          this.handleLogout();
        }
      }
    });
  },
  
  // 输入昵称
  onNicknameInput(e) {
    const nick = e.detail.value;
    const ava = this.data.tempAvatarUrl;
    this.setData({ 
      tempNickname: nick,
      hasUserInfo: !!nick && !!ava
    });
  },
  
  // 更新头像昵称状态
  updateHasUserInfo() {
    const nick = this.data.tempNickname || (this.data.userInfo && this.data.userInfo.nickName);
    const ava = this.data.tempAvatarUrl || (this.data.userInfo && this.data.userInfo.avatarUrl);
    this.setData({ hasUserInfo: !!nick && !!ava });
  },
  
  // 取消编辑
  cancelEdit() {
    console.log('[my] 取消编辑');
    this.setData({ 
      showEditDialog: false, 
      tempNickname: '', 
      tempAvatarUrl: '' 
    });
    
    // 如果是首次登录且取消了设置，保持登录状态但标记为需要设置
    if (this.data.isLoggedIn && !this.data.hasCustomProfile) {
      wx.showToast({ 
        title: '请尽快设置头像昵称', 
        duration: 2000
      });
    }
  },
  
  // 保存头像昵称设置
  async saveCustomProfile() {
    const nickName = (this.data.tempNickname || '').trim();
    const avatarUrl = (this.data.tempAvatarUrl || '').trim();
    
    if (!nickName) {
      wx.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }
    if (!avatarUrl) {
      wx.showToast({ title: '请选择头像', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '保存中...', mask: true });

    try {
      let finalAvatarUrl = avatarUrl;

      // 检查是否为临时路径，如果是则重新上传
      if (this.isTempFilePath(avatarUrl)) {
        console.log('检测到临时路径，重新上传头像');
        try {
          finalAvatarUrl = await this.uploadAvatarToCloud(avatarUrl);
        } catch (uploadError) {
          console.error('头像重新上传失败:', uploadError);
          wx.hideLoading();
          wx.showToast({ title: '头像保存失败', icon: 'none' });
          return;
        }
      }

      // 调用云函数更新数据库
      const result = await wx.cloud.callFunction({
        name: 'userLogin',
        data: {
          action: 'updateCustomProfile',
          nickName: nickName,
          avatarUrl: finalAvatarUrl
        }
      });

      if (result.result.success) {
        const customUserInfo = {
          nickName: nickName,
          avatarUrl: finalAvatarUrl,
          openId: this.data.userOpenId,
          isCustom: true,
          updateTime: new Date().toISOString()
        };

        // 保存到本地存储
        this.saveUserInfoToLocal(customUserInfo);

        // 更新页面状态
        this.setData({
          userInfo: customUserInfo,
          showEditDialog: false,
          hasUserInfo: true,
          hasCustomProfile: true
        });
        
        // 同步到全局状态
        const app = getApp();
        app.syncUserLoginStatus(customUserInfo, true, this.data.userOpenId, 'custom');
        
        wx.hideLoading();
        wx.showToast({ title: '设置成功', icon: 'success' });
        
      } else {
        wx.hideLoading();
        wx.showToast({ title: result.result.message || '保存失败', icon: 'none' });
      }
      
    } catch (error) {
      console.error('保存用户信息失败:', error);
      wx.hideLoading();
      wx.showToast({ title: '设置失败', icon: 'none' });
    }
  },
  
  // 保存用户信息到本地存储
  saveUserInfoToLocal(userInfo) {
    try {
      wx.setStorageSync('custom_user_info', userInfo);
      wx.setStorageSync('user_info', userInfo);
      wx.setStorageSync('user_openid', this.data.userOpenId);
      
      console.log('[my] 用户信息已保存到本地存储');
    } catch (error) {
      console.error('保存到本地存储失败:', error);
    }
  },
  
  // 头像处理 
  
  // 使用新版 chooseAvatar 回调
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    if (avatarUrl) {
      wx.showLoading({ title: '上传中...', mask: true });
      this.uploadAvatarToCloud(avatarUrl).then(newAvatarUrl => {
        this.setData({
          tempAvatarUrl: newAvatarUrl,
          hasUserInfo: !!this.data.tempNickname && !!newAvatarUrl
        });
        wx.hideLoading();
        wx.showToast({ title: '头像已更新', icon: 'none' });
      }).catch(err => {
        wx.hideLoading();
        wx.showToast({ title: '头像上传失败', icon: 'none' });
        console.error('上传头像失败', err);
      });
    }
  },

  // 上传头像到云存储（确保使用永久路径）
  uploadAvatarToCloud(tempFilePath) {
    return new Promise((resolve, reject) => {
      const openid = this.data.userOpenId || 'unknown';
      const timestamp = new Date().getTime();
      const random = Math.floor(Math.random() * 10000);
    
      // 使用用户openid作为路径，确保唯一性
      const cloudPath = `user_avatars/${openid}/avatar_${timestamp}_${random}.jpg`;
    
      console.log('开始上传头像到:', cloudPath);
    
      wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: tempFilePath,
        success: (res) => {
          console.log('头像上传成功，fileID:', res.fileID);
          resolve(res.fileID); 
        },
        fail: (err) => {
          console.error('上传头像到云存储失败:', err);
          reject(err);
        }
      });
    });
  },
  
  // 修复头像显示问题
  fixAvatarDisplay() {
    const { userInfo } = this.data;
    
    if (userInfo && userInfo.avatarUrl && 
        (this.isTempFilePath(userInfo.avatarUrl) || !this.isValidAvatarUrl(userInfo.avatarUrl))) {
      console.log('检测到无效头像路径，进行修复');
      
      // 使用默认头像替代无效路径
      const fixedUserInfo = {
        ...userInfo,
        avatarUrl: 'cloud://cloud1-4g4nzi8a994f009b.636c-cloud1-4g4nzi8a994f009b-1411647226/icon/default-avatar.png'
      };
      
      this.setData({ userInfo: fixedUserInfo });
      
      // 更新本地存储
      wx.setStorageSync('custom_user_info', fixedUserInfo);
      
      wx.showToast({
        title: '头像显示已修复',
        icon: 'success',
        duration: 2000
      });
    }
  },
  
  // 检查是否为临时路径
  isTempFilePath(path) {
    if (!path) return false;
    return path.includes('tmp/') || 
           path.startsWith('wxfile://') || 
           path.includes('WeappFileSystem') ||
           path.includes('AppData') ||
           path.includes('http://tmp/');
  },

  // 检查是否为有效头像路径
  isValidAvatarUrl(path) {
    if (!path) return false;
    return path.startsWith('cloud://') || 
           path.startsWith('http://') || 
           path.startsWith('https://') ||
           path.includes('user_avatars/') ||
           path.includes('../../images/');
  },

  // 页面跳转
  handleNavigate(e) {
    const url = e.currentTarget.dataset.url;
    if (url) {
      wx.navigateTo({ url });
    }
  }
});
