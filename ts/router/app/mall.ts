import { Router, Request, Response, NextFunction } from "express"
// import { findAll } from "../../model/mall/category"
import { getAsync } from "../../lib/request"
import { sendOK, sendError as se } from "../../lib/response"
import { getAdsviewCount } from "../../model/ads/ads_view"
import { getAdsfaorCount } from "../../model/ads/favoriate"
import { getGoodsviesrCount } from "../../model/mall/goods_view"
import { getGoodsfavorCount } from "../../model/mall/favoriate"
export const router = Router()

router.get("/test", async function (req: Request, res: Response, next: NextFunction) {
    try {
        // let categories = await findAll({})
        // return res.json({ categories: categories })
        let x = await getAsync({ url: "http://127.0.0.1:12345/appuser/" })
        return res.json({ now: new Date(), data: x })
    } catch (e) {
        return res.json({ recommendAds: e.message })
    }
})

router.get("/counts", async function (req: Request, res: Response, next: NextFunction) {
    try {
        let ads_views, ads_faor, goods_faor, goods_views
        let useruuid = (req as any).headers.uuid

        ads_views = useruuid ? (await getAdsviewCount(useruuid)) : 0
        ads_faor = useruuid ? (await getAdsfaorCount(useruuid)) : 0
        goods_views = useruuid ? (await getGoodsviesrCount(useruuid)) : 0
        goods_faor = useruuid ? (await getGoodsfavorCount(useruuid)) : 0

        return sendOK(res, { ads_views: ads_views, ads_faor: ads_faor, goods_views: goods_views, goods_faor: goods_faor })
    } catch (e) {
        e.info(se, res, e)
    }
})