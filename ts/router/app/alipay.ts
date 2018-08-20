import { validateCgi } from "../../lib/validator"
import { findByPrimary } from "../../model/orders/orders"
import { findByPrimary as findUsersExt } from "../../model/users/users_ext"
import * as moment from "moment"
import { alipayValidator } from "./validator"
import { aliPayOpt, bidMaxCount } from "../../config/alipay"
import { Router, Request, Response, NextFunction } from "express"
import { getVerifyParams, getSign, veriySign } from "../../lib/alipay"
import { sendOK, sendNotFound, sendErrMsg } from "../../lib/response"
import { checkAppLogin, LoginInfo } from "../../redis/logindao"
import { findJoinUUID, findByUseruuidAndActuuid, updateEvaluatejoin } from "../../model/evaluate/evaluatejoin"
import { createGroupAfterPay, joinGroupAfterPay } from "./evaluate"
import { findByPrimaryUUID } from "../../model/evaluate/evaluateactivity"
import { updateOrderState } from "./orders"
import * as logger from "winston"
export const router = Router()

import { randomInt } from "../../lib/utils"
import { insertOne, findByPrimary as findAli, updateState } from "../../model/pay/alipay"
function getOutTradeNo() {
    const prefix = ""
    return `${prefix}${moment().format("YYYYMMDDHHmmss")}${randomInt(1000, 9999)}`
}

router.post('/', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const loginInfo: LoginInfo = (req as any).loginInfo
    let { orderuuids } = (req as any).body
    let order: any
    let ordersTotal_fee = 0
    let ordersgoodpoint = 0
    try {
        for (let i = 0; i < orderuuids.length; i++) {
            validateCgi({ orderuuid: orderuuids[i] }, alipayValidator.pay)
            order = await findByPrimary(orderuuids[i])
            if (!order)
                return sendNotFound(res, "不存在订单！")
            ordersTotal_fee += order.real_fee + order.postage
            ordersgoodpoint += order.goodpoint
        }
        let user = await findUsersExt(loginInfo.getUuid())
        if (user.points < ordersgoodpoint)
            return sendNotFound(res, "积分不足!")
        // await exchange(loginInfo.getUuid(), { points: ordersgoodpoint, balance: 0 })//减积分
        let aliOrder = order.goods[0]
        let datetime = moment().format("YYYY-MM-DD HH:mm:ss")
        let out_trade_no = getOutTradeNo()
        let bizOpt = {
            body: aliOrder.content,
            subject: aliOrder.title,
            out_trade_no: out_trade_no,
            timeout_express: aliPayOpt.timeout_express,
            total_amount: ordersTotal_fee / 100,
            seller_id: aliPayOpt.seller_id,     //不用传
            product_code: "QUICK_MSECURITY_PAY",
        }
        //用于生成签名的参数
        logger.info(JSON.stringify(bizOpt))
        let allOpt = {
            app_id: aliPayOpt.app_id,
            method: aliPayOpt.method,     //接口名称,支付宝网关
            charset: aliPayOpt.charset,
            format: aliPayOpt.format,     //仅支持json
            sign_type: aliPayOpt.sign_type,  //签名算法
            timestamp: datetime,
            version: aliPayOpt.version,     //调用的接口版本，固定为：1.0
            notify_url: aliPayOpt.notify_url,   //支付宝服务器主动通知商户服务器
            biz_content: JSON.stringify(bizOpt),         //将所有业务参数放在biz_content里面
        }

        let unifiedOrder = await getVerifyParams(allOpt) //所有参数参数排序 返回字符串
        let sign = await getSign(unifiedOrder)  //获取签名
        let allParam = {
            app_id: encodeURIComponent(aliPayOpt.app_id),
            biz_content: encodeURIComponent(JSON.stringify(bizOpt)),
            method: encodeURIComponent(aliPayOpt.method),     //接口名称,支付宝网关
            format: encodeURIComponent(aliPayOpt.format),     //仅支持json
            charset: encodeURIComponent(aliPayOpt.charset),
            sign_type: encodeURIComponent(aliPayOpt.sign_type),  //签名算法
            sign: encodeURIComponent(sign),
            timestamp: encodeURIComponent(datetime),   //"yyyy-MM-dd HH:mm:ss"
            version: encodeURIComponent(aliPayOpt.version),     //调用的接口版本，固定为：1.0
            notify_url: encodeURIComponent(aliPayOpt.notify_url),   //支付宝服务器主动通知商户服务器里指定的页面http/https路径
        }

        //插入阿里支付的记录表
        let obj = {
            out_trade_no,
            useruuid: loginInfo.getUuid(),
            orderuuids,
            state: 'new',
            total_amount: ordersTotal_fee / 100
        }
        let o = await insertOne(obj)
        if (!o)
            return sendErrMsg(res, "insert failed", 500)

        logger.info(JSON.stringify(allParam))
        sendOK(res, { param: allParam })
    } catch (e) {
        return e
    }
})

//支付宝异步通知,该接口给支付宝调用
router.post('/notify'/*, checkAppLogin*/, async function (req: Request, res: Response, next: NextFunction) {
    let aliParams = (req as any).body
    try {
        console.log("支付宝异步通知参数")
        console.log(JSON.stringify(aliParams))
        let mysign = await veriySign(aliParams)  //获取签名
        if (mysign) {
            console.log("验签成功")
            //判断交易状态
            switch (aliParams.trade_status) {
                case 'TRADE_SUCCESS': console.log("交易成功"); await updateAliPayState(aliParams.out_trade_no)
                    break
                case 'WAIT_BUYER_PAY': console.log("交易创建，等待买家付款")
                    break
                case 'TRADE_CLOSED': console.log("未付款交易超时关闭，或支付完成后全额退款")
                    break
                case 'TRADE_FINISHED': console.log("交易结束，不可退款")
                    break
                default: console.log("交易异常")
                    return
            }

            console.log("success")
            return 'success'
        } else {
            console.log("验签失败")
        }

    } catch (e) {
        return e
    }
})

async function updateAliPayState(out_trade_no: any) {
    let res = await findAli(out_trade_no)
    if (!res)
        return

    await updateState(out_trade_no, 'fin')//更新阿里支付表的记录状态，不等待
    await updateOrderState(res.orderuuids, 'alipay', res.useruuid)//更新订单状态，不等待
}

router.post('/paygroup', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const loginInfo: LoginInfo = (req as any).loginInfo
    let { activityuuid, groupuuid, addressuuid, property } = (req as any).body

    try {
        validateCgi({ activityuuid, addressuuid }, alipayValidator.paygroup)
        let join = await findByUseruuidAndActuuid(loginInfo.getUuid(), activityuuid)
        let act = await findByPrimaryUUID(activityuuid)

        if (!join)
            return sendNotFound(res, "不存在订单！")

        if (join && join.inputcount > bidMaxCount)
            return sendNotFound(res, "您尝试次数太多啦")

        if (join.bid < act.reserveprice)
            return sendNotFound(res, "出价不对")

        let now = moment().format("YYYY-MM-DD HH:mm:ss")
        if (act.endtime < now)
            return sendNotFound(res, "活动已经结束")

        await updateEvaluatejoin(join.uuid, { groupuuid, addressuuid, property })

        let aliOrder = { content: "十金时代-暗拼猜团", title: "暗拼猜团" }
        let datetime = moment().format("YYYY-MM-DD HH:mm:ss")
        let out_trade_no = getOutTradeNo()
        let bizOpt = {
            body: aliOrder.content,
            subject: aliOrder.title,
            out_trade_no: out_trade_no,
            timeout_express: aliPayOpt.timeout_express,
            total_amount: join.bid,
            // seller_id: aliPayOpt.seller_id,     //不用传
            product_code: "QUICK_MSECURITY_PAY",
        }
        //用于生成签名的参数
        logger.info(JSON.stringify(bizOpt))
        let allOpt = {
            app_id: aliPayOpt.app_id,
            method: aliPayOpt.method,     //接口名称,支付宝网关
            charset: aliPayOpt.charset,
            format: aliPayOpt.format,     //仅支持json
            sign_type: aliPayOpt.sign_type,  //签名算法
            timestamp: datetime,
            version: aliPayOpt.version,     //调用的接口版本，固定为：1.0
            notify_url: aliPayOpt.groupnotify_url,   //支付宝服务器主动通知商户服务器
            biz_content: JSON.stringify(bizOpt),         //将所有业务参数放在biz_content里面
        }

        let unifiedOrder = await getVerifyParams(allOpt) //所有参数参数排序 返回字符串
        let sign = await getSign(unifiedOrder)  //获取签名
        let allParam = {
            app_id: encodeURIComponent(aliPayOpt.app_id),
            biz_content: encodeURIComponent(JSON.stringify(bizOpt)),
            method: encodeURIComponent(aliPayOpt.method),     //接口名称,支付宝网关
            format: encodeURIComponent(aliPayOpt.format),     //仅支持json
            charset: encodeURIComponent(aliPayOpt.charset),
            sign_type: encodeURIComponent(aliPayOpt.sign_type),  //签名算法
            sign: encodeURIComponent(sign),
            timestamp: encodeURIComponent(datetime),   //"yyyy-MM-dd HH:mm:ss"
            version: encodeURIComponent(aliPayOpt.version),     //调用的接口版本，固定为：1.0
            notify_url: encodeURIComponent(aliPayOpt.groupnotify_url),   //支付宝服务器主动通知商户服务器里指定的页面http/https路径
        }

        //插入阿里支付的记录表
        let obj = {
            out_trade_no,
            useruuid: loginInfo.getUuid(),
            orderuuids: [join.uuid],
            state: 'new',
            total_amount: join.bid
        }
        let o = await insertOne(obj)
        if (!o)
            return sendErrMsg(res, "insert failed", 500)

        logger.info(JSON.stringify(allParam))
        sendOK(res, { param: allParam })
    } catch (e) {
        return e
    }
})

router.post('/groupnotify'/*, checkAppLogin*/, async function (req: Request, res: Response, next: NextFunction) {
    let aliParams = (req as any).body
    try {
        console.log("支付宝异步通知参数")
        console.log(JSON.stringify(aliParams))
        let mysign = await veriySign(aliParams)  //获取签名
        if (mysign) {
            console.log("验签成功")
            //判断交易状态
            switch (aliParams.trade_status) {
                case 'TRADE_SUCCESS': console.log("交易成功"); await joinGroupState(aliParams.out_trade_no)
                    break
                case 'WAIT_BUYER_PAY': console.log("交易创建，等待买家付款")
                    break
                case 'TRADE_CLOSED': console.log("未付款交易超时关闭，或支付完成后全额退款")
                    break
                case 'TRADE_FINISHED': console.log("交易结束，不可退款")
                    break
                default: console.log("交易异常")
                    return
            }
            console.log("success")
            return 'success'
        } else {
            console.log("验签失败")
        }

    } catch (e) {
        return e
    }
})

async function joinGroupState(out_trade_no: string) {
    let res = await findAli(out_trade_no)
    if (!res.orderuuids)
        return

    let join = await findJoinUUID(res.orderuuids[0])
    if (join.leader) {//开团
        await createGroupAfterPay(join.activityuuid, res.useruuid)
    } else {//参团
        await joinGroupAfterPay(join.groupuuid, res.useruuid)
    }
}