import { validateCgi } from "../../lib/validator"
import { invireRul } from "./validator"
import { Router, Request, Response, NextFunction } from "express"
import { sendOK, sendError as se, sendNoPerm } from "../../lib/response"
import { updateInviteRule, getInviteRule } from "../../model/ads/inviterule"
import { checkLogin, LoginInfo } from "../../redis/logindao"
export const router = Router()

router.put('/', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { content, invitepoint, parentinvitepoint, invitebalance, parentinvitebalance } = (req as any).body
    try {
        const info: LoginInfo = (req as any).loginInfo
        if (!info.isAdminRW() && !info.isRoot())
            return sendNoPerm(res)
        let inviterul = {
            content: content,
            invitepoint: parseInt(invitepoint),
            parentinvitepoint: parseInt(parentinvitepoint),
            invitebalance: parseFloat(invitebalance) * 100,
            parentinvitebalance: parseFloat(parentinvitebalance) * 100
        }
        validateCgi(inviterul, invireRul.info)

        let inviteruls = await updateInviteRule(inviterul)
        if (inviteruls) {
            inviteruls.invitebalance = inviteruls.invitebalance / 100
            inviteruls.parentinvitebalance = inviteruls.parentinvitebalance / 100
        }
        return sendOK(res, { inviterul: inviteruls })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.get('/', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    try {
        let inviteruls = await getInviteRule(req.app.locals.sequelize)
        if (inviteruls) {
            inviteruls.invitebalance = inviteruls.invitebalance / 100
            inviteruls.parentinvitebalance = inviteruls.parentinvitebalance / 100
        }
        return sendOK(res, { inviterul: inviteruls })
    } catch (e) {
        e.info(se, res, e)
    }
})