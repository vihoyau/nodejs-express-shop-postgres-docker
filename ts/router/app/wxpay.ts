import { Router, Request, Response, NextFunction } from "express"
import { sendError as se, sendOK, sendNotFound, sendErrMsg } from "../../lib/response"
import { findByPrimary as findcoupon } from "../../model/mall/coupon"
import { findByPrimary as findUsersExt } from "../../model/users/users_ext"
import { wxpayValidator } from "./validator"
import { validateCgi } from "../../lib/validator"
import { findByPrimary } from "../../model/orders/orders"
import { wxPayOpt, wxPaymentOpt, wxGroupPayOpt, bidMaxCount } from "../../config/wxpay"
import { genPrePayUnifiedOrder, genPrePayUnifiedOrderh5, validateNotify, getWebParam, getWebParamh5 } from "../../lib/wxpay"
import { insertNewTrade, findByTradeNo, setWxTradeState } from "../../model/pay/wxtrade"
import { checkAppLogin, LoginInfo } from "../../redis/logindao"
import { findJoinUUID, findByUseruuidAndActuuid, updateEvaluatejoin } from "../../model/evaluate/evaluatejoin"
import { findByPrimaryUUID } from "../../model/evaluate/evaluateactivity"
import { createGroupAfterPay, joinGroupAfterPay } from "./evaluate"
import * as moment from "moment"
export const router = Router()

import { updateOrderState } from "./orders"

// TODO checkAppLogin
// charge/wxpay2/pay
router.post('/pay', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { orderuuids } = (req as any).body
    const loginInfo: LoginInfo = (req as any).loginInfo
    try {
        let ordersTotal_fee = 0
        let ordersgoodpoint = 0
        for (let i = 0; i < orderuuids.length; i++) {
            // 校验订单号
            validateCgi({ orderuuid: orderuuids[i] }, wxpayValidator.pay)
            let order = await findByPrimary(orderuuids[i])
            if (!order)
                return sendNotFound(res, "不存在订单！")
            ordersTotal_fee += order.real_fee + order.postage
            ordersgoodpoint += order.goodpoint
        }
        let user = await findUsersExt(loginInfo.getUuid())
        if (user.points < ordersgoodpoint)
            return sendNotFound(res, "积分不足!")
        //await exchange(loginInfo.getUuid(), { points: ordersgoodpoint, balance: 0 })//减积分
        // 请求生成订单
        let wxorder = await genPrePayUnifiedOrder({
            body: "十金时代-購買商品",
            total_fee: ordersTotal_fee,
            spbill_create_ip: "192.168.0.6",
            trade: "APP"
        }, wxPayOpt)
        // 插入数据库
        wxorder['orderuuids'] = orderuuids
        wxorder['status'] = 1
        wxorder['useruuid'] = loginInfo.getUuid()
        await insertNewTrade(wxorder)
        let timestamp = new Date().getTime().toString().slice(0, 10)
        let webParam = await getWebParam(wxorder.prepay_id, wxPayOpt.appid, timestamp, wxPayOpt.key, wxPayOpt.mch_id)
        sendOK(res, { param: webParam })
    } catch (e) {
        e.info(se, res, e)
    }
})

//优惠券支付
router.post('/couponpay', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { couponuuid } = (req as any).body
    try {
        const loginInfo: LoginInfo = (req as any).loginInfo
        let coupon = await findcoupon(couponuuid)
        let user = await findUsersExt(loginInfo.getUuid())
        if (user.points < coupon.point)
            return sendNotFound(res, "积分不足!")
        //await exchange(loginInfo.getUuid(), { points: coupon.point, balance: 0 })//减积分
        // 请求生成订单
        let wxorder = await genPrePayUnifiedOrder({
            body: "十金时代-購買商品",
            total_fee: coupon.price,
            spbill_create_ip: "192.168.0.6",
            trade: "APP"
        }, wxPayOpt)
        // 插入数据库
        await insertNewTrade(wxorder)
        let timestamp = new Date().getTime().toString().slice(0, 10)
        let webParam = await getWebParam(wxorder.prepay_id, wxPayOpt.appid, timestamp, wxPayOpt.key, wxPayOpt.mch_id)
        sendOK(res, { param: webParam })
    } catch (e) {
        e.info(se, res, e)
    }
})
//优惠券支付
router.post('/htmlcouponpay', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { couponuuid, openid } = (req as any).body
    try {
        const loginInfo: LoginInfo = (req as any).loginInfo
        let coupon = await findcoupon(couponuuid)
        let user = await findUsersExt(loginInfo.getUuid())
        if (user.points < coupon.point)
            return sendNotFound(res, "积分不足!")
        //await exchange(loginInfo.getUuid(), { points: coupon.point, balance: 0 })//减积分
        // 请求生成订单
        let wxorder = await genPrePayUnifiedOrderh5({
            body: "十金时代-購買商品",
            total_fee: coupon.price,
            spbill_create_ip: "192.168.0.6",
            trade: "JSAPI",
            openid: openid
        }, wxPayOpt)
        // 插入数据库
        await insertNewTrade(wxorder)
        let timestamp = new Date().getTime().toString().slice(0, 10)
        let webParam = await getWebParam(wxorder.prepay_id, wxPayOpt.appid, timestamp, wxPayOpt.key, wxPayOpt.mch_id)
        sendOK(res, { param: webParam })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.post('/htmlpay', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { orderuuids, openid } = (req as any).body
    const loginInfo: LoginInfo = (req as any).loginInfo
    try {
        let ordersTotal_fee = 0
        let ordersgoodpoint = 0
        for (let i = 0; i < orderuuids.length; i++) {
            // 校验订单号
            validateCgi({ orderuuid: orderuuids[i] }, wxpayValidator.pay)
            let order = await findByPrimary(orderuuids[i])
            if (!order)
                return sendNotFound(res, "不存在订单！")
            ordersTotal_fee += order.real_fee + order.postage
            ordersgoodpoint += order.goodpoint
        }
        let user = await findUsersExt(loginInfo.getUuid())
        if (user.points < ordersgoodpoint)
            return sendNotFound(res, "积分不足!")
        //await exchange(loginInfo.getUuid(), { points: ordersgoodpoint, balance: 0 })//减积分
        // 请求生成订单
        let wxorder = await genPrePayUnifiedOrderh5({
            body: "十金时代-購買商品",
            total_fee: ordersTotal_fee,
            spbill_create_ip: "192.168.0.6",
            trade: "JSAPI",
            openid: openid
        }, wxPaymentOpt)

        // 插入数据库
        wxorder['orderuuids'] = orderuuids
        wxorder['status'] = 1
        wxorder['useruuid'] = loginInfo.getUuid()
        wxorder.trade_type = "WEB"
        await insertNewTrade(wxorder)
        let timestamp = new Date().getTime().toString().slice(0, 10)
        let webParam = await getWebParamh5(wxorder.prepay_id, wxPaymentOpt.appid, timestamp, wxPaymentOpt.key, wxPaymentOpt.mch_id)
        sendOK(res, { param: webParam })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.post('/htmlrecharge', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { moment, openid } = (req as any).body
    try {
        //validateCgi({ orderuuid: orderuuid }, wxpayValidator.pay)

        // 校验订单号
        // let order = await findByPrimary(orderuuid)
        // if (!order)
        //     return sendNotFound(res, "不存在订单！")

        // 请求生成订单
        let wxorder = await genPrePayUnifiedOrderh5({
            body: "十金时代-購買商品",
            total_fee: parseFloat(moment) * 100,
            spbill_create_ip: "192.168.0.6",
            trade: "JSAPI",
            openid: openid
        }, wxPaymentOpt)
        // 插入数据库
        wxorder.trade_type = "WEB"
        let wxtrade = await insertNewTrade(wxorder)
        let timestamp = new Date().getTime().toString().slice(0, 10)
        let webParam = await getWebParamh5(wxorder.prepay_id, wxPaymentOpt.appid, timestamp, wxPaymentOpt.key, wxPaymentOpt.mch_id)
        sendOK(res, { param: webParam, id: wxtrade.uuid })
    } catch (e) {
        e.info(se, res, e)
    }
})


router.post('/recharge', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { moment } = (req as any).body
    try {
        moment = Math.round(parseFloat(moment) * 100)
        validateCgi({ moment: moment }, wxpayValidator.momentvalidator)
        // 请求生成订单
        let wxorder = await genPrePayUnifiedOrder({
            body: "十金时代-購買商品",
            total_fee: moment,
            spbill_create_ip: "192.168.0.6",
            trade: "APP"
        }, wxPayOpt)

        // 插入数据库
        let wxtrade = await insertNewTrade(wxorder)
        let timestamp = new Date().getTime().toString().slice(0, 10)
        let webParam = await getWebParam(wxorder.prepay_id, wxPayOpt.appid, timestamp, wxPayOpt.key, wxPayOpt.mch_id)
        sendOK(res, { param: webParam, id: wxtrade.uuid })
    } catch (e) {
        e.info(se, res, e)
    }
})

function sendTradeOK(res: Response) {
    res.send(`<xml> <return_code><![CDATA[SUCCESS]]></return_code> <return_msg><![CDATA[OK]]></return_msg> </xml>`)
}

function sendTradeFail(res: Response) {
    res.status(403).send(`<xml> <return_code><![CDATA[FAIL]]></return_code> <return_msg><![CDATA[BAD]]></return_msg> </xml>`)
}

// 读取POST的body
async function readRawBody(req: any, res: any, next: any) {
    let arr = new Array<string>()
    req.on('data', function (chunk: any) {
        arr.push(chunk.toString())
    })

    req.on('end', function (chunk: any) {
        if (chunk) {
            arr.push(chunk.toString())
        }
        req.rawBody = arr.join()
        next()
    })
}

// 微信后台回调，会有多次
router.post('/notify', readRawBody, async function (req: Request, res: Response, next: NextFunction) {
    try {
        let body = (<any>req).rawBody

        // 校验
        let obj = await validateNotify(body, wxPayOpt)

        // 检查订单是否已经完成
        let out_trade_no = obj.out_trade_no
        let trade = await findByTradeNo(out_trade_no)
        if (trade.state !== "new") {
            return sendTradeOK(res)
        }

        // 设置订单完成
        await setWxTradeState(out_trade_no, "fin")
        await updateState(out_trade_no)

        return sendTradeOK(res)
    } catch (e) {
        return sendTradeFail(res)
    }
})

async function updateState(out_trade_no: any) {
    let res = await findByTradeNo(out_trade_no)
    if (!res.orderuuids)
        return

    await updateOrderState(res.orderuuids, 'wxpay', res.useruuid)
}

//支付开团&参团
router.post('/paygroup', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { activityuuid, groupuuid, addressuuid, property } = (req as any).body
    const loginInfo: LoginInfo = (req as any).loginInfo
    let useruuid = loginInfo.getUuid()
    try {
        // 校验订单号
        validateCgi({ uuid: activityuuid, addressuuid }, wxpayValidator.grouppay)
        let join = await findByUseruuidAndActuuid(useruuid, activityuuid)
        let act = await findByPrimaryUUID(activityuuid)
        if (!join)
            return sendNotFound(res, "没有参团信息！")

        if (join && join.inputcount > bidMaxCount)
            return sendNotFound(res, "您尝试次数太多啦")

        if (join.bid < act.reserveprice)
            return sendNotFound(res, "出价不对")

        let now = moment().format("YYYY-MM-DD HH:mm:ss")
        if (act.endtime < now)
            return sendNotFound(res, "活动已经结束")

        await updateEvaluatejoin(join.uuid, { groupuuid, addressuuid, property })

        // 请求生成订单
        let wxorder = await genPrePayUnifiedOrder({
            body: "十金时代-暗拼猜团",
            total_fee: join.bid * 100,
            spbill_create_ip: "192.168.0.6",
            trade: "APP"
        }, wxGroupPayOpt)

        // 插入数据库
        wxorder['orderuuids'] = [join.uuid]
        wxorder['status'] = 1
        wxorder['useruuid'] = loginInfo.getUuid()
        await insertNewTrade(wxorder)
        let timestamp = new Date().getTime().toString().slice(0, 10)
        let webParam = await getWebParam(wxorder.prepay_id, wxPayOpt.appid, timestamp, wxPayOpt.key, wxPayOpt.mch_id)
        sendOK(res, { param: webParam })
    } catch (e) {
        sendErrMsg(res, e, 500)
    }
})

//html支付开团&参团
router.post('/htmlpaygroup', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { activityuuid, groupuuid, addressuuid, property, openid } = (req as any).body
    const loginInfo: LoginInfo = (req as any).loginInfo
    let useruuid = loginInfo.getUuid()
    try {
        // 校验订单号
        validateCgi({ uuid: activityuuid, addressuuid }, wxpayValidator.grouppay)
        let join = await findByUseruuidAndActuuid(useruuid, activityuuid)
        let act = await findByPrimaryUUID(activityuuid)
        if (!join)
            return sendNotFound(res, "没有参团信息！")

        if (join && join.inputcount > bidMaxCount)
            return sendNotFound(res, "您尝试次数太多啦")

        if (join.bid < act.reserveprice)
            return sendNotFound(res, "出价不对")

        let now = moment().format("YYYY-MM-DD HH:mm:ss")
        if (act.endtime < now)
            return sendNotFound(res, "活动已经结束")

        await updateEvaluatejoin(join.uuid, { groupuuid, addressuuid, property })

        // 请求生成订单
        let wxorder = await genPrePayUnifiedOrderh5({
            body: "十金时代-購買商品",
            total_fee: join.bid * 100,
            spbill_create_ip: "192.168.0.6",
            trade: "JSAPI",
            openid: openid
        }, wxGroupPayOpt)

        // 插入数据库
        wxorder['orderuuids'] = [join.uuid]
        wxorder['status'] = 1
        wxorder['useruuid'] = loginInfo.getUuid()
        await insertNewTrade(wxorder)
        let timestamp = new Date().getTime().toString().slice(0, 10)
        let webParam = await getWebParam(wxorder.prepay_id, wxPayOpt.appid, timestamp, wxPayOpt.key, wxPayOpt.mch_id)
        sendOK(res, { param: webParam })
    } catch (e) {
        sendErrMsg(res, e, 500)
    }
})

router.post('/groupnotify', readRawBody, async function (req: Request, res: Response, next: NextFunction) {
    try {
        let body = (<any>req).rawBody

        // 校验
        let obj = await validateNotify(body, wxPayOpt)

        // 检查订单是否已经完成
        let out_trade_no = obj.out_trade_no
        let trade = await findByTradeNo(out_trade_no)
        if (trade.state !== "new") {
            return sendTradeOK(res)
        }

        // 设置订单完成
        await setWxTradeState(out_trade_no, "fin")
        await updateJoin(out_trade_no)

        return sendTradeOK(res)
    } catch (e) {
        return sendTradeFail(res)
    }
})

async function updateJoin(out_trade_no: string) {
    let res = await findByTradeNo(out_trade_no)
    if (!res.orderuuids)
        return

    let join = await findJoinUUID(res.orderuuids[0])
    if (join.leader) {//开团
        await createGroupAfterPay(join.activityuuid, res.useruuid)
    } else {//参团
        await joinGroupAfterPay(join.groupuuid, res.useruuid)
    }
}