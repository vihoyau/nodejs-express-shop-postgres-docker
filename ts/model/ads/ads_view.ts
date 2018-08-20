import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"

const modelName = "ads.ads_view"
export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        useruuid: DataTypes.UUID,
        adsuuid: DataTypes.UUID,
        ext: DataTypes.JSONB,
        modified: DataTypes.TIME
    }, {
            timestamps: false,
            schema: "ads",
            freezeTableName: true,
            tableName: "ads_view",
        })
}

//添加广告浏览记录
export async function insertAdsView(obj: any) {
    let res = await getModel(modelName).insertOrUpdate(obj)
    return res ? res : undefined
}

//根据useruuid 和adsuuid 获取查询
export async function getAdsviewByuuid(useruuid: string, adsuuid: string) {
    let res = await getModel(modelName).findOne({ attributes: ['uuid'], where: { useruuid: useruuid, adsuuid: adsuuid } })
    return res ? res.get("uuid") : undefined
}

//删除单个浏览记录
export async function delelteAdsview(uuid: string) {
    return await getModel(modelName).destroy({ where: { uuid: uuid } })
}

//获取单个浏览记录数量
export async function getAdsviewCount(useruuid: string) {
    let res = await getModel(modelName).count({ where: { useruuid: useruuid } })
    return res ? res : 0
}

//删除用户的全部浏览记录
export async function deleteAllbyuseruuid(useruuid: string) {
    return await getModel(modelName).destroy({ where: { useruuid: useruuid } })
}

//查询用户的广告浏览记录
export async function findAll(sequelize: Sequelize, useruuid: string, cursor: number, limit: number) {
    let res = await sequelize.query(`SELECT
	v.*, A ."content",
	A .pics,
	A .created AS adscreated,
	A.title,
    A.hot,
	ae.views,
	ae.virtviews
FROM
	ads.ads_view AS v
LEFT JOIN ads.ads AS A ON v.adsuuid = A .uuid
LEFT JOIN ads.ads_ext as ae on A.uuid=ae.uuid
WHERE
	v.useruuid = '${useruuid}'
AND A . STATE = 'on'
 AND A .deleted = 0 offset ${cursor}  limit ${limit}`, { type: "select" }) as any[]
    return res
}