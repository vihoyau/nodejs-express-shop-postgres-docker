import { getModel } from "../../lib/global"
import { DataTypes, Sequelize } from "sequelize"

const [schema, table] = ["logistics", "logistics"]
const modelName = `${schema}.${table}`

export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid: {
            primaryKey: true,
            type: DataTypes.INTEGER,
            defaultValue: DataTypes.UUIDV4,
        },
        logisticscode: DataTypes.CHAR(64),
        ordercode: DataTypes.CHAR(64),
        shippercode: DataTypes.CHAR(64),
        traces: DataTypes.ARRAY(DataTypes.JSONB)
    }, {
            timestamps: false,
            schema: schema,
            freezeTableName: true,
            tableName: table,
        })
}

export async function insertLogistics(logistics: any) {
    return await getModel(modelName).insertOrUpdate(logistics)
}

export async function findByPrimary(uuid: string) {
    let res = await getModel(modelName).findByPrimary(uuid)
    return res ? res.get() : undefined
}

export async function updateTraces(shippercode: string, logisticscode: string, traces: string) {
    let [number, res] = await getModel(modelName).update({ traces: traces }, { where: { shippercode: shippercode, logisticscode: logisticscode }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function getByCode(shippercode: string, logisticscode: string) {
    let res = await getModel(modelName).findOne({ where: { shippercode: shippercode, logisticscode: logisticscode } })
    return res ? res.get() : undefined
}

export async function deleteLogistics(uuid: string) {
    return await getModel(modelName).destroy({ where: { uuid: uuid } })
}

export async function getByOrderCode(ordercode: string) {
    let res = await getModel(modelName).findOne({ where: { ordercode: ordercode } })
    return res ? res.get() : undefined
}

export async function getCount(sequelize: Sequelize, searchdata: string) {
    let ordercode = ' '
    if (searchdata.trim().length === 36 || searchdata.trim().length === 32) {
        ordercode = "or l.ordercode = '" + searchdata.trim() + "'"
    }
    let res = await sequelize.query(`select count(*) from users.users c, logistics.logistics l, orders.orders o ,logistics.shipper s where c.uuid=o.useruuid and l.ordercode=o.uuid and s.shippercode=l.shippercode and (l.logisticscode like '%${searchdata}%' or c.username  like '%${searchdata}%'  ${ordercode})`, { type: "select" }) as any[]
    return parseInt(res[0].count)
}

export async function getAll(sequelize: Sequelize, searchdata: string, cursor: number, limit: number) {
    let ordercode = ' '
    if (searchdata.trim().length === 36 || searchdata.trim().length === 32) {
        ordercode = "or l.ordercode = '" + searchdata.trim() + "'"
    }
    let res = await sequelize.query(`select l.uuid,l.logisticscode ,l.shippercode,s.shippername ,o.goods,c.username ,l.ordercode from users.users c, logistics.logistics l , orders.orders o ,logistics.shipper s where c.uuid=o.useruuid and l.ordercode=o.uuid and s.shippercode=l.shippercode and (l.logisticscode like '%${searchdata}%' or c.username  like '%${searchdata}%' ${ordercode}) order by o.created desc  offset ${cursor} LIMIT ${limit}`, { type: "select" }) as any[]
    return res
}