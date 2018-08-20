import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"

const modelName = "trend.trend"
export const defineFunction = function (sequelize: Sequelize) {

    return sequelize.define(modelName, {
        uuid: { //动态uuid
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        useruuid: DataTypes.UUID,   //用户uuid
        state: DataTypes.INTEGER,   //on, rejected 新建之后就是on, 被人举报，经管理员查实下线就是rejected
        content: DataTypes.TEXT,    //内容
        pics: DataTypes.ARRAY(DataTypes.TEXT),  //图片数组
        mov: DataTypes.TEXT,    //视频url
        preview: DataTypes.TEXT, //视频预览图url
        reward: DataTypes.FLOAT,    //打赏模式下，打赏数额
        question_ext: DataTypes.JSONB,  //题目
        answer_mold: DataTypes.JSONB,    //only红包模式下{mold:"points| balance",type:"quota|random",amount:"人数",total:"总值"}
        random: DataTypes.ARRAY(DataTypes.INTEGER),   //only 红包模式下的随机类型的，红包数组
        nice: DataTypes.INTEGER, //好评数
        comment: DataTypes.INTEGER,//评论数
        share: DataTypes.INTEGER, //分享数
        mold: DataTypes.STRING,  //default常规， redpaper红包， reward打赏
        created: DataTypes.TIME,
        modified: DataTypes.TIME,
    }, {
            timestamps: false,
            schema: "trend",
            freezeTableName: true,
            tableName: "trend",
        })
}

export async function insertTrend(obj: any) {
    let t = await getModel(modelName).create(obj, { returning: true })
    return t ? t.get() : undefined
}

export async function countByState(state: string) {
    return await getModel(modelName).count({ where: { state } })
}

export async function deleteTrend(uuid: string) {
    await getModel(modelName).destroy({ where: { uuid: uuid } })
}

export async function updateTrend(uuid: string, obj: any) {
    let [number, res] = await getModel(modelName).update(obj, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function findByTrendUUID(uuid: string) {
    let res = await getModel(modelName).findByPrimary(uuid)
    return res ? res.get() : undefined
}

export async function findAllTrend(sequelize: Sequelize, state: string, cursor: number, limit: number, shield?: any) {
    let res
    if (shield) {
        let uuid = "("
        for (let j = 0; j < shield.length; j++) {
            if (j == shield.length - 1) {
                uuid = uuid + "'" + shield[j].shielduuid + "'"
            } else {
                uuid = uuid + "'" + shield[j].shielduuid + "',"
            }
        }
        uuid += ")"

        res = await sequelize.query(`
        select t.*,u.username,u.headurl,u.nickname from trend.trend t,users.users u
        where t.useruuid = u.uuid
        and t.state = '${state}'
        and t.useruuid not in ${uuid}
        order by t.created desc
        offset ${cursor}
        limit ${limit}
        `, { type: "select" }) as any[]

    } else {
        res = await sequelize.query(`
        select t.*,u.username,u.headurl,u.nickname from trend.trend t,users.users u
        where t.useruuid = u.uuid
        and t.state = '${state}'
        order by t.created desc
        offset ${cursor}
        limit ${limit}
        `, { type: "select" }) as any[]
    }

    return res
}

export async function findAllTrendByKeyWord(sequelize: Sequelize, cursor: number, limit: number, keyword: any) {
    let res = await sequelize.query(`
    select t.*,u.username,u.headurl,u.nickname from trend.trend t,users.users u
    where t.useruuid = u.uuid
    and t.state = 'on'
    and t.content like '%${keyword}%'
    order by t.created desc
    offset ${cursor}
    limit ${limit}
    `, { type: "select" }) as any[]
    return res
}

export async function trendUpdateNice(uuid: string) {
    let [number, res] = await getModel(modelName).update({ nice: Sequelize.literal(`nice+ 1`) }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function trendCutNice(uuid: string) {
    let [number, res] = await getModel(modelName).update({ nice: Sequelize.literal(`nice- 1`) }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function findByUserUUID(sequelize: Sequelize, useruuid: string, cursor: number, limit: number) {
    let res = await sequelize.query(`
    select t.*,u.username,u.headurl,u.nickname from trend.trend t,users.users u
    where t.useruuid = u.uuid
    and t.state = 'on'
    and t.useruuid = '${useruuid}'
    order by t.created desc
    offset ${cursor}
    limit ${limit}
    `, { type: "select" }) as any[]
    return res
}

export async function trendUpdateShare(uuid: string) {
    let [number, res] = await getModel(modelName).update({ share: Sequelize.literal(`share+ 1`) }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function trendUpdateCom(uuid: string) {
    let [number, res] = await getModel(modelName).update({ comment: Sequelize.literal(`comment+ 1`) }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function trendDownCom(uuid: string) {
    let [number, res] = await getModel(modelName).update({ comment: Sequelize.literal(`comment- 1`) }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function modifilyMov(uuid: string, mov: string, preview: string) {
    let [number, res] = await getModel(modelName).update({ mov, preview }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}
