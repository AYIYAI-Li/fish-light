/**
 * 获取全局用户信息
 * @returns {Object} 用户信息对象
 */
export function getGlobalUserInfo() {
  const app = getApp();
  return app.getGlobalUserInfo();
}

/**
 * 检查用户是否已登录
 * @returns {boolean} 是否已登录
 */
export function isUserLoggedIn() {
  const app = getApp();
  return app.isUserLoggedIn();
}

/**
 * 获取用户头像和昵称
 * @returns {Object|null} 用户头像和昵称，未登录时返回null
 */
export function getUserProfile() {
  const app = getApp();
  return app.getUserProfile();
}

/**
 * 获取用户昵称
 * @returns {string|null} 用户昵称，未登录时返回null
 */
export function getUserNickname() {
  const profile = getUserProfile();
  return profile ? profile.nickName : null;
}

/**
 * 获取用户头像
 * @returns {string|null} 用户头像URL，未登录时返回null
 */
export function getUserAvatar() {
  const profile = getUserProfile();
  return profile ? profile.avatarUrl : null;
}

/**
 * 获取用户OpenID
 * @returns {string|null} 用户OpenID，未登录时返回null
 */
export function getUserOpenId() {
  const app = getApp();
  return app.globalData.userOpenId;
}

/**
 * 等待用户登录完成
 * @param {number} timeout 超时时间（毫秒），默认5000ms
 * @returns {Promise} 返回用户信息Promise
 */
export function waitForUserLogin(timeout = 5000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const checkLogin = () => {
      if (isUserLoggedIn()) {
        resolve(getGlobalUserInfo());
        return;
      }
      
      if (Date.now() - startTime > timeout) {
        reject(new Error('等待用户登录超时'));
        return;
      }
      
      setTimeout(checkLogin, 100);
    };
    
    checkLogin();
  });
}

/**
 * 监听用户登录状态变化
 * @param {Function} callback 状态变化回调函数
 * @param {number} interval 检查间隔（毫秒），默认500ms
 * @returns {Function} 返回停止监听的函数
 */
export function watchUserLoginStatus(callback, interval = 500) {
  let lastStatus = null;
  
  const timer = setInterval(() => {
    const currentStatus = isUserLoggedIn();
    
    if (lastStatus !== currentStatus) {
      lastStatus = currentStatus;
      callback(currentStatus, getGlobalUserInfo());
    }
  }, interval);
  
  // 返回停止监听的函数
  return () => {
    clearInterval(timer);
  };
}

/**
 * 格式化用户显示名称
 * @param {string} fallback 未登录时的默认显示文本
 * @returns {string} 格式化后的用户显示名称
 */
export function formatUserDisplayName(fallback = '未登录') {
  const nickname = getUserNickname();
  return nickname || fallback;
}

/**
 * 获取用户头像URL（带默认头像）
 * @param {string} defaultAvatar 默认头像URL
 * @returns {string} 用户头像URL
 */
export function getUserAvatarWithDefault(defaultAvatar = '/images/default-avatar-2.png') {
  const avatar = getUserAvatar();
  return avatar || defaultAvatar;
}

/**
 * 用户账号管理工具函数
 */

/**
 * 保存用户账号信息（包括备份）
 * @param {Object} userInfo 用户信息
 * @param {string} openId 用户OpenID
 */
export function saveUserAccount(userInfo, openId) {
  if (!userInfo || !openId) {
    console.warn('[userState] 保存用户账号失败：参数不完整');
    return false;
  }
  
  try {
    // 保存主要用户信息
    wx.setStorageSync('userInfo', userInfo);
    wx.setStorageSync('userOpenId', openId);
    wx.setStorageSync('profileSource', 'custom');
    
    // 创建备份用户信息，用于退出登录后恢复
    wx.setStorageSync(`backup_userInfo_${openId}`, userInfo);
    
    console.log('[userState] 用户账号信息保存成功，OpenID:', openId);
    return true;
  } catch (error) {
    console.error('[userState] 保存用户账号信息失败:', error);
    return false;
  }
}

/**
 * 恢复用户账号信息
 * @param {string} openId 用户OpenID
 * @returns {Object|null} 恢复的用户信息，失败时返回null
 */
export function restoreUserAccount(openId) {
  if (!openId) {
    console.warn('[userState] 恢复用户账号失败：OpenID为空');
    return null;
  }
  
  try {
    // 首先尝试从主要存储恢复
    let userInfo = wx.getStorageSync('userInfo');
    const storedOpenId = wx.getStorageSync('userOpenId');
    
    if (userInfo && userInfo.nickName && userInfo.avatarUrl && userInfo.openId === openId) {
      console.log('[userState] 从主要存储恢复用户账号成功');
      return userInfo;
    }
    
    // 尝试从备份存储恢复
    const backupUserInfo = wx.getStorageSync(`backup_userInfo_${openId}`);
    if (backupUserInfo && backupUserInfo.nickName && backupUserInfo.avatarUrl) {
      console.log('[userState] 从备份存储恢复用户账号成功');
      
      // 恢复备份信息到主要存储
      const restoredUserInfo = { ...backupUserInfo, openId: openId };
      wx.setStorageSync('userInfo', restoredUserInfo);
      wx.setStorageSync('userOpenId', openId);
      wx.setStorageSync('profileSource', 'custom');
      
      return restoredUserInfo;
    }
    
    console.log('[userState] 没有找到可恢复的用户账号信息');
    return null;
  } catch (error) {
    console.error('[userState] 恢复用户账号信息失败:', error);
    return null;
  }
}

/**
 * 清除用户登录状态（保留账号信息用于恢复）
 * @param {string} openId 用户OpenID
 */
export function clearUserLoginState(openId) {
  try {
    // 清除登录状态但保留OpenID和备份信息
    wx.removeStorageSync('userInfo');
    wx.removeStorageSync('profileSource');
    wx.removeStorageSync('wechatUserInfo');
    
    // 不清除userOpenId和backup_userInfo，用于后续恢复
    
    console.log('[userState] 用户登录状态已清除，账号信息已保留，OpenID:', openId);
    return true;
  } catch (error) {
    console.error('[userState] 清除用户登录状态失败:', error);
    return false;
  }
}

/**
 * 检查用户账号是否存在
 * @param {string} openId 用户OpenID
 * @returns {boolean} 是否存在用户账号
 */
export function hasUserAccount(openId) {
  if (!openId) return false;
  
  try {
    // 检查主要存储
    const userInfo = wx.getStorageSync('userInfo');
    const storedOpenId = wx.getStorageSync('userOpenId');
    
    if (userInfo && userInfo.nickName && userInfo.avatarUrl && storedOpenId === openId) {
      return true;
    }
    
    // 检查备份存储
    const backupUserInfo = wx.getStorageSync(`backup_userInfo_${openId}`);
    if (backupUserInfo && backupUserInfo.nickName && backupUserInfo.avatarUrl) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('[userState] 检查用户账号失败:', error);
    return false;
  }
}

/**
 * 获取用户账号的完整信息
 * @param {string} openId 用户OpenID
 * @returns {Object|null} 用户账号信息，包括登录状态
 */
export function getUserAccountInfo(openId) {
  if (!openId) return null;
  
  try {
    const userInfo = wx.getStorageSync('userInfo');
    const storedOpenId = wx.getStorageSync('userOpenId');
    const profileSource = wx.getStorageSync('profileSource') || 'custom';
    
    // 如果主要存储中有匹配的信息
    if (userInfo && userInfo.nickName && userInfo.avatarUrl && storedOpenId === openId) {
      return {
        userInfo: userInfo,
        isLoggedIn: true,
        openId: openId,
        profileSource: profileSource
      };
    }
    
    // 检查备份存储
    const backupUserInfo = wx.getStorageSync(`backup_userInfo_${openId}`);
    if (backupUserInfo && backupUserInfo.nickName && backupUserInfo.avatarUrl) {
      return {
        userInfo: backupUserInfo,
        isLoggedIn: false, 
        openId: openId,
        profileSource: 'custom'
      };
    }
    
    return null;
  } catch (error) {
    console.error('[userState] 获取用户账号信息失败:', error);
    return null;
  }
}

/**
 * 检查并同步全局登录状态
 * 用于确保页面间登录状态的一致性
 */
export function checkAndSyncGlobalLoginState() {
  const app = getApp();
  if (app && app.checkAndSyncLocalUserState) {
    app.checkAndSyncLocalUserState();
  }
}

/**
 * 获取当前登录状态（实时检查）
 * 优先使用全局状态，如果全局状态异常则检查本地存储
 */
export function getCurrentLoginState() {
  const app = getApp();
  
  // 首先检查全局状态
  if (app && app.globalData && app.globalData.isLoggedIn) {
    return {
      isLoggedIn: true,
      userInfo: app.globalData.userInfo,
      userOpenId: app.globalData.userOpenId,
      profileSource: app.globalData.profileSource
    };
  }
  
  // 如果全局状态异常，检查本地存储
  try {
    const userInfo = wx.getStorageSync('userInfo');
    const userOpenId = wx.getStorageSync('userOpenId');
    const profileSource = wx.getStorageSync('profileSource') || 'custom';
    
    if (userInfo && userInfo.nickName && userInfo.avatarUrl && userInfo.openId === userOpenId) {
      // 本地有有效数据，同步到全局
      if (app && app.syncUserLoginStatus) {
        app.syncUserLoginStatus(userInfo, true, userOpenId, profileSource);
      }
      
      return {
        isLoggedIn: true,
        userInfo: userInfo,
        userOpenId: userOpenId,
        profileSource: profileSource
      };
    }
  } catch (error) {
    console.error('[userState] 检查本地存储失败:', error);
  }
  
  return {
    isLoggedIn: false,
    userInfo: null,
    userOpenId: null,
    profileSource: 'custom'
  };
}

/**
 * 确保用户登录状态持久化
 * 在页面切换或应用恢复时调用，确保登录状态不丢失
 */
export function ensureLoginStatePersistence() {
  const app = getApp();
  
  if (!app) {
    console.warn('[userState] 应用实例未找到');
    return false;
  }
  
  try {
    // 检查并同步本地存储的用户状态
    app.checkAndSyncLocalUserState();
    
    // 获取当前登录状态
    const currentState = getCurrentLoginState();
    
    if (currentState.isLoggedIn) {
      console.log('[userState] 登录状态持久化检查完成，用户已登录');
      return true;
    } else {
      console.log('[userState] 登录状态持久化检查完成，用户未登录');
      return false;
    }
  } catch (error) {
    console.error('[userState] 确保登录状态持久化失败:', error);
    return false;
  }
}

/**
 * 页面间登录状态同步
 * 在页面显示时调用，确保与全局状态一致
 */
export function syncPageLoginState() {
  const app = getApp();
  
  if (!app) {
    console.warn('[userState] 应用实例未找到');
    return null;
  }
  
  try {
    // 检查并同步全局状态
    app.checkAndSyncLocalUserState();
    
    // 返回当前登录状态
    return getCurrentLoginState();
  } catch (error) {
    console.error('[userState] 页面间登录状态同步失败:', error);
    return null;
  }
}
