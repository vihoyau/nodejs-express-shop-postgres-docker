import {
    findByUseruuid, insertOrder, updateState, modifiedPointpay, AutomaticSeparation
    , findByUserState, findByPrimary, modifiedFeeType, deleteOrder
    , inserordercouponuuid, searchPointNumber, searchdeduction, inserpoint, seachGoodsProperty
} from "../../model/orders/orders"
import { findByState as findByStateAndDeleted, updateNumber, findByPrimary as findgood } from "../../model/mall/goods"
import { deleteByUuid } from "../../model/orders/shopping_cart"
import { findByPrimary as findUser, finduserslevel } from "../../model/users/users"
import { exchange } from "../../model/users/users_ext"
import { createMessage } from "../../model/users/message"
import { updateCouponState, findCouponByUsercouponuuid, getusercouponuuid } from "../../model/users/usercoupon"
import { addExp } from "../../model/users/users_ext"
import { getByCode } from "../../model/logistics/logistics"
import { deletemessage } from "../../model/users/message"
import { checkAppLogin } from "../../redis/logindao"
import { LoginInfo } from "../../redis/logindao"
import { validateCgi } from "../../lib/validator"
import { findByName } from "../../model/system/system"
import { addPointAndCashlottery } from "../../model/users/users"
// import { updatePrizeInfo, findAllPrize } from "../../model/mall/prize"
import { shoppingCartValidator, ordersValidator } from "./validator"
import { sendOK, sendError as se, sendNotFound, sendErrMsg } from "../../lib/response"
import { Router, Request, Response, NextFunction } from "express"
import { getPageCount } from "../../lib/utils"
export const router = Router()

router.get('/', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { page, count } = req.query
    try {
        validateCgi({ page: page, count: count }, shoppingCartValidator.pageAndCount)
        const loginInfo: LoginInfo = (req as any).loginInfo
        let { cursor, limit } = getPageCount(page, count)
        let orders = await findByUseruuid(loginInfo.getUuid(), cursor, limit)
        orders.forEach(r => {
            r.total_fee = r.total_fee / 100
            r.real_fee = r.real_fee / 100
        })
        return sendOK(res, orders)
    } catch (e) {
        e.info(se, res, e)
    }
})

export async function comparepro(arr: any, str: Array<string>, num: number) {
    for (let j = 0; j < arr.length; j++) {
        for (let i = 0; i < str.length; i++) {
            if (arr[j].type === str[i]) {
                if (arr[j].data) {
                    arr[j].data = await comparepro(arr[j].data, str, num)
                    return arr
                } else {
                    if (parseInt(arr[j].stock) < num) {
                        return undefined
                    }
                    console.log("arr[j].stockarr[j].stockarr[j].stock" + arr[j].stock)
                    if (arr[j].stock)
                        arr[j].stock = parseInt(arr[j].stock) - num + ""
                    return arr
                }
            }
        }
    }
}
//查询商品的属性
router.get('/checkgoods', async function (req: Request, res: Response, next: NextFunction) {
    let { goodsuuid } = req.query
    if (Object.prototype.toString.apply(goodsuuid) === "[object Array]") {
        for (let i = 0; i < goodsuuid.length; i++) {
            let goodpro = await seachGoodsProperty(goodsuuid[i])
            if (goodpro.deduction === "off") {
                return sendOK(res, { goodsdeduction: "off" })
            }
        }
    } else {
        let goodpro = await seachGoodsProperty(goodsuuid)
        if (goodpro.deduction === "off") {
            return sendOK(res, { goodsdeduction: "off" })
        }
    }
    return sendOK(res, { goodsdeduction: "on" })
})
//查询积分及计算付款金额
router.post('/checkpoint', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const info: LoginInfo = (req as any).loginInfo
    let useruuid = info.getUuid()
    let { coupons, goods } = (req as any).body
    let array = await AutomaticSeparation(goods)
    // coupons = JSON.parse(coupons)
    try {
        const loginInfo: LoginInfo = (req as any).loginInfo
        let userLevel = await finduserslevel(req.app.locals.sequelize, loginInfo.getUuid())
        let real_feeuse = 0
        //判断积分数量
        let userpoint = await searchPointNumber(useruuid)
        let points = userpoint.points
        //抵扣汇率deduction
        let deductionuuid = "0c163e52-f26d-4d77-ae71-dd3ae8184333"
        let deduction = await searchdeduction(deductionuuid)
        let deductiontext = deduction.deductiontext
        let exchage = deduction.exchange
        let usenumber = deduction.usenumber
        //可用整数人民币
        let rmbdeduction = Math.floor(points / exchage)
        let real_use
        let total_fee = 0
        let postageall = 0
        for (let i = 0; i < array.length; i++) {//遍历每个商家
            let total_fee1 = 0
            let real_fee1 = 0
            let goodpoint = 0
            for (let j = 0; j < array[i].length; j++) {//遍历每个商家下的每个商品
                if (array[i][j].number < 1 || array[i][j].goodprice < 0 || array[i][j].goodpoint < 0) {
                    return sendErrMsg(res, "商品价格或数量有误", 500)
                }
                real_fee1 += array[i][j].goodprice * 100 * array[i][j].number
                total_fee1 += array[i][j].goodprice * 100 * array[i][j].number
                goodpoint += array[i][j].goodpoint * 100 * array[i][j].number
            }
			if(!goodpoint){   }
            let usercouponuuid: any
            let couponuuid: any
            let usercoupon: any
            if (coupons && coupons.length > 0) {
                couponuuid = await usedCoupon(coupons, array[i])//获得在该商家使用的优惠券
                if (couponuuid) {
                    usercoupon = await getusercouponuuid(couponuuid, useruuid)
                    usercouponuuid = usercoupon.uuid
                }
            }
            let real_fee = Math.round(real_fee1 * (userLevel.discount ? userLevel.discount : 100) / 100)
            if (usercouponuuid) {
                let coupon = await findCouponByUsercouponuuid(usercouponuuid)
                switch (coupon.coupontype) {
                    case 'discount':
                        //如果是折扣券，先用折扣券打折后再会员打折
                        real_fee = Math.round(real_fee1 * (coupon.content.discount / 100) * (userLevel.discount ? userLevel.discount : 100) / 100)
                        break;
                    case 'fulldown':
                        //如果是满减券，先用减去优惠后再会员打折
                        real_fee = Math.round((real_fee1 - (coupon.content.condition * 100)) * (userLevel.discount ? userLevel.discount : 100) / 100)
                        break;
                    case 'cash':
                        //如果是现金券，先用减去优惠后再会员打折
                        real_fee = Math.round((real_fee1 - (coupon.content.cash * 100)) * (userLevel.discount ? userLevel.discount : 100) / 100)
                        break;
                    default:
                        break
                }
            }
            real_feeuse += real_fee
            total_fee += total_fee1
            postageall += array[i][0].postage * 100
        }
        let usermb = 0
        if (points === 0) {
            real_use = real_feeuse
            return sendOK(res, { deductionpoint: 0, real_use, points, real_fee: real_feeuse, total_fee1: total_fee/100, deductiontext, usenumber, usermb: 0 })
        } else {
            //最高抵扣50%,rmbdeduction为返回抵扣的价格，real_use抵扣后的价格，real_fee未抵扣的价格，points积分
            let maxfee = Math.floor(real_feeuse * 0.5)
            if (rmbdeduction <= maxfee / 100) {
                real_use = (real_feeuse - rmbdeduction * 100 + postageall) / 100
                let real_feeall = (real_feeuse + postageall) / 100
                usermb = rmbdeduction
                return sendOK(res, { deductionpoint: rmbdeduction * exchage, real_use, real_fee: real_feeall, points, total_fee1: total_fee/100, deductiontext, usenumber, usermb })
            } else {
                maxfee=(Math.floor(maxfee/100))*100
                real_use = (real_feeuse - maxfee + postageall) / 100
                let deductpoint = maxfee 
                let real_feeall = (real_feeuse + postageall) / 100
                usermb = maxfee/exchage
                return sendOK(res, { deductionpoint: deductpoint, real_use, points, real_fee: real_feeall, total_fee1: total_fee/100, deductiontext, usenumber, usermb })
            }
        }
    } catch (e) {
        return e
    }
})
//生成抵扣金币订单
router.post('/deduction', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { fee_info, address, message, cartuuid } = (req as any).body
    let state = 'wait-pay'
    //最后的价格
    let { goods, coupons, deductionpoint } = (req as any).body
    let everypoint = 0
    coupons = JSON.parse(coupons)
    let orderArr: any[] = []
    goods = JSON.parse(goods)
    let array = await AutomaticSeparation(goods)
    try {
        const loginInfo: LoginInfo = (req as any).loginInfo
        let userLevel = await finduserslevel(req.app.locals.sequelize, loginInfo.getUuid())
        for (let i = 0; i < array.length; i++) {//遍历每个商家
            everypoint = Math.round(deductionpoint / (array.length))
            let total_fee1 = 0
            let real_fee1 = 0
            let goodpoint = 0
            for (let j = 0; j < array[i].length; j++) {//遍历每个商家下的每个商品
                if (array[i][j].number < 1 || array[i][j].goodprice < 0 || array[i][j].goodpoint < 0) {
                    return sendErrMsg(res, "商品价格或数量有误", 500)
                }
                real_fee1 += array[i][j].goodprice * 100 * array[i][j].number
                total_fee1 += array[i][j].goodprice * 100 * array[i][j].number
                goodpoint += array[i][j].goodpoint * array[i][j].number
            }
	    if(!goodpoint){}
            let usercouponuuid = await usedCoupon(coupons, array[i])//获得在该商家使用的优惠券
            let real_fee = Math.round(real_fee1 * (userLevel.discount ? userLevel.discount : 100) / 100)
            if (usercouponuuid) {
                //  await updateCouponState(usercouponuuid, 'used')//修改优惠券为已使用
                //**************************************************计算实际价格****************************************************** */
                let coupon = await findCouponByUsercouponuuid(usercouponuuid)
                switch (coupon.coupontype) {
                    case 'discount':
                        //如果是折扣券，先用折扣券打折后再会员打折
                        real_fee = Math.round(real_fee1 * (coupon.content.discount / 100) * (userLevel.discount ? userLevel.discount : 100) / 100)
                        break;
                    case 'fulldown':
                        //如果是满减券，先用减去优惠后再会员打折
                        real_fee = Math.round((real_fee1 - (coupon.content.condition * 100)) * (userLevel.discount ? userLevel.discount : 100) / 100)
                        break;
                    case 'cash':
                        //如果是现金券，先用减去优惠后再会员打折
                        real_fee = Math.round((real_fee1 - (coupon.content.cash * 100)) * (userLevel.discount ? userLevel.discount : 100) / 100)
                        break;
                    default:
                        break
                }
                //***************************************************************************************************************** */
            }
            real_fee = real_fee / 100
            //抵扣汇率deduction
            let deductionuuid = "0c163e52-f26d-4d77-ae71-dd3ae8184333"
            let deduction = await searchdeduction(deductionuuid)
            let exchage = deduction.exchange
            real_fee = (real_fee - everypoint / exchage) * 100
            let obj = {
                useruuid: loginInfo.getUuid(),
                goods: array[i],
                total_fee: Math.round(total_fee1),
                real_fee: real_fee,
                fee_info: JSON.parse(fee_info),
                address: JSON.parse(address),
                message: message,
                goodpoint: everypoint,
                postage: array[i][0].postage * 100,
                businessmen: array[i][0].businessmen,
                state: state
            }
            if (cartuuid != 'undefined') {
                let cartUuids = JSON.parse(cartuuid)
                for (let i = 0; i < cartUuids.length; i++) {
                    //清空购物车表
                    await deleteByUuid(cartUuids[i])
                }
            }
            if (array[i]) {
                let good = array[i]
                for (let i = 0; i < good.length; i++) {
                    //判断商品是否已下线
                    let goods = await findByStateAndDeleted(good[i].gooduuid)
                    let newpropertySet = good[i].property.split(",")
                    if (good[i].tags) {
                        let arr = await comparepro(good[i].tags, newpropertySet, good[i].number)
                        if (!arr) {
                            return sendNotFound(res, "商品已售完！！")
                        }
                        for (let i = 0; i < arr.length; i++) {
                            if (newpropertySet.length > 1 && !arr[i].data) {
                                return sendNotFound(res, "商品已售完！！")
                            }
                        }
                        await updateNumber(arr, good[i].gooduuid)
                    }
                    if (!goods)
                        return sendNotFound(res, good[i].title + "已删除或已下架")
                }
            } else {
                return sendNotFound(res, "商品已售完！！")
            }
            let orders = await insertOrder(obj)
            let ordersuuid = orders.uuid
            //保存优惠券id
            await inserordercouponuuid(usercouponuuid, ordersuuid)
            //保存金币
            await inserpoint(deductionpoint, ordersuuid)
            orders.total_fee = orders.total_fee / 100
            orders.real_fee = orders.real_fee / 100
            let users = await findUser(loginInfo.getUuid())
            let objc = {
                useruuid: users.uuid,
                username: users.username,
                content: '商家已接单！',
                state: 'send',
                orderuuid: orders.uuid,
                title: '订单消息'
            }
            await createMessage(objc)//发送消息
            orderArr.push(orders)
        }
        return sendOK(res, orderArr)
    } catch (e) {
        e.info(se, res, e)
    }
})
//生成订单
router.post('/', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { fee_info, address, message, cartuuid } = (req as any).body
    let state = 'wait-pay'
    let { goods, coupons } = (req as any).body
    coupons = JSON.parse(coupons)
    let orderArr: any[] = []
    goods = JSON.parse(goods)
    let array = await AutomaticSeparation(goods)
    try {
        const loginInfo: LoginInfo = (req as any).loginInfo
        let userLevel = await finduserslevel(req.app.locals.sequelize, loginInfo.getUuid())
        for (let i = 0; i < array.length; i++) {//遍历每个商家
            let total_fee1 = 0
            let real_fee1 = 0
            let goodpoint = 0
            for (let j = 0; j < array[i].length; j++) {//遍历每个商家下的每个商品
                if (array[i][j].number < 1 || array[i][j].goodprice < 0 || array[i][j].goodpoint < 0) {
                    return sendErrMsg(res, "商品价格或数量有误", 500)
                }
                real_fee1 += array[i][j].goodprice * 100 * array[i][j].number
                total_fee1 += array[i][j].goodprice * 100 * array[i][j].number
                goodpoint += array[i][j].goodpoint * array[i][j].number
            }
            let usercouponuuid = await usedCoupon(coupons, [i])//获得在该商家使用的优惠券
            let real_fee = Math.round(real_fee1 * (userLevel.discount ? userLevel.discount : 100) / 100)
            if (usercouponuuid) {
                //  await updateCouponState(usercouponuuid, 'used')//修改优惠券为已使用
                //**************************************************计算实际价格****************************************************** */
                let coupon = await findCouponByUsercouponuuid(usercouponuuid)
                switch (coupon.coupontype) {
                    case 'discount':
                        //如果是折扣券，先用折扣券打折后再会员打折
                        real_fee = Math.round(real_fee1 * (coupon.content.discount / 100) * (userLevel.discount ? userLevel.discount : 100) / 100)
                        break;
                    case 'fulldown':
                        //如果是满减券，先用减去优惠后再会员打折
                        real_fee = Math.round((real_fee1 - (coupon.content.condition * 100)) * (userLevel.discount ? userLevel.discount : 100) / 100)
                        break;
                    case 'cash':
                        //如果是现金券，先用减去优惠后再会员打折
                        real_fee = Math.round((real_fee1 - (coupon.content.cash * 100)) * (userLevel.discount ? userLevel.discount : 100) / 100)
                        break;
                    default:
                        break
                }
                //***************************************************************************************************************** */
            }

            let obj = {
                useruuid: loginInfo.getUuid(),
                goods: array[i],
                //total_fee: Math.round((total_fee1 +  (array[i][0].postage * 100)) * ((userLevel && userLevel.discount) ? userLevel.discount : 100) / 100),
                total_fee: Math.round(total_fee1),
                // real_fee: Math.round(real_fee1 * (userLevel.discount ? userLevel.discount : 100) / 100),
                real_fee: real_fee,
                fee_info: JSON.parse(fee_info),
                address: JSON.parse(address),
                message: message,
                goodpoint: Math.round(goodpoint/* + array[i][0].postage * 10*/),
                postage: array[i][0].postage * 100,
                businessmen: array[i][0].businessmen,
                state: state
            }
            if (cartuuid != 'undefined') {
                let cartUuids = JSON.parse(cartuuid)
                for (let i = 0; i < cartUuids.length; i++) {
                    //清空购物车表
                    await deleteByUuid(cartUuids[i])
                }
            }
            if (array[i]) {
                let good = array[i]
                for (let i = 0; i < good.length; i++) {
                    //判断商品是否已下线
                    let goods = await findByStateAndDeleted(good[i].gooduuid)
                    let newpropertySet = good[i].property.split(",")
                    if (good[i].tags) {
                        let arr = await comparepro(good[i].tags, newpropertySet, good[i].number)
                        if (!arr) {
                            return sendNotFound(res, "商品已售完！！")
                        }
                        for (let i = 0; i < arr.length; i++) {
                            if (newpropertySet.length > 1 && !arr[i].data) {
                                return sendNotFound(res, "商品已售完！！")
                            }
                        }
                        await updateNumber(arr, good[i].gooduuid)
                    }
                    if (!goods)
                        return sendNotFound(res, good[i].title + "已删除或已下架")
                }
            } else {
                return sendNotFound(res, "商品已售完！！")
            }
            let orders = await insertOrder(obj)
            let ordersuuid = orders.uuid
            //保存优惠券id
            await inserordercouponuuid(usercouponuuid, ordersuuid)
            orders.total_fee = orders.total_fee / 100
            orders.real_fee = orders.real_fee / 100
            let users = await findUser(loginInfo.getUuid())
            let objc = {
                useruuid: users.uuid,
                username: users.username,
                content: '商家已接单！',
                state: 'send',
                orderuuid: orders.uuid,
                title: '订单消息'
            }
            await createMessage(objc)//发送消息
            orderArr.push(orders)
        }
        return sendOK(res, orderArr)
    } catch (e) {
        e.info(se, res, e)
    }
})

//修改订单状态，支付方式
router.put('/:uuid', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { state, fee_type } = (req as any).body
    const uuid = req.params["uuid"]
    try {
        const loginInfo: LoginInfo = (req as any).loginInfo
        validateCgi({ state: state, uuid: uuid }, shoppingCartValidator.uuid)
        let orders = await updateState(state, uuid)
        //*****************订单完成****************** */
        if (state === 'finish') {
            let users = await findUser(orders.useruuid)
            let objc = {
                useruuid: users.uuid,
                username: users.username,
                content: '订单已完成！',
                state: 'send',
                orderuuid: uuid,
                title: '物流注册消息'
            }
            await createMessage(objc)//发送消息
        }
        //*****************订单待发货********************* */
        if (state === 'wait-send') {
            await addExp(loginInfo.getUuid(), orders.fee_info.paypoint)
        }
        //**********************订单已付款************************ */
        if (fee_type === "wxpay" || fee_type === "alipay" || fee_type === "cardpay") {
            orders = await modifiedFeeType(fee_type, uuid)
        }
        return sendOK(res, orders)
    } catch (e) {
        e.info(se, res, e)
    }
})

//微信支付和阿里支付的回调（修改支付类型，改变发货状态）；这个接口之前的外部接口，现在改成内部接口 by qizhibiao
export async function updateOrderState(orderuuids: any, fee_type: any, useruuid: any) {
    try {
        const uuids = orderuuids
        validateCgi({ fee_type: fee_type }, ordersValidator.fee_type)
        let ordersTotal_fee = 0
        let ordersgoodpoint = 0
        for (let i = 0; i < orderuuids.length; i++) {
            // 校验订单号
            let order = await findByPrimary(orderuuids[i])
            if (!order)
                return "不存在订单！"
            ordersTotal_fee += order.real_fee + order.postage
            ordersgoodpoint += order.goodpoint
            let usergoodsuuid = order.usergoodsuuid
            if (usergoodsuuid) {
                await updateCouponState(usergoodsuuid, 'used')//修改优惠券为已使用
            }
        }
        await exchange(useruuid, { points: ordersgoodpoint, balance: 0 })//减积分
        for (let i = 0; i < uuids.length; i++) {
            validateCgi({ uuid: uuids[i] }, shoppingCartValidator.uuid)
            //*****************订单完成****************** */
            let order = await findByPrimary(uuids[i])
            ordersTotal_fee += order.real_fee + order.postage
            //**********************订单已付款************************ */
            if (fee_type === "wxpay" || fee_type === "alipay" || fee_type === "cardpay") {
                if (order.real_fee === 0 && order.postage === 0) {
                    await modifiedPointpay("pointpay", orderuuids[i])//积分支付方式
                } else {
                    await modifiedFeeType(fee_type, uuids[i])//其他支付模式
                }
            }
            await updateState("wait-send", uuids[i])//修改状态为待发货
            //await addExp(loginInfo.getUuid(), uuids[i].fee_info.paypoint)//??????????????????????
            let users = await findUser(order.useruuid)
            let objc = {
                useruuid: users.uuid,
                username: users.username,
                content: '付款成功，正在为您火速发货中^_^。',
                state: 'send',
                orderuuid: uuids[i],
                title: '订单消息'
            }
            await createMessage(objc)//发送消息
        }

        let system = await findByName('numcondition')
        if (ordersTotal_fee >= parseInt(system.content.minorder)) {
            await addPointAndCashlottery(useruuid, 1, 0)//增加免费抽奖机会
        }
        return "状态修改成功！"
    } catch (e) {
        return e
    }
}

router.get('/state', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { state, page, count } = req.query
    try {
        validateCgi({ page: page, count: count }, shoppingCartValidator.pageAndCount)
        const loginInfo: LoginInfo = (req as any).loginInfo
        let { cursor, limit } = getPageCount(page, count)
        let orders = await findByUserState(loginInfo.getUuid(), state, cursor, limit)
        orders.forEach(r => {
            r.total_fee = r.total_fee / 100
            r.real_fee = r.real_fee / 100
        })
        return sendOK(res, orders)
    } catch (e) {
        e.info(se, res, e)
    }
})

router.get('/:uuid', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const uuid = req.params["uuid"]
    try {
        validateCgi({ uuid: uuid }, shoppingCartValidator.uuid)
        let orders = await findByPrimary(uuid)
        let users
        let logistics
        if (orders) {
            orders.total_fee = orders.total_fee / 100
            orders.real_fee = orders.real_fee / 100

            users = await findUser(orders.useruuid)
            if (orders.shippercode && orders.logisticscode) {
                logistics = await getByCode(orders.shippercode, orders.logisticscode)
            }
        }
        return sendOK(res, { orders: orders, users: users, logistics: logistics })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.delete('/:uuid', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const uuid = req.params["uuid"]
    try {
        validateCgi({ uuid: uuid }, shoppingCartValidator.uuid)
        let order = await findByPrimary(uuid)
        if (order.state === "wait-pay") {
            let good = order.goods
            if (good) {
                for (let i = 0; i < good.length; i++) {
                    //判断商品是否已下线
                    let newpropertySet = good[i].property.split(",")
                    let goods = await findgood(good[i].gooduuid)
                    if (goods.tags) {
                        let arr = await restoregoodsnum(goods.tags, newpropertySet, good[i].number)
                        await updateNumber(arr, goods.uuid)
                    }
                }
            }
        }

        await deletemessage(uuid)
        await deleteOrder(uuid)
        return sendOK(res, { order: order })
    } catch (e) {
        e.info(se, res, e)
    }
})

async function restoregoodsnum(arr: any, str: Array<string>, num: number) {
    for (let j = 0; j < arr.length; j++) {
        for (let i = 0; i < str.length; i++) {
            if (arr[j].type === str[i]) {
                if (arr[j].data) {
                    arr[j].data = await restoregoodsnum(arr[j].data, str, num)
                    return arr
                } else {
                    if (arr[j].stock)
                        arr[j].stock = parseInt(arr[j].stock) + num + ""
                    return arr
                }
            }
        }
    }
}

/**
 * 找到在该商家使用的优惠券
 * @param coupons
 * @param businessmen
 */
async function usedCoupon(coupons: any[], businessmen: any[]) {
    if (coupons != []) {
        for (let k = 0; k < coupons.length; k++) {//
            if (coupons[k].business === businessmen[0].businessmen) {
                return coupons[k].uuid
            }
        }
    } else {
        return null

    }
}
