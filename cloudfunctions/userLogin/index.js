const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const usersCollection = db.collection('users')

exports.main = async (event, context) => {
  const { action } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    switch (action) {
      case 'login':
        return await handleLogin(event, openid)
      case 'updateUserInfo':
        return await updateUserInfo(event, openid)
      case 'updateCustomProfile': 
        return await updateCustomProfile(event, openid)
      case 'logout':
        return await handleLogout(openid)
      case 'getUserInfo':
        return await getUserInfo(openid)
      case 'checkContentSafety':
        return await checkContentSafety(event, openid)
      default:
        return { success: false, message: '未知操作' }
    }
  } catch (error) {
    console.error('云函数错误:', error)
    return { success: false, message: '服务器错误' }
  }
}

// 处理登录
async function handleLogin(event, openid) {
  try {
    // 首先检查用户是否存在
    const userQuery = await usersCollection.where({ _id: openid }).get()
    const userExists = userQuery.data.length > 0
    const now = new Date()

    if (!userExists) {
      const newUser = {
        _id: openid,
        openid: openid,
        nickName: '微信用户', 
        avatarUrl: '', 
        createTime: now,
        updateTime: now,
        lastLoginTime: now,
        isLoggedIn: true,
        loginCount: 1,
        isCustom: false 
      }
      
      await usersCollection.add({ data: newUser })
      
      return {
        success: true,
        data: {
          openid: openid,
          userInfo: {
            nickName: '微信用户',
            avatarUrl: '',
            openId: openid,
            isCustom: false
          },
          isNewUser: true
        }
      }
    } else {
      // 老用户更新登录信息
      await usersCollection.doc(openid).update({
        data: {
          isLoggedIn: true,
          lastLoginTime: now,
          updateTime: now,
          loginCount: db.command.inc(1)
        }
      })

      // 获取用户信息
      const userResult = await usersCollection.doc(openid).get()
      const userData = userResult.data

      return {
        success: true,
        data: {
          openid: openid,
          userInfo: {
            nickName: userData.nickName,
            avatarUrl: userData.avatarUrl,
            openId: openid,
            isCustom: userData.isCustom || false
          },
          isNewUser: false
        }
      }
    }

  } catch (error) {
    console.error('登录过程错误:', error)
    return { success: false, message: '登录失败' }
  }
}

// 更新自定义资料
async function updateCustomProfile(event, openid) {
  const { nickName, avatarUrl } = event

  if (!nickName || !avatarUrl) {
    return { success: false, message: '昵称和头像不能为空' }
  }

  try {
    const updateData = {
      nickName: nickName,
      avatarUrl: avatarUrl,
      updateTime: new Date(),
      isCustom: true, 
      isLoggedIn: true
    }

    await usersCollection.doc(openid).update({
      data: updateData
    })

    await db.collection('posts').where({ userOpenId: openid }).update({
      data: {
        user: nickName,
        avatar: avatarUrl
      }
    })

    await db.collection('comments').where({ userOpenId: openid }).update({
      data: {
        user: nickName,
        avatar: avatarUrl
      }
    })

    // 返回更新后的用户信息
    const userResult = await usersCollection.doc(openid).get()
    const userData = userResult.data

    return { 
      success: true, 
      message: '资料更新成功',
      data: {
        userInfo: {
          nickName: userData.nickName,
          avatarUrl: userData.avatarUrl,
          openId: openid,
          isCustom: true
        }
      }
    }
  } catch (error) {
    console.error('更新用户资料失败:', error)
    return { success: false, message: '更新失败' }
  }
}

// 更新用户信息
async function updateUserInfo(event, openid) {
  const { userInfo } = event

  if (!userInfo) {
    return { success: false, message: '用户信息不能为空' }
  }

  try {
    const updateData = {
      updateTime: new Date()
    }

    // 只更新传入的字段
    if (userInfo.nickName) updateData.nickName = userInfo.nickName
    if (userInfo.avatarUrl) updateData.avatarUrl = userInfo.avatarUrl
    if (userInfo.isCustom !== undefined) updateData.isCustom = userInfo.isCustom

    await usersCollection.doc(openid).update({
      data: updateData
    })

    return { 
      success: true, 
      message: '用户信息更新成功'
    }
  } catch (error) {
    console.error('更新用户信息失败:', error)
    return { success: false, message: '更新失败' }
  }
}

// 获取用户信息
async function getUserInfo(openid) {
  try {
    const userResult = await usersCollection.doc(openid).get()
    
    if (userResult.data) {
      return {
        success: true,
        data: userResult.data
      }
    } else {
      return { success: false, message: '用户不存在' }
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return { success: false, message: '获取失败' }
  }
}

// 处理退出
async function handleLogout(openid) {
  try {
    await usersCollection.doc(openid).update({
      data: {
        isLoggedIn: false,
        lastLogoutTime: new Date()
      }
    })

    return { success: true, message: '退出成功' }
  } catch (error) {
    console.error('退出错误:', error)
    return { success: false, message: '退出失败' }
  }
}

async function checkContentSafety(event, openid) {
  const { content, scene } = event
  const text = (content || '').trim()
  if (!text) {
    return { success: true, pass: true }
  }
  try {
    const res = await cloud.openapi.security.msgSecCheck({
      openid,
      scene: scene || 2,
      version: 2,
      content: text
    })
    const suggest = res && res.result && res.result.suggest
    const pass = !suggest || suggest === 'pass'
    if (pass) {
      return { success: true, pass: true }
    }
    return { success: false, pass: false, message: '内容不符合平台规范' }
  } catch (error) {
    console.error('内容安全检测失败:', error)
    return { success: false, pass: false, message: '内容安全检测失败' }
  }
}
