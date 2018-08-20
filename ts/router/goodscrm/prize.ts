import { prizeValidator, crmuserValidator } from "./validator"
import { validateCgi } from "../../lib/validator"
import { checkLogin } from "../../redis/logindao"
import { sendOK, sendError as se } from "../../lib/response"
import { Router, Request, Response, NextFunction } from "express"
import { insertPrize, getPrizeList, getCount, updatePrizeInfo, deletePrize } from "../../model/mall/prize"

export const router: Router = Router()

//新增奖品
router.post("/", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { title, prize, state } = (req as any).body
    try {
        validateCgi({ title, state }, prizeValidator.insertOptions)
        let obj = {
            title: title,
            prize: JSON.parse(prize),
            state: state
        }
        await insertPrize(obj)
        return sendOK(res, { msg: "新增成功!" })
    } catch (e) {
        e.info(se, res, e)
    }
})

//修改奖品信息
router.put("/:uuid", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const uuid = req.params["uuid"]
    const { title, prize, state } = (req as any).body
    try {
        validateCgi({ title, uuid, state }, prizeValidator.updateOptions)
        let obj = {
            title: title,
            prize: JSON.parse(prize),
            state: state
        }
        await updatePrizeInfo(obj, uuid)
        return sendOK(res, { msg: '编辑成功!' })
    } catch (e) {
        e.info(se, res, e)
    }
})

//获得奖品列表
router.get("/", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { start, length, draw, search } = req.query
    let { state } = req.query
    try {
        let searchdata = (search as any).value
        validateCgi({ start, length, searchdata, state }, crmuserValidator.pagination)
        if (!state || state === 'undefined' || state == undefined)
            state = ''
        if (!searchdata || searchdata === 'undefined' || searchdata == undefined)
            searchdata = ''
        let recordsFiltered = await getCount(searchdata, state)
        let prize = await getPrizeList(parseInt(start), parseInt(length), searchdata, state)
        return sendOK(res, { draw: draw, prize: prize, recordsFiltered: recordsFiltered })
    } catch (e) {
        e.info(se, res, e)
    }
})

//删除奖品
router.delete("/:uuid", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const uuid = req.params["uuid"]
    try {
        validateCgi({ uuid: uuid }, prizeValidator.UUID)
        await deletePrize(req.app.locals.sequelize, uuid)
        return sendOK(res, { msg: "删除成功" })
    } catch (e) {
        e.info(se, res, e)
    }
})