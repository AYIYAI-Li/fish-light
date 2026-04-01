// 让所有页面共享同一登录状态

const AUTH_HEADER_KEY = 'Authorization'; 

function getToken() {
  try { return wx.getStorageSync('user_token') || ''; } catch(e) { return ''; }
}

function getOpenId() {
  try { return wx.getStorageSync('user_openid') || wx.getStorageSync('userOpenId') || ''; } catch(e) { return ''; }
}

function getUserInfo() {
  try { return wx.getStorageSync('user_info') || wx.getStorageSync('userInfo') || null; } catch(e) { return null; }
}

function getAuthHeaders(extraHeaders = {}) {
  const token = getToken();
  const headers = { ...extraHeaders };
  if (token) headers[AUTH_HEADER_KEY] = `Bearer ${token}`; [AUTH_HEADER_KEY] = token
  return headers;
}

// 统一鉴权请求封装
function requestWithAuth(options = {}) {
  const { header = {}, ...rest } = options;
  const headers = getAuthHeaders(header);
  return wx.request({ header: headers, ...rest });
}

// 确保已登录
function ensureLogin() {
  const app = getApp();
  const hasToken = !!getToken();
  if (app && app.globalData && app.globalData.isLogin && hasToken) {
    return Promise.resolve({
      isLogin: true,
      token: getToken(),
      openid: getOpenId(),
      userInfo: getUserInfo()
    });
  }

  return new Promise((resolve, reject) => {
    try {
      const token = getToken();
      if (token) {
        if (app && app.globalData && !app.globalData.isLogin) {
          app.globalData.isLogin = true;
          app.globalData.userInfo = getUserInfo();
          app.globalData.openid = getOpenId();
        }
        resolve({ isLogin: true, token, openid: getOpenId(), userInfo: getUserInfo() });
        return;
      }

      if (!app || !app.cloudLogin) {
        reject(new Error('app.cloudLogin 未就绪'));
        return;
      }

      // 一次性登录成功回调
      app.userLoginSuccess = (data) => {
        resolve({
          isLogin: true,
          token: getToken(),
          openid: getOpenId(),
          userInfo: getUserInfo() || (data && data.userInfo) || null
        });
      };

      app.cloudLogin();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  AUTH_HEADER_KEY,
  getToken,
  getOpenId,
  getUserInfo,
  getAuthHeaders,
  requestWithAuth,
  ensureLogin
};
