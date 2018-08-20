import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"

const modelName = "ads.ads_ext"
export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid: {
            type: DataTypes.UUID,
            primaryKey: true,
        },
        views: DataTypes.INTEGER,
        view: DataTypes.INTEGER,//记录免费抽奖
        clicknumber: DataTypes.INTEGER,
        virtviews: DataTypes.INTEGER
    }, {
            timestamps: false,
            schema: "ads",
            freezeTableName: true,
            tableName: "ads_ext",
        })
}

export async function updateViews(uuid: string) {
    let [number, res] = await getModel(modelName).update({
        views: Sequelize.literal(`views+${1}`), view: Sequelize.literal(`view+${1}`), virtviews: Sequelize.literal(`virtviews+${1}`)
    }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function updateView(uuid: string, view: number) {
    let [number, res] = await getModel(modelName).update({
        view: Sequelize.literal(`view-${view}`)
    }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function upateVirtviews(uuid: string, virtviews: number) {
    let [number, res] = await getModel(modelName).update({ virtviews: virtviews }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function updateNumber(uuid: string) {
    let [number, res] = await getModel(modelName).update({
        clicknumber: Sequelize.literal(`clicknumber+${1}`),
    }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function findByPrimary(uuid: string) {
    let res = await getModel(modelName).findByPrimary(uuid)
    return res ? res.get() : undefined
}
export async function getview(){
    let res = await getModel(modelName).findAll();
    return res.map(r => r.get());
}