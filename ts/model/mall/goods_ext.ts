import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"

const modelName = "mall.goods_ext"
export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid: {                         // UUID
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        views: DataTypes.INTEGER,       // 浏览次数
        volume: DataTypes.INTEGER,      // 剩余数量
        sales: DataTypes.INTEGER        // 已售数量
    }, {
            timestamps: false,
            schema: "mall",
            freezeTableName: true,
            tableName: "goods_ext"
        })
}

// 热门商品列表
export async function findByViews(sequelize: Sequelize) {
    let res = await sequelize.query(`
        select * from mall.goods a
        left join mall.goods_ext b on a.uuid = b.uuid
        where a.state = 'onsale' and a.deleted = 0
        order by b.views
        limit 3`, { type: "select" }) as any[]
    return res
}

export async function orderBySales(seque: Sequelize, cursor: number, limit: number, category: string) {
    let res = await seque.query(
        `select * from mall.goods a
        left join mall.goods_ext b on a.uuid = b.uuid
        where a.state = 'onsale' and a.deleted = 0
        and  a.category ='${category}'
        order by b.sales desc
        offset ${cursor} limit ${limit}`, { type: "SELECT" }) as any[]
    return res
}

export async function orderBySubCategoryCSales(seque: Sequelize, cursor: number, limit: number, subcategory: string) {
    let res = await seque.query(
        `select * from mall.goods a
        left join mall.goods_ext b on a.uuid = b.uuid
        where a.state = 'onsale' and a.deleted = 0
        and  a.subcategory ='${subcategory}'
        order by b.sales desc
        offset ${cursor} limit ${limit}`, { type: "SELECT" }) as any[]
    return res
}

export async function findByKeywordSales(keyword: string, seque: Sequelize, cursor: number, limit: number) {
    let res = await seque.query(
        `select * from mall.goods a
        left join mall.goods_ext b on a.uuid = b.uuid
        where a.state = 'onsale' and a.deleted = 0
        and  (a.keyword like '%${keyword}%' or a.title like '%${keyword}%')
        order by b.sales desc
        offset ${cursor} limit ${limit}`, { type: "SELECT" }) as any[]
    return res
}
export async function updateViews(uuid: string) {
    let [number] = await getModel(modelName).update({
        exp: Sequelize.literal(`views+1`)
    }, { where: { uuid: uuid }, returning: true })

    return number
}

export async function updateOnsales(uuid: string, sales: number) {
    let [number] = await getModel(modelName).update({
        exp: Sequelize.literal(`sales+${sales}`)
    }, { where: { uuid: uuid }, returning: true })
    return number
}