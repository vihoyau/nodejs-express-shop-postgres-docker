import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"

const [schema, table] = ["pay", "paylog"]
const modelName = `${schema}.${table}`

export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        re_user_name: DataTypes.TEXT,
        amount: DataTypes.INTEGER,
        description: DataTypes.TEXT,
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

export async function createdPaylog(paylog: any) {
    return await getModel(modelName).create(paylog, { returning: true })
}

export async function getByUseruuid(useruuid: string) {
    let res = await getModel(modelName).findAll({ where: { useruuid: useruuid, created: { $gt: Sequelize.literal(`now() - interval '${7} day'`) as any } } })
    return res.map(r => r.get())
}