import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"

const modelName = "mall.consult"
export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        content: DataTypes.ARRAY(DataTypes.JSONB),
        goodsuuid: DataTypes.UUID,
        useruuid: DataTypes.UUID,
        state: DataTypes.ENUM("new", "reply"),
        modified: DataTypes.TIME,
        created: DataTypes.TIME,
    }, {
            timestamps: false,
            schema: "mall",
            freezeTableName: true,
            tableName: "consult"
        })
}

/**
 * 添加
 */
export async function insertConsult(content: any, goodsuuid: string, useruuid: string, state: string) {
    let res = await getModel(modelName).create({ content: content, goodsuuid: goodsuuid, useruuid: useruuid, state: state })
    return res ? res : undefined
}

/**
 * 更新
 */
export async function updateConsult(content: any, goodsuuid: string, useruuid: string, state: string) {
    let [number, res] = await getModel(modelName).update({ content: content, state: state }, { where: { goodsuuid: goodsuuid, useruuid: useruuid }, returning: true })
    return number ? res[0].get() : undefined
}

export async function updateConsultByUuid(content: any, uuid: string, state: string) {
    let [number, res] = await getModel(modelName).update({ content: content, state: state }, { where: { uuid: uuid }, returning: true })
    return number ? res[0].get() : undefined
}

/**
 * 对客户咨询进行列表显示
 */
export async function listConsult(sequelize: Sequelize, goodsuuid: string) {
    let res = await sequelize.query(`select c.*,u.nickname from mall.consult c left join users.users u on c.useruuid=u.uuid where goodsuuid= '${goodsuuid}'`, { type: "select" }) as any[]
    return res
}

export async function findByPrimary(sequelize: Sequelize, uuid: string) {
    let res = await sequelize.query(`SELECT u.username,c.uuid,c."content",c.state, c.modified,c.created,g.pics,g.title FROM mall."consult" c,mall.goods g,users.users u where c.goodsuuid=g.uuid AND C .useruuid = u.uuid and c.uuid='${uuid}'`, { type: "select" }) as any[]
    return res
}

export async function deleteConsult(uuid: string) {
    await getModel(modelName).destroy({ where: { uuid: uuid } })
}

export async function findByGoodsuuidAndUseruuid(goodsuuid: string, useruuid: string) {
    let res = await getModel(modelName).findOne({ attributes: ["content"], where: { goodsuuid: goodsuuid, useruuid: useruuid } })
    return res ? res.get("content") : undefined
}

export async function getCount(sequelize: Sequelize, searchdata: string) {
    let state: string
    switch (searchdata) {
        case '已回复':
            state = " or c.state='reply'";
            break;
        case '提问':
            state = " or c.state='new'";
            break;
        default:
            state = ''
    }
    let res = await sequelize.query(`SELECT
	COUNT (*)
FROM
	mall."consult" C,
	mall.goods G,
	users.users u
WHERE
	C .goodsuuid = G .uuid
AND C .useruuid = u.uuid
AND (
	u.username LIKE '%${searchdata}%'
      ${state}
	OR G .title LIKE '%${searchdata}%'
)`, { type: "SELECT" }) as any[]
    return parseInt(res[0].count)
}

/**
 * 管理员对客户的评论
 */
export async function findBy(sequelize: Sequelize, searchdata: string, cursor: number, limit: number) {
    let state: string
    switch (searchdata) {
        case '已回复':
            state = " or c.state='reply'";
            break;
        case '提问':
            state = " or c.state='new'";
            break;
        default:
            state = ''
    }
    let res = await sequelize.query(`SELECT u.username,c.uuid,c."content",c.state, c.modified,c.created,g.pics,g.title FROM mall."consult" c,mall.goods g,users.users u where c.goodsuuid=g.uuid AND C .useruuid = u.uuid and ( u.username like '%${searchdata}%'  ${state} or g.title like '%${searchdata}%') order by c.modified desc  OFFSET ${cursor} LIMIT ${limit}`, { type: "SELECT" }) as any[]
    return res
}