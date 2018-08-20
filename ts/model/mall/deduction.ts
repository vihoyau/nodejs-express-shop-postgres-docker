import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"

const [schema, table] = ["mall", "deduction"]
const modelName = `${schema}.${table}`

export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
        },
        exchange: DataTypes.INTEGER,
        deductiontext: DataTypes.CHAR(128),
        usenumber: DataTypes.CHAR(128),
    }, {
            timestamps: false,
            schema: schema,
            freezeTableName: true,
            tableName: table,
        })
}

export async function inserdeduction(exchange:any,deductiontext:any,usenumber:any,uuid:any) {
    let res = await getModel(modelName).update({exchange,deductiontext,usenumber},{ where: {uuid}})
    return res 
}

export async function searchdeduction(uuid:any) {
    let res = await getModel(modelName).findByPrimary(uuid)
    return res 
}