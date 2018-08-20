import { delelteGoodsview, deleteAllbyuseruuid, findAll } from "../../model/mall/goods_view"
import { sendOK, sendError as se } from "../../lib/response"
import { usersValidator } from "./validator"
import { validateCgi } from "../../lib/validator"
import { getPageCount } from "../../lib/utils"
import { checkAppLogin, LoginInfo } from "../../redis/logindao"
import { Router, Request, Response, NextFunction } from "express"

export const router = Router()

//删除当前用户的全部商品浏览记录
router.delete("/users", checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    try {
        const loginInfo: LoginInfo = (req as any).loginInfo
        validateCgi({ uuid: loginInfo.getUuid() }, usersValidator.uuid)
        await deleteAllbyuseruuid(loginInfo.getUuid())
        return sendOK(res, { msg: "删除成功" })
    } catch (e) {
        e.info(se, res, e)
    }
})

//删除当前用户的一个商品浏览记录
router.delete("/:uuid", checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const uuid = req.params["uuid"]
    try {
        validateCgi({ uuid: uuid }, usersValidator.uuid)
        await delelteGoodsview(uuid)
        return sendOK(res, { msg: "删除成功" })
    } catch (e) {
        e.info(se, res, e)
    }
})

//查询当前用户的商品浏览记录
router.get("/", checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { page, count } = req.query
    try {
        const loginInfo: LoginInfo = (req as any).loginInfo
        const { cursor, limit } = getPageCount(page, count)
        let goodsviews = await findAll(req.app.locals.sequelize, loginInfo.getUuid(), cursor, limit)
        goodsviews.forEach(r => {
            r.realprice = r.realprice / 100
            r.price = r.price / 100
        })
        return sendOK(res, { goodsviews: goodsviews })
    } catch (e) {
        e.info(se, res, e)
    }
})
