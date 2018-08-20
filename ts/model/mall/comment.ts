import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"

const modelName = "mall.comment"
export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        content: DataTypes.TEXT,
        goodsuuid: DataTypes.UUID,
        useruuid: DataTypes.UUID,
        parent: DataTypes.UUID,
        state: DataTypes.ENUM("new", "on", "reject", "replied"),
        created: DataTypes.TIME,
    }, {
            timestamps: false,
            schema: "mall",
            freezeTableName: true,
            tableName: "comment"
        })
}

/**
 * 添加评论
 */
export async function insertComment(content: any, goodsuuid: string, useruuid: string, parent: string, state: string) {
    let res = await getModel(modelName).create({ content: content, goodsuuid: goodsuuid, useruuid: useruuid, parent: parent, state: state }, { returning: true })
    return res ? res.get() : undefined
}

/**
 *对评论进行审批
 */
export async function updateComment(uuid: string, state: string) {
    let [number, res] = await getModel(modelName).update({ state: state }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

/**
 *删除评论
 */
export async function deleteComment(uuid: string) {
    return await getModel(modelName).destroy({ where: { uuid: uuid } })
}

export async function getCount(sequelize: Sequelize, searchdata: string) {
    let res = await sequelize.query(`select count(*) from mall."comment" c,users.users u ,mall.goods g where c.parent IS NULL and  c.useruuid=u.uuid and c.goodsuuid=g.uuid and g.state='onsale' and g.deleted=0 and (u.username like '%${searchdata}%' or c.content like '%${searchdata}%')`, { type: "SELECT" }) as any[]
    return parseInt(res[0].count)
}

/**
 * 显示app端的评论列表
 */
export async function listAppComment(sequelize: Sequelize, goodsuuid: string, cursor: number, limit: number) {
    let res = await sequelize.query(`select c.* ,a.content as reword,u.nickname from  mall."comment" as c LEFT JOIN mall."comment" as a  on c.uuid = a.parent LEFT JOIN users.users as u on c.useruuid=u.uuid where c."state" ='on' and c.parent is NULL and c.goodsuuid='${goodsuuid}' order by c.created offset ${cursor} limit ${limit}`, { type: "selelct" }) as any[]
    return res
}

export async function getcomentByparent(parent: string) {
    let res = await getModel(modelName).findOne({ where: { parent: parent } })
    return res.get()
}

/**
 * 对客户评论进行列表显示
 */
export async function listComment(sequelize: Sequelize, searchdata: string, cursor: number, limit: number) {
    let res = await sequelize.query(`select c.uuid, c."content", c.goodsuuid, c.useruuid ,c.parent ,c.state ,c.created ,
u.uuid uuuid, u.username uusername,
g.uuid guuid, g.title gtitle, g.keyword gkeyword, g.price gprice, g.realprice grealprice, g."content" gcontent, g.specification gspecification , g.category gcategory , g.subcategory gsubcategory , g.tags gtags, g.association gassociation , g.pics gpics, g.points gpoints, g.state gstate, g.deleted gdeleted , g.modified gmodified , g.created gcreated
 from mall."comment" c,users.users u ,mall.goods g where  c.parent IS NULL and  c.useruuid=u.uuid and c.goodsuuid=g.uuid and g.state='onsale' and g.deleted=0 and (u.username like '%${searchdata}%' or c.content like '%${searchdata}%') order by c.created desc offset ${cursor} limit ${limit}`, { type: "SELECT" }) as any[]
    return res
}

/**
 * 管理员对客户的评论
 */
export async function findByParent(sequelize: Sequelize, parent: string) {
    let res = await sequelize.query(`SELECT u.username,c."content",c.created,g.pics,g.title FROM mall."comment" c,mall.goods g,mall.crmuser u where c.goodsuuid=g.uuid  AND c.parent= '${parent}'  AND c.state='on' order by c.created desc  `, { type: "SELECT" }) as any[]
    return res
}