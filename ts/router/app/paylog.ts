import { Router, Request, Response, NextFunction } from "express"
import { sendOK, sendError as se } from "../../lib/response"
import { checkAppLogin, LoginInfo } from "../../redis/logindao"
import { getByUseruuid } from "../../model/pay/paylog"
export const router = Router()

router.get('/', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const loginInfo: LoginInfo = (req as any).loginInfo // TODO
    try {
        let paylog = await getByUseruuid(loginInfo.getUuid())
        paylog.forEach(r => {
            r.amount = r.amount / 100
        })
        return sendOK(res, { paylog: paylog })
    } catch (e) {
        e.info(se, res, e)
    }
})