import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"

const modelName = "mall.lotterylevel"
export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        level: DataTypes.INTEGER,//奖品等级
        prizeuuid: DataTypes.UUID,//奖品uuid数组
        num: DataTypes.INTEGER,//每个等级奖品数
        title: DataTypes.CHAR(225),
        state: DataTypes.ENUM('pointlottery', 'cashlottery'),//抽奖方式
        receive: DataTypes.ENUM('false', 'true'),//奖励是否已经领取
        awardnum: DataTypes.INTEGER,//奖励数量
        limitcount: DataTypes.INTEGER,//该等级单个用户最多可抽取次数
        created: DataTypes.TIME,
        modified: DataTypes.TIME
    }, {
            timestamps: false,
            schema: "mall",
            freezeTableName: true,
            tableName: "lotterylevel"
        })
}

/**
 * 创建奖品等级
 */
export async function insertLotterylevel(obj: any) {
    await getModel(modelName).create(obj, { returning: true })
}

/**
 * 获得奖品等级详情
 * @param uuid
 */
export async function findByPrimary(uuid: string) {
    let res = await getModel(modelName).findByPrimary(uuid)
    return res ? res.get() : undefined
}

/**
 * 获得奖品等级详情
 * @param uuid
 */
export async function findLotteryLevel(level: number, state: string) {
    let res = await getModel(modelName).findOne({ where: { level: level, state: state } })
    return res ? res.get() : undefined
}

/**
 * 根据等级抽奖类型获得奖品等级详情
 * @param uuid
 * @param state
 */
export async function findByLevel(sequelize: Sequelize, level: number, state: string) {
    let res = await sequelize.query(`select sum(num) from mall.lotterylevel where "level"=${level} and state='${state}'`, { type: "select" }) as any[]
    return res[0].sum
}

/**
 * 根据等级抽奖类型获得奖品等级详情
 * @param uuid
 * @param state
 */
export async function findnumcout(sequelize: Sequelize, level: number, state: string) {
    let res = await sequelize.query(`select sum(num) from mall.lotterylevel where "level"=${level} and state='${state}'`, { type: "select" })
    return res[0].sum
}

/**
 * 获得奖品等级列表
 */
export async function getLotterylevelList(cursor: number, limit: number, state: string) {
    state = '%' + state + '%'
    let res = await getModel(modelName).findAll({
        where: {
            state: { $like: state }
        },
        order: [['level', 'ASC'], ['modified', 'DESC']],
        limit: limit,
        offset: cursor
    })
    return res.map(r => r.get())
}

/**
 * 获得奖品等级列表记录数
 */
export async function getCount(state: string) {
    state = '%' + state + '%'
    let res = await getModel(modelName).count({
        where: {
            state: { $like: state }
        }
    })
    return res ? res : undefined
}

/**
 * 获得各个等级的奖励
 */
export async function getLotterylevel(state: string) {
    let res = await getModel(modelName).findAll({ where: { state: state }, order: [['level', 'asc']] })
    return res ? res.map(r => r.get()) : undefined
}

/**
 * 修改奖品等级信息
 * @param lotterylevel
 * @param uuid
 */
export async function updateLotterylevelInfo(lotterylevel: any, uuid: string) {
    let [number, res] = await getModel(modelName).update(lotterylevel, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

/**
 * 删除奖品等级
 * @param uuid
 */
export async function deleteLotterylevel(uuid: string) {
    await getModel(modelName).destroy({ where: { uuid: uuid } })
}

/**
 * 修改奖品状态
 * @param code
 * @param state
 */
export async function getLotterylevels(sequelize: Sequelize, code: number, state: string) {
    let res = await sequelize.query(`select * from mall.lotterylevel where level=${code} and state='${state}' and num >0`, { type: "select" }) as any[]
    let random = Math.floor((Math.random() * res.length))
    return res[random]
}

/**
 * 减少奖品数量
 * @param uuid
 */
export async function updateLotterylevelNum(uuid: string) {
    let [number, resp] = await getModel(modelName).update({ num: Sequelize.literal(`num-1`) }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? resp[0].get() : undefined
}