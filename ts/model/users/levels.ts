import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"

const modelName = "users.levels"

export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
        },
        levels: DataTypes.CHAR(20),
        fromexp: DataTypes.RANGE,
        discount: DataTypes.INTEGER,
        modified: DataTypes.TIME,
    }, {
            timestamps: false,
            schema: "users",
            freezeTableName: true,
            tableName: "levels",
        })
}

export async function createLevels(obj: any) {
    let res = await getModel(modelName).create(obj)
    return res.get()
}

export async function deleteLevels(uuid: string) {
    await getModel(modelName).destroy({ where: { uuid: uuid } })
}

export async function updateLevels(uuid: string, obj: any) {
    let [number, res] = await getModel(modelName).update(obj, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function findByid(uuid: string) {
    let res = await getModel(modelName).findByPrimary(uuid)
    return res.get()
}

export async function getCount(obj: any) {
    let res = await getModel(modelName).count({ where: obj })
    return res
}

export async function findAll(obj: any, cursor: number, limit: number) {
    let res = await getModel(modelName).findAll({ where: obj, order: [["levels", "asc"]], offset: cursor, limit: limit })
    return res.map(r => r.get())
}

export async function findAlllevels(cursor: number, limit: number) {
    let res = await getModel(modelName).findAll({ order: [["levels", "asc"]], offset: cursor, limit: limit })
    return res.map(r => r.get())
}

export async function findByExp(exp: number) {
    let res = await getModel(modelName).findOne({ where: { fromexp: { $containsin: exp } } })
    return res.get()
}

export async function getMaxExp(sequelize: Sequelize) {
    let res = await sequelize.query(`select "max"(upper(l.fromexp) )from users.levels l`, { type: "select" }) as any[]
    return res
}