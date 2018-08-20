import { validateCgi } from "../../lib/validator"
import { goodsValidator } from "./validator"
import { Router, Request, Response, NextFunction } from "express"
import { checkAppLogin, LoginInfo } from "../../redis/logindao"
import { sendOK, sendError as se } from "../../lib/response"
import { getGoods, saveGoods, removeGoods } from "../../redis/history"
import { findByPrimary as findgoods } from "../../model/mall/goods"

export const router = Router()
/* GET goodslog listing. */
router.get('/goods', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    try {
        const loginInfo: LoginInfo = (req as any).loginInf
        let ads = await getGoods(loginInfo.getUuid())
        return sendOK(res, { ads: ads })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.delete('/goods/:uuid', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const uuid = req.params["uuid"]
    try {
        validateCgi({ uuid: uuid }, goodsValidator.uuid)
        const loginInfo: LoginInfo = (req as any).loginInf
        let goods = await findgoods(uuid)
        let goodss = await getGoods(loginInfo.getUuid())
        if (goodss) {
            goodss.push(goods)
            let num = goodss.findIndex(goods)
            goods.splice(num, 1)
            goodss = await saveGoods(loginInfo.getUuid(), goodss)
            return sendOK(res, { goodss: goodss })
        }
        return sendOK(res, {})
    } catch (e) {
        e.info(se, res, e)
    }
})

router.delete('/all', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    try {
        const loginInfo: LoginInfo = (req as any).loginInf
        await removeGoods(loginInfo.getUuid())
        return sendOK(res, {})
    } catch (e) {
        e.info(se, res, e)
    }
})