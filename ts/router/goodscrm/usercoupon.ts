import { checkLogin, LoginInfo } from "../../redis/logindao"
import { sendOK, sendError as se } from "../../lib/response"
import { Router, Request, Response, NextFunction } from "express"
import { getcouponlist, getcouponlistCount, usedUsercoupon } from "../../model/users/usercoupon"
import { findByPrimary } from "../../model/ads/crmuser"
export const router: Router = Router()

//获得用户优惠券列表
router.get("/", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    try {
        const { start, length, draw, search } = req.query
        let { coupontype, state } = req.query
        let searchdata = (search as any).value
        const loginInfo: LoginInfo = (req as any).loginInfo
        let crmuser = await findByPrimary(loginInfo.getUuid())
        if (!coupontype || coupontype === undefined || coupontype === "undefined") {
            coupontype = ''
        }
        if (!state || state === undefined || state === "undefined") {
            state = ''
        }
        let recordsFiltered = await getcouponlistCount(req.app.locals.sequelize, crmuser.mgruuids, searchdata, coupontype, state)
        let usercoupon = await getcouponlist(req.app.locals.sequelize, crmuser.mgruuids, parseInt(start), parseInt(length), searchdata, coupontype, state)
        return sendOK(res, { usercoupon: usercoupon, draw: draw, recordsFiltered: recordsFiltered })
    } catch (e) {
        e.info(se, res, e)
    }
})

//优惠券确认使用
router.patch("/:uuid", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    try {
        const uuid = req.params['uuid']
        let usercoupon = await usedUsercoupon('used', uuid)
        return sendOK(res, { usercoupon: usercoupon })
    } catch (e) {
        e.info(se, res, e)
    }
})