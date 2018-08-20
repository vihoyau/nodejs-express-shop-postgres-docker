import { awardusersValidator, crmuserValidator } from "./validator"
import { validateCgi } from "../../lib/validator"
import { checkLogin } from "../../redis/logindao"
import { sendOK, sendError as se, sendNotFound } from "../../lib/response"
import { Router, Request, Response, NextFunction } from "express"
import { insertAwardusers, updateAwardusersInfo, findAwardusersByUseruuid, findAwardusersBylevelAndstate, getCount, getAwardusersList, deleteAwardusers } from "../../model/mall/awardusers"
import { findByLevel as findLotterylevelBylevelAndstate } from "../../model/mall/lotterylevel"
import { timestamps } from "../../config/winston"
export const router: Router = Router()


//设置一二等奖用户和黑名单
router.post("/", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { useruuid, username, level, state } = (req as any).body
    try {
        validateCgi({ useruuid, username, level: parseInt(level), state }, awardusersValidator.insertOptions)
        let obj = {
            useruuid: useruuid,
            username: username,
            level: parseInt(level),
            state: state
        }
        let numcount

        if (parseInt(level) > 0) {//如果不是设置为黑名单
            numcount = await findLotterylevelBylevelAndstate(req.app.locals.sequelize, level, state)
            if (!numcount)
                return sendNotFound(res, "请先设置奖励等级！")
        }
        if (parseInt(numcount) > 0 || parseInt(level) === 0) {//如果奖励等级存在
            let awardusersnum = await findAwardusersBylevelAndstate(req.app.locals.sequelize, level, state)
            if (parseInt(awardusersnum) < parseInt(numcount) || parseInt(level) === 0) {
                let awardusers = await findAwardusersByUseruuid(useruuid, state)
                if (awardusers)
                    return sendNotFound(res, "该获奖用户已存在！")
                await insertAwardusers(obj)
            } else {
                return sendNotFound(res, "该等级的奖励人数已达到最大人数！")
            }
        } else {
            return sendNotFound(res, "请先设置奖励等级！")
        }
        return sendOK(res, { awardusers: "添加成功！" })
    } catch (e) {
        e.info(se, res, e)
    }
})

//修改一二等奖用户和黑名单
router.put("/:uuid", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const uuid = req.params["uuid"]
    const { useruuid, username, level, state } = (req as any).body
    try {
        validateCgi({ useruuid, username, level: parseInt(level), state }, awardusersValidator.insertOptions)
        let obj = {
            useruuid,
            username,
            level: parseInt(level),
            state
        }
        //let numcount = await findLotterylevelBylevelAndstate(req.app.locals.sequelize, level, state)
        let numcount
        if (parseInt(level) > 0) {//如果不是设置为黑名单
            numcount = await findLotterylevelBylevelAndstate(req.app.locals.sequelize, level, state)
            if (!numcount)
                return sendNotFound(res, "请先设置奖励等级！")
        }
        if (parseInt(numcount) > 0 || parseInt(level) === 0) {//如果奖励等级存在
            let awardusersnum = await findAwardusersBylevelAndstate(req.app.locals.sequelize, level, state)

            if (parseInt(level) === 0 || parseInt(awardusersnum) <= parseInt(numcount)) {
                let awardusers = await findAwardusersByUseruuid(useruuid, state)
                if (awardusers && awardusers.uuid != uuid)
                    return sendNotFound(res, "该获奖用户已存在！")
                await updateAwardusersInfo(obj, uuid)
            } else {
                return sendNotFound(res, "该等级的奖励人数已达到最大人数！")
            }
        } else {
            return sendNotFound(res, "请在等级设置中设置奖励等级！")
        }
        return sendOK(res, { awardusers: "设置成功！" })
    } catch (e) {
        e.info(se, res, e)
    }
})

//获得一二等奖用户和黑名单列表
router.get("/", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { start, length, draw, search } = req.query
    let { state, receive } = req.query
    try {
        let searchdata = (search as any).value
        validateCgi({ start, length, searchdata }, crmuserValidator.pagination)
        validateCgi({ state, receive }, awardusersValidator.getOptions)
        if (!receive || receive === 'undefined' || receive == undefined)
            receive = ''
        if (!state || state === 'undefined' || state == undefined)
            state = ''
        let recordsFiltered = await getCount(searchdata, state, receive)
        let awardusers = await getAwardusersList(parseInt(start), parseInt(length), searchdata, state, receive)
        awardusers.forEach((r: any) => {
            r.created = timestamps(r.created)
        })
        return sendOK(res, { draw: draw, awardusers: awardusers, recordsFiltered: recordsFiltered })
    } catch (e) {
        e.info(se, res, e)
    }
})

//删除一二等奖用户和黑名单
router.delete("/:uuid", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const uuid = req.params["uuid"]
    try {
        validateCgi({ uuid }, awardusersValidator.UUID)
        await deleteAwardusers(uuid)
        return sendOK(res, { awardusers: "删除成功！" })
    } catch (e) {
        e.info(se, res, e)
    }
})