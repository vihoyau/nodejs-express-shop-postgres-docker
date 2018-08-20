import * as logger from "winston"
import { getModel } from "../../lib/global"
import { DataTypes, Sequelize } from "sequelize"

const [schema, table] = ["users", "lotterylog"]
const modelName = `${schema}.${table}`

export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        useruuid: DataTypes.UUID,
        prizeinfo: DataTypes.JSONB,//奖品信息
        point: DataTypes.INTEGER,
        balance: DataTypes.INTEGER,
        created: DataTypes.TIME
    }, {
            timestamps: false,
            schema: schema,
            freezeTableName: true,
            tableName: table,
        })
}

//添加领奖记录
export async function insertLotterylog(obj: any) {
    try {
        await getModel(modelName).create(obj)
    } catch (e) {
        logger.error("insertLotterylog error", e.message)
    }
}