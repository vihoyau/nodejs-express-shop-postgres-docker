import * as logger from "winston"
import { getModel } from "../../lib/global"
import { DataTypes, Sequelize } from "sequelize"

const [schema, table] = ["users", "smscode"]
const modelName = `${schema}.${table}`

export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        id: {
            primaryKey: true,
            type: DataTypes.INTEGER,
            autoIncrement: true
        },
        username: DataTypes.CHAR(64),
        ext: DataTypes.JSONB,
        created: DataTypes.TIME
    }, {
            timestamps: false,
            schema: schema,
            freezeTableName: true,
            tableName: table,
        })
}

export async function insertSmsCode(username: string, obj: { code: string, [field: string]: any }) {
    try {
        await getModel(modelName).create({ username: username, ext: obj })
    } catch (e) {
        logger.error("insertSmsCode error", e.message)
    }
}