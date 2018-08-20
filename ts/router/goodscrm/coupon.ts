import { couponValidator, crmuserValidator } from "./validator"
import { validateCgi } from "../../lib/validator"
import { checkLogin } from "../../redis/logindao"
import { sendOK, sendError as se } from "../../lib/response"
import { Router, Request, Response, NextFunction } from "express"
import { insertCoupon, getCouponList, getCount, updateCouponInfo, deleteCoupon } from "../../model/mall/coupon"
import { timestamps } from "../../config/winston"

export const router: Router = Router()

//新增优惠券
router.post("/", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { businessuuid, business, kind, title, content, price, point, tsrange, num, description, coupontype } = (req as any).body
    try {
        validateCgi({ businessuuid: businessuuid, business: business, kind: kind, title: title, price: price, point: point, num: num, coupontype: coupontype }, couponValidator.insertOptions)
        let obj = {
            businessuuid: businessuuid,
            business: business,
            kind: kind,
            title: title,
            content: JSON.parse(content),
            price: JSON.parse(price) * 100,
            point: JSON.parse(point),
            tsrange: JSON.parse(tsrange),
            num: JSON.parse(num),
            description: description,
            coupontype: coupontype
        }
        await insertCoupon(obj)
        return sendOK(res, { msg: "新增成功!" })
    } catch (e) {
        e.info(se, res, e)
    }
})

//修改优惠券信息
router.put("/:uuid", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const uuid = req.params["uuid"]
    const { businessuuid, business, kind, title, content, price, point, tsrange, num, description, coupontype } = (req as any).body
    try {
        validateCgi({ uuid: uuid, businessuuid: businessuuid, business: business, kind: kind, title: title, price: price, point: point, num: num, coupontype: coupontype }, couponValidator.updateOptions)
        let obj = {
            businessuuid: businessuuid,
            kind: kind,
            business: business,
            title: title,
            content: JSON.parse(content),
            price: JSON.parse(price) * 100,
            point: JSON.parse(point),
            tsrange: JSON.parse(tsrange),
            description: description,
            num: JSON.parse(num),
            coupontype: coupontype,
        }
        await updateCouponInfo(obj, uuid)
        return sendOK(res, { msg: '编辑成功!' })
    } catch (e) {
        e.info(se, res, e)
    }
})

//获得优惠券列表
router.get("/", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { start, length, draw, search } = req.query
    let { coupontype } = req.query
    let { kind } = req.query
    let { state } = req.query
    try {
        let searchdata = (search as any).value
        validateCgi({ start: start, length: length, searchdata: searchdata }, crmuserValidator.pagination)
        if (!coupontype || coupontype === 'undefined' || coupontype == undefined)
            coupontype = ''
        if (!kind || kind === 'undefined' || kind == undefined)
            kind = ''
        if (!state || state === 'undefined' || state == undefined)
            state = ''
        let recordsFiltered = await getCount(searchdata, coupontype, kind, state)
        let coupon = await getCouponList(parseInt(start), parseInt(length), searchdata, coupontype, kind, state)
        coupon.forEach(r => {
            r.tsrange[0] = timestamps(r.tsrange[0])
            r.tsrange[1] = timestamps(r.tsrange[1])
            r.price = r.price / 100
        })
        return sendOK(res, { draw: draw, coupon: coupon, recordsFiltered: recordsFiltered })
    } catch (e) {
        e.info(se, res, e)
    }
})

//删除优惠券
router.delete("/:uuid", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const uuid = req.params["uuid"]
    try {
        validateCgi({ uuid: uuid }, couponValidator.UUID)
        await deleteCoupon(uuid)
        return sendOK(res, { msg: "删除成功" })
    } catch (e) {
        e.info(se, res, e)
    }
})