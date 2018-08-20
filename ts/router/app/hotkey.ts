import { validateCgi } from "../../lib/validator"
import { usersValidator } from "./validator"
import { Router, Request, Response, NextFunction } from "express"
import { sendOK, sendError as se } from "../../lib/response"
import { getKeywords } from "../../model/ads/hotkey"

export const router = Router()
/* GET adslog listing. */
router.get('/searchkeys', async function (req: Request, res: Response, next: NextFunction) {
    // 获取参数
    const {count, keyword} = req.query
    try {
        validateCgi({ count: count, keyword: keyword }, usersValidator.keywords)
        let hotkey = await getKeywords(parseInt(count), keyword)
        return sendOK(res, { hotkey: hotkey })
    } catch (e) {
        e.info(se, res, e)
    }
})
