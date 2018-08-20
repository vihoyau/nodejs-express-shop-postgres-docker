import { couponValidator } from "./validator"
import { validateCgi } from "../../lib/validator"
import { checkAppLogin, LoginInfo } from "../../redis/logindao"
import { sendOK, sendError as se } from "../../lib/response"
import { getPageCount } from "../../lib/utils"
import { Router, Request, Response, NextFunction } from "express"
import { getAPPCouponList, getAPPBusinessCouponList } from "../../model/mall/coupon"
import { getbyuseruuidandcouponuuid/*, getbyprimary*/ } from "../../model/users/usercoupon"
import { timestamptype } from "../../config/winston"

export const router: Router = Router()

//获得对应商家优惠券列表
router.get("/business", checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { business } = req.query
    try {
        validateCgi({ business: business }, couponValidator.business)
        const loginInfo: LoginInfo = (req as any).loginInfo
        let coupon = await getAPPBusinessCouponList(business)

        for (let i = 0; i < coupon.length; i++) {
            coupon[i].content.discount = coupon[i].content.discount / 10
            coupon[i].tsrange[0] = timestamptype(coupon[i].tsrange[0])
            coupon[i].tsrange[1] = timestamptype(coupon[i].tsrange[1])
            coupon[i].price = coupon[i].price / 100

            let usercoupon = await getbyuseruuidandcouponuuid(loginInfo.getUuid(), coupon[i].uuid)

            coupon[i].id = usercoupon ? 'true' : null
        }
        return sendOK(res, { coupon: coupon })
    } catch (e) {
        e.info(se, res, e)
    }
})

//获得优惠券列表
router.get("/", async function (req: Request, res: Response, next: NextFunction) {
    let { page, count, kind } = req.query
    try {
        let { cursor, limit } = await getPageCount(page, count)
        if (kind === null || kind === undefined)
            kind = ''
        let coupon = await getAPPCouponList(cursor, limit, kind)
        coupon.forEach(r => {
            r.content.discount = r.content.discount / 10
            r.tsrange[0] = timestamptype(r.tsrange[0])
            r.tsrange[1] = timestamptype(r.tsrange[1])
            r.price = r.price / 100
        })
        return sendOK(res, { coupon: coupon, page: parseInt(page) + 1 + '', count: count })
    } catch (e) {
        e.info(se, res, e)
    }
})