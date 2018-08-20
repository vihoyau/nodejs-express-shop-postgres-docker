import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"

const modelName = "trend.trendcomment"
export const defineFunction = function (sequelize: Sequelize) {

    return sequelize.define(modelName, {
        uuid: { //评论uuid
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        useruuid: DataTypes.UUID,   //用户uuid
        trenduuid: DataTypes.UUID,  //动态uuid
        content: DataTypes.TEXT,    //评论内容
        parent: DataTypes.UUID, //父评论uuid
        upnum: DataTypes.INTEGER,   //点赞数
        reward: DataTypes.BOOLEAN,   //是否已经打赏
        state: DataTypes.STRING,    //状态，on | rejected,被举报了，核实之后就是rejected
        created: DataTypes.TIME,
        modified: DataTypes.TIME,
    }, {
            timestamps: false,
            schema: "trend",
            freezeTableName: true,
            tableName: "trendcomment",
        })
}

export async function insertComment(obj: any) {
    let t = await getModel(modelName).create(obj, { returning: true })
    return t ? t.get() : undefined
}

export async function delTrendComment(uuid: string) {
    let [num, res] = await getModel(modelName).update({ state: 'rejected' }, { where: { uuid: uuid }, returning: true })
    return num > 0 ? res[0].get() : undefined
}

export async function findByParent(parent: string) {
    let res = await getModel(modelName).findAll({ where: { parent, state: 'on' } })
    return res.map(r => r.get())
}

export async function findByTrenduuid(sequelize: Sequelize, trenduuid: string, start: number, length: number) {
    let res = await sequelize.query(`
    select "comment".uuid as commentuuid, content, users.username ,users.nickname ,users.headurl ,"comment".created,"comment".upnum
    from trend."trendcomment" as comment ,users.users as users where comment.useruuid = users.uuid
    and comment.trenduuid='${trenduuid}' order by created desc
    offset ${start} limit ${length}`, { type: 'select' });
    return res ? res : null
}

export async function getCountByTrendUUID(trenduuid: string) {
    return await getModel(modelName).count({ where: { trenduuid } })
}

export async function findByPrimaryUUID(uuid: string) {
    let res = await getModel(modelName).findByPrimary(uuid)
    return res ? res.get() : undefined
}

export async function queryCommentNum(commentUUID: string) {
    let res = await getModel(modelName).findByPrimary(commentUUID, { attributes: ['upnum'] });
    return res;
}

export async function updateCommentNum(commentUUID: string, num: number) {
    let [number, res] = await getModel(modelName).update({ upnum: num }, { where: { uuid: commentUUID }, returning: true });
    return number > 0 ? res[0].get() : undefined;
}

export async function updateReward(commentUUID: string, reward: boolean) {
    let [number, res] = await getModel(modelName).update({ reward: reward }, { where: { uuid: commentUUID }, returning: true });
    return number > 0 ? res[0].get() : undefined;
}

export async function querycommentRepliedCount(sequelize: Sequelize, commentUUID: string) {
    let res = await sequelize.query(`
    select count(comment.uuid) as count  from trend.trendcomment as comment where parent = '${commentUUID}' and state='on'`);
    return res ? res : undefined;
}

export async function queryCommentByparentuuid(sequelize: Sequelize, commentuuid: string) {
    let res = await sequelize.query(`
    select "comment".uuid as commentuuid, content, users.username ,users.nickname ,users.headurl ,"comment".created,"comment".upnum
    from trend."trendcomment" as comment ,users.users as users where comment.useruuid = users.uuid and parent = '${commentuuid}'
    and comment.state= 'on' order by created desc`, { type: 'select' });
    return res ? res : null
}

export async function queryCommentParent(sequelize: Sequelize, trenduuid: string, cursor: number, limit: number) {
    let res = await sequelize.query(`
    select comment.uuid as commentuuid, content, users.username,users.nickname ,users.headurl ,comment.upnum, comment.created,comment.reward
    from trend.trendcomment as comment ,users.users as users where comment.parent is null  and
    comment.useruuid = users.uuid and comment.trenduuid = '${trenduuid}' and comment.state='on'
    order by comment.created desc
    offset ${cursor} limit ${limit}`, { type: 'select' });
    return res ? res : null;
}

export async function queryCommentParentDownNum(sequelize: Sequelize, trenduuid: string, commentuuid: string) {
    let res = await sequelize.query(`
    select count(*) as count from
    trend.trendcomment as comment ,users.users as users
    where comment.parent = '${commentuuid}'  and  comment.useruuid = users.uuid
    and comment.trenduuid = '${trenduuid}' and comment.state='on'`, { type: 'select' });
    return res ? res[0].count : undefined;
}

export async function findFirstComByParent(sequelize: Sequelize, parent: string) {
    let res = await sequelize.query(`
    select t.*,u.username,u.nickname,u.headurl from trend.trendcomment t,users.users u
    where t.parent = '${parent}' and t.useruuid = u.uuid and t.state='on'
    order by created asc limit 1
    `, { type: 'select' }) as any[]
    return res
}