import * as logger from "winston"
import { getModel } from "../../lib/global"
import { DataTypes, Sequelize } from "sequelize"

const [schema, table] = ["users", "statistics"]
const modelName = `${schema}.${table}`

export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
        },
        ip: DataTypes.STRING,   //访客ip
        useruuid: DataTypes.UUID,
        loginnumber: DataTypes.INTEGER,
        searchnumber: DataTypes.INTEGER,
        favoritenumber: DataTypes.INTEGER,
        type: DataTypes.ENUM('ads', 'goods'),
        ext: DataTypes.JSONB,
        created: DataTypes.TIME
    }, {
            timestamps: false,
            schema: schema,
            freezeTableName: true,
            tableName: table,
        })
}

/**
 * 记录某个用户的登录次数，对商品或产品的搜索，收藏，奖励次数
 */
export async function insertStatistics(obj: any) {
    let res
    try {
        res = await getModel(modelName).create(obj)
    } catch (e) {
        logger.error("insertSmsCode error", e.message)
    }
    return res.get()
}

//会员访问统计的详情
export async function findByPrimary(uuid: string) {
    let res = await getModel(modelName).findByPrimary(uuid)
    return res ? res.get() : undefined
}

//按时间段查询会员访问统计列表
export async function findAllByTimeRange(sequelize: Sequelize, timeRange: any, cursor: number, limit: number) {
    let res = await sequelize.query(`SELECT	A.*,b.* FROM	users.users AS A
right JOIN (
	SELECT
		"sum" (s.loginnumber) loginnumber,
		"sum" (favoritenumber) favoritenumber,
		"sum" (searchnumber) searchnumber,
		useruuid,
        type
	FROM
		users."statistics" s
	where '`+ timeRange[0] + `'<  s.created and  '` + timeRange[1] + `'>  s.created
	GROUP BY
        type,
		useruuid
) AS b ON A .uuid = b.useruuid offset ${cursor} limit ${limit} `, { type: "select" }) as any[]
    return res
}

//按时间段查询会员访问统计列表数量
export async function findAllByTimeRangeCount(sequelize: Sequelize, timeRange: any) {
    let res = await sequelize.query(`SELECT count(*)	FROM	users.users AS A
right JOIN (
	SELECT
		"sum" (s.loginnumber) loginnumber,
		"sum" (favoritenumber) favoritenumber,
		"sum" (searchnumber) searchnumber,
		useruuid,
        type
	FROM
		users."statistics" s
	where '`+ timeRange[0] + `'<  s.created and  '` + timeRange[1] + `'>  s.created
	GROUP BY
        type,
		useruuid
) AS b ON A .uuid = b.useruuid`, { type: "select" }) as any[]
    return parseInt(res[0].count)
}

export async function findCountVisitorByTimeRange(sequelize: Sequelize, timeRange: any) {
    let res = await sequelize.query(`select count(*) from users.statistics s
    where '`+ timeRange[0] + `'<  s.created and  '` + timeRange[1] + `'>  s.created
    and s.ip is not null`, { type: "select" }) as any[]
    return res[0].count
}

export async function findAllVisitorByTimeRange(sequelize: Sequelize, timeRange: any, cursor: number, limit: number) {
    let res = await sequelize.query(`select * from users.statistics s
    where '`+ timeRange[0] + `'<  s.created and  '` + timeRange[1] + `'>  s.created
    and s.ip is not null order by s.created desc offset ${cursor} limit ${limit}`, { type: "select" }) as any[]
    return res
}

export async function getCountByUserAndTime(sequelize: Sequelize, useruuid: string, starttime: Date, endtime: Date) {
    let res = await sequelize.query(`
        select count(*) from users.statistics s
        where s.created > '${starttime.toLocaleString()}'
        and s.created < '${endtime.toLocaleString()}'
        and s.useruuid = '${useruuid}'
        and s.loginnumber = 1
    `, { type: "select" }) as any[]
    return parseInt(res[0].count)
}

export async function getLogsByUserAndTime(sequelize: Sequelize, useruuid: string, starttime: Date, endtime: Date,
    cursor: number, limit: number) {
    let res = await sequelize.query(`
        select * from users.statistics s
        where s.created > '${starttime.toLocaleString()}'
        and s.created < '${endtime.toLocaleString()}'
        and s.useruuid = '${useruuid}'
        and s.loginnumber = 1
        order by s.created desc
        offset ${cursor}
        limit ${limit}
        `, { type: "select" }) as any[]
    return res
}
