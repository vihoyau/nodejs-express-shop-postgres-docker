import { delelteAdsview, deleteAllbyuseruuid, findAll } from "../../model/ads/ads_view"
import { sendOK, sendError as se } from "../../lib/response"
import { usersValidator } from "./validator"
import { validateCgi } from "../../lib/validator"
import { getPageCount } from "../../lib/utils"
import { checkAppLogin, LoginInfo } from "../../redis/logindao"
import { Router, Request, Response, NextFunction } from "express"
export const router = Router()

//删除当前用户的全部广告浏览记录
router.delete("/users", checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    try {
        const loginInfo: LoginInfo = (req as any).loginInfo
        validateCgi({ uuid: loginInfo.getUuid() }, usersValidator.uuid)
        await deleteAllbyuseruuid(loginInfo.getUuid())
        return sendOK(res, { msg: "清空成功" })
    } catch (e) {
        e.info(se, res, e)
    }
})

//删除当前用户的一个广告浏览记录
router.delete("/:uuid", checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const uuid = req.params["uuid"]
    try {
        validateCgi({ uuid: uuid }, usersValidator.uuid)
        await delelteAdsview(uuid)
        return sendOK(res, { msg: "删除成功" })
    } catch (e) {
        e.info(se, res, e)
    }
})

//查询当前用户的广告浏览记录
router.get("/", checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { page, count } = req.query
    try {
        const loginInfo: LoginInfo = (req as any).loginInfo
        validateCgi({ page: page, count: count }, usersValidator.pagecount)
        const { cursor, limit } = getPageCount(page, count)
        let goodsviews = await findAll(req.app.locals.sequelize, loginInfo.getUuid(), cursor, limit)
        return sendOK(res, { goodsviews: goodsviews })
    } catch (e) {
        e.info(se, res, e)
    }
})
