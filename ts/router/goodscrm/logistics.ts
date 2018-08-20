import { logistics, logisticsValitater } from "./validator"
import { validateCgi } from "../../lib/validator"
import { sendOK, sendError as se } from "../../lib/response"
import { checkLogin } from "../../redis/logindao"
import { createMessage } from "../../model/users/message"
import { Router, Request, Response, NextFunction } from "express"
import { updateLogistics, modifiedLogistics, findByPrimary as findOrder } from "../../model/orders/orders"
import { findByPrimary as findUser } from "../../model/users/users"
import { getByCode, insertLogistics, getByOrderCode, getAll, getCount, deleteLogistics, findByPrimary } from "../../model/logistics/logistics"
import { getShipper, getShipperName, getByShipperName } from "../../model/logistics/shippercode"
import { getOrderTracesByJson } from '../../lib/logistics'
export const router: Router = Router()

router.post('/logistics', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { shipperCode, logisticCode, orderCode } = (req as any).body
    try {
        validateCgi({ shipperCode, logisticCode, orderCode }, logistics.code)
        let result = await getOrderTracesByJson(shipperCode, logisticCode, orderCode)
        let lo = {
            logisticscode: logisticCode,
            shippercode: shipperCode,
            ordercode: orderCode
        }
        await insertLogistics(lo)
        await updateLogistics(logisticCode, shipperCode, orderCode)
        let order = await findOrder(orderCode)
        let users
        if (order) {
            users = await findUser(order.useruuid)
            let objc = {
                useruuid: users.uuid,
                username: users.username,
                content: '已交付物流，详情查看订单',
                state: 'send',
                orderuuid: orderCode,
                title: '物流注册消息'
            }
            await createMessage(objc)//发送消息
        }
        return sendOK(res, { result: result })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.delete('/:uuid', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let uuid = req.params["uuid"]
    try {
        validateCgi({ uuid }, logistics.UUID)
        let order = await findByPrimary(uuid)
        await deleteLogistics(uuid)
        await modifiedLogistics(null, null, order.uuid)
        return sendOK(res, { result: '删除成功！' })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.get('/shippercode', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    try {
        let result = await getShipper(req.app.locals.sequelize)
        return sendOK(res, { result: result })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.get('/bycode', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { shipperCode, logisticCode } = req.query
    try {
        validateCgi({ shipperCode, logisticCode }, logistics.twoCode)
        let result = await getByCode(shipperCode, logisticCode)
        return sendOK(res, { result: result })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.get('/ordercode', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { orderCode } = req.query
    try {
        validateCgi({ orderCode }, logistics.order)
        let result = await getByOrderCode(orderCode)
        return sendOK(res, { result: result })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.get('/shippercode', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { shipperName } = req.query
    try {
        validateCgi({ shipperName }, logistics.shippername)
        let result = await getByShipperName(shipperName)
        return sendOK(res, { result: result })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.get('/shippername', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { shipperCode } = req.query
    try {
        validateCgi({ shipperCode }, logistics.shipper)
        let result = await getShipperName(shipperCode)
        return sendOK(res, { result: result })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.get('/', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { start, length, draw, search } = req.query
    try {
        let searchdata = (search as any).value
        validateCgi({ start, length, searchdata }, logisticsValitater.pagination)
        let recordsFiltered = await getCount(req.app.locals.sequelize, searchdata)
        let result = await getAll(req.app.locals.sequelize, searchdata, parseInt(start), parseInt(length))
        return sendOK(res, { result: result, draw: draw, recordsFiltered: recordsFiltered })
    } catch (e) {
        e.info(se, res, e)
    }
})