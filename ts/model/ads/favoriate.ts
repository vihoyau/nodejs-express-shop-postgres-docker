import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"

const modelName = "ads.favorite"
export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        useruuid: DataTypes.UUID,
        aduuid: DataTypes.UUID,
        created: DataTypes.TIME,
    }, {
            timestamps: false,
            schema: "ads",
            freezeTableName: true,
            tableName: "favorite",
        })
}

export async function getByUserAds(adsuuid: string, useruuid: string) {
    let res = await getModel(modelName).find({ where: { useruuid: useruuid, aduuid: adsuuid } })
    return res ? res.get() : undefined
}

export async function getAdsUuids(useruuid: string, cursor: number, limit: number) {
    let res = await getModel(modelName).findAll({ where: { useruuid: useruuid }, offset: cursor, limit: limit, order: [['created', 'DESC']] })
    return res.map(r => r.get())
}

export async function favoriateInsert(useruuid: string, adsuuid: string) {
    await getModel(modelName).create({ useruuid: useruuid, aduuid: adsuuid }, { returning: true })
}

export async function deleteByUserAds(adsuuid: string, useruuid: string) {
    return getModel(modelName).destroy({ where: { aduuid: adsuuid, useruuid: useruuid } })
}

//获取单个收藏记录数量
export async function getAdsfaorCount(useruuid: string) {
    let res = await getModel(modelName).count({ where: { useruuid: useruuid } })
    return res ? res : 0
}
