import { crmuserValidator } from "./validator"
import { validateCgi } from "../../lib/validator"
import { checkLogin } from "../../redis/logindao"
import { sendOK, sendError as se, sendNoPerm, sendNotFound, sendErrMsg } from "../../lib/response"
import { setLoginAsync, delLogin, LoginInfo } from "../../redis/logindao"
import { Router, Request, Response, NextFunction } from "express"
import { findByUsername, findByPrimary, findGoodsOW, findMallCount, findByPassword, findMallUserInfo, modifiedPassword, findGoodsOWUserInfo, findByUsernames, findGoodsOWCount, insertCrmUser, findAdminrwUserInfo, resetPassword, findAdminrwCount, resetState, inserMgruuids, deleteCrmuser, findUserInfo, findCount, findByAppUsername, new_insertCrmUser } from "../../model/ads/crmuser"
import { resetAppUserState, getAllUsers, getAllUserPoints, /*getAll,*/ deleteUser, getCount } from "../../model/users/users"
import { findByPrimary as finduserext, updateOpenid } from "../../model/users/users_ext"
import { checkPassword, md5sum } from "../../lib/utils"
//import { timeformat } from "./puton";
import { timestamps } from "../../config/winston";

export const router: Router = Router()

async function setSetSingleField(obj: { uuid: string, field: string, value: string, func: Function }, req: Request, res: Response) {
    const { uuid, field, value, func } = obj
    let user = await findByPrimary(uuid)
    if (!user)
        return sendNotFound(res, "用户不存在！")

    if (user[field] === value)
        return sendOK(res, user)

    user = await func(uuid, value)

    delete user.password
    return sendOK(res, user)
}

//显示crmUser基本信息
router.get("/mallcrmsuer", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { start, length, draw, search } = req.query
    try {
        // const info: LoginInfo = (req as any).loginInfo
        // if (!info.isRoot() && !info.isAdminRW())
        //     return sendNoPerm(res)
        let searchdata = (search as any).value
        validateCgi({ start, length, searchdata }, crmuserValidator.pagination)
        let recordsFiltered = await findMallCount(searchdata)
        let crmusers = await findMallUserInfo(parseInt(start), parseInt(length), searchdata)
        return sendOK(res, { crmusers: crmusers, draw: draw, recordsFiltered: recordsFiltered })
    } catch (e) {
        e.info(se, res, e)
    }

})

//显示crmUser基本信息
router.get("/", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { start, length, draw, search } = req.query
    try {
        // const info: LoginInfo = (req as any).loginInfo
        // if (!info.isRoot() && !info.isAdminRW())
        //     return sendNoPerm(res)
        let searchdata = (search as any).value
        validateCgi({ start, length, searchdata }, crmuserValidator.pagination)
        let recordsFiltered = await findCount(searchdata)
        let crmusers = await findUserInfo(parseInt(start), parseInt(length), searchdata)
        return sendOK(res, { crmusers: crmusers, draw: draw, recordsFiltered: recordsFiltered })
    } catch (e) {
        e.info(se, res, e)
    }

})

router.get("/adminrw", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { start, length, draw, search } = req.query
    try {
        // const info: LoginInfo = (req as any).loginInfo
        // if (!info.isRoot())
        //     return sendNoPerm(res)
        let searchdata = (search as any).value
        validateCgi({ start, length, searchdata }, crmuserValidator.pagination)
        let recordsFiltered = await findAdminrwCount(searchdata)
        let crmusers = await findAdminrwUserInfo(parseInt(start), parseInt(length), searchdata)
        return sendOK(res, { crmusers: crmusers, draw: draw, recordsFiltered: recordsFiltered })
    } catch (e) {
        e.info(se, res, e)
    }

})

router.patch("/root", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { oldpassword, newpassword, confirmpassword } = (req as any).body
    try {
        const info: LoginInfo = (req as any).loginInfo

        if (confirmpassword != newpassword)
            return sendErrMsg(res, "两次输入密码不一致！", 409)

        let root = await findByPassword(oldpassword, info.getUuid())
        if (root) {
            await modifiedPassword(newpassword, info.getUuid())
            return sendOK(res, { msg: "修改密码成功！" })
        } else {
            return sendErrMsg(res, "密码输入错误！", 409)
        }
    } catch (e) {
        e.info(se, res, e)
    }

})

router.get("/goodsOW", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { start, length, draw, search } = req.query
    try {
        const info: LoginInfo = (req as any).loginInfo
        let searchdata = (search as any).value
        validateCgi({ start, length, searchdata }, crmuserValidator.pagination)
        let recordsFiltered
        let crmusers: any[]
        if (info.isRoot()) {
            recordsFiltered = await findGoodsOWCount(searchdata)
            crmusers = await findGoodsOWUserInfo(parseInt(start), parseInt(length), searchdata)
        }
        if (info.isGoodsRO() || info.isGoodsRW()) {
            recordsFiltered = 1
            crmusers = await findGoodsOW(info.getUuid())
        }
        return sendOK(res, { crmusers: crmusers, draw: draw, recordsFiltered: recordsFiltered })
    } catch (e) {
        e.info(se, res, e)
    }

})

/**
 *app用户信息管理
 */
router.get('/userInfo', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { start, length, draw, search, pointsort, balancesort } = req.query
    try {
        let searchdata = (search as any).value
        validateCgi({ start, length, searchdata }, crmuserValidator.pagination)
        //validateCgi({ pointsort: pointsort, balancesort: balancesort }, crmuserValidator.sort)
        let recordsFiltered = await getCount(req.app.locals.sequelize, searchdata)
        if (pointsort === undefined || pointsort === null)
            pointsort = ''

        if (balancesort === undefined || balancesort === null)
            balancesort = ''

        let appuser = await getAllUsers(req.app.locals.sequelize, searchdata, parseInt(start), parseInt(length), pointsort, balancesort)
        appuser.forEach(r => {
            r.created = timestamps(r.created)
            r.balance = r.balance / 100
            r.total_balance = r.total_balance / 100
        })
        return sendOK(res, { appuser: appuser, draw: draw, recordsFiltered: recordsFiltered })
    } catch (e) {
        e.info(se, res, e)
    }
})

/**
 *微信解绑
 */
router.put('/mvbind/:useruuid', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const appuuid = req.params["useruuid"]
    const { openid } = (req as any).body
    try {
        const info: LoginInfo = (req as any).loginInfo
        if (!info.isRoot() && !info.isAdminRW())
            return sendNoPerm(res)
        let userext = await finduserext(appuuid)
        if (userext) {
            if (userext.openid === openid) {
                await updateOpenid(appuuid, null)
                return sendOK(res, "ok")
            }
        }
        return sendErrMsg(res, "openid 不存在！", 409)
    } catch (e) {
        e.info(se, res, e)
    }
})

/**
 * 账户积分管理
 */
router.get('/points', async function (req: Request, res: Response, next: NextFunction) {
    const { start, length, draw, search } = req.query
    try {
        let searchdata = (search as any).value
        validateCgi({ start, length, searchdata }, crmuserValidator.pagination)
        let recordsFiltered = await getCount(req.app.locals.sequlize, searchdata)
        let appuser = await getAllUserPoints(req.app.locals.sequlize, searchdata, parseInt(start), parseInt(length))
        return sendOK(res, { appuser: appuser, draw: draw, recordsFiltered: recordsFiltered })
    } catch (e) {
        e.info(se, res, e)
    }
})


//删除appuser
router.delete('/appuser/:uuid', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const uuid = req.params["uuid"]
    try {
        const info: LoginInfo = (req as any).loginInfo
        if (!info.isRoot())
            return sendNoPerm(res)
        validateCgi({ uuid }, crmuserValidator.uuid)
        let crmusers = await deleteUser(uuid)
        return sendOK(res, crmusers)
    } catch (e) {
        e.info(se, res, e)
    }
})

//删除crmuser
router.delete('/:uuid', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const uuid = req.params["uuid"]
    try {
        const info: LoginInfo = (req as any).loginInfo
        if (!info.isRoot())
            return sendNoPerm(res)
        validateCgi({ uuid: uuid }, crmuserValidator.uuid)
        await deleteCrmuser(uuid)
        return sendOK(res, "删除成功！")
    } catch (e) {
        e.info(se, res, e)
    }
})

// 修改APP User状态
router.patch('/appuser_state', async function (req: Request, res: Response, next: NextFunction) {
    const { useruuid, state } = (req as any).body
    try {
        validateCgi({ useruuid, state }, crmuserValidator.setState)
        return await setSetSingleField({ uuid: useruuid, field: "state", value: state, func: resetAppUserState }, req, res)
    } catch (e) {
        e.info(se, res, e)
    }
})

// 修改crm状态
router.patch('/state', async function (req: Request, res: Response, next: NextFunction) {
    const { useruuid, state } = (req as any).body
    try {
        validateCgi({ useruuid, state }, crmuserValidator.setState)
        let crmuser = await setSetSingleField({ uuid: useruuid, field: "state", value: state, func: resetState }, req, res)
        return sendOK(res, { crmuser: crmuser })
    } catch (e) {
        e.info(se, res, e)
    }
})

//AdminRW分配管理advertiser
router.patch("/mgruuids/:uuid", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const uuid = req.params["uuid"]
    const { mgruuids } = (req as any).body
    try {
        const info: LoginInfo = (req as any).loginInfo
        if (!info.isRoot())
            return sendNoPerm(res)
        validateCgi({ uuid: uuid, mgruuids: mgruuids }, crmuserValidator.setMgruuids)
        let crmuser = await inserMgruuids(uuid, JSON.parse(mgruuids))
        sendOK(res, { crmuser: crmuser })
    } catch (e) {
        e.info(se, res, e)
    }
})

//禁用crm用户
router.patch("/:uuid/state", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const uuid = req.params["uuid"]
    const { state } = (req as any).body
    try {
        validateCgi({ uuid, state }, crmuserValidator.setState)
        let crmuser = await resetState(uuid, state)
        sendOK(res, { crmuser: crmuser })
    } catch (e) {
        e.info(se, res, e)
    }
})

// 修改密码
router.patch('/password', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { useruuid, password } = (req as any).body
    try {
        validateCgi({ useruuid, password }, crmuserValidator.setPassword)
        return await setSetSingleField({ uuid: useruuid, field: "state", value: password, func: resetPassword }, req, res)
    } catch (e) {
        e.info(se, res, e)
    }
})


// admin查看crm用户
router.get('/:uuid', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const uuid = req.params["uuid"]
    const info: LoginInfo = (req as any).loginInfo

    try {
        if (!info.isAdminRO() || !info.isAdminRW())
            return sendNoPerm(res)

        validateCgi({ uuid }, crmuserValidator.uuid)

        let user = await findByPrimary(uuid)

        delete user.password
        return sendOK(res, user)
    } catch (e) {
        e.info(se, res, e)
    }
})

// 添加用户
router.post('/crm', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { username, password, description, state, role } = (req as any).body
    let { perm, phone, email, realname, address, company } = (req as any).body
    const info: LoginInfo = (req as any).loginInfo

    try {
        if (!info.isRoot() && !info.isAdminRW() && !info.isGoodsRW())
            return sendNoPerm(res)

        let user = await findByUsernames(username)
        if (user)
            return sendErrMsg(res, "该用账号已存在！", 409)

        let obj = { username, password, description, state, role, perm, phone, email, realname, address }
        validateCgi(obj, crmuserValidator.create)

        if (company) {
            (obj as any).mgruuids = [company]
        }
        if (perm === "adsRW" && !company) {
            return sendNotFound(res, "miss company")
        }
        (obj as any).perm = { [obj.perm]: 1 }
        let crmuser = await insertCrmUser(obj)

        delete crmuser.password     // 不返回密码
        return sendOK(res, crmuser)
    } catch (e) {
        e.info(se, res, e)
    }
})

// 登陆
router.post('/login', async function (req: Request, res: Response, next: NextFunction) {
    const { username, password } = (req as any).body
    try {
        //校验参数
        validateCgi({ username, password }, crmuserValidator.login)

        let user = await findByUsername(username)                //"ads"."crmuser"是否存在该用户
        if (!user) {
            let APPUSER = await findByAppUsername(username)     //"ads"."crmuser"不存在该用户的时候，判断该用户是否为app用户
            if (!APPUSER)                                    //不是app用户
                return sendNotFound(res, "用户不存在！")

            checkPassword(APPUSER.password, password)              //检查密码是否正确
            let obj = {
                username,
                password,
                uuid: APPUSER.uuid,                      //app用户的uuid传给新创建的crm用户中
                perm: { "appuser": 1 },                    //权限
                mgruuids: new Array()                        //空数组
            }
            let crmuuid = await new_insertCrmUser(obj);       //app用户的记录插入到crm用户中

            // 生成token, key
            let [now, uuid] = [new Date(), crmuuid.uuid]
            let [token, key] = [md5sum(`${now.getTime()}_${Math.random()}`), md5sum(`${now.getTime()}_${Math.random()}`)]

            /* 缓存用户登陆信息到redis：key=uuid, value = {key:key, token:token, login:time, perm:perm}，
                key是双方协商的密钥，token是临时访问令牌, perm是权限列表 */
            let cache = new LoginInfo(uuid, key, token, now.toLocaleString(), JSON.stringify(crmuuid.perm))
            await setLoginAsync(uuid, cache)

            res.cookie("token", token, { maxAge: 90000000, httpOnly: false })
                .cookie("uuid", uuid, { maxAge: 90000000, httpOnly: false })
            return sendOK(res, { key: key, perm: JSON.stringify(crmuuid.perm), token: token, uuid: uuid })

        } else {
            checkPassword(user.password, password)
            // 生成token, key
            let [now, uuid] = [new Date(), user.uuid]
            let [token, key] = [md5sum(`${now.getTime()}_${Math.random()}`), md5sum(`${now.getTime()}_${Math.random()}`)]

            /* 缓存用户登陆信息到redis：key=uuid, value = {key:key, token:token, login:time, perm:perm}，
                key是双方协商的密钥，token是临时访问令牌, perm是权限列表 */
            let cache = new LoginInfo(uuid, key, token, now.toLocaleString(), JSON.stringify(user.perm))
            await setLoginAsync(uuid, cache)
            res.cookie("token", token, { maxAge: 90000000, httpOnly: false })
                .cookie("uuid", uuid, { maxAge: 90000000, httpOnly: false })
            return sendOK(res, { key: key, perm: JSON.stringify(user.perm), token: token, uuid: uuid })
        }

    } catch (e) {
        e.info(se, res, e)
    }
})

// 登出
router.post('/logout', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let loginInfo: LoginInfo = (req as any).loginInfo
    delLogin(loginInfo.getUuid())  // 不等待
    return sendOK(res, { msg: "ok" })
})