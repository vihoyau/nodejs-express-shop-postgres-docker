import { validateCgi } from "../../lib/validator"
import { invireRul, adsValidator, userLoginLog } from "./validator"
import { Router, Request, Response, NextFunction } from "express"
import { sendOK, sendError as se, sendNoPerm } from "../../lib/response"
import { findByPrimary, getCountByUserAndTime, getLogsByUserAndTime } from "../../model/users/statistics"
import { getRewardByType, getRewardByUser, getCount } from "../../model/users/reward"
import { getUserAndlevels, getUserAndlevelsCount } from "../../model/users/reward"
import { checkLogin, LoginInfo } from "../../redis/logindao"
import { timestamps } from "../../config/winston"
export const router = Router()

router.get('/reward/user', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { useruuid, start, length, draw, search } = req.query
    try {
        let searchdata = (search as any).value
        const info: LoginInfo = (req as any).loginInfo
        if (!info.isGoodsRW() || !info.isRoot())
            return sendNoPerm(res)

        validateCgi({ useruuid, start, length, searchdata }, invireRul.infomation)
        let obj = {}
        if (searchdata) {
            obj = {
                useruuid,
                $or: [
                    { username: { $like: '%' + searchdata + '%' } },
                    { reaname: { $like: '%' + searchdata + '%' } }
                ]
            }
        } else {
            obj = { useruuid }
        }

        let recordsFiltered = await getCount(obj)
        let statistics = await getRewardByUser(obj, parseInt(start), parseInt(length))
        return sendOK(res, { statistics: statistics, draw: draw, recordsFiltered: recordsFiltered })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.get('/reward/type', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { type, useruuid, start, length, draw, search } = req.query
    try {
        let searchdata = (search as any).value
        const info: LoginInfo = (req as any).loginInfo
        if (!info.isGoodsRW() || !info.isRoot())
            return sendNoPerm(res)

        validateCgi({ type, useruuid, start, length, searchdata }, invireRul.infoAndType)
        let obj = {}
        if (searchdata) {
            obj = {
                useruuid,
                $or: [
                    { username: { $like: '%' + searchdata + '%' } },
                    { reaname: { $like: '%' + searchdata + '%' } }
                ]
            }
        } else {
            obj = { type, useruuid }
        }
        let recordsFiltered = await getCount(obj)
        let statistics = await getRewardByType(obj, parseInt(start), parseInt(length))
        return sendOK(res, { statistics, draw, recordsFiltered })
    } catch (e) {
        e.info(se, res, e)
    }
})

//查找app用户登录日志
router.get('/loginlog', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { useruuid, start, length, starttime, endtime } = (req as any).query
    validateCgi({ useruuid, start, length }, userLoginLog.get)

    try {
        let recordsFiltered = await getCountByUserAndTime(res.app.locals.sequelize, useruuid, new Date(starttime), new Date(endtime))
        let logs = await getLogsByUserAndTime(res.app.locals.sequelize, useruuid, new Date(starttime), new Date(endtime), start, length)
        logs.forEach(r => {
            r.created = timestamps(r.created)
        })
        return sendOK(res, { logs, recordsFiltered })
    } catch (e) {
        se(res, e)
    }
})

router.get('/:uuid', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const uuid = req.params['uuid']
    try {
        const info: LoginInfo = (req as any).loginInfo
        if (!info.isGoodsRW() || !info.isRoot())
            return sendNoPerm(res)

        validateCgi({ uuid }, invireRul.UUID)
        let statistics = await findByPrimary(uuid)
        return sendOK(res, { statistics })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.get("/", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { start, length, draw, search, timeRange } = req.query
    try {
        const info: LoginInfo = (req as any).loginInfo
        if (!info.isGoodsRO() && !info.isRoot() && !info.isGoodsRW() && !info.isAdminRO() && !info.isAdminRW())
            return sendNoPerm(res)

        let searchdata = (search as any).value
        validateCgi({ start, length, searchdata }, adsValidator.pagination)
        let recordsFiltered = await getUserAndlevelsCount(req.app.locals.sequelize, searchdata, JSON.parse(timeRange))
        let users = await getUserAndlevels(req.app.locals.sequelize, searchdata, parseInt(start), parseInt(length), JSON.parse(timeRange))
        users.forEach(r => {
            r.created = timestamps(r.created)
            r.modified = timestamps(r.modified)
        })
        return sendOK(res, { users: users, draw: draw, recordsFiltered: recordsFiltered })
    } catch (e) {
        e.info(se, res, e)
    }
})