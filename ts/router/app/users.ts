import { validateCgi } from "../../lib/validator"
import { usersValidator } from "./validator"
import { headImgOpt } from "../../config/resource"
import { getAsync } from "../../lib/request"
import { wxOpt } from "../../config/wechat"
import { wxPayOpt } from "../../config/wxpay"
import { Router, Request, Response, NextFunction } from "express"
import { checkPassword, md5sum } from "../../lib/utils"
import { updateStatusByUUID, findByprimay } from "../../model/pay/wxtrade"
import { uploadHeadImg } from "../../lib/upload"

import {
    saveOpenid, getOpenid, saveSmsCode, getSmsCode, removeSmsCode,
    saveCaptchaCode, getCaptchaCode, /* saveCaptchaCode2, getCaptchaCode2, */
    saveCaptchaCode3, getCaptchaCode3, getInvite, saveInvite
} from "../../redis/users"

import { setAppLoginAsync, delAppLogin, LoginInfo } from "../../redis/logindao"
import { sendOK, sendError as se, sendNotFound, sendErrMsg } from "../../lib/response"
import { checkAppLogin } from "../../redis/logindao"
import { sendSms } from "../../lib/sms"
import {
    insertUsers, deleteUser, getByUsername, updatePointlottery, wxqqInsertUser,
    updatePassword, updateInformation, checkUser, findByPrimary, finduserslevel/*, findNullPass*/
} from "../../model/users/users"

import { insertSmsCode } from "../../model/users/smscode"
import {
    findByPrimary as findExByPrimary, updatePoints, updateOpenid, updateQQcode,
    recharge, findByOpenid, findByQQcode, findByAppOpenid, updateAppOpenid
} from "../../model/users/users_ext"
import { insertStatistics } from "../../model/users/statistics"
import { insertReward } from "../../model/users/reward"
import { findByName } from "../../model/system/system"
import { amountcheck } from "../../lib/amountmonitor"

const captchapng = require("captchapng")
import { insertInvitation, getByInvite, updateInvitation, getByPhone } from "../../model/ads/invitation"
import { getInviteRule } from "../../model/ads/inviterule"
import logger = require("winston")

//新添加的
import { new_insertCrmUser } from "../../model/ads/crmuser"
export const router = Router()

//wx获取openid
router.get('/wxopenid', async function (req: Request, res: Response, next: NextFunction) {
    let { code, type } = (req as any).query
    validateCgi({ code }, usersValidator.wxcode)
    try {
        let opt = type ? { //公众号获取openid
            url: "https://api.weixin.qq.com/sns/oauth2/access_token?appid=" + wxOpt.appid +
                "&secret=" + wxOpt.secret + "&code=" + code + "&grant_type=authorization_code"
        } : {   //app获取openid
                url: "https://api.weixin.qq.com/sns/oauth2/access_token?appid=" + wxPayOpt.appid +
                    "&secret=" + wxPayOpt.key0 + "&code=" + code + "&grant_type=authorization_code"
            }

        let re = await getAsync(opt)
        let { openid, access_token } = JSON.parse(re)
        let opt2 = {    //获取个人信息
            url: "https://api.weixin.qq.com/sns/userinfo?access_token=" + access_token + "&openid=" + openid
        }
        let re2 = await getAsync(opt2)
        let { headimgurl, nickname } = JSON.parse(re2)

        let user_ext = type ? (await findByOpenid(openid)) : (await findByAppOpenid(openid))
        logger.info(`-----the openid is :` + openid + `,` + type + `,` + user_ext)
        if (user_ext && user_ext.length > 0) {  //绑定过手机了
            // 生成token, key
            let [now, uuid] = [new Date(), user_ext[0].uuid]
            let [token, key] = [md5sum(`${now.getTime()}_${Math.random()}`), md5sum(`${now.getTime()}_${Math.random()}`)]
            let cache = new LoginInfo(uuid, key, token, now.toLocaleString())

            // 缓存用户登陆信息到redis：key=uuid, value = {key:key, token:token, login:time}，key是双方协商的密钥，token是临时访问令牌
            await setAppLoginAsync(uuid, cache)
            let user = await findByPrimary(uuid)
            if (user.headurl.substring(0, 4) == 'http' && (user.headurl != headimgurl || user.nickname != nickname)) {
                await updateInformation(uuid, { headurl: headimgurl, nickname })
            }
            return sendOK(res, { key: key, token: token, uuid: uuid })
        }

        return sendOK(res, { openid, headimgurl, nickname })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//qq获取openid
router.get('/qqopenid', async function (req: Request, res: Response, next: NextFunction) {
    let { token } = (req as any).query
    validateCgi({ token }, usersValidator.token)

    try {
        let opt = {
            url: "https://graph.qq.com/oauth2.0/me?access_token=" + token
        }
        let re = await getAsync(opt)
        let openid = re.substring(re.indexOf(`"openid":"`) + 10, re.lastIndexOf(`"`))
        let opt2 = {    //获取个人的信息
            url: "https://graph.qq.com/user/get_simple_userinfo?" +
                "access_token=" + token + "&oauth_consumer_key=1105949172&openid=" + openid + "&format=json"
        }
        let re2 = await getAsync(opt2)
        let { figureurl_qq_1, nickname } = JSON.parse(re2)

        let user_ext = await findByQQcode(openid)
        if (user_ext && user_ext.length > 0) {  //绑定过手机了
            // 生成token, key
            let [now, uuid] = [new Date(), user_ext[0].uuid]
            let [token, key] = [md5sum(`${now.getTime()}_${Math.random()}`), md5sum(`${now.getTime()}_${Math.random()}`)]
            let cache = new LoginInfo(uuid, key, token, now.toLocaleString())

            // 缓存用户登陆信息到redis：key=uuid, value = {key:key, token:token, login:time}，key是双方协商的密钥，token是临时访问令牌
            await setAppLoginAsync(uuid, cache)
            let user = await findByPrimary(uuid)
            if (user.headurl.substring(0, 4) == 'http' && (user.headurl != figureurl_qq_1) || user.nickname != nickname) {
                await updateInformation(uuid, { headurl: figureurl_qq_1, nickname })
            }
            return sendOK(res, { key: key, token: token, uuid: uuid })
        }

        return sendOK(res, { openid, headimgurl: figureurl_qq_1, nickname })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//获取wx qq绑定情况,三种绑定
router.get('/bindstatus', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { useruuid } = (req as any).query
    try {
        let user_ext = await findExByPrimary(useruuid)
        return sendOK(res, { wxapp: user_ext.appopenid ? true : false, wx: user_ext.openid ? true : false, qq: user_ext.qqcode ? true : false })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})


//解绑wx,qq
router.put('/unbind', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { useruuid, type } = (req as any).body
    try {
        let r = null
        if (type == 'wx') {
            r = await updateOpenid(useruuid, null)
        } else if (type == 'qq') {
            r = await updateQQcode(useruuid, null)
        } else {
            r = await updateAppOpenid(useruuid, null)
        }
        if (r)
            return sendOK(res, { msg: "succ" })
        return sendErrMsg(res, "failed", 500)
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

router.get("/userslevel", checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    try {
        const loginInfo: LoginInfo = (req as any).loginInfo
        let userInfo = await finduserslevel(req.app.locals.sequelize, loginInfo.getUuid())
        return sendOK(res, { userInfo: userInfo })
    } catch (e) {

    }
})

//获得（或者刷新）图形验证码的图片
router.get('/captcha', async function (req: Request, res: Response, next: NextFunction) {
    let { username } = (req as any).query
    validateCgi({ username }, usersValidator.code)

    try {
        /*
                if (await getCaptchaCode2(username))
                    return sendErrMsg(res, "操作过于频繁", 500)
                await saveCaptchaCode2(username) */

        let code = parseInt(JSON.stringify(Math.random() * 9000 + 1000))
        await saveCaptchaCode(username, JSON.stringify(code))

        let p = new captchapng(100, 30, code)
        p.color(0, 0, 0, 0)
        p.color(80, 80, 80, 255)
        let img = p.getBase64()
        let imgbase64 = new Buffer(img, 'base64')
        res.writeHead(200, {
            'Content-Type': 'image/png'
        })
        return res.end(imgbase64)
    } catch (e) {
        return se(res, e)
    }
})

//第三方绑定,openid和qqcode二选一；code是短信验证码；username手机号
router.post('/wxqq', async function (req: Request, res: Response, next: NextFunction) {
    let { username, code, openid, qqcode, headimgurl, nickname, type, password } = (req as any).body
    let obj: any = {
        username: username,
        perm: { "appuser": 1 },       //权限
        uuid: "",
        password,
        mgruuids: new Array()
    }
    try {
        validateCgi({ code: code, username: username },
            usersValidator.wxqq)

        let us = await getByUsername(username)
        let us_ext = undefined
        if (us) {
            us_ext = await findExByPrimary(us.uuid)
            if (us.headurl == null)
                await updateInformation(us.uuid, { headurl: headimgurl })
            if (us.nickname == null)
                await updateInformation(us.uuid, { nickname })
        }

        if (!type) {    //qq
            if (qqcode && us && us_ext.qqcode && us_ext.qqcode != qqcode)
                return sendNotFound(res, "用户绑定了其他qq号")
        } else if (type == 'wx') {  //微信公众号
            if (openid && us && us_ext.openid && us_ext.openid != openid)
                return sendNotFound(res, "用户绑定了其他微信号")
        } else if (type == 'wxapp') {  //app微信
            if (openid && us && us_ext.appopenid && us_ext.appopenid != openid)
                return sendNotFound(res, "用户绑定了其他微信号")
        }

        let s = await getSmsCode(username)
        if (!s) {
            return sendErrMsg(res, "请先请求短信验证码", 500)
        }

        let m = JSON.parse(s)
        if (code == parseInt(m.code)) {
            let appuser
            if (!us && !us_ext) {   //新用户，要插入数据
                if (openid)
                    appuser = await wxqqInsertUser(req.app.locals.sequelize, username, openid, undefined, headimgurl, nickname, type, password)       //得到插入到appuser的信息
                else
                    appuser = await wxqqInsertUser(req.app.locals.sequelize, username, undefined, qqcode, headimgurl, nickname, undefined, password)

                obj.uuid = appuser.uuid             //取得appuser的uuid
                //插入记录到crm系统的用户中
                await new_insertCrmUser(obj);       //插入注册用户的记录到crm用户中,且uuid的值等于appuser
                await insertInvitation(appuser.uuid, username)
            } else {    //旧用户，可能需要登记openid或者qqcode
                if (openid && (!!!us_ext.openid || !!!us_ext.appopenid)) {  //绑定微信号
                    if (type == 'wxapp')
                        await updateAppOpenid(us_ext.uuid, openid)
                    if (type == 'wx')
                        await updateOpenid(us_ext.uuid, openid)
                } else if (qqcode && us_ext.qqcode == null) {   //绑定qq号
                    await updateQQcode(us_ext.uuid, qqcode)
                }
            }

            removeSmsCode(username)   // 不等待

            let users = await getByUsername(username)

            // 生成token, key
            let [now, uuid] = [new Date(), users.uuid]
            let [token, key] = [md5sum(`${now.getTime()}_${Math.random()}`), md5sum(`${now.getTime()}_${Math.random()}`)]
            let cache = new LoginInfo(uuid, key, token, now.toLocaleString())

            // 缓存用户登陆信息到redis：key=uuid, value = {key:key, token:token, login:time}，key是双方协商的密钥，token是临时访问令牌
            await setAppLoginAsync(uuid, cache)

            return sendOK(res, { key: key, token: token, uuid: uuid })
        }
        return sendNotFound(res, "验证码有误!")
    } catch (e) {
        e.info(se, res, e)
    }
})

//app 用户注册
router.post('/reg', async function (req: Request, res: Response, next: NextFunction) {
    let { username, password, code, invite, openid, nickname, platform } = (req as any).body
    let obj = {
        username,
        password,
        perm: { "appuser": 1 },       //权限
        uuid: "",
        mgruuids: new Array()
    }
    try {
        validateCgi({ code: code, username: username, password: password },
            usersValidator.register)

        let us = await getByUsername(username)
        if (us) {
            return sendNotFound(res, "用户已存在!")
        }

        let a = await getCaptchaCode3(username)
        if (!a && !platform) {
            return sendErrMsg(res, "未通过图形验证", 500)
        }

        let s = await getSmsCode(username)
        if (!s) {
            return sendErrMsg(res, "请先请求短信验证码", 500)
        }

        if (invite) {
            let inv = await getInvite(invite)
            if (inv)
                return sendErrMsg(res, "邀请过于频繁", 500)
        }

        let m = JSON.parse(s)
        if (code == parseInt(m.code)) {
            if (!openid)
                openid = null

            if (openid && openid !== undefined && openid !== 'undefined') {
                let user_ext = await findByOpenid(openid)
                if (user_ext && user_ext.length > 0) {
                    logger.error("openid 已存在,如需解绑请联系客服。" + openid);
                    return sendNotFound(res, "该微信用户已绑定，如需解绑请联系客服。");
                }
            }

            if (password === "123456789") {
                logger.error("invalid password", s, JSON.stringify((req as any).body))
                return sendNotFound(res, "密码太简单!")
            }
            let appuser = await insertUsers(req.app.locals.sequelize, username, password, nickname, openid)       //得到插入到appuser的信息
            obj.uuid = appuser.uuid             //取得appuser的uuid
            //插入记录到crm系统的用户中
            await new_insertCrmUser(obj);       //插入注册用户的记录到crm用户中,且uuid的值等于appuser

            removeSmsCode(username)   // 不等待

            let users = await getByUsername(username)
            let invtation = await insertInvitation(users.uuid, username)
            if (invite && invite !== "undefined") {
                const invitator = invite
                let oldinvtation = await getByPhone(invite)
                if (!oldinvtation) {
                    await deleteUser(users.uuid)
                    return sendNotFound(res, "邀请码不存在!")
                }

                invite = oldinvtation.invite
                let parentinvtation = await getByInvite(invite)
                if (parentinvtation) {

                    let inviterul = await getInviteRule(req.app.locals.sequelize)
                    let points: number = inviterul.invitepoint ? inviterul.invitepoint : 0
                    let parentpoints: number = inviterul.parentinvitepoint ? inviterul.parentinvitepoint : 0
                    let balance: number = inviterul.invitebalance ? inviterul.invitebalance : 0
                    let parentbalance: number = inviterul.parentinvitebalance ? inviterul.parentinvitebalance : 0

                    await updatePoints(parentinvtation.useruuid, { points: parentpoints, balance: parentbalance, exp: 0 })//邀请人得积分和零钱

                    await amountcheck(req.app.locals.sequelize, parentinvtation.useruuid, "invite", parentbalance / 100, parentpoints)

                    logger.debug(`用户${parentinvtation.useruuid}邀请手机号为${username}的用户注册获得points${parentpoints}balance${parentbalance}`)

                    await updatePoints(users.uuid, { points: points, balance: balance, exp: 0 })//注册人得积分和零钱
                    logger.debug(`用户${users.uuid}通过注册获得points${points}balance${balance}`)

                    let system = await findByName('numcondition')
                    await updatePointlottery(parentinvtation.useruuid, parseInt(system.content.invite))//邀请用户加抽奖机会
                    logger.debug(`用户${parentinvtation.useruuid}邀请手机号为${username}的用户注册获得${parseInt(system.content.invite)}次抽奖次数`)

                    await updateInvitation(parseInt(invite), invtation.invite)

                    let reward = {
                        useruuid: users.uuid,
                        username: users.username,
                        realname: users.realname,
                        balance: balance,
                        point: inviterul.invitepoint,
                        type: 'register'
                    }

                    await insertReward(reward)
                    let rewardparent = {
                        useruuid: parentinvtation.useruuid,
                        balance: parentbalance,
                        point: inviterul.invitepoint,
                        type: 'registerparent'
                    }
                    await insertReward(rewardparent)

                    await saveInvite(invitator, "inviting")//防海量邀请
                }
            }
            // 生成token, key
            let [now, uuid] = [new Date(), users.uuid]
            let [token, key] = [md5sum(`${now.getTime()}_${Math.random()}`), md5sum(`${now.getTime()}_${Math.random()}`)]
            let cache = new LoginInfo(uuid, key, token, now.toLocaleString())

            // 缓存用户登陆信息到redis：key=uuid, value = {key:key, token:token, login:time}，key是双方协商的密钥，token是临时访问令牌
            await setAppLoginAsync(uuid, cache)

            return sendOK(res, { key: key, token: token, uuid: uuid })
        }
        return sendNotFound(res, "验证码有误!")
    } catch (e) {
        se(res, e)
    }
})

// 发送短信
router.get('/message', async function (req: Request, res: Response, next: NextFunction) {
    let { phone, type, code, username } = req.query
    if (!phone) {
        phone = username
    }
    try {
        validateCgi({ phone: phone }, usersValidator.phone)
        if (await getSmsCode(phone)) {
            return sendOK(res, { msg: "ok" })
        }

        if (type && code) {
            let c = await getCaptchaCode(phone)
            if (parseInt(c) != parseInt(code))
                return sendErrMsg(res, "图形验证码错误", 502)
            await saveCaptchaCode3(phone)
        }

        let body = await sendSms(phone)     // "{"code":200,"msg":"1501","obj":"1121"}"
        // let body = JSON.stringify({ obj: "1234", "code": 200 })
        let m = JSON.parse(body)
        let cache = { body: body, code: m.obj }

        saveSmsCode(phone, JSON.stringify(cache)) // 不等待
        insertSmsCode(phone, { code: m.obj })  // 不等待

        return sendOK(res, { msg: "ok" })
    } catch (e) {
        e.info(se, res, e)
    }
})

// 修改密码
router.put('/username', async function (req: Request, res: Response, next: NextFunction) {
    let { username, password, code } = (req as any).body
    try {
        validateCgi({ code: code, username: username, password: password }, usersValidator.setPassword)

        let s = await getSmsCode(username)
        if (!s) {
            return sendNotFound(res, "请先请求验证码!")
        }

        let m = JSON.parse(s)
        if (code === m.code) {
            await updatePassword(username, password)
            removeSmsCode(username)  // 不等待
            return sendOK(res, { msg: "ok" })
        }

        return sendNotFound(res, "验证码有误!")
    } catch (e) {
        e.info(se, res, e)
    }
})

// 充值
router.put('/recharge/:uuid', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { moment } = (req as any).body
    const uuid = req.params['uuid']
    try {
        const loginInfo: LoginInfo = (req as any).loginInfo
        let wxtrade = await findByprimay(uuid)
        if (!wxtrade)
            return sendErrMsg(res, "不存在的UUID", 500)

        moment = wxtrade.total_fee
        validateCgi({
            uuid: loginInfo.getUuid(),
            moment: moment
        }, usersValidator.moment)

        if (wxtrade.state != 'fin' || wxtrade.status == 1)
            return sendErrMsg(res, "已充值，或者还未支付成功", 500)

        await recharge(loginInfo.getUuid(), moment)
        await updateStatusByUUID(wxtrade.uuid, 1)

        await amountcheck(req.app.locals.sequelize, loginInfo.getUuid(), "recharge", moment / 100, 0)

        let user_ext = await findExByPrimary(loginInfo.getUuid())
        user_ext.balance = user_ext.balance / 100
        user_ext.total_balance = user_ext.total_balance / 100
        return sendOK(res, { user_ext: user_ext })
    } catch (e) {
        e.info(se, res, e)
    }
})

async function findUserInfo(uuid: string) {
    let user = await findByPrimary(uuid)
    let user_ext = await findExByPrimary(uuid)
    if (!(user && user_ext))
        throw new Error("用户不存在！")

    let exclude = new Set<string>()
    exclude.add("password").add("modified")

    let merge: any = {}
    for (let k in user) {
        if (exclude.has(k))
            continue
        merge[k] = user[k]
    }
    return merge
}

//获得用户信息
router.get('/info', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    try {
        const loginInfo: LoginInfo = (req as any).loginInfo
        let users = await findByPrimary(loginInfo.getUuid())
        let users_ext = await findExByPrimary(loginInfo.getUuid())
        delete users.password
        return sendOK(res, { users: users, users_ext })
    } catch (e) {
        e.info(se, res, e)
    }

})

//抽奖获得用户信息
router.get('/userinfo', async function (req: Request, res: Response, next: NextFunction) {
    try {
        let useruuid = (req as any).headers.uuid
        let users = null
        if (useruuid) {
            users = await findByPrimary(useruuid)
            delete users.password
        }
        return sendOK(res, { users: users })
    } catch (e) {
        e.info(se, res, e)
    }

})

router.put('/message/:uuid', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { nickname, address, headurl, sex, birthday } = (req as any).body
    let uuid = req.params["uuid"]
    try {
        let obj
        if (nickname)
            obj = { uuid: uuid, nickname: nickname }
        if (address)
            obj = { uuid: uuid, address: address }
        if (headurl)
            obj = { uuid: uuid, headurl: headurl }
        if (sex)
            obj = { uuid: uuid, sex: sex }
        if (birthday)
            obj = { uuid: uuid, birthday: birthday }

        validateCgi(obj, usersValidator.patchInfo)

        delete obj.uuid
        let merge = await updateInformation(uuid, obj)
        return sendOK(res, merge)
    } catch (e) {
        e.info(se, res, e)
    }
})

// 修改个人信息
router.put('/:uuid', async function (req: Request, res: Response, next: NextFunction) {
    let { nickname, realname, idcard, address, headurl, sex, birthday, interest, description } = (req as any).body
    let uuid = req.params["uuid"]
    try {
        let obj = {
            uuid: uuid,
            nickname: (nickname === "undefined" ? null : nickname),
            realname: (realname === "null" ? null : realname),
            idcard: idcard,
            address: (address === "undefined" ? null : address),
            headurl: headurl,
            sex: sex,
            birthday: (birthday === "undefined" ? null : birthday),
            interest: interest,
            description: description
        }
        validateCgi(obj, usersValidator.information)

        delete obj.uuid
        await updateInformation(uuid, obj)

        let merge = findUserInfo(uuid)
        return sendOK(res, merge)
    } catch (e) {
        e.info(se, res, e)
    }
})

// 登陆
router.post('/login', async function (req: Request, res: Response, next: NextFunction) {
    const { username, password } = (req as any).body
    try {
        //校验参数
        validateCgi({ username: username, password: password }, usersValidator.applogin)

        let user = await getByUsername(username)
        if (!user)
            return sendNotFound(res, "用户不存在！")
        if (user.state === "off")
            return sendNotFound(res, "用户已被禁用,请联系管理员！")

        if (user.password == null)
            return sendErrMsg(res, "密码不存在，可能是第三方用户", 500)

        checkPassword(user.password, password)

        let obj = {
            useruuid: user.uuid,
            loginnumber: 1,
            searchnumber: 0,
            favoritenumber: 0,
            type: 'ads',
        }
        validateCgi({ loginnumber: obj.loginnumber, searchnumber: obj.searchnumber, favoritenumber: obj.favoritenumber, type: obj.type }, usersValidator.obj)
        await insertStatistics(obj)

        // 生成token, key
        let [now, uuid] = [new Date(), user.uuid]
        let [token, key] = [md5sum(`${now.getTime()}_${Math.random()}`), md5sum(`${now.getTime()}_${Math.random()}`)]
        let cache = new LoginInfo(uuid, key, token, now.toLocaleString())

        // 缓存用户登陆信息到redis：key=uuid, value = {key:key, token:token, login:time}，key是双方协商的密钥，token是临时访问令牌
        await setAppLoginAsync(uuid, cache)
        return sendOK(res, { key: key, token: token, uuid: uuid })
    } catch (e) {
        e.info(se, res, e)
    }
})

// 登出
router.post('/logout', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    let loginInfo: LoginInfo = (req as any).loginInfo
    delAppLogin(loginInfo.getUuid())  // 不等待
    return sendOK(res, { msg: "ok" })
})

router.get('/test', async function (req: any, res: Response, next: NextFunction) {
    return sendOK(res, { msg: "test ok" })
})

router.post('/headimg', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    try {
        const loginInfo: LoginInfo = (req as any).loginInfo
        let newPath = await uploadHeadImg(req, {
            uuid: loginInfo.getUuid(),
            tmpDir: headImgOpt.tmpDir,
            maxSize: headImgOpt.maxSize,
            extnames: headImgOpt.extnames,
            targetDir: headImgOpt.targetDir,
            fieldName: headImgOpt.fieldName,
        })
        return sendOK(res, newPath)
    } catch (e) {
        e.info(se, res, e)
    }
})

// 微信绑定时，请求微信授权
router.get('/bind', async function (req: Request, res: Response, next: NextFunction) {
    const code = req.query["code"]
    const tokenUrl = "https://api.weixin.qq.com/sns/oauth2/access_token"
    let url = `${tokenUrl}?appid=${wxOpt.appid}&secret=${wxOpt.secret}&code=${code}&grant_type=authorization_code`

    try {
        let body = await getAsync({ url: url })
        let m = JSON.parse(body)
        if (!m) {
            logger.info("wx oauth2 fail", body)
            return res.status(401)
        }

        const openid = m.openid
        if (!openid) {
            logger.info("wx oauth2 fail", body)
            return res.status(401)
        }

        await saveOpenid(openid)
        return res.redirect(`${wxOpt.bindRedirect}?openid=${openid}&t=${new Date().getTime()}`)
    } catch (e) {
        e.info(se, res, e)
    }
})

// 微信绑定时，请求微信授权
router.get('/regiester/bind', async function (req: Request, res: Response, next: NextFunction) {
    const code = req.query["code"]
    const tokenUrl = "https://api.weixin.qq.com/sns/oauth2/access_token"
    let url = `${tokenUrl}?appid=${wxOpt.appid}&secret=${wxOpt.secret}&code=${code}&grant_type=authorization_code`

    try {
        let body = await getAsync({ url: url })
        let m = JSON.parse(body)
        if (!m) {
            logger.info("wx oauth2 fail", body)
            return res.status(401)
        }

        const openid = m.openid
        if (!openid) {
            logger.info("wx oauth2 fail", body)
            return res.status(401)
        }

        await saveOpenid(openid)
        return res.redirect(`${wxOpt.registerBindRedirect}?openid=${openid}&t=${new Date().getTime()}`)
    } catch (e) {
        e.info(se, res, e)
    }
})

// 绑定用户微信openid
router.post('/bind', async function (req: Request, res: Response, next: NextFunction) {
    const { openid } = (req as any).query
    const { username, password } = (req as any).body
    try {
        if (!openid)
            return sendNotFound(res, "openid不存在！")

        validateCgi({ username: username, password: password }, usersValidator.bind)

        const id = await getOpenid(openid)
        if (!id)
            return sendNotFound(res, "openid不存在！")

        let user = await checkUser(username, password)
        if (!user)
            return sendNotFound(res, "用户不存在！")
        let user_ext = await findByOpenid(openid)
        if (user_ext.length > 0)
            return sendNotFound(res, "openid 已存在,如需解绑请联系客服。")

        await updateOpenid(user.uuid, openid)
        return sendOK(res, { msg: "ok" })
    } catch (e) {
        e.info(se, res, e)
    }
})

// 查询用户信息
router.get('/:uuid', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const uuid = req.params["uuid"]
    try {
        validateCgi({ uuid: uuid }, usersValidator.uuid)

        let merge = await findUserInfo(uuid)
        return sendOK(res, merge)
    } catch (e) {
        e.info(se, res, e)
    }
})

router.get('/appuser/:uuid', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const uuid = req.params["uuid"]
    try {
        validateCgi({ uuid: uuid }, usersValidator.uuid)

        let user = await findByPrimary(uuid)
        let user_ext = await findExByPrimary(uuid)
        if (!(user && user_ext))
            throw new Error("用户不存在！")

        delete user.password
        user_ext.balance = user_ext.balance / 100
        user_ext.total_balance = user_ext.total_balance / 100

        return sendOK(res, { user: user, user_ext: user_ext })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.patch('/appuser/:uuid', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const uuid = req.params["uuid"]
    try {
        validateCgi({ uuid: uuid }, usersValidator.uuid)

        let user = await findByPrimary(uuid)
        let user_ext = await findExByPrimary(uuid)
        if (!(user && user_ext))
            throw new Error("用户不存在！")

        delete user.password

        user_ext.balance = user_ext.balance / 100
        user_ext.total_balance = user_ext.total_balance / 100
        return sendOK(res, { user: user, user_ext: user_ext })
    } catch (e) {
        e.info(se, res, e)
    }
})

/* router.post('/abcd', async function (req: Request, res: Response, next: NextFunction) {
    let users = await findNullPass(req.app.locals.sequelize)
    let count = 0
    for (let i = 0; i < users.length; i++) {
        let res = await getByPhone(users[i].username)
        if (!res) {
            await insertInvitation(users[i].uuid, users[i].username)
            count++
        }
    }
    return sendOK(res, { count })
}) */