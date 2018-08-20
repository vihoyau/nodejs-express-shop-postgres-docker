import { getModel } from "../../lib/global"
import { DataTypes, Sequelize } from "sequelize"

const [schema, table] = ["users", "message"]
const modelName = `${schema}.${table}`

export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
        },
        useruuid: DataTypes.UUID,
        username: DataTypes.CHAR(120),
        content: DataTypes.TEXT,
        state: DataTypes.ENUM('new', 'send', 'saw'),
        ext: DataTypes.JSONB,
        title: DataTypes.CHAR(225),
        orderuuid: DataTypes.UUID,
        created: DataTypes.TIME
    }, {
            timestamps: false,
            schema: schema,
            freezeTableName: true,
            tableName: table,
        })
}

export async function createMessage(create: any) {
    let res = await getModel(modelName).create(create, { returning: true })
    return res ? res : undefined
}

export async function getCount(obj: any) {
    let res = await getModel(modelName).count({ where: obj })
    return res
}

export async function getMessageByType(obj: any, cursor: number, limit: number) {
    let res = await getModel(modelName).findAll({ where: obj, order: [['created', "desc"]], offset: cursor, limit: limit })
    return res.map(r => r.get())
}

export async function findByPrimary(uuid: string) {
    let res = await getModel(modelName).findByPrimary(uuid)
    return res ? res.get() : undefined
}

export async function getMySendMessage(useruuid: string) {
    let res = await getModel(modelName).findAll({ where: { state: 'send', $or: [{ useruuid: null }, { useruuid: useruuid }] } })
    return res.map(r => r.get())
}

export async function getMyMessage(useruuid: string) {
    let res = await getModel(modelName).findAll({ where: { state: ['send', 'saw'], $or: [{ useruuid: null }, { useruuid: useruuid }] }, order: [['state', 'desc'], ['created', 'desc']] })
    return res.map(r => r.get())
}

export async function getMyMessageCount(useruuid: string) {
    let res = await getModel(modelName).count({ where: { state: 'send', useruuid: useruuid } })
    return res
}

export async function updateMessage(uuid: string) {
    await getModel(modelName).update({ state: 'send' }, { where: { uuid: uuid }, returning: true })
}
export async function updateMessageSaw(uuid: string) {
    await getModel(modelName).update({ state: 'saw' }, { where: { uuid: uuid }, returning: true })
}

export async function updateContent(content: string, uuid: string, title: string, username: string, useruuid: string) {
    await getModel(modelName).update({ content: content, title: title, username: username, useruuid: useruuid }, { where: { uuid: uuid }, returning: true })
}

export async function getMessage(useruuid: string) {
    await getModel(modelName).findAll({ where: { useruuid: null } })
}

export async function findAll(sequelize: Sequelize, cursor: number, limit: number) {
    let res = await sequelize.query(`select m.*,u.username from users.message as m left join users.users as u on m.useruuid=u.uuid order by m.created desc offset ${cursor} limit ${limit}`, { type: "select" }) as any[]
    return res
}

export async function deletemessage(orderuuid: string) {
    await getModel(modelName).destroy({ where: { orderuuid: orderuuid } })
}

/**
 *删除消息
 * @param uuid
 */
export async function removemessage(uuid: string) {
    await getModel(modelName).destroy({ where: { uuid: uuid } })
}
