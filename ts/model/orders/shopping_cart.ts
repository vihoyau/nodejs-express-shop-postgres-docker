import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"

const modelName = "orders.shopping_cart"
export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        useruuid: DataTypes.UUID,
        gooduuid: DataTypes.UUID,
        number: DataTypes.INTEGER,
        property: DataTypes.CHAR(200),
        pic: DataTypes.CHAR(255),
        goodpoint: DataTypes.INTEGER,
        goodprice: DataTypes.INTEGER,
        stock: DataTypes.INTEGER,
        modified: DataTypes.TIME,
        created: DataTypes.TIME,
    }, {
            timestamps: false,
            schema: "orders",
            freezeTableName: true,
            tableName: "shopping_cart"
        })
}

/**
 * 查询购物车所有购物车信息
 */
export async function findByUseruuid(sequelize: Sequelize, useruuid: string, cursor: number, limit: number) {
    let res = await sequelize.query(`select d.*,s.* from orders.shopping_cart as s, mall.goods as d where s.gooduuid=d.uuid and d.state='onsale' and d.deleted=0 and s.useruuid='${useruuid}' order by s.created desc offset ${cursor} limit ${limit}`, { type: "select" }) as any[]
    return res
}

/**
 * 根据useruuid和gooduuid查询所对应的购物车表
 */
export async function findNumberByUseruuidGooduuid(useruuid: string, gooduuid: string, property: string) {
    let res = await getModel(modelName).findOne({ attributes: ["number"], where: { useruuid: useruuid, gooduuid: gooduuid, property: property } })
    return res ? res.get('number') : undefined
}

/**
 * 根据useruuid和gooduuid更新所对应的购物车的购买数量
 */
export async function updateByUseruuidAndGooduuid(useruuid: string, gooduuid: string, property: string, number: number) {
    let [numbe, res] = await getModel(modelName).update({ number: number }, { where: { useruuid: useruuid, gooduuid: gooduuid, property: property }, returning: true })
    return numbe > 0 ? res[0].get() : undefined
}

/**
 * 添加购物车商品信息
 */
export async function insertShoppingCart(useruuid: string, gooduuid: string, property: string, number: number, pic: string, goodpoint: number, goodprice: number, stock: number) {
    let res = await getModel(modelName).create({ useruuid: useruuid, gooduuid: gooduuid, property: property, number: number, pic: pic, goodpoint: goodpoint, goodprice: goodprice, stock: stock }, { returning: true })
    return res ? res.get() : undefined
}

/**
 * 根据主键修改购买的商品的数量
 */
export async function updateNumberByUuid(uuid: string, number: any) {
    let [numbe, res] = await getModel(modelName).update({ number: Sequelize.literal(`number+${number}`), }, { where: { uuid: uuid }, returning: true })
    return numbe > 0 ? res[0].get() : undefined
}

/**
 * 删除购物车中指定主键的商品
 */
export async function deleteByUuid(uuid: string) {
    return await getModel(modelName).destroy({ where: { uuid: uuid } })
}