import { insertFavoriate, getFavoriateByDeletedAndUseruuid, deleteFavoriateByUuid } from "../../model/mall/favoriate"
import { insertStatistics } from "../../model/users/statistics"
import { sendOK, sendError as se } from "../../lib/response"
import { favoriateValitator } from "./validator"
import { validateCgi } from "../../lib/validator"
import { getPageCount } from "../../lib/utils"
import { checkAppLogin, LoginInfo } from "../../redis/logindao"
import { Router, Request, Response, NextFunction } from "express"
export const router = Router()

/**
 * 收藏商品
 */
router.post("/goods", checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { gooduuid } = (req as any).body
    try {
        validateCgi({ gooduuid }, favoriateValitator.gooduuid)
        const loginInfo: LoginInfo = (req as any).loginInfo
        let favoriate = await insertFavoriate(loginInfo.getUuid(), gooduuid)
        let obj = {
            useruuid: loginInfo.getUuid(),
            loginnumber: 0,
            searchnumber: 1,
            favoritenumber: 0,
            type: 'goods',
        }
        await insertStatistics(obj)
        return sendOK(res, { favoriate: favoriate })
    } catch (e) {
        e.info(se, res, e)
    }
})

/**
 * 列表显示已收藏的商品
 */
router.get("/", checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { page, count } = req.query
    try {
        validateCgi({ page: page, count: count }, favoriateValitator.pageAndCount)
        const loginInfo: LoginInfo = (req as any).loginInfo
        const { cursor, limit } = getPageCount(page, count)
        let favoriate = await getFavoriateByDeletedAndUseruuid(req.app.locals.sequelize, loginInfo.getUuid(), cursor, limit)
        favoriate.forEach(r => {
            r.price = r.price / 100
            r.realprice = r.realprice / 100
        })
        return sendOK(res, { favoriate: favoriate })
    } catch (e) {
        e.info(se, res, e)
    }
})

/**
 * 取消关注
 */
router.delete("/:uuid", checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const gooduuid = req.params["uuid"]
    try {
        const loginInfo: LoginInfo = (req as any).loginInfo
        await deleteFavoriateByUuid(gooduuid, loginInfo.getUuid())
        return sendOK(res, { favoriate: "取消关注成功" })
    } catch (e) {
        e.info(se, res, e)
    }
})

