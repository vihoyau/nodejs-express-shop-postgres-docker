import { validateCgi } from "../../lib/validator"
import { usersValidator } from "./validator"
import { Router, Request, Response, NextFunction } from "express"
import { sendError as se, sendNotFound, sendOK } from "../../lib/response"
import { exchange, findByPrimary } from "../../model/users/users_ext"
import { findByPrimary as findCoupon } from "../../model/mall/coupon"
import { createMessage } from "../../model/users/message"
import { createdUsercoupon } from "../../model/users/usercoupon"
import { findByName } from "../../model/system/system"
import { addPointAndCashlottery } from "../../model/users/users"
import { updateState, modifiedBalancepay, modifiedPointpay } from "../../model/orders/orders"
import { checkAppLogin, LoginInfo } from "../../redis/logindao"
export const router = Router()

//获取新消息
router.post('/exchange', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { orderuuids, points, balance } = (req as any).body
    try {
        const info: LoginInfo = (req as any).loginInfo
        balance = Math.round(parseFloat(balance) * 100)
        validateCgi({ points: points, balance: balance }, usersValidator.exchange)

        orderuuids.forEach((r: string) => {
            validateCgi({ uuid: r }, usersValidator.uuid)
        });

        if (balance < 0 || points < 0)
            return sendNotFound(res, "零钱不足!")

        let user = await findByPrimary(info.getUuid())
        if (user.points < parseInt(points))
            return sendNotFound(res, "积分不足!")

        if (user.balance < parseInt(balance))
            return sendNotFound(res, "零钱不足!")

        await exchange(info.getUuid(), { points: points, balance: balance })

        for (let i = 0; i < orderuuids.length; i++) {
            if (balance === 0) {//积分支付方式
                await modifiedPointpay("pointpay", orderuuids[i])//积分支付方式
            } else {
                await modifiedBalancepay("balancepay", orderuuids[i])//零钱支付方式
            }
            await updateState("wait-send", orderuuids[i])
            let obj = {
                useruuid: user.uuid,
                username: user.username,
                content: '已支付成功，系统正在出单',
                state: 'send',
                orderuuid: orderuuids[i],
                title: '物流消息'
            }
            await createMessage(obj)//发送消息
        }
        let system = await findByName('numcondition')
        if (balance / 100 >= parseInt(system.content.minorder)) {
            await addPointAndCashlottery(info.getUuid(), parseInt(system.content.invite), 0)//增加免费抽奖机会
        }
        sendOK(res, { exchange: "ok!" })
    } catch (e) {
        e.info(se, res, e)
    }
})

//优惠券零钱支付方式
router.post('/couponpay', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { couponuuid } = (req as any).body
    try {
        const info: LoginInfo = (req as any).loginInfo
        validateCgi({ uuid: couponuuid }, usersValidator.uuid)
        let coupon = await findCoupon(couponuuid)
        let user = await findByPrimary(info.getUuid())

        if (user.balance < coupon.price)
            return sendNotFound(res, "零钱不足!")

        if (user.points < coupon.point)
            return sendNotFound(res, "积分不足!")

        await exchange(info.getUuid(), { points: coupon.point, balance: coupon.price })//减零钱
        await createdUsercoupon(info.getUuid(), couponuuid)//发放优惠券
        sendOK(res, { exchange: "ok!" })
    } catch (e) {
        e.info(se, res, e)
    }
})