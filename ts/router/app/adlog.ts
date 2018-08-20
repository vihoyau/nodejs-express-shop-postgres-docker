import { usersValidator } from "./validator"
import { validateCgi } from "../../lib/validator"
import { Router, Request, Response, NextFunction } from "express"
import { LoginInfo } from "../../redis/logindao"
import { sendOK, sendError as se } from "../../lib/response"
import { checkAppLogin } from "../../redis/logindao"
import { getByUserUuid, findadslogs } from "../../model/ads/adslog"
import { getAds, saveAds, removeAds } from "../../redis/history"
import { findByPrimary } from "../../model/ads/ads"
import { getPageCount } from "../../lib/utils"

export const router = Router()


/* GET adslog listing. */
router.get('/adslog', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    // 获取参数
    const { page, count } = req.query
    try {
        const loginInfo: LoginInfo = (req as any).loginInfo
        validateCgi({ count: count, page: page }, usersValidator.pagecount)
        let { cursor, limit } = getPageCount(page, count)
        let adslogs = await getByUserUuid(loginInfo.getUuid(), cursor, limit)
        return sendOK(res, { adslogs: adslogs, page: parseInt(page) + 1, count: count })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.get("/:useruuid", checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const useruuid = req.params["useruuid"]
    const { page, count } = req.query
    try {
        validateCgi({ uuid: useruuid }, usersValidator.uuid)
        const { cursor, limit } = getPageCount(page, count)
        let adslogs = await findadslogs(req.app.locals, useruuid, cursor, limit)
        return sendOK(res, { adslogs: adslogs })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.get('/ads', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    try {
        const loginInfo: LoginInfo = (req as any).loginInf
        let ads = await getAds(loginInfo.getUuid())
        return sendOK(res, { ads: ads })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.delete('/ads/:uuid', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const uuid = req.params["uuid"]
    try {
        const loginInfo: LoginInfo = (req as any).loginInf
        let ads = await findByPrimary(uuid)
        let adss = await getAds(loginInfo.getUuid())
        if (adss) {
            adss.push(ads)
            let num = adss.findIndex(ads)
            adss.splice(num, 1)
            adss = await saveAds(loginInfo.getUuid(), adss)
            return sendOK(res, { adss: adss })
        }
        return sendOK(res, { msg: "删除成功！" })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.delete('/all', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    try {
        const loginInfo: LoginInfo = (req as any).loginInf
        await removeAds(loginInfo.getUuid())
        return sendOK(res, { msg: "全部删除成功！" })
    } catch (e) {
        e.info(se, res, e)
    }
})