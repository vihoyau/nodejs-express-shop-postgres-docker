import { validateCgi } from "../../lib/validator"
import { trendValidator } from "./validator"
import { LoginInfo } from "../../redis/logindao"
import { Router, Request, Response, NextFunction } from "express"
import { sendOK, sendErrMsg, sendNoPerm } from "../../lib/response"
import { checkLogin } from "../../redis/logindao"
import { findAllTrend, updateTrend, findByTrendUUID, countByState, trendDownCom } from "../../model/trend/trend"
import { findAllReflect, getCount, updateReflectState } from "../../model/trend/reflect"
import { delTrendComment, getCountByTrendUUID, findByTrenduuid, findByPrimaryUUID } from "../../model/trend/trendcomment"
import { updateStateToApp, findByPrimary } from "../../model/users/users"
import { findAllShielded, getCount as shieldGetCount } from "../../model/trend/shielded"
import { timestamps } from "../../config/winston"

export const router = Router()

//crm查看全部的动态
router.get('/allTrend', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { state, start, length } = (req as any).query   //state in 'on' 'rejected'
    validateCgi({ state, start, length }, trendValidator.getAll)

    try {
        let recordsFiltered = await countByState(state)
        let trends = await findAllTrend(req.app.locals.sequelize, state, start, length)
        trends.forEach(element => {
            element.created = timestamps(element.created)
        })
        return sendOK(res, { trends, recordsFiltered })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//crm查看某个动态的全部评论，为了方便十金客户及时查看所谓的违法评论证据，这里把 on&rejected的评论都展示出来
router.get("/allCom", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { start, length, trenduuid } = (req as any).query
    validateCgi({ start, length }, trendValidator.getAllC)

    try {
        let recordsFiltered = await getCountByTrendUUID(trenduuid)
        let com = await findByTrenduuid(res.app.locals.sequelize, trenduuid, start, length)
        com.forEach((r: any) => {
            r.created = timestamps(r.created)
        })
        return sendOK(res, { com, recordsFiltered })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//crm查看全部的举报
router.get('/allReflect', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { state, start, length } = (req as any).query
    validateCgi({ state, start, length }, trendValidator.getAllR)

    try {
        let recordsFiltered = await getCount(state)
        let reflects = await findAllReflect(state, start, length)
        let arr = []
        for (let i = 0; i < reflects.length; i++) {
            let obj
            if (reflects[i].trenduuid) {
                let trend = await findByTrendUUID(reflects[i].trenduuid)
                obj = Object.assign({ reflects: reflects[i] }, { trend })
                arr.push(obj)
            } else if (reflects[i].commentuuid) {
                let com = await findByPrimaryUUID(reflects[i].commentuuid)
                obj = Object.assign({ reflects: reflects[i] }, { com })
                arr.push(obj)
            }
        }
        return sendOK(res, { arr, recordsFiltered })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//rejected评论，或者动态
router.delete('/', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { type, uuid, reflectuuid } = (req as any).body
    validateCgi({ type, uuid }, trendValidator.del)

    try {
        const info: LoginInfo = (req as any).loginInfo
        if (!info.isAdminRW() && !info.isRoot())
            return sendNoPerm(res)

        if (type == 'comment') {    //删除评论
            let com = await delTrendComment(uuid)
            await trendDownCom(com.trenduuid)   //减少评论数
            /* let children = await findByParent(uuid)
            for (let i = 0; i < children.length; i++) {
                await delTrendComment(children[i].uuid)
            } */
        } else {    //删除动态
            await updateTrend(uuid, { state: "rejected" })
            /* let com = await findByTrenduuid(uuid)
            for (let i = 0; i < com.length; i++) {
                await delTrendComment(com[i].uuid)
            } */
        }
        if (reflectuuid)
            await updateReflectState(reflectuuid, 'accepted')

        return sendOK(res, { msg: "succ" })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//拉黑用户
router.put('/forbiden', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { useruuid } = (req as any).body
    validateCgi({ useruuid }, trendValidator.forbiden)

    try {
        const info: LoginInfo = (req as any).loginInfo
        if (!info.isAdminRW() && !info.isRoot())
            return sendNoPerm(res)

        await updateStateToApp(useruuid, 'off')
        return sendOK(res, { msg: "succ" })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//经查举报不实，只是修改举报状态为受理，不删除不拉黑
router.put('/:reflectuuid', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let reflectuuid = req.params['reflectuuid']
    validateCgi({ reflectuuid }, trendValidator.updateR)

    try {
        const info: LoginInfo = (req as any).loginInfo
        if (!info.isAdminRW() && !info.isRoot())
            return sendNoPerm(res)

        await updateReflectState(reflectuuid, 'accepted')
        return sendOK(res, { msg: "succ" })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})


//crm查看全部的动态屏蔽情况
router.get('/shield', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { start, length } = (req as any).query
    let shield = await findAllShielded(res.app.locals.sequelize, start, length)
    let recordsFiltered = await shieldGetCount()
    for (let i = 0; i < shield.length; i++) {
        shield[i].created = timestamps(shield[i].created)
        let user = await findByPrimary(shield[i].useruuid)
        shield[i] = Object.assign(shield[i], { username: user.username, nickname: user.nickname, headurl: user.headurl })
    }
    return sendOK(res, { shield, recordsFiltered })
})
