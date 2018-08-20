import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"
import { findByName } from "../../model/system/system"
const modelName = "users.userprize"
export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        useruuid: DataTypes.UUID,//用户uuid
        username: DataTypes.CHAR(225),//用户名
        prizeuuid: DataTypes.UUID,//奖品uuid
        level: DataTypes.INTEGER,//奖品等级
        num: DataTypes.INTEGER,//获得奖品数量
        lotterytype: DataTypes.ENUM('pointlottery', 'cashlottery'),//奖励方式
        state: DataTypes.ENUM('true', 'false'),//奖品是否已经领取
        created: DataTypes.TIME,
        modified: DataTypes.TIME,
        eventname:DataTypes.TEXT        //活动名称
    }, {
            timestamps: false,
            schema: "users",
            freezeTableName: true,
            tableName: "userprize"
        })
}

/**
 * 创建奖品
 */
export async function insertUserprize(obj: any) {
    let res = await getModel(modelName).create(obj, { returning: true })
    return res ? res.get() : undefined
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
 * app端获得某个用户奖品列表
 */
export async function getUserprizes(sequelize: Sequelize, useruuid: string, ) {
    let res = await sequelize.query(`SELECT
	up.*,
    p.title,
    p.prize
FROM
	users.userprize AS up
LEFT JOIN mall.prize AS P ON up.prizeuuid = P .uuid
WHERE
up.useruuid ='${useruuid}'
ORDER BY
	up.created DESC`, { type: "select" }) as any[]
    return res
}
/**
 * 获得当前活动获奖用户列表
 */
export async function getUserprizeList(sequelize: Sequelize, cursor: number, limit: number, searchdata: string, state: string, lotterytype: string, receive: string) {
    let event = await findByName('eventname')//获得当前的活动名称记录
    let eventname = event.content.event

    let res = await sequelize.query(`SELECT
	up.uuid,
    up.username,
    up.level,
    up.state as receive,
    up.created,
    up.lotterytype,
    p.title,
    p.state
FROM
	users.userprize AS up
LEFT JOIN mall.prize AS p ON up.prizeuuid =p.uuid 
WHERE
    eventname = '${eventname}'
	and p.state like '%${state}%'
    and  up.state like '%${receive}%'
    and up.lotterytype like '%${lotterytype}%'
and(
	up.username LIKE '%${searchdata}%'
OR  p.title LIKE '%${searchdata}%'
)
ORDER BY
	
    up."created" DESC,
    up."level" ASC,
    up."username" ASC
    OFFSET ${cursor}
LIMIT ${limit}`, { type: "select" }) as any[]
    return res
}

/**
 * 获奖用户名单
 * @param sequelize
 * @param cursor
 * @param limit
 * @param searchdata
 * @param state
 */
export async function getLotteryUserprizes(sequelize: Sequelize, lotterytype: string) {
    let res = await sequelize.query(`SELECT
	*
FROM
	users.userprize AS up
LEFT JOIN mall.prize AS P ON up.prizeuuid = P .uuid
where up.lotterytype='${lotterytype}'
ORDER BY
	up.created DESC
LIMIT 10`, { type: "select" }) as any[]
    return res
}

/**
 * 获得奖品列表记录数
 */
export async function getCount(sequelize: Sequelize, searchdata: string, state: string, lotterytype: string, receive: string) {
    let event = await findByName('eventname')//获得当前的活动名称记录
    let eventname = event.content.event
    let res = await sequelize.query(`SELECT
	count(*)
FROM
	users.userprize AS up
LEFT JOIN mall.prize AS p ON up.prizeuuid = p.uuid
WHERE
    up.eventname = '${eventname}'
	and  p.state like '%${state}%'
    and  up.state like '%${receive}%'
    and up.lotterytype like '%${lotterytype}%'
and(
	up.username LIKE '%${searchdata}%'
OR p.title LIKE '%${searchdata}%'
)
`, { type: "select" }) as any[]
    return res[0].count
}

//查找mall.lotterylevel表中某奖品的记录
export async function find_prize_state(uuid:string) {
    let res = await getModel('mall.prize').findOne({where:{uuid:uuid}});
    return res ? res.get() : undefined
}


/**
 * 获得单个用户的获得单个奖品的数量
 * @param useruuid
 * @param prizeuuid
 */
export async function findPrizeCount(useruuid: string, prizeuuid: string,eventname:string) {
    let res = await getModel(modelName).count({ where: { useruuid: useruuid, prizeuuid: prizeuuid,eventname : eventname } })
    return res
}

/**
 * 修改奖品信息
 * @param userprize
 * @param uuid
 */
export async function updateUserprizeInfo(userprize: any, uuid: string) {
    let [number, res] = await getModel(modelName).update(userprize, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

/**
 * 修改奖品状态信息
 * @param uuid
 */
export async function updateUserprizeState(uuid: string) {
    let [number, res] = await getModel(modelName).update({ state: 'true' }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

/**
 * 删除奖品
 * @param uuid
 */
export async function deleteUserprize(uuid: string) {
    await getModel(modelName).destroy({ where: { uuid: uuid } })
}
