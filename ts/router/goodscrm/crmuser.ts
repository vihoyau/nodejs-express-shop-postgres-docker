import { crmuserValidator } from "./validator"
import { validateCgi } from "../../lib/validator"
import { sendOK, sendError as se, sendNoPerm, sendNotFound } from "../../lib/response"
import { setLoginAsync, delLogin, LoginInfo, checkLogin } from "../../redis/logindao"
import { Router, Request, Response, NextFunction } from "express"
import { findByUsername, findByPrimary, insertCrmUser, resetPassword, resetState, deleteGoodsUser, findAllByCount, findAllBy } from "../../model/mall/crmuser"
import { queryadvByuuid /* ,findadv_ByPrimary */ } from "../../model/ads/crmuser"
import { resetAppUserState, getUserAndlevels, deleteusers, getUserAndlevelsCount } from "../../model/users/users"
import { updateexp } from "../../model/users/users_ext"
import { getMaxExp } from "../../model/users/levels"
import { checkPassword, md5sum ,checkState} from "../../lib/utils"

import {findByAppUsername, new_insertCrmUser} from "../../model/ads/crmuser"
//新添加
import { find_one_users_ext_table_information,find_AdvInfo_by_crmuuid } from "../../model/ads/advertiser"

export const router: Router = Router()

async function setSetSingleField(obj: { uuid: string, field: string, value: string, func: Function }, req: Request, res: Response) {
    const info: LoginInfo = (req as any).loginInfo
    if (!info.isRoot())
        return sendNoPerm(res)

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

router.patch("/exp/:uuid", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { exp } = (req as any).body
    const uuid = req.params["uuid"]
    try {
        validateCgi({ uuid, exp }, crmuserValidator.expValidator)
        let users = await updateexp(uuid, exp)
        return sendOK(res, { users: users })
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

// 修改状态
router.patch('/state', async function (req: Request, res: Response, next: NextFunction) {
    const { useruuid, state } = (req as any).body
    try {
        validateCgi({ useruuid, state }, crmuserValidator.setState)
        return await setSetSingleField({ uuid: useruuid, field: "state", value: state, func: resetState }, req, res)
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

router.delete('/:uuid', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const useruuid = req.params['uuid']
    try {
        const info: LoginInfo = (req as any).loginInfo
        if (!info.isRoot())
            return sendNoPerm(res)

        validateCgi({ useruuid }, crmuserValidator.usruuid)
        await deleteGoodsUser(useruuid)
        return sendOK(res, { msg: "删除成功" })
    } catch (e) {
        e.info(se, res, e)
    }
})

//查看所有会员的信息
router.get("/users", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { start, length, draw, search } = req.query
    try {
        let searchdata = (search as any).value
        validateCgi({ start, length, searchdata }, crmuserValidator.pagination)
        let maxexp = await getMaxExp(req.app.locals.sequelize)
        let users = await getUserAndlevels(req.app.locals.sequelize, searchdata, parseInt(start), parseInt(length))
        let recordsFiltered = await getUserAndlevelsCount(req.app.locals.sequelize, searchdata)
        users.forEach(r => {
            r.total_balance = r.total_balance / 100
            r.balance = r.balance / 100
        })
        return sendOK(res, { users: users, maxexp: maxexp, draw: draw, recordsFiltered: recordsFiltered })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.delete("/users/:uuid", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const uuid = req.params["uuid"]

    try {
        validateCgi({ uuid }, crmuserValidator.uuid)
        let users = await deleteusers(uuid)
        return sendOK(res, { users: users })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.put("/users/:uuid", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const uuid = req.params["uuid"]
    const { state } = (req as any).body
    try {
        validateCgi({ uuid }, crmuserValidator.uuid)
        let users = await resetAppUserState(uuid, state)
        return sendOK(res, { users: users })
    } catch (e) {
        e.info(se, res, e)
    }
})
// admin查询所有crm用户
// GET /users/?page&count[&created][&order&desc]
router.get('/', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { order, desc, start, length, draw, search } = req.query
    try {
        let searchdata = (search as any).value
        const info: LoginInfo = (req as any).loginInfo
        if (!info.isRoot() && !info.isAdminRO() && !info.isAdminRW())
            return sendNoPerm(res)

        validateCgi({ order, desc, start, length, searchdata }, crmuserValidator.findAll)
        let recordsFiltered = await findAllByCount(req.app.locals.sequelize, searchdata)
        let crmUsers = await findAllBy(req.app.locals.sequelize, searchdata, parseInt(start), parseInt(length))

        return sendOK(res, { crmUsers: crmUsers, draw: draw, recordsFiltered: recordsFiltered })
    } catch (e) {
        e.info(se, res, e)
    }
})

// 添加用户
router.post('/crm', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { username, password, description, state, perm, phone, email, realname } = (req as any).body
    const info: LoginInfo = (req as any).loginInfo

    try {
        if (!info.isRoot() && !info.isAdminRW())
            return sendNoPerm(res)

        let obj = { username, password, description, state, perm, phone, email, realname };
        validateCgi(obj, crmuserValidator.create);

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
 //       validateCgi({ username: username, password: password }, crmuserValidator.login)

        let user = await findByUsername(username)                //"ads"."crmuser"是否存在该用户
        if (!user) {
            let APPUSER = await findByAppUsername(username)     //"ads"."crmuser"不存在该用户的时候，判断该用户是否为app用户
            if (!APPUSER) {                                     //不是app用户
                return sendNotFound(res, "用户不存在！")
            }
            checkPassword(APPUSER.password, password)           //检查密码是否正确
            let obj = {
                username: username,
                password: password,
                uuid: APPUSER.uuid,                             //app用户的uuid传给新创建的crm用户中
                perm: { "appuser": 1 },                         //权限
                mgruuids: new Array()                           //空数组
            }
            let crmuuid = await new_insertCrmUser(obj);         //app用户的记录插入到crm用户中

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
        }


        else {
            checkPassword(user.password, password)
            checkState('off',user.state)

        // 生成token, key
        let [now, uuid] = [new Date(), user.uuid]
        let [token, key] = [md5sum(`${now.getTime()}_${Math.random()}`), md5sum(`${now.getTime()}_${Math.random()}`)]

            /* 缓存用户登陆信息到redis：key=uuid, value = {key:key, token:token, login:time, perm:perm}，
                key是双方协商的密钥，token是临时访问令牌, perm是权限列表 */
            let cache = new LoginInfo(uuid, key, token, now.toLocaleString(), JSON.stringify(user.perm))
            await setLoginAsync(uuid, cache)
            let advertiseruuid = await queryadvByuuid(uuid);
            res.cookie("token", token, { maxAge: 90000000, httpOnly: false })
                .cookie("uuid", uuid, { maxAge: 90000000, httpOnly: false })

            if (advertiseruuid.get('mgruuids') == undefined || advertiseruuid.get('mgruuids') == null || advertiseruuid.get('mgruuids').length == 0) {
                return sendOK(res, { key: key, perm: JSON.stringify(user.perm), token: token, uuid: uuid });
            } else {
                return sendOK(res, { key: key, perm: JSON.stringify(user.perm), token: token, uuid: uuid, advertiseruuid: advertiseruuid.get('mgruuids') });
            }
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

// admin查看crm用户
router.get('/:uuid', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const uuid = req.params["uuid"]
    try {
        validateCgi({ uuid }, crmuserValidator.uuid)

        let user = await findByPrimary(uuid)

        delete user.password
        return sendOK(res, user)
    } catch (e) {
        e.info(se, res, e)
    }
})

//获取余额和余额状态的接口
router.get('/adv_balance/:crmuuid', checkLogin,async function (req: Request, res: Response, next: NextFunction) {
    try{
        const crmuuid = req.params["crmuuid"]
        let user_ext_info = await find_one_users_ext_table_information(crmuuid)
        user_ext_info.balance = ((user_ext_info.crm_balance) / 100).toFixed(2)

        user_ext_info.balance_state = user_ext_info.balance <= 0 ? 2 : 1

        let advinfo = await find_AdvInfo_by_crmuuid(crmuuid)

        return sendOK(res, { balance: user_ext_info.balance, points: user_ext_info.crm_points, balance_state: user_ext_info.balance_state, dailybudget: advinfo.dailybudget })
    } catch (e) {
        e.info(se, res, e);
    }
    
})