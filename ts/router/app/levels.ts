import { checkAppLogin } from "../../redis/logindao"
import { Router, Request, Response, NextFunction } from "express"
import { sendOK, sendError as se } from "../../lib/response"
import { findAlllevels } from "../../model/users/levels"

export const router = Router()

// TODO
router.get('/', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    try {
        let { page, count } = req.query
        let result = await findAlllevels(parseInt(page) - 1, parseInt(count))
        return sendOK(res, { result: result })
    } catch (e) {
        e.info(se, res, e)
    }
})
