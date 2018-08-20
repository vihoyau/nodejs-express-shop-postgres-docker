
import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"

const [schema, table] = ["pay", "alipay"]
const modelName = `${schema}.${table}`

export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        out_trade_no: {
            type: DataTypes.TEXT,
            primaryKey: true,
        },
        useruuid: DataTypes.UUID,
        orderuuids: DataTypes.ARRAY(DataTypes.UUID),
        state: {
            type: DataTypes.ENUM,
            values: ["new", "fin", "abandon"]
        },
        total_amount: DataTypes.FLOAT,
        created: DataTypes.TIME,
        modified: DataTypes.TIME,
    }, {
            timestamps: false,
            schema: schema,
            freezeTableName: true,
            tableName: table,
        })
}

export async function insertOne(obj: any) {
    let res = await getModel(modelName).create(obj)
    return res ? res.get() : undefined
}

export async function updateState(no: string, state: string) {
    let [num, res] = await getModel(modelName).update({ state }, { where: { out_trade_no: no }, returning: true })
    return num > 0 ? res[0].get() : undefined
}

export async function findByPrimary(out_trade_no: string) {
    let res = await getModel(modelName).findByPrimary(out_trade_no)
    return res ? res.get() : undefined
}
