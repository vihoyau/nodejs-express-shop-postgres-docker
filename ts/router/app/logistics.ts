import { logistics } from "./validator"
import { validateCgi } from "../../lib/validator"
import { sendOK, sendError as se } from "../../lib/response"
import { checkAppLogin } from "../../redis/logindao"
import { Router, Request, Response, NextFunction } from "express"
import { getByOrderCode } from "../../model/logistics/logistics"
export const router: Router = Router()

router.get('/orderCode', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { orderCode } = req.query
    try {
        validateCgi({ orderCode: orderCode }, logistics.order)
        let result = await getByOrderCode(orderCode)
        return sendOK(res, { result: result })
    } catch (e) {
        e.info(se, res, e)
    }
})