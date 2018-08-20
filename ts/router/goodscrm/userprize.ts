import { userprizeValidator, crmuserValidator } from "./validator"
import { validateCgi } from "../../lib/validator"
import { checkLogin } from "../../redis/logindao"
import { sendOK, sendError as se } from "../../lib/response"
import { Router, Request, Response, NextFunction } from "express"
import { getUserprizeList, getCount } from "../../model/users/userprize"
import { timestamps } from "../../config/winston"
export const router: Router = Router()

//获奖列表
router.get("/", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { start, length, draw, search } = req.query
    let { state, lotterytype, receive } = req.query
    try {
        let searchdata = (search as any).value
        validateCgi({ start: start, length: length, searchdata: searchdata }, crmuserValidator.pagination)
        validateCgi({ state: state, lotterytype: lotterytype, receive }, userprizeValidator.stateAndlotterytype)
        if (!state || state === 'undefined' || state == undefined)
            state = ''
        if (!searchdata || searchdata === 'undefined' || searchdata == undefined)
            searchdata = ''
        let recordsFiltered = await getCount(req.app.locals.sequelize, searchdata, state, lotterytype, receive)
        let prize = await getUserprizeList(req.app.locals.sequelize, parseInt(start), parseInt(length), searchdata, state, lotterytype, receive)
        if (prize.length === 0) {
            return sendOK(res, { draw: draw, prize: [], recordsFiltered: 0 })
        } else {
            for (let i = 0 ; i < prize.length;i++) {
                prize[i].created = timestamps( prize[i].created)            //创建时间的格式转换
            }
            return sendOK(res, { draw: draw, prize: prize, recordsFiltered: recordsFiltered })
        }

    } catch (e) {
        e.info(se, res, e)
    }
})
