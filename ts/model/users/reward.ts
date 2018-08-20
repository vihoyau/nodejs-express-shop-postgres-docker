import * as logger from "winston"
import { getModel } from "../../lib/global"
import { DataTypes, Sequelize } from "sequelize"

const [schema, table] = ["users", "reward"]
const modelName = `${schema}.${table}`

export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
        },
        useruuid: DataTypes.UUID,
        username: DataTypes.CHAR(240),
        reaname: DataTypes.CHAR(240),
        point: DataTypes.INTEGER,
        balance: DataTypes.INTEGER,
        type: DataTypes.ENUM('register', 'answer'),
        ext: DataTypes.JSONB,
        created: DataTypes.TIME
    }, {
            timestamps: false,
            schema: schema,
            freezeTableName: true,
            tableName: table,
        })
}

export async function insertReward(obj: any) {
    try {
        await getModel(modelName).create(obj, { returning: true })
    } catch (e) {
        logger.error("insertSmsCode error", e.message)
    }
}

export async function getCount(obj: any) {
    let res = await getModel(modelName).count({ where: obj })
    return res
}

export async function getRewardByType(obj: any, cursor: number, limit: number) {
    let res = await getModel(modelName).findAll({ where: obj, offset: cursor, limit: limit })
    return res.map(r => r.get())
}

export async function getRewardByUser(obj: any, cursor: number, limit: number) {
    let res = await getModel(modelName).findAll({ where: obj, offset: cursor, limit: limit })
    return res.map(r => r.get())
}

export async function getUserAndlevels(sequelize: Sequelize, searchdata: string, cursor: number, limit: number, timeRange: any) {
    let res = await sequelize.query(`SELECT
	*
FROM
	users.users AS u
RIGHT JOIN (
	SELECT
		SUM (point) AS totalpoints,
		SUM (balance) AS totalbalance,
		useruuid,
		TYPE
	FROM
		users.reward AS r
	WHERE
		r.created >='`+ timeRange[0] + `'
        and
		r.created <='`+ timeRange[1] + `'
	GROUP BY
		useruuid,
		TYPE
) AS b ON u.uuid = b.useruuid and (u.username like '%${searchdata}%') order by u.created desc offset ${cursor} LIMIT ${limit}`, { type: "select" }) as any[]
    return res
}

export async function getUserAndlevelsCount(sequelize: Sequelize, searchdata: string, timeRange: any) {
    let res = await sequelize.query(`SELECT
	count(*)
FROM
	users.users AS u
RIGHT JOIN (
	SELECT
		SUM (point) AS totalpoint,
		SUM (balance) AS totalbalance,
		useruuid,
		TYPE
	FROM
		users.reward AS r
	WHERE
		r.created >='`+ timeRange[0] + `'
        and
		r.created <='`+ timeRange[1] + `'
	GROUP BY
		useruuid,
		TYPE
) AS b ON u.uuid = b.useruuid and (u.username like '%${searchdata}%')`, { type: "select" }) as any[]
    return parseInt(res[0].count)
}