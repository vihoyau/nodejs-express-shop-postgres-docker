import { validateCgi } from "../../lib/validator"
import { usersValidator } from "./validator"
import { Router, Request, Response, NextFunction } from "express"
import { getByUserUuid } from "../../model/ads/invitation"
import { getInviteRule } from "../../model/ads/inviterule"
import { checkAppLogin } from "../../redis/logindao"
import { LoginInfo } from "../../redis/logindao"
import { sendOK, sendError as se } from "../../lib/response"

export const router = Router()

/* GET adslog listing. */
router.get('/', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    // 获取参数
    try {
        const loginInfo: LoginInfo = (req as any).loginInfo
        validateCgi({ uuid: loginInfo.getUuid() }, usersValidator.uuid)
        let phone: string = await getByUserUuid(loginInfo.getUuid())
        let inviterule = await getInviteRule(req.app.locals.sequelize)
        return sendOK(res, { invite: phone, content: inviterule.content })
    } catch (e) {
        e.info(se, res, e)
    }
})