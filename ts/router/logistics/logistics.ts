import { Router, Request, Response, NextFunction } from "express"
import { sendOK } from "../../lib/response"
import { logisticsReturn } from '../../lib/logistics'
import { getByCode, updateTraces, insertLogistics } from "../../model/logistics/logistics"
// import { findByPrimary } from "../../model/orders/orders"
// import { findByPrimary as findusers } from "../../model/users/users"
// import { createMessage } from "../../model/users/message"
import * as logger from "winston"
export const router = Router()

router.all('/', async function (req: Request, res: Response, next: NextFunction) {
    let result = (req as any).body
    let logistics = JSON.parse(result.RequestData).Data
    try {
        for (let i = 0; i < logistics.length; i++) {
            let logistic = await getByCode(logistics[i].ShipperCode, logistics[i].LogisticCode)
            if (logistic) {
                // let order = await findByPrimary(logistic.ordercode)
                // if (order) {
                //     let user = await findusers(order.useruuid)
                //     let content
                //     switch (order.state) {
                //         case "wait-pay":
                //             content = "您有一个待支付订单！"
                //             break;
                //         case "wait-send":
                //             content = "您有一个待发货订单！"
                //             break;
                //         case "wait-recv":
                //             content = "您的商品已发货！"
                //             break;
                //         case "wait-comment":
                //             content = "您有一个待评价订单！"
                //             break;
                //         case "wait-ack":
                //             content = "您有一个待审核订单！"
                //             break;
                //         case "cancel":
                //             content = "您的订单已取消！"
                //             break;
                //         case "finish":
                //             content = "您的订单已完成！"
                //             break;
                //     }
                //     let obj = {
                //         useruuid: user.uuid,
                //         username: user.username,
                //         content: content,
                //         state: 'send',
                //         orderuuid: order.uuid,
                //         title: '物流消息'
                //     }
                //     await createMessage(obj)
                // }
                await updateTraces(logistics[i].ShipperCode, logistics[i].LogisticCode, logistics[i].Traces)
            } else {
                let lo = {
                    logisticscode: logistics[i].LogisticCode,
                    shippercode: logistics[i].ShipperCode,
                    traces: logistics[i].Traces
                }
                await insertLogistics(lo)
            }
        }
        return sendOK(res, logisticsReturn())
    } catch (e) {
        logger.info("logistics notify error", e.message)
    }
})