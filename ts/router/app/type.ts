import { validateCgi } from "../../lib/validator"
import { usersValidator } from "./validator"
import { Router, Request, Response, NextFunction } from "express"
import { sendOK, sendError as se } from "../../lib/response"
import { getCategory, getSubcategory, findByPrimary, getsearchAll } from "../../model/ads/category"
export const router = Router()

/* GET adtype listing. */
router.get('/adtype', async function (req: Request, res: Response, next: NextFunction) {
    try {
        let adtype = await getCategory()
        let searchAll = await getsearchAll("查看所有")
        let coupon = await getsearchAll('优惠券')
        let recommend = await getsearchAll('推荐')
        return sendOK(res, { adtype: adtype, searchAll: searchAll, coupon: coupon, recommend: recommend })
    } catch (e) {
        e.info(se, res, e)
    }
})

/* GET adslog listing. */
router.get('/subtype', async function (req: Request, res: Response, next: NextFunction) {
    // 获取参数
    const { parentuuid } = req.query
    try {
        validateCgi({ uuid: parentuuid }, usersValidator.uuid)
        let subtype = await getSubcategory(parentuuid)
        return sendOK(res, { subtype: subtype })
    } catch (e) {
        e.info(se, res, e)
    }
})


router.get('/:uuid', async function (req: Request, res: Response, next: NextFunction) {
    // 获取参数
    let uuid = req.params["uuid"]
    try {
        validateCgi({ uuid: uuid }, usersValidator.uuid)
        let subtype = await findByPrimary(uuid)
        return sendOK(res, { subtype: subtype })
    } catch (e) {
        e.info(se, res, e)
    }
})