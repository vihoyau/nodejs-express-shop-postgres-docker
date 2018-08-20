import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"

const modelName = "mall.favoriate"
export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        useruuid: DataTypes.UUID,
        gooduuid: DataTypes.UUID,
        created: DataTypes.TIME,
    }, {
            timestamps: false,
            schema: "mall",
            freezeTableName: true,
            tableName: "favoriate"
        })
}

/**
 * 收藏商品
 */
export async function insertFavoriate(useruuid: string, gooduuid: string) {
    let res = await getModel(modelName).create({ useruuid: useruuid, gooduuid: gooduuid }, { returning: true })
    return res ? res.get() : undefined
}

/**
 * 列表显示已收藏的商品
 * @param sequelize
 * @param useruuid
 * @param cursor
 * @param limit
 */
export async function getFavoriateByDeletedAndUseruuid(sequelize: Sequelize, useruuid: string, cursor: number, limit: number) {
    let res = await sequelize.query(`select * from mall.favoriate f ,mall.goods g where f.gooduuid=g.uuid and f.useruuid='${useruuid}' order by f.created desc offset ${cursor} limit ${limit}`, { type: "select" }) as any[]
    return res
}

/**
 * 取消收藏
 * @param uuid
 */
export async function deleteFavoriateByUuid(gooduuid: string, useruuid: string) {
    await getModel(modelName).destroy({ where: { gooduuid: gooduuid, useruuid: useruuid } })
}

/**
 * 查询收藏列表中的商品
 * @param gooduuid
 * @param useruuid
 */
export async function findFavoriateByUuid(gooduuid: string, useruuid: string) {
    let res = await getModel(modelName).findOne({ where: { gooduuid: gooduuid, useruuid: useruuid } })
    return res ? res.get() : undefined
}


//获取单个收藏记录数量
export async function getGoodsfavorCount(useruuid: string) {
    let res = await getModel(modelName).count({ where: { useruuid: useruuid } })
    return res ? res : 0
}