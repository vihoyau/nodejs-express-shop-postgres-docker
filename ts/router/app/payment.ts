import { validateCgi } from "../../lib/validator"
import { paymentValidator } from "./validator"
import { Router, Request, Response, NextFunction } from "express"
import { sendOK, sendError as se, sendNotFound } from "../../lib/response"
import { notify } from "../../daemon/daemon"
import { findByPrimary } from "../../model/users/users_ext"
import { findByPrimary as findUsers } from "../../model/users/users"
import { randomInt } from "../../lib/utils"
import * as moment from "moment"
import { wxPaymentOpt } from "../../config/wxpay"
import { checkAppLogin, LoginInfo } from "../../redis/logindao"
import assert = require("assert")
import { transterAmount } from "../../model/pay/transfer"
export const router = Router()

// TODO
router.post('/:useruuid', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const useruuid = req.params["useruuid"]
    const loginInfo: LoginInfo = (req as any).loginInfo // TODO
    const { amount, description } = (req as any).body
    try {
        assert(useruuid === loginInfo.getUuid()) // TODO
        let obj = { useruuid: useruuid, amount: amount, description: description }
        validateCgi(obj, paymentValidator.pay)

        let user = await findByPrimary(useruuid)
        if (!user)
            return sendNotFound(res, "不存在此用户！")

        let users = await findUsers(useruuid)
        if (!users)
            return sendNotFound(res, "不存在此用户！")

        if (users.state === 'off')
            return sendNotFound(res, "账户异常，请重新登录！")

        if (user.balance < amount)
            return sendNotFound(res, "余额不足！")

        if (amount < 100)
            return sendNotFound(res, "转账金额不足！")

        if (!user.openid || user.openid === 'undefined')
            return sendNotFound(res, "未绑定微信公众号！")

        let transter = {
            partner_trade_no: `${moment().format("YYYYMMDDHHmmss")}${randomInt(1000, 9999)}`,
            spbill_create_ip: "192.168.0.221",
            openid: user.openid,
            amount: amount,
            description: description,
            check_name: "NO_CHECK",
            mch_appid: wxPaymentOpt.appid,
            mchid: wxPaymentOpt.mch_id,
            nonce_str: `${new Date().getTime()}${randomInt(1000, 9999)}`,
            useruuid: useruuid
        }

        await transterAmount(req.app.locals.sequelize, useruuid, transter)
        notify("payment.pay", obj)
        return sendOK(res, { msg: "已经发送请求！" })
    } catch (e) {
        e.info(se, res, e)
    }
})