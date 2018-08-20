import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"

const modelName = "trend.reflect"
export const defineFunction = function (sequelize: Sequelize) {

    return sequelize.define(modelName, {
        uuid: { //举报uuid
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        useruuid: DataTypes.UUID,   //用户uuid
        trenduuid: DataTypes.UUID,  //动态uuid
        commentuuid: DataTypes.UUID, //评论uuid
        state: DataTypes.STRING,  // 受理状态 new,accepted
        reason: DataTypes.TEXT, //举报原因
        created: DataTypes.TIME,
        modified: DataTypes.TIME,
    }, {
            timestamps: false,
            schema: "trend",
            freezeTableName: true,
            tableName: "reflect",
        })
}

export async function insertReflect(obj: any) {
    let t = await getModel(modelName).create(obj, { returning: true })
    return t ? t.get() : undefined
}

export async function updateReflectState(uuid: string, state: string) {
    let [number, res] = await getModel(modelName).update({ state }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function findAllReflect(state: string, cursor: number, limit: number) {
    let res = await getModel(modelName).findAll({ where: { state }, offset: cursor, limit: limit })
    return res.map(r => r.get())
}

export async function getCount(state: string) {
    return await getModel(modelName).count({ where: { state } })
}

