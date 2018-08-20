import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"

const modelName = "system.system"
export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        name: DataTypes.CHAR(50),
        content: DataTypes.JSONB,
        modified: DataTypes.TIME,
    }, {
            timestamps: false,
            schema: "system",
            freezeTableName: true,
            tableName: "system"
        })
}

export async function findByName(name: string) {
    let res = await getModel(modelName).findOne({ where: { name: name } })
    return res ? res.get() : undefined
}

export async function updateSystem(content: any, name: string) {
    let [number, res] = await getModel(modelName).update({ content: content }, { where: { name: name }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function insertSystem(content: any, name: string) {
    let res = await getModel(modelName).create({ content: content, name: name }, { returning: true })
    return res ? res.get() : undefined
}

