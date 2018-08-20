import { findAll, updateLogistics, findByState, deleteOrder, getOrderCount, findOrders, updateState, insertOrder, getCount, findByWaitSend } from "../../model/orders/orders"
import { findByState as findByStateAndDeleted } from "../../model/mall/goods"
import { finduserslevel } from "../../model/users/users"
import { checkLogin, LoginInfo } from "../../redis/logindao"
import { validateCgi } from "../../lib/validator"
import { ordersValidator } from "./validator"
import { timestamps } from "../../config/winston"
import { sendOK, sendError as se, sendNoPerm } from "../../lib/response"
import { Router, Request, Response, NextFunction } from "express"
export const router = Router()

router.put('/:uuid', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { logisticscode, shippercode } = (req as any).body
    const uuid = req.params["uuid"]
    try {
        const loginInfo: LoginInfo = (req as any).loginInfo
        validateCgi({ logisticscode, shippercode, uuid }, ordersValidator.logisticsCode)
        if (loginInfo.isAdminRO || loginInfo.isAdsRW || loginInfo.isAdsRO)
            return sendNoPerm(res)
        let orders = await updateLogistics(logisticscode, shippercode, uuid)
        return sendOK(res, orders)
    } catch (e) {
        e.info(se, res, e)
    }
})

router.patch('/:uuid', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { state } = (req as any).body
    const uuid = req.params["uuid"]
    try {
        const loginInfo: LoginInfo = (req as any).loginInfo
        if (loginInfo.isAdminRO || loginInfo.isAdsRW || loginInfo.isAdsRO)
            return sendNoPerm(res)
        validateCgi({ state, uuid }, ordersValidator.stateUuid)
        let orders = await updateState(state, uuid)
        return sendOK(res, orders)
    } catch (e) {
        e.info(se, res, e)
    }
})

router.get('/', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { start, length, draw, search, state } = req.query
    try {
        let searchdata = (search as any).value as string
        validateCgi({ start, length, searchdata, state }, ordersValidator.pagination)
        let obj = {
            searchdata: searchdata,
            state: state
        }

        /* switch (searchdata) {
            case "待支付":
                obj = {
                    state: "wait-pay"
                }
                break;
            case "待发货":
                obj = {
                    state: "wait-send"
                }
                break;
            case "待收货":
                obj = {
                    state: "wait-recv"
                }
                break;
            case "待评论":
                obj = {
                    state: "wait-comment"
                }
                break;
            case "待审核":
                obj = {
                    state: "wait-ack"
                }
                break;
            case "已取消":
                obj = {
                    state: "cancel",
                }
                break;
            case "完成":
                obj = {
                    state: "finish"
                }
                break;
            default:
                if (searchdata.length === 36 || searchdata.length === 32) {
                    obj = {
                        uuid: searchdata
                    }
                } else {
                    obj = {
                        other: searchdata
                    }
                }
                break;
        } */


        let recordsFiltered = await getOrderCount(req.app.locals.sequelize, obj)
        let orders = await findAll(req.app.locals.sequelize, obj, parseInt(start), parseInt(length))
        orders.forEach(r => {
            r.real_fee = r.real_fee / 100
            r.total_fee = r.total_fee / 100
            r.created = timestamps(r.created)
            r.modified = timestamps(r.modified)
        })
        return sendOK(res, { orders, draw, recordsFiltered })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.get('/state', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { state, start, length, draw } = req.query
    try {
        validateCgi({ start, length, searchdata: undefined }, ordersValidator.pagination)
        let recordsFiltered = await getCount({ state: state })
        let orders = await findByState(state, parseInt(start), parseInt(length))
        return sendOK(res, { orders: orders, draw: draw, recordsFiltered: recordsFiltered })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.get("/waitSend", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { start, length, draw } = req.query
    try {
        validateCgi({ start, length, searchdata: undefined }, ordersValidator.pagination)
        let recordsFiltered = await getCount({ state: 'wait-send' })
        let order = await findByWaitSend(parseInt(start), parseInt(length))
        return sendOK(res, { ordrer: order, draw: draw, recordsFiltered: recordsFiltered })

    } catch (e) {
        e.info(se, res, e)
    }
})

router.get('/:uuid', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const uuid = req.params["uuid"]
    try {
        validateCgi({ uuid }, ordersValidator.UUID)
        let orders = await findOrders(req.app.locals.sequelize, uuid)
        let userLevel
        if (orders && orders.useruuid) {
            userLevel = await finduserslevel(req.app.locals.sequelize, orders.useruuid)
        }
        orders.real_fee = orders.real_fee / 100
        orders.total_fee = orders.total_fee / 100
        orders.created = timestamps(orders.created)
        orders.modified = timestamps(orders.modified)
        return sendOK(res, { orders: orders, discount: userLevel.discount ? userLevel.discount : 100 })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.post('/', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { goods, total_fee, real_fee, fee_info, address, message, state } = (req as any).body
    try {
        const loginInfo: LoginInfo = (req as any).loginInfo
        let obj = {
            useruuid: loginInfo.getUuid(),
            goods: JSON.parse(goods),
            total_fee: total_fee * 100,
            real_fee: real_fee * 100,
            fee_info: JSON.parse(fee_info),
            address: JSON.parse(address),
            message: message,
            state: state
        }
        validateCgi(obj, ordersValidator.orderinfoValidator)
        let good = JSON.parse(goods)
        for (let i = 0; i < good.length; i++) {
            //判断商品是否已下线
            let orders = await findByStateAndDeleted(good[i].gooduuid)
            if (!orders)
                return sendOK(res, { msg: "商品已删除或已下架" })
        }
        let orders = await insertOrder(obj)
        return sendOK(res, orders)
    } catch (e) {
        e.info(se, res, e)
    }
})

router.delete('/:uuid', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const uuid = req.params["uuid"]
    try {
        validateCgi({ uuid: uuid }, ordersValidator.UUID)
        await deleteOrder(uuid)
        return sendOK(res, "删除订单成功！")
    } catch (e) {
        e.info(se, res, e)
    }
})