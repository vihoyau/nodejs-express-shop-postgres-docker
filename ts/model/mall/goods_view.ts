import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"

const modelName = "mall.goods_view"
export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        useruuid: DataTypes.UUID,
        gooduuid: DataTypes.UUID,
        num: DataTypes.INTEGER,
        ext: DataTypes.JSONB,
        modified: DataTypes.TIME
    }, {
            timestamps: false,
            schema: "mall",
            freezeTableName: true,
            tableName: "goods_view",
        })
}

//添加商品浏览记录
export async function insertGoodsView(obj: any) {
    let res = await getModel(modelName).create(obj)
    return res ? res : undefined
}

export async function updateGoodsView(uuid: string) {
    let res = await getModel(modelName).update({ num: Sequelize.literal(`num+${1}`) }, { where: { uuid: uuid }, returning: true })
    return res ? res : undefined
}


//根据useruuid 和 gooduuid 获取查询
export async function getGoodsviewByuuid(useruuid: string, gooduuid: string) {
    let res = await getModel(modelName).findOne({ attributes: ['uuid'], where: { useruuid: useruuid, gooduuid: gooduuid } })
    return res ? res.get("uuid") : undefined
}

//删除单个浏览记录
export async function delelteGoodsview(uuid: string) {
    return await getModel(modelName).destroy({ where: { uuid: uuid } })
}

//删除用户的全部浏览记录
export async function deleteAllbyuseruuid(useruuid: string) {
    return await getModel(modelName).destroy({ where: { useruuid: useruuid } })
}

//查询用户的浏览记录
export async function findAll(sequelize: Sequelize, useruuid: string, cursor: number, limit: number) {
    // let res = await getModel(modelName).findAll({ where: { useruuid: useruuid }, offset: cursor, limit: limit })
    let res = await sequelize.query(`select v.*,g.title,g.realprice,g.price,g.points, g.pics,g.created as goodscreated from mall.goods_view as v left join mall.goods as g on v.gooduuid =g.uuid where v.useruuid ='${useruuid}' and g.state='onsale' and g.deleted=0 offset ${cursor}  limit ${limit}`, { type: "select" }) as any[]
    return res
}

//获取单个收藏记录数量
export async function getGoodsviesrCount(useruuid: string) {
    let res = await getModel(modelName).count({ where: { useruuid: useruuid } })
    return res ? res : 0
}