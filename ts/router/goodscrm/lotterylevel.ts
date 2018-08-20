import { lotterylevelValidator, crmuserValidator } from "./validator"
import { validateCgi } from "../../lib/validator"
import { checkLogin } from "../../redis/logindao"
import { sendOK, sendError as se } from "../../lib/response"
import { Router, Request, Response, NextFunction } from "express"
import { insertLotterylevel, getLotterylevelList, getCount, updateLotterylevelInfo, deleteLotterylevel } from "../../model/mall/lotterylevel"

export const router: Router = Router()

//新增奖励等级
router.post("/", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { level, prizes, state, limitcount } = (req as any).body
    try {
        validateCgi({ level: parseInt(level), state: state, limitcount: parseInt(limitcount) }, lotterylevelValidator.insertOptions)

        let prizeus = JSON.parse(prizes)
        for (let i = 0; i < prizeus.length; i++) {
            let obj = {
                level: parseInt(level),
                prizeuuid: prizeus[i].uuid,
                num: parseInt(prizeus[i].num),
                state: state,
                title: prizeus[i].title,
                awardnum: parseInt(prizeus[i].awardnum),
                limitcount: parseInt(limitcount)//每个用户抽中改该等级奖品最高次数
            }
            await insertLotterylevel(obj)
        }
        return sendOK(res, { msg: "新增成功!" })
    } catch (e) {
        e.info(se, res, e)
    }
})

//修改奖励等级信息
router.put("/:uuid", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const uuid = req.params["uuid"]
    const { level, prizeuuid, title, num, state, awardnum, limitcount } = (req as any).body
    try {
        validateCgi({ uuid: uuid, prizeuuid: prizeuuid, level: parseInt(level), title: title, num: num, state: state, awardnum: parseInt(awardnum), limitcount: parseInt(limitcount) }, lotterylevelValidator.updateOptions)
        let obj = {
            level: parseInt(level),
            prizeuuid: prizeuuid,
            num: parseInt(num),
            state: state,
            title: title,
            awardnum: parseInt(awardnum),
            limitcount: parseInt(limitcount)
        }
        await updateLotterylevelInfo(obj, uuid)
        return sendOK(res, { msg: '编辑成功!' })
    } catch (e) {
        e.info(se, res, e)
    }
})

//获得奖励等级列表
router.get("/", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { start, length, draw, search } = req.query
    let { state } = req.query
    try {
        let searchdata = (search as any).value
        validateCgi({ start, length, searchdata }, crmuserValidator.pagination)
        validateCgi({ state }, lotterylevelValidator.state)
        if (!state || state === 'undefined' || state == undefined)
            state = ''
        let recordsFiltered = await getCount(state)
        let lotterylevel = await getLotterylevelList(parseInt(start), parseInt(length), state)
        return sendOK(res, { draw: draw, Lotterylevel: lotterylevel, recordsFiltered: recordsFiltered })
    } catch (e) {
        e.info(se, res, e)
    }
})

//删除奖励等级
router.delete("/:uuid", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const uuid = req.params["uuid"]
    try {
        validateCgi({ uuid: uuid }, lotterylevelValidator.UUID)
        await deleteLotterylevel(uuid)
        return sendOK(res, { msg: "删除成功" })
    } catch (e) {
        e.info(se, res, e)
    }
})