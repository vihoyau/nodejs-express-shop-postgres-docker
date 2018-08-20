import { validateCgi } from "../../lib/validator"
import { systemValidator } from "./validator"
import { Router, Request, Response, NextFunction } from "express"
import { sendOK, sendError as se } from "../../lib/response"
import { findByName } from "../../model/system/system"

export const router = Router()

router.get('/', async function (req: Request, res: Response, next: NextFunction) {
    const { name } = req.query
    try {
        validateCgi({ name: name }, systemValidator.sysname)
        let result = await findByName(name)
        return sendOK(res, result)
    } catch (e) {
        e.info(se, res, e)
    }
})