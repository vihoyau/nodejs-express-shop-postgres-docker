import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"

const modelName = "mall.awardusers"
export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        useruuid: DataTypes.UUID,//用户id
        username: DataTypes.CHAR(225),//用户名
        level: DataTypes.INTEGER,//奖品等级
        state: DataTypes.ENUM('pointlottery', 'cashlottery'),//抽奖方式
        receive: DataTypes.ENUM('false', 'true'),//奖品是否被领取
        created: DataTypes.TIME,
        modified: DataTypes.TIME,
    }, {
            timestamps: false,
            schema: "mall",
            freezeTableName: true,
            tableName: "awardusers"
        })
}

/**
 * 设置一二等奖和黑名单人数
 */
export async function insertAwardusers(obj: any) {
    await getModel(modelName).create(obj, { returning: true })
}

/**
 * 获得设置的获奖人信息
 * @param uuid
 */
export async function findByPrimary(uuid: string) {
    let res = await getModel(modelName).findByPrimary(uuid)
    return res ? res.get() : undefined
}

/**
 * 根据用户id和抽奖类型获得抽奖用户
 * @param useruuid
 * @param state
 */
export async function findByLotterytype(useruuid: string, state: string) {
    let res = await getModel(modelName).findOne({ where: { useruuid: useruuid, state: state, } })
    return res ? res.get() : undefined
}

/**
 * 获得后台设置的获奖人信息
 */
export async function getAwardusersList(cursor: number, limit: number, searchdata: string, state: string, receive: string) {
    searchdata = '%' + searchdata + '%'
    state = '%' + state + '%'
    receive = '%' + receive + '%'
    let res = await getModel(modelName).findAll({
        where: {
                 $or: [{ username: { $like: searchdata } }] ,
                 receive: { $like: receive } ,
                 state: { $like: state } 

        },
        order: [['level', 'DESC'], ['created', 'DESC']],
        limit: limit,
        offset: cursor
    })
    return res ? res.map(r => r.get()) : undefined
}

/**
 * 获得后台设置的获奖人信息记录数
 */
export async function getCount(searchdata: string, state: string, receive: string) {
    searchdata = '%' + searchdata + '%'
    state = '%' + state + '%'
    receive = '%' + receive + '%'
    let res = await getModel(modelName).count({
        where: {
                $or: [{ username: { $like: searchdata } }] ,
                receive: { $like: receive } ,
                state: { $like: state }
             } 
    })
    return res
}

/**
 * 查找该等级设置的中奖用户的数量
 */
export async function findAwardusersByLevelCount(sequelize: Sequelize, level: number, state: string, receive: string) {
    let res = await sequelize.query(`select count(*) from  mall.awardusers  where "level"=${level} and "state"='${state}' and receive = '${receive}'`, { type: "select" }) as any
    return res[0].count
}

/**
 * 修改奖品获奖人或黑名单
 * @param awardusers
 * @param uuid
 */
export async function updateAwardusersInfo(awardusers: any, uuid: string) {
    let [number, res] = await getModel(modelName).update(awardusers, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

/**
 * 删除获奖人和黑名单
 * @param uuid
 */
export async function deleteAwardusers(uuid: string) {
    await getModel(modelName).destroy({ where: { uuid: uuid } })
}

/**
 * 根据useruuid查找设置的黑白名单用户
 * @param useruuid
 */
export async function findAwardusersByUseruuid(useruuid: string, state: string) {
    let res = await getModel(modelName).findOne({ where: { useruuid: useruuid, state: state } })
    return res ? res.get() : undefined
}

/**
 * 根据等级和奖励类型查找设置的黑白名单用户
 * @param useruuid
 */
export async function findAwardusersBylevelAndstate(sequelize: Sequelize, level: string, state: string) {
    let res = await sequelize.query(`select count(*) from mall.awardusers where "level"=${level} and state='${state}'`, { type: "select" }) as any[]
    return res[0].count
}

//设置每个用户的每次活动的每种类型的获奖奖品的最高上限 (现金：3次, 积分 ： 1次, 实物类： 1次, 优惠劵 ：1次)
export async function get_user_event_prizenum(sequelize: Sequelize,useruuid:string,state:string,eventname:string) {
    let res = await sequelize.query(`SELECT
count(p.state) as  prizenum
FROM
users.userprize AS up
LEFT JOIN mall.prize AS p ON up.prizeuuid = p.uuid
WHERE
up.useruuid = '${useruuid}'
and p.state = '${state}'
and up.eventname = '${eventname}'
 `, { type: "select" }) 
    return res
}