import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"

const modelName = "orders.orders"
export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        useruuid: DataTypes.UUID,
        goods: DataTypes.ARRAY(DataTypes.JSONB),
        total_fee: DataTypes.INTEGER,
        real_fee: DataTypes.INTEGER,
        fee_info: DataTypes.JSONB,
        address: DataTypes.JSONB,
        message: DataTypes.TEXT,
        state: DataTypes.ENUM('wait-pay', 'wait-send', 'wait-recv', 'wait-comment', 'wait-ack', 'cancel', 'finish'),
        fee_type: DataTypes.ENUM('wait-pay', 'wxpay', 'alipay', 'pointpay', 'balancepay', 'cardpay'),//支付方式
        logisticscode: DataTypes.CHAR(64),
        shippingcode: DataTypes.CHAR(64),
        postage: DataTypes.INTEGER,
        businessmen: DataTypes.CHAR(30),
        goodpoint: DataTypes.INTEGER,
        couponuuid: DataTypes.UUID,//优惠券uuid
        prize: DataTypes.CHAR(50),//奖品
        modified: DataTypes.TIME,
        created: DataTypes.TIME,
    }, {
            timestamps: false,
            schema: "orders",
            freezeTableName: true,
            tableName: "orders"
        })
}

export async function findByUseruuid(useruuid: string, cursor: number, limit: number) {
    let res = await getModel(modelName).findAll({
        where: { useruuid: useruuid },
        offset: cursor,
        limit: limit,
        order: [['created', 'desc']]
    })
    return res.map(r => r.get())
}

//支付方式
export async function modifiedFeeType(fee_type: string, uuid: string) {
    let [number, res] = await getModel(modelName).update({ fee_type: fee_type }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

//积分支付方式
export async function modifiedBalancepay(fee_type: string, uuid: string) {
    let [number, res] = await getModel(modelName).update({ fee_type: fee_type }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}
//积分支付方式
export async function modifiedPointpay(fee_type: string, uuid: string) {
    let [number, res] = await getModel(modelName).update({ fee_type: fee_type }, { where: { uuid: uuid, real_fee: 0, postage: 0 }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function findAll(seque: Sequelize, obj: any, cursor: number, limit: number) {
    let uuid
    if (obj.searchdata.length == 32 || obj.searchdata.length == 36)
        uuid = `or o.uuid='${obj.searchdata}'`
    else
        uuid = ''
    let res = await seque.query(`select o.*,u.username from orders.orders o left join users.users u on o.useruuid =u.uuid where 1=1 and o.state like '%${obj.state}%' and (u.username like '%${obj.searchdata}%' ${uuid})  order by o.created desc offset ${cursor}  limit ${limit} `, { type: "select" }) as any[]
    return res
}

export async function getOrderCount(seque: Sequelize, obj: any) {
    let uuid
    if (obj.searchdata.length == 32 || obj.searchdata.length == 36)
        uuid = `or o.uuid='${obj.searchdata}'`
    else
        uuid = ''
    let res = await seque.query(`select count(*) from orders.orders o left join users.users u on o.useruuid =u.uuid where 1=1 and o.state like '%${obj.state}%' and (u.username like '%${obj.searchdata}%' ${uuid})`, { type: "select" }) as any[]
    return res[0].count
}

export async function getCount(obj: any) {
    let res = await getModel(modelName).count({ where: obj })
    return res
}
//查询优惠券uuid
export async function searchgoodsuuid(uuid:any) {
    let res = await getModel(modelName).findByPrimary(uuid)
    return res ? res.get() : undefined
}
//查询用户积分
export async function searchPointNumber(uuid:any) {
    let res = await getModel("users.users_ext").findByPrimary(uuid)
    return res ? res.get() : undefined
}
//查询汇率
export async function searchdeduction(uuid:any) {
    let res = await getModel("mall.deduction").findByPrimary(uuid)
    return res ? res.get() : undefined
}
export async function insertOrder(obj: any) {
    let res = await getModel(modelName).create(obj, { returning: true })
    return res ? res.get() : undefined
}
//查询商品属性
export async function seachGoodsProperty(uuid:any) {
    let res = await getModel("mall.goods").findByPrimary(uuid)
    return res ? res.get() : undefined
}
//保存优惠券
export async function inserordercouponuuid(usercouponuuid:any,ordersuuid:any) {
    let res = await getModel(modelName).update({ usergoodsuuid: usercouponuuid }, { where: { uuid: ordersuuid }, returning: true })
    return res
}
//保存抵扣金币
export async function inserpoint(deductionpoint:any,ordersuuid:any) {
    let res = await getModel("orders.orders").update({ deductionpoint }, { where: { uuid: ordersuuid }, returning: true })
    return res
}
export async function updateState(state: string, uuid: string) {
    let [number, res] = await getModel(modelName).update({ state: state }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function updateLogistics(logisticscode: string, shippingcode: string, uuid: string) {
    let [number, res] = await getModel(modelName).update(
        { logisticscode: logisticscode, shippingcode: shippingcode, state: 'wait-recv' },
        { where: { uuid: uuid }, returning: true }
    )
    return number > 0 ? res[0].get() : undefined
}

export async function modifiedLogistics(logisticscode: string, shippingcode: string, uuid: string) {
    let [number, res] = await getModel(modelName).update({ logisticscode: logisticscode, shippingcode: shippingcode, state: 'wait-send' }, { where: { uuid: uuid } })
    return number > 0 ? res[0].get() : undefined
}

export async function findByUserState(useruuid: string, state: string, cursor: number, limit: number) {
    let res = await getModel(modelName).findAll({
        where: { useruuid: useruuid, state: state },
        offset: cursor,
        limit: limit,
        order: [['created', 'desc']]
    })
    return res.map(r => r.get())
}

export async function findByWaitSend(cursor: number, limit: number) {
    let res = await getModel(modelName).findAll({ where: { state: 'wait-send' }, offset: cursor, limit: limit, order: [["created", "desc"]] })
    return res.map(r => r.get())
}

export async function findByState(state: string, cursor: number, limit: number) {
    let res = await getModel(modelName).findAll({
        where: { state: state },
        offset: cursor,
        limit: limit,
        order: [['created', 'desc']]
    })
    return res.map(r => r.get())
}

export async function findByPrimary(uuid: string) {
    let res = await getModel(modelName).findByPrimary(uuid)
    return res ? res.get() : undefined
}

export async function findOrders(seque: Sequelize, uuid: string) {
    let res = await seque.query(`select o.*,u.username,s.shippername from orders.orders as o LEFT JOIN users.users as u on o.useruuid=u.uuid left join logistics.shipper as s on s.shippercode=o.shippingcode where o.uuid='${uuid}'`, { type: "select" }) as any[]
    return res ? res[0] : undefined
}

export async function findWaitPay(time: number) {
    let res = await getModel(modelName).findAll({ where: { state: "wait-pay", created: { $lt: Sequelize.literal(`now() - interval '${time} hour'`) as any } } })
    return res.map(r => r.get())
}

export async function updateWaitPay(time: number, state: string) {
    let [number, res] = await getModel(modelName).update({ state: state }, { where: { state: "wait-pay", created: { $lt: Sequelize.literal(`now() - interval '${time} hour'`) as any} }, returning: true })
    return number > 0 ? res.map(r => r.get()) : undefined
}

export async function updateWaitRecv(time: number, state: string) {
    let [number, res] = await getModel(modelName).update({ state: state }, { where: { state: "wait-recv", created: { $lt: Sequelize.literal(`now() - interval '${time} day'`) as any} }, returning: true })
    return number > 0 ? res.map(r => r.get()) : undefined
}

export async function updateWaitComment(time: number, state: string) {
    let [number, res] = await getModel(modelName).update({ state: state }, { where: { state: "wait-comment", created: { $lt: Sequelize.literal(`now() - interval '${time} day'`) as any} }, returning: true })
    return number > 0 ? res.map(r => r.get()) : undefined
}

export async function deleteOrder(uuid: string) {
    return await getModel(modelName).destroy({ where: { uuid: uuid } })
}

/**
 * 将下单的商品按商家分类
 * @param goods
 */
export async function AutomaticSeparation(goods: any) {
    let array: any[] = []
    let businessmens: any[] = []
    let goodss: any[] = []
    for (let a = 0; a < goods.length; a++) {//遍历所有下单的商品
        if (businessmens.length === 0 || goods[a].businessmen === null) {//第一个商品默认为第一个商家
            businessmens = []
            businessmens.push(goods[a])//第一个商家
            array.push(businessmens)
            goodss.push(goods[a].businessmen)
        } else {
            for (let b = 0; b < array.length; b++) {//遍历每个商家
                if (array[b][0].businessmen === goods[a].businessmen && goods[a].businessmen != null) {//判断购买的商品是否已经分配到商家中
                    businessmens = array[b]
                    businessmens.push(goods[a])
                    array[b] = businessmens
                }
            }
            let index = goodss.indexOf(goods[a].businessmen)//判断商家是否存在
            if (index === -1) {
                businessmens = []
                businessmens.push(goods[a])
                array.push(businessmens)
                goodss.push(goods[a].businessmen)
            }
        }
    }
    return array
}
