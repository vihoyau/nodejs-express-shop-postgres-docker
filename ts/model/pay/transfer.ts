import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"

const [schema, table] = ["pay", "transfer"]
const modelName = `${schema}.${table}`

export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        mch_appid: DataTypes.TEXT,
        mchid: DataTypes.TEXT,
        partner_trade_no: DataTypes.TEXT,
        openid: DataTypes.TEXT,
        check_name: DataTypes.TEXT,
        re_user_name: DataTypes.TEXT,
        amount: DataTypes.INTEGER,
        description: DataTypes.TEXT,
        spbill_create_ip: DataTypes.TEXT,
        nonce_str: DataTypes.TEXT,
        state: {
            type: DataTypes.ENUM,
            values: ["new", "fin", "abandon"]
        },
        failcount: DataTypes.INTEGER,
        ext: DataTypes.JSONB,
        useruuid: DataTypes.UUID,
        created: DataTypes.TIME,
        modified: DataTypes.TIME,
    }, {
            timestamps: false,
            schema: schema,
            freezeTableName: true,
            tableName: table,
        })
}

export async function findByPartnerTradeNo(no: string) {
    let r = await getModel(modelName).findOne({ where: { partner_trade_no: no } })
    return r ? r.get() : undefined
}

export async function transterAmount(seqz: Sequelize, useruuid: string, transfer: any) {

    let amount = transfer.amount
    await seqz.transaction(async t => {
        let [number, res] = await getModel("users.users_ext").update({
            balance: Sequelize.literal(`balance-${amount}`)
        }, {
                where: { uuid: useruuid },
                returning: true,
                transaction: t
            })

        if (number === 0)
            throw new Error("用户不存在！")

        let ext = res[0]
        if (ext.get("balance") < 0)
            throw new Error("余额不足！")

        return getModel(modelName).create(transfer, { transaction: t })
    })
}

export async function findNewUUIDs(limit: number) {
    let res = await getModel(modelName).findAll({ where: { state: "new" }, attributes: ["uuid"], order: "created", limit: limit })
    return res.map(r => r.get("uuid"))
}

export async function setTransferState(uuid: string, ext: any, state: string) {
    let [num, res] = await getModel(modelName).update({ ext: ext, state: state }, { where: { uuid: uuid }, returning: true })
    return num > 0 ? res[0].get() : undefined
}

export async function setTransferStateAbandon(transfer: any, ext: any) {
    let amount = transfer.amount
    await getModel("users.users_ext").update({
        balance: Sequelize.literal(`balance+${amount}`)
    }, {
            where: { uuid: transfer.useruuid },
            returning: true,
        })
    await getModel(modelName).update({ ext: ext, state: "abandon" }, { where: { uuid: transfer.uuid } })
}

export async function findById(uuid: string) {
    let r = await getModel(modelName).findByPrimary(uuid)
    return r ? r.get() : undefined
}

export async function findStateByTradeNos(tradeNos: string) {
    let res = await getModel(modelName).findAll({
        where: { partner_trade_no: { $in: tradeNos } },
        attributes: ["partner_trade_no", "state"]
    })
    return res.map(r => r.get()) as { partner_trade_no: string, state: string }[]
}
