import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"
import logger = require("winston")


const [schema, table] = ["users", "users_ext"]
const modelName = `${schema}.${table}`

export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
        },
        openid: DataTypes.CHAR(64), //公众号的openid
        appopenid: DataTypes.CHAR(64),//app的openid
        qqcode: DataTypes.STRING,   //qq用户的唯一标识
        points: DataTypes.INTEGER,
        total_points: DataTypes.INTEGER,
        balance: DataTypes.INTEGER,
        total_balance: DataTypes.INTEGER,
        crm_balance: DataTypes.INTEGER,
        crm_total_balance: DataTypes.INTEGER,
        crm_points: DataTypes.INTEGER,  //app和crm积分分开
        crm_total_points: DataTypes.INTEGER,
        exp: DataTypes.INTEGER,
        views: DataTypes.INTEGER,//广告的浏览次数
        modified: DataTypes.TIME,
        margin : DataTypes.INTEGER,
        crm_balance_state: DataTypes.ARRAY(DataTypes.INTEGER)
    }, {
            timestamps: false,
            schema: schema,
            freezeTableName: true,
            tableName: table,
        })
}

export async function updatePoints(uuid: string, obj: { points: number, balance: number, exp: number }) {
    let [number] = await getModel(modelName).update({
        exp: Sequelize.literal(`exp+${obj.exp}`),
        points: Sequelize.literal(`points+${obj.points}`),
        balance: Sequelize.literal(`balance+${obj.balance}`),
        total_points: Sequelize.literal(`total_points+${obj.points}`),
        total_balance: Sequelize.literal(`total_balance+${obj.balance}`)
    }, { where: { uuid: uuid }, })
    logger.error(`用户${uuid}===>exp+${obj.exp}===>points+${obj.points}==>balance+${obj.balance}`)
    return number
}

//新添加
export async function updatebalance_and_total_balance(uuid: string, expenses: number) {
    let [number] = await getModel(modelName).update({
        crm_balance: Sequelize.literal(`crm_balance+${expenses * 100}`),
        crm_total_balance: Sequelize.literal(`crm_total_balance+${expenses * 100}`),
    }, { where: { uuid: uuid }, })
    logger.error(`用户${uuid}====>crm_balance+${expenses * 100}`)
    return number
}
//添加
export async function update_crm_total_balance(uuid: string, crm_balance: number) {
    let [number] = await getModel(modelName).update({
        crm_total_balance: Sequelize.literal(`crm_total_balance+${crm_balance}`),
    }, { where: { uuid: uuid }, })
    logger.error(`用户${uuid}====>crm_total_balance+${crm_balance}`)
    return number
}

export async function cut_crm_total_balance(uuid: string, crm_balance: number) {
    let [number] = await getModel(modelName).update({
        crm_total_balance: Sequelize.literal(`crm_total_balance-${crm_balance}`),
    }, { where: { uuid: uuid }, })
    return number
}

export async function recharge(uuid: string, moment: number) {
    let [number] = await getModel(modelName).update({
        balance: Sequelize.literal(`balance+${moment}`),
        total_balance: Sequelize.literal(`total_balance+${moment}`),
    }, { where: { uuid: uuid }, })
    logger.error(`用户${uuid}====>balance+${moment}`)
    return number
}

export async function exchange(uuid: string, obj: { points: number, balance: number }) {
    let [number] = await getModel(modelName).update({
        balance: Sequelize.literal(`balance-${obj.balance}`),
        points: Sequelize.literal(`points-${obj.points}`),
    }, { where: { uuid: uuid }, })
    logger.error(`用户${uuid}====>balance-${obj.balance}===>points-${obj.points}`)
    return number
}

export async function findByPrimary(uuid: string) {
    let user = await getModel(modelName).findByPrimary(uuid)
    return user ? user.get() : undefined
}

export async function updateOpenid(uuid: string, openid: string) {
    let [number, res] = await getModel(modelName).update({ openid: openid }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function updateAppOpenid(uuid: string, openid: string) {
    let [number, res] = await getModel(modelName).update({ appopenid: openid }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function updateQQcode(uuid: string, qqcode: string) {
    let [number, res] = await getModel(modelName).update({ qqcode: qqcode }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

//新添加  修改margin保证金字段的状态
export async function modifyMargin(uuid: string, margin: string) {
    let [number, res] = await getModel(modelName).update({ margin: margin + '00' },{ where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

//新添加  修改crm_balance总余额字段字段的状态
export async function modify_crm_balance(uuid: string, crm_balance: number) {
    let [number, res] = await getModel(modelName).update({
        crm_balance: Sequelize.literal(`crm_balance+${crm_balance}`)
    }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function cut_crm_balance(uuid: string, crm_balance: number) {
    let [number, res] = await getModel(modelName).update({
        crm_balance: Sequelize.literal(`crm_balance-${crm_balance}`)
    }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function modify_crm_point(uuid: string, crm_points: number) {
    let [num, res] = await getModel(modelName).update({
        crm_points: Sequelize.literal(`crm_points+${crm_points}`),
        crm_total_points: Sequelize.literal(`crm_total_points+${crm_points}`)
    }, { where: { uuid }, returning: true })
    return num > 0 ? res[0].get() : undefined
}

export async function cut_crm_point(uuid: string, crm_points: number) {
    let [num, res] = await getModel(modelName).update({
        crm_points: Sequelize.literal(`crm_points-${crm_points}`),
        crm_total_points: Sequelize.literal(`crm_total_points-${crm_points}`)
    }, { where: { uuid }, returning: true })
    return num > 0 ? res[0].get() : undefined
}

//新添加  修改crm_balance_state审核字段的状态
export async function modify_crm_balance_state(uuid: string, crm_balance_state: Array<number>) {
    let [number, res] = await getModel(modelName).update({ crm_balance_state: crm_balance_state },{ where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function updateexp(uuid: string, exp: number) {
    let [number, res] = await getModel(modelName).update({ exp: exp }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function addExp(uuid: string, exp: number) {
    let [number] = await getModel(modelName).update({
        exp: Sequelize.literal(`exp+${exp}`)
    }, { where: { uuid: uuid }, })
    logger.error(`用户${uuid}====>exp+${exp}`)
    return number
}

export async function delExp(uuids: string, exp: number) {
    let [number] = await getModel(modelName).update({
        exp: Sequelize.literal(`exp-${exp}`)
    }, { where: { uuid: uuids }, })
    logger.error(`用户${uuids}====>exp-${exp}`)
    return number
}

export async function findByOpenid(openid: string) {    //公众号的openid
    let user = await getModel(modelName).findAll({ where: { openid: openid } })
    return user.map(r => r.get())
}

export async function findByAppOpenid(openid: string) {//app的openid和公众号的openid不一致
    let user = await getModel(modelName).findAll({ where: { appopenid: openid } })
    return user.map(r => r.get())
}

export async function findByQQcode(qqcode: string) {
    let user = await getModel(modelName).findAll({ where: { qqcode: qqcode } })
    return user.map(r => r.get())
}

//得到user_ext表的信息表
export async function finduuid(uuid: string) {
    let res = await getModel(modelName).findOne({ where: { uuid: uuid } })
    return res ? res.get() : undefined
}


/**
 * 增加广告浏览次数
 */
export async function updateAdsViews(uuid: string, views: any) {
    let [number, res] = await getModel(modelName).update({ views: Sequelize.literal(`views+${views}`) }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

/**
 * 减少广告浏览次数
 * @param uuid
 * @param views
 */
export async function modifiedAdsViews(uuid: string, views: any) {
    let [number, res] = await getModel(modelName).update({ views: Sequelize.literal(`views-${views}`) }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}