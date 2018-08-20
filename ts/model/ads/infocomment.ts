import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"
const modelName = "ads.infocomment"
export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        content: DataTypes.TEXT,
        useruuid: {
            type: DataTypes.UUID,
            allowNull: false
        },
        parent: DataTypes.UUID,
        state: DataTypes.CHAR(48),
        created: DataTypes.TIME,
        infouuid: DataTypes.UUID,
        upnum: DataTypes.INTEGER,
    },
        {
            timestamps: false,
            schema: "ads",
            freezeTableName: true,
            tableName: "infocomment"
        }
    )
}

// export async function findcomment() {
//     let res = await getModel(modelName).findAll({});
//     return res.map(r => r.get());
// }

/**
 * 插入一条新的广告评论
 * @param content
 * @param useruuid
 * @param infouuid
 */

export async function insertadsComment(content: string, useruuid: string, infouuid: string) {
    let res = getModel(modelName).create({ content: content, useruuid: useruuid, infouuid: infouuid }, { returning: true });
    return res;
}
/**
 *
 * @param content
 * @param useruuid
 * @param infouuid
 * @param parent
 */
export async function insertParentComment(content: string, useruuid: string, infouuid: string, parent: string) {
    let res = await getModel(modelName).create({ content: content, useruuid: useruuid, infouuid: infouuid, parent: parent }, { returning: true });
    return res;
}

export async function queryCommentNum(commentUUID: string) {
    let res = await getModel(modelName).findByPrimary(commentUUID, { attributes: ['upnum'] });
    return res;
}

export async function updateCommentNum(commentUUID: string, num: number) {
    let [number, res] = await getModel(modelName).update({ upnum: num }, { where: { uuid: commentUUID }, returning: true });
    return number > 0 ? res[0].get() : undefined;
}

export async function queryadsCommentNum(sequelize: Sequelize, infouuid: string) {
    let res = await sequelize.query(`select count(*) from ads.infocomment as comment where comment.infouuid = '${infouuid}' and comment.state not in ('new') and parent is null`, { type: 'select' });
    return res ? res : null;
}

export async function querycommentRepliedCount(sequelize: Sequelize, commentUUID: string) {
    let res = await sequelize.query(`select count(comment.uuid) as count  from ads.infocomment as comment where parent = '${commentUUID}'`);
    return res ? res : undefined;
}
export async function queryadsCommentUpnumMAX(sequelize: Sequelize, infouuid: string) {
    let res = await sequelize.query(`select comment.uuid as commentuuid, content, users.nickname,users.headurl ,comment.upnum, comment.created from  ads.infocomment as comment ,users.users as users ,
    (select max(comment.upnum) as max from ads.infocomment as comment where comment.parent is null  and comment.infouuid = '${infouuid}' and comment.state not in ('new')) as t1
    where comment.parent is null  and  comment.useruuid = users.uuid and comment.state in ('on') and comment.infouuid = '${infouuid}' and t1.max = comment.upnum
    `, { type: 'select' });
    return res ? res : undefined;
}

export async function queryCommentParentDownLastcomment(sequelize: Sequelize, commentuuid?: string) {
    if (commentuuid == undefined) {
        return undefined;
    }
    let res = await sequelize.query(`select comment.content, users.nickname  from ads.infocomment as comment ,users.users as users
        where  comment.useruuid = users.uuid  and comment.state in ('on') and comment.parent = '${commentuuid}'
        and comment.created   = (select max(tcomment.created) from ads.infocomment as tcomment where tcomment.state in ('on') and tcomment.parent = '${commentuuid}' )`, { type: 'select' })
    return res ? res : undefined;
}

export async function queryCommentParent(sequelize: Sequelize, infouuid: string) {
    let res = await sequelize.query(`select comment.uuid as commentuuid, content, users.nickname,users.headurl ,comment.upnum, comment.created from ads.infocomment as comment ,users.users as users where comment.parent is null  and  comment.useruuid = users.uuid and comment.state in ('on') and comment.infouuid = '${infouuid}' order by comment.created desc`, { type: 'select' });
    return res ? res : null;
}

export async function queryCommentParentDownNum(sequelize: Sequelize, infouuid: string, commentuuid: string) {
    let res = await sequelize.query(`select count(*) as count from ads.infocomment as comment ,users.users as users where comment.parent = '${commentuuid}'  and  comment.useruuid = users.uuid and comment.state in ('on') and comment.infouuid = '${infouuid}'`, { type: 'select' });
    return res ? res[0].count : undefined;
}

export async function queryCommentByparentuuid(sequelize: Sequelize, commentuuid: string) {
    let res = await sequelize.query(`select "comment".uuid as commentuuid, content, users.nickname ,"comment".created,"comment".upnum from ads."infocomment" as comment ,users.users as users where comment.useruuid = users.uuid and parent = '${commentuuid}' and comment.state in ('on') order by created desc`, { type: 'select' });
    return res ? res : null
}

export async function querycrmcomment(sequelize: Sequelize, cursor: number, limit: number, classify?: string, advertiseruuid?: string) {
    if (classify == undefined || classify == null || classify == "") {
        if (advertiseruuid != undefined) {
            let res = sequelize.query(`select comment.uuid, ads.title, users.nickname, comment.content, comment.downnum, comment.created, comment.state from  ads.informationads as ads , users.users as users ,ads.infocomment as comment
            where  users.uuid = comment.useruuid and comment.infouuid = ads.uuid    and ads.advertiseruuid = '${advertiseruuid}' order by comment.created desc  offset ${cursor} limit ${limit} `, { type: 'select' });
            return res ? res : undefined;
        }
        let res = sequelize.query(`select comment.uuid, ads.title, users.nickname, comment.content, comment.downnum, comment.created, comment.state from  ads.informationads as ads , users.users as users ,ads.infocomment as comment
        where  users.uuid = comment.useruuid and comment.infouuid = ads.uuid   order by comment.created desc  offset ${cursor} limit ${limit} `, { type: 'select' });
        return res ? res : undefined;
    } else {
        if (advertiseruuid != undefined) {
            let res = sequelize.query(`select comment.uuid, ads.title, users.nickname, comment.content, comment.downnum, comment.created, comment.state from  ads.informationads as ads , users.users as users ,ads.infocomment as comment
            where  users.uuid = comment.useruuid and comment.infouuid = ads.uuid  and comment.state = '${classify}'  and ads.advertiseruuid = '${advertiseruuid}' order by comment.created desc  offset ${cursor} limit ${limit} `, { type: 'select' });
            return res ? res : undefined;
        }
        let res = sequelize.query(`select comment.uuid, ads.title, users.nickname, comment.content, comment.downnum, comment.created, comment.state from  ads.informationads as ads , users.users as users ,ads.infocomment as comment
        where  users.uuid = comment.useruuid and comment.infouuid = ads.uuid   and comment.state = '${classify}'  order by comment.created desc  offset ${cursor} limit ${limit} `, { type: 'select' });
        return res ? res : undefined;
    }

}

export async function queryCountcrmcommnet(sequelize: Sequelize, classify?: string, advertiseruuid?: string) {
    if (classify == undefined || classify == null || classify == "") {
        if (advertiseruuid != undefined) {
            let res = await sequelize.query(`select count(comment.uuid) as count from  ads.informationads as ads , users.users as users ,ads.infocomment as comment
            where  users.uuid = comment.useruuid and comment.infouuid = ads.uuid    and ads.advertiseruuid = '${advertiseruuid}'
            `, { type: 'select' })
            return res ? res[0].count : undefined;
        } else {
            let res = await sequelize.query(`select count(comment.uuid) as count   from  ads.informationads as ads , users.users as users ,ads.infocomment as comment
            where  users.uuid = comment.useruuid and comment.infouuid = ads.uuid `, { type: 'select' });
            return res ? res[0].count : undefined;
        }
    } else {
        if (advertiseruuid != undefined) {
            let res = await sequelize.query(`select count(comment.uuid) as count   from  ads.informationads as ads , users.users as users ,ads.infocomment as comment
            where  users.uuid = comment.useruuid and comment.infouuid = ads.uuid  and comment.state = '${classify}'  and ads.advertiseruuid = '${advertiseruuid}' `, { type: 'select' });
            return res ? res[0].count : undefined;
        } else {
            let res = await sequelize.query(`select count(comment.uuid) as count   from  ads.informationads as ads , users.users as users ,ads.infocomment as comment
            where  users.uuid = comment.useruuid and comment.infouuid = ads.uuid   and comment.state = '${classify}'`, { type: 'select' });
            return res ? res[0].count : undefined;
        }
    }
}
/**
 *
 * @param commentuuid
 * @param state   postgres  check ' new 为未审核  on 审核通过  reject 审核没通过  replied 已回复 '
 */
export async function updatePendingcomment(commentuuid: string, state: string, rejectcontent: string) {
    if (rejectcontent == undefined || rejectcontent == null) {
        let [number, res] = await getModel(modelName).update({ state: state }, { where: { uuid: commentuuid } });
        return number > 0 ? res : undefined;
    } else {
        let [number, res] = await getModel(modelName).update({ state: state, rejectcontent: rejectcontent }, { where: { uuid: commentuuid } });
        return number > 0 ? res : undefined;
    }
}


