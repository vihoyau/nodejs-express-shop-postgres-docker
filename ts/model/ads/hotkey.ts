import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"

const modelName = "ads.searchkey"
export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        id: DataTypes.INTEGER,
        keyword: {
            type: DataTypes.CHAR(256),
            primaryKey: true,
        },
        times: DataTypes.INTEGER,
    }, {
            timestamps: false,
            schema: "ads",
            freezeTableName: true,
            tableName: "searchkey"
        })
}
export async function getKeywords(limit: number, keyword: string) {
    let res = await getModel(modelName).findAll({ where: { keyword: { $like: '%' + keyword + '%' } }, limit: limit, order: [['times', 'DESC']] })
    return res.map(r => r.get())
}

export async function getByKeywords(keyword: string) {
    let res = await getModel(modelName).findByPrimary(keyword)
    return res ? res.get() : undefined
}

export async function hotkeyInsert(keyword: string) {
    return await getModel(modelName).create({ keyword: keyword })
}

export async function update(id: string) {
    let [number] = await getModel(modelName).update({ times: Sequelize.literal(`times+${1}`) }, { where: { id: id }, })
    if (number === 0)
        throw new Error("updateViews error")
}

