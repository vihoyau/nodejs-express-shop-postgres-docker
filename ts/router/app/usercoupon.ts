import { usercouponValidator } from "./validator"
import { validateCgi } from "../../lib/validator"
import { checkAppLogin, LoginInfo } from "../../redis/logindao"
import { sendOK, sendError as se, sendNotFound } from "../../lib/response"
import { Router, Request, Response, NextFunction } from "express"
import { exchange } from "../../model/users/users_ext"
import { insertusercoupon, getGoodsCouponLists, createdUsercoupon, usedUsercoupon, getUserSelectGoodsCoupon, findCouponByUsercouponuuid, updateSelected, getbyuseruuidandcouponuuid, getGoodsCouponList, getusercouponlist } from "../../model/users/usercoupon"
import { getAPPBusinessCouponList, findByPrimary as findcoupon, updateCouponNum } from "../../model/mall/coupon"
import { timestamptype } from "../../config/winston"
export const router: Router = Router()

//购买优惠券
router.post("/coupon", checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    try {
        const { couponuuid } = (req as any).body
        const loginInfo: LoginInfo = (req as any).loginInfo
        let coupon = await findcoupon(couponuuid)
        validateCgi({ couponuuid: couponuuid }, usercouponValidator.insertOptions)
        await exchange(loginInfo.getUuid(), { points: coupon.point, balance: 0 })//减积分
        await createdUsercoupon(loginInfo.getUuid(), couponuuid)
        if (coupon.kind === 'entity') {
            await updateCouponNum(couponuuid)//减少库存
        }
        return sendOK(res, { msg: "购买成功！" })
    } catch (e) {
        e.info(se, res, e)
    }
})

//用户新增优惠券
router.post("/", checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { couponuuid, business } = (req as any).body
    try {
        validateCgi({ couponuuid: couponuuid }, usercouponValidator.insertOptions)
        const loginInfo: LoginInfo = (req as any).loginInfo
        let usercoupon = await getbyuseruuidandcouponuuid(loginInfo.getUuid(), couponuuid)
        if (usercoupon) {//已拥有
            return sendNotFound(res, "您已经拥有该优惠券啦")
        } else {//创建一条新记录
            await insertusercoupon(req.app.locals.sequelize, loginInfo.getUuid(), couponuuid)
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
        }
    } catch (e) {
        e.info(se, res, e)
    }
})

//获得下单商品可使用的优惠券列表
router.get("/business", checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { business, total_fee } = req.query
    try {
        validateCgi({ business: business }, usercouponValidator.business)
        validateCgi({ total_fee: parseInt(total_fee) * 100 }, usercouponValidator.total_fee)
        const loginInfo: LoginInfo = (req as any).loginInfo
        let usercoupon = await getGoodsCouponList(req.app.locals.sequelize, loginInfo.getUuid(), business)
        for (let i = 0; i < usercoupon.length; i++) {
            usercoupon[i].tsrange[0] = timestamptype(usercoupon[i].tsrange[0])
            usercoupon[i].tsrange[1] = timestamptype(usercoupon[i].tsrange[1])
            usercoupon[i].price = usercoupon[i].price / 100

            if (usercoupon[i].content.quota && parseFloat(total_fee) < JSON.parse(usercoupon[i].content.quota)) {//筛选出满足满减条件的优惠券
                usercoupon.splice(i, 1)
            } else if (usercoupon[i].content.cash && parseFloat(total_fee) < JSON.parse(usercoupon[i].content.cash)) {//筛选车满足现金券的优惠券
                usercoupon.splice(i, 1)
            }
            if (parseFloat(total_fee) === 0) {//筛选出积分兑换
                usercoupon.splice(i, 1)
            }
        }
        return sendOK(res, { usercoupon: usercoupon })
    } catch (e) {
        e.info(se, res, e)
    }
})

//选取优惠券
router.put("/selected/:uuid", checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    let uuid = req.params["uuid"]
    let { business } = (req as any).body
    try {
        //validateCgi({ uuid: uuid }, usercouponValidator.UUID)
        validateCgi({ business: business }, usercouponValidator.business)
        const loginInfo: LoginInfo = (req as any).loginInfo
        let usercoupons = await getGoodsCouponLists(req.app.locals.sequelize, loginInfo.getUuid(), business)
        if (usercoupons[0]) {
            await updateSelected(usercoupons[0].uuid, null)
        }
        if (uuid != null && uuid != undefined && uuid != 'undefined' && uuid != 'null') {
            await updateSelected(uuid, business)
            let coupon = await findCouponByUsercouponuuid(uuid)
            return sendOK(res, { coupon: coupon })
        } else {
            return sendOK(res, { "msg": "取消成功！" })
        }
    } catch (e) {
        e.info(se, res, e)
    }
})

//获得用户选中的优惠券列表
router.get("/userselected", checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { business } = req.query
    try {
        let businesss = JSON.parse(business)
        businesss.forEach((r: any) => {
            validateCgi({ business: r }, usercouponValidator.business)
        });
        const loginInfo: LoginInfo = (req as any).loginInfo
        let usercoupons = await getUserSelectGoodsCoupon(req.app.locals.sequelize, loginInfo.getUuid(), businesss)
        return sendOK(res, { usercoupons: usercoupons })
    } catch (e) {
        e.info(se, res, e)
    }
})

//获得用户优惠券列表
router.get("/", checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { kind, state } = req.query
    try {
        validateCgi({ kind: kind, state: state }, usercouponValidator.pagination)
        const loginInfo: LoginInfo = (req as any).loginInfo
        state = state ? state : ''
        let usercoupon = await getusercouponlist(req.app.locals.sequelize, loginInfo.getUuid(), kind, state)
        return sendOK(res, { usercoupon: usercoupon })
    } catch (e) {
        e.info(se, res, e)
    }
})

//优惠券确认使用
router.put("/:uuid", checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    try {
        const uuid = req.params['uuid']
        let usercoupon = await usedUsercoupon('used', uuid)
        return sendOK(res, { usercoupon: usercoupon })
    } catch (e) {
        e.info(se, res, e)
    }
})