import { Router, Request, Response, NextFunction } from "express"
import { sendOK, sendError as se } from "../../lib/response"
import { getBanners } from "../../model/mall/banner"

export const router = Router()


/* GET banner listing. */
router.get('/', async function (req: Request, res: Response, next: NextFunction) {
    // 获取参数
    try {
        let adslogs = await getBanners()
        return sendOK(res, { adslogs: adslogs })
    } catch (e) {
        e.info(se, res, e)
    }
})