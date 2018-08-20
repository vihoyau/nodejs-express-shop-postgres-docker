import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"

const [schema, table] = ["users", "users"]
const modelName = `${schema}.${table}`

export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
        },
        username: DataTypes.TEXT,
        password: DataTypes.TEXT,
        nickname: DataTypes.CHAR(64),
        realname: DataTypes.CHAR(64),
        idcard: DataTypes.CHAR(36),
        address: DataTypes.TEXT,
        headurl: DataTypes.TEXT,
        state: DataTypes.ENUM("on", "off"),
        sex: DataTypes.CHAR(8),
        birthday: DataTypes.CHAR(20),
        interest: DataTypes.TEXT,
        description: DataTypes.TEXT,
        ext: DataTypes.JSONB,
        pointlottery: DataTypes.INTEGER,//积分抽奖次数
        cashlottery: DataTypes.INTEGER,//零钱抽奖次数
        created: DataTypes.TIME,
        modified: DataTypes.TIME,
    }, {
            timestamps: false,
            schema: schema,
            freezeTableName: true,
            tableName: table,
        })
}

export async function insertUsers(seqz: Sequelize, username: string, password: string, nickname: string, openid: string) {
    return await seqz.transaction(async t => {                  //记得加上return
        let user = await getModel(modelName).create({ username, password, nickname }, { transaction: t, returning: true })
        let uuid = user.get("uuid")
        await getModel("users.statistics").create({ uuid: uuid }, { transaction: t })
        let res = await getModel("users.users_ext").create({ uuid: uuid, openid: openid }, { transaction: t })
        return !!res ? res.get() : undefined
    })
}

export async function wxqqInsertUser(seqz: Sequelize, username: string, openid: string, qqcode: string, headurl: string, nickname: string, type?: string, password?: any) {

    return await seqz.transaction(async function (t) {
        let user = await getModel(modelName).create({ username, headurl, nickname, password }, { transaction: t, returning: true })
        let uuid = user.get('uuid')
        await getModel("users.statistics").create({ uuid }, { transaction: t })
        let res
        if (openid) {
            if (type == 'wxapp')
                res = await getModel("users.users_ext").create({ uuid, appopenid: openid }, { transaction: t })
            else
                res = await getModel("users.users_ext").create({ uuid, openid: openid }, { transaction: t })
        }
        else
            res = await getModel("users.users_ext").create({ uuid, qqcode }, { transaction: t })

        return !!res ? res.get() : undefined
    })
}

//新添加
export async function new_insertUsers(seqz: Sequelize, username: string, password: string) {
    return await seqz.transaction(async t => {
        let user = await getModel(modelName).create({ username: username, password: password }, { transaction: t, returning: true })
        let uuid = user.get("uuid")
        await getModel("users.statistics").create({ uuid: uuid }, { transaction: t })
        let res = await getModel("users.users_ext").create({ uuid: uuid }, { transaction: t })
        return !!res?res.get():undefined
    })
}


export async function getByUsername(username: string) {
    let res = await getModel(modelName).findOne({ where: { username: username } })
    return res ? res.get() : undefined
}

export async function updatePassword(username: string, password: string) {
    let [number, res] = await getModel(modelName).update({ password: password }, { where: { username: username }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function getAll(cursor: number, limit: number) {
    let res = await getModel(modelName).findAll({ offset: cursor, limit: limit, })
    return res.map(r => r.get())

}

export async function updateInformation(uuid: string, obj: any) {
    let [number, res] = await getModel(modelName).update(obj, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function checkUser(username: string, password: string) {
    let res = await getModel(modelName).findOne({ where: { username: username, password: password } })
    return res ? res.get() : undefined
}

export async function updateOpenid(username: string, openid: string) {
    let [number, res] = await getModel(modelName).update({ openid: openid }, { where: { username: username } })
    return number > 0 ? res[0].get() : undefined
}

//未使用？？？？
export async function updateStateToApp(uuid: string, appState: string) {
    let [number, res] = await getModel(modelName).update({ state: appState }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

//？？？？？？？？？？？？？？？
export async function updatePoint(updateUser: any, uuid: string) {
    let [number, res] = await getModel(modelName).update(updateUser, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function findByPrimary(uuid: string) {
    let user = await getModel(modelName).findByPrimary(uuid)
    return user ? user.get() : undefined
}

export async function resetAppUserState(useruuid: string, state: string) {
    let [number, res] = await getModel(modelName).update({ state: state }, { where: { uuid: useruuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

/**
 *  查询会员的积分
 */
export async function getAllUserPoints(sequelize: Sequelize, searchdata: string, cursor: number, limit: number) {
    let res = await sequelize.query(`select * from users.users u, users.users_ext ue where u.uuid=ue.uuid and (u.username like '%${searchdata}%' ) order by ue.total_points desc offset ${cursor} limit ${limit}`, { type: "select" }) as any[]
    return res
}

/**
 * 查询会员的所有信息
 */
export async function getAllUsers(sequelize: Sequelize, searchdata: string, cursor: number, limit: number, pointsort: string, balancesort: string) {
    if (pointsort != "" || pointsort) {
        pointsort = ' ue.points ' + pointsort + ','
    } else {
        pointsort = ''
    }
    if (balancesort != "" || balancesort) {
        balancesort = ' ue.balance ' + balancesort + ','
    } else {
        balancesort = ''
    }
    let res = await sequelize.query(`select * from users.users u,users.users_ext ue
    where u.uuid=ue.uuid
    and (u.username like '%${searchdata}%' or ue.openid like '%${searchdata}%' )
    order by ${pointsort} ${balancesort} u.created desc offset ${cursor} LIMIT ${limit}`, { type: "select" }) as any[]
    return res
}

export async function getCount(sequelize: Sequelize, searchdata: string) {
    let res = await sequelize.query(`select count(*) from users.users u,users.users_ext ue
    where u.uuid=ue.uuid
    and (u.username like '%${searchdata}%'  or ue.openid like '%${searchdata}%' ) `, { type: "select" }) as any[]
    return res[0].count
}

export async function deleteUser(uuid: string) {
    await getModel(modelName).destroy({ where: { uuid: uuid } })
}

export async function getUserAndlevels(sequelize: Sequelize, searchdata: string, cursor: number, limit: number) {
    let res = await sequelize.query(`SELECT us.*,u.*,a.levels,a.fromexp,a.discount,a.modified
    FROM users.users us LEFT JOIN users.users_ext AS u ON u.uuid = us.uuid LEFT JOIN users.levels AS A ON A .fromexp @> u."exp"
    WHERE us.STATE = 'on' ORDER BY A.levels DESC OFFSET ${cursor} LIMIT ${limit}`, { type: "select" }) as any[]
    return res
}

export async function finduserslevel(sequelize: Sequelize, uuid: string) {
    let res = await sequelize.query(`select * from users.users as u left join users.users_ext  as us on u.uuid =us.uuid left join users.levels as l on l.fromexp @> us."exp" where u.uuid ='${uuid}' limit 1`, { type: "select" }) as any[]
    return res[0]
}

export async function getUserAndlevelsCount(sequelize: Sequelize, searchdata: string) {
    let res = await sequelize.query(`select count(*) FROM users.users us
    LEFT JOIN users.users_ext AS u ON u.uuid = us.uuid
    LEFT JOIN users.levels AS A ON A .fromexp @> u."exp"
    WHERE us.STATE = 'on' `, { type: "select" }) as any[]
    return parseInt(res[0].count)
}

export async function deleteusers(uuid: string) {
    let [number, res] = await getModel(modelName).update({ state: 'off' }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function updatePointlottery(uuid: string, invite: number) {
    let [number, res] = await getModel(modelName).update({ pointlottery: Sequelize.literal(`pointlottery+${invite}`) }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

/**
 * 修改修改积分抽奖次数和零钱抽奖次数
 * @param uuid
 * @param pointlottery
 * @param cashlottery
 */
export async function updatePointAndCashlottery(uuid: string, pointlottery: number, cashlottery: number) {
    let [number, res] = await getModel(modelName).update({
        pointlottery: Sequelize.literal(`pointlottery-${pointlottery}`),
        cashlottery: Sequelize.literal(`cashlottery-${cashlottery}`)
    }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

/**
 * 修改修改积分抽奖次数和零钱抽奖次数
 * @param uuid
 * @param pointlottery
 * @param cashlottery
 */
export async function addPointAndCashlottery(uuid: string, pointlottery: number, cashlottery: number) {
    let [number, res] = await getModel(modelName).update({
        pointlottery: Sequelize.literal(`pointlottery+${pointlottery}`),
        cashlottery: Sequelize.literal(`cashlottery+${cashlottery}`)
    }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}


export async function getOffCount() {
    let res = await getModel(modelName).count({ where: { state: "off" } })
    return res
}

export async function getAllOffUsers(cursor: number, limit: number) {
    let res = await getModel(modelName).findAll({ where: { state: 'off' }, offset: cursor, limit: limit })
    return res ? res.map(r => r.get()) : undefined
}

/* export async function findNullPass(sequelize: Sequelize, ) {
    let res = await sequelize.query(`
    SELECT * from users.users where "password" is null;
    `, { type: "select" }) as any[]
    return res
} */
