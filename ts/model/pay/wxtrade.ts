
import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"

const [schema, table] = ["pay", "wxtrade"]
const modelName = `${schema}.${table}`

export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        orderuuids: DataTypes.ARRAY(DataTypes.UUID),
        useruuid: DataTypes.UUID,
        out_trade_no: DataTypes.TEXT,
        openid: DataTypes.TEXT,
        prepay_id: DataTypes.TEXT,
        state: {
            type: DataTypes.ENUM,
            values: ["new", "fin", "abandon"]
        },
        appid: DataTypes.TEXT,
        mch_id: DataTypes.TEXT,
        body: DataTypes.TEXT,
        total_fee: DataTypes.INTEGER,
        spbill_create_ip: DataTypes.TEXT,
        trade_type: {
            type: DataTypes.ENUM,
            values: ["APP", "WEB", "NATIVE"]
        },
        ext: DataTypes.JSONB,
        status: DataTypes.INTEGER,
        created: DataTypes.TIME,
        modified: DataTypes.TIME,
    }, {
            timestamps: false,
            schema: schema,
            freezeTableName: true,
            tableName: table,
        })
}

export async function insertNewTrade(order: any) {
    let res = await getModel(modelName).create(order)
    return res ? res.get() : undefined
}

export async function findByTradeNo(tradeNo: string) {
    let res = await getModel(modelName).findOne({ where: { out_trade_no: tradeNo } })
    return res ? res.get() : undefined
}

export async function setWxTradeState(tradeNo: string, state: string) {
    await getModel(modelName).update({ state: state }, { where: { out_trade_no: tradeNo } })
}

export async function findByprimay(uuid: string) {
    let res = await getModel(modelName).findByPrimary(uuid)
    return res ? res.get() : undefined
}

export async function updateStatusByUUID(uuid: string, status: number) {
    let [num, res] = await getModel(modelName).update({ status }, { where: { uuid }, returning: true })
    return num > 0 ? res[0].get() : undefined
}
