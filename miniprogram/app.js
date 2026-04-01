App({
  globalData: {
    userInfo: null,
    openid: null,
    isLogin: false,
    userLoginSuccess: null 
  },

  onLaunch: function() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'cloud1-4g4nzi8a994f009b', 
        traceUser: true,
      })
    }

  /**
   * 检查登录状态
   */
    this.checkLoginStatus()
  },
  checkLoginStatus: function() {
    const token = wx.getStorageSync('user_token')
    const userInfo = wx.getStorageSync('user_info')
    const openid = wx.getStorageSync('user_openid')
    
    if (token && userInfo && openid) {
      this.globalData.token = token
      this.globalData.userInfo = userInfo
      this.globalData.openid = openid
      this.globalData.isLogin = true
      console.log('检测到已有登录状态')
    }
  },

  /**
   * 登录流程
   */
  cloudLogin: function() {
    wx.showLoading({ title: '登录中...', mask: true })

    // 1. 获取用户微信登录凭证
    wx.login({
      success: async (loginRes) => {
        if (loginRes.code) {
          try {
            // 2. 调用云函数进行登录
            const result = await wx.cloud.callFunction({
              name: 'userLogin', 
              data: {
                action: 'login',
                code: loginRes.code
              }
            })

            const { success, data, message } = result.result
            
            if (success) {
              // 3. 登录成功，保存用户信息
              this.globalData.openid = data.openid
              this.globalData.userInfo = data.userInfo || null
              this.globalData.isLogin = true

              // 保存到本地存储
              wx.setStorageSync('user_token', data.token || data.openid)
              wx.setStorageSync('user_info', data.userInfo || { openid: data.openid })
              wx.setStorageSync('user_openid', data.openid)

              wx.hideLoading()
              wx.showToast({ title: '登录成功', icon: 'success' })
              console.log('云开发登录成功', data)

              // 触发登录成功事件
              if (this.globalData.userLoginSuccess) {
                this.globalData.userLoginSuccess(data)
                this.globalData.userLoginSuccess = null
              }

            } else {
              wx.hideLoading()
              wx.showToast({ title: message || '登录失败', icon: 'none' })
            }
          } catch (error) {
            wx.hideLoading()
            console.error('调用云函数失败:', error)
            wx.showToast({ title: '网络错误', icon: 'none' })
          }
        } else {
          wx.hideLoading()
          console.error('获取code失败:', loginRes.errMsg)
        }
      },
      fail: (err) => {
        wx.hideLoading()
        console.error('wx.login调用失败:', err)
      }
    })
  },

  /**
   * 获取用户信息（需要用户授权）
   */
  getUserProfile: function() {
    wx.getUserProfile({
      success: async (res) => {
        const userInfo = res.userInfo
        try {
          // 更新用户信息到云数据库
          const result = await wx.cloud.callFunction({
            name: 'userLogin',
            data: {
              action: 'updateUserInfo',
              userInfo: userInfo
            }
          })
          
          if (result.result.success) {
            this.globalData.userInfo = userInfo
            wx.setStorageSync('user_info', userInfo)
            wx.showToast({ title: '信息更新成功', icon: 'success' })
          }
        } catch (error) {
          console.error('更新用户信息失败:', error)
        }
      },
      fail: (err) => {
        console.log('用户拒绝授权:', err)
      }
    })
  },

  /**
   * 退出登录
   */
  cloudLogout: async function() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'userLogin',
        data: {
          action: 'logout'
        }
      })
      
      if (result.result.success) {
        // 清除本地存储
        wx.removeStorageSync('user_token')
        wx.removeStorageSync('user_info')
        wx.removeStorageSync('user_openid')
        
        // 清除全局数据
        this.globalData.token = null
        this.globalData.userInfo = null
        this.globalData.openid = null
        this.globalData.isLogin = false

        wx.showToast({ title: '已退出登录', icon: 'success' })
        console.log('用户已退出登录')
      } else {
        wx.showToast({ title: '退出失败', icon: 'none' })
      }
    } catch (error) {
      console.error('退出登录失败:', error)
      wx.removeStorageSync('user_token')
      wx.removeStorageSync('user_info')
      wx.removeStorageSync('user_openid')
      this.globalData.token = null
      this.globalData.userInfo = null
      this.globalData.openid = null
      this.globalData.isLogin = false
      wx.showToast({ title: '已退出', icon: 'success' })
    }
  },

  /**
   * 同步用户登录状态到全局
   */
  syncUserLoginStatus: function(userInfo, isLoggedIn, openid, profileSource) {
    this.globalData.userInfo = userInfo
    this.globalData.isLogin = isLoggedIn
    this.globalData.openid = openid
    this.globalData.profileSource = profileSource
  },


  checkAndSyncLocalUserState: function() {
    const token = wx.getStorageSync('user_token')
    const userInfo = wx.getStorageSync('user_info')
    const openid = wx.getStorageSync('user_openid')
    
    if (token && userInfo && openid) {
      this.globalData.token = token
      this.globalData.userInfo = userInfo
      this.globalData.openid = openid
      this.globalData.isLogin = true
    }
  }
})
