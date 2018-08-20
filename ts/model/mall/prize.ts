import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"

const modelName = "mall.prize"
export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        prize: DataTypes.JSONB,//奖品
        title: DataTypes.CHAR(225),//标题
        state: DataTypes.ENUM('goods', 'coupon', 'point', 'balance'),//奖品类型
        created: DataTypes.TIME,
        modified: DataTypes.TIME,
    }, {
            timestamps: false,
            schema: "mall",
            freezeTableName: true,
            tableName: "prize"
        })
}

/**
 * 创建奖品
 */
export async function insertPrize(obj: any) {
    await getModel(modelName).create(obj, { returning: true })
}

/**
 * 获得奖品详情
 * @param uuid
 */
export async function findByPrimary(uuid: string) {
    let res = await getModel(modelName).findByPrimary(uuid)
    return res ? res.get() : undefined
}

/**
 * 获得奖品详情
 * @param uuid
 */
export async function findAllPrize() {
    let res = await getModel(modelName).findAll({ where: { state: "goods" } })
    return res ? res.map(r => r.get()) : undefined
}

/**
 * 获得奖品列表
 */
export async function getPrizeList(cursor: number, limit: number, searchdata: string, state: any) {
    state = "%" + state + "%"
    searchdata = "%" + searchdata + "%"
    let res = await getModel(modelName).findAll({
        where: {
            $or: { title: { $like: searchdata } },
            state: { $like: state }
        },
        order: [['created', 'DESC']],
        limit: limit,
        offset: cursor
    })
    return res.map(r => r.get())
}

/**
 * 获得奖品列表记录数
 */
export async function getCount(searchdata: string, state: any) {
    state = "%" + state + "%"
    searchdata = "%" + searchdata + "%"
    let res = await getModel(modelName).count({
        where: {
            $or: { title: { $like: searchdata } },
            state: { $like: state }
        }
    })
    return res ? res : undefined
}

/**
 * 修改奖品信息
 * @param Prize
 * @param uuid
 */
export async function updatePrizeInfo(prize: any, uuid: string) {
    let [number, res] = await getModel(modelName).update(prize, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

/**
 * 删除奖品
 * @param uuid
 */
export async function deletePrize(sequelize: Sequelize, uuid: string) {
    return await sequelize.transaction(async t => {
        await getModel(modelName).destroy({ where: { uuid: uuid }, transaction: t })
        await getModel("users.userprize").destroy({ where: { prizeuuid: uuid }, transaction: t })
        await getModel("mall.lotterylevel").destroy({ where: { prizeuuid: uuid }, transaction: t })
    })
}
