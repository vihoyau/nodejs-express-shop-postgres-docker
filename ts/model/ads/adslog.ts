import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"

const modelName = "ads.adslog"
export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        ip: DataTypes.STRING,   //·Ã¿Íip
        aduuid: DataTypes.UUID,
        useruuid: DataTypes.UUID,
        points: DataTypes.INTEGER,
        paytype: DataTypes.ENUM('immediate', 'balance'),
        state: DataTypes.ENUM('on', 'fin', 'stop'),
        openid: DataTypes.CHAR(64),
        keyword: DataTypes.TEXT,
        answercount: DataTypes.INTEGER,
        username: DataTypes.CHAR(64),
        ext: DataTypes.JSONB,
        balance: DataTypes.INTEGER,
        created: DataTypes.TIME,
        modified: DataTypes.TIME,
    }, {
            timestamps: false,
            schema: "ads",
            freezeTableName: true,
            tableName: "adslog",
        })
}

export async function getByTwoUuid(adsuuid: string, useruuid: string) {
    let res = await getModel(modelName).findOne({ where: { useruuid: useruuid, aduuid: adsuuid } })
    return res ? res.get() : undefined
}

export async function getCount(sequelize: Sequelize, adsuuid: string, searchdata: string) {
    let res = await sequelize.query(`select count(*) from ads.adslog as a, users.users as b where a.useruuid=b.uuid and a.aduuid='${adsuuid}' and (b.username like '%${searchdata}%') `, { type: "SELECT" }) as any[]
    return res[0].count
}

export async function getCount2(sequelize: Sequelize, adsuuid: string, searchdata: string) {
    let res = await sequelize.query(`select count(*) from ads.adslog where ip is not null and aduuid = '${adsuuid}'`, { type: "SELECT" }) as any[]
    return res[0].count
}

export async function getByAdsUuid(sequelize: Sequelize, adsuuid: string, searchdata: string, cursor: number, limit: number) {
    let res = await sequelize.query(`
    select b.*,a.* from ads.adslog as a, users.users as b
    where a.useruuid=b.uuid  and a.aduuid='${adsuuid}'
    and (b.username like '%${searchdata}%')
    ORDER BY a.modified desc
    LIMIT ${limit} offset ${cursor} `, { type: "SELECT" }) as any[]
    return res
}

export async function getByAdsUuid2(sequelize: Sequelize, adsuuid: string, searchdata: string, cursor: number, limit: number) {
    let res = await sequelize.query(`
    select a.* from ads.adslog a
    where a.ip is not null and a.aduuid='${adsuuid}'
    ORDER BY a.modified desc
    LIMIT ${limit} offset ${cursor} `, { type: "SELECT" }) as any[]
    return res
}

export async function getByUserUuid(useruuid: string, cursor: number, limit: number) {
    let res = await getModel(modelName).findAll({
        where: { useruuid: useruuid },
        offset: cursor,
        limit: limit,
        order: [['created', 'DESC']]
    })
    return res.map(r => r.get())
}

export async function insertAdslog(adlog: any) {
    return await getModel(modelName).create(adlog, { returning: true })
}

export async function updateAdslog(adlog: any, uuid: string) {
    let [number, res] = await getModel(modelName).update(adlog, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function getPayReadyLogs(page: string, count: string) {
    const [p, c] = [parseInt(page), parseInt(count)]
    let res = await getModel(modelName).findAll({ where: { payment: 0 }, offset: p, limit: c, order: [['modified', 'DESC']] })
    return res.map(r => r.get())
}

export async function setPaymentDone(uuids: Array<string>) {
    let [number, res] = await getModel(modelName).update({ payment: 1 }, { where: { uuid: { $in: uuids } } })
    return number > 0 ? res[0].get() : undefined
}

export async function getStopAdsLogs() {
    let res = await getModel(modelName).findAll({ where: { state: 'stop' }, order: [['modified', 'DESC']] })
    return res.map(r => r.get())
}

export async function findadslogs(sequelize: Sequelize, useruuid: string, cursor: number, limit: number) {
    let res = await sequelize.query(`select * from ads.adslog l , ads.ads a where l.aduuid =a.uuid and l.useruuid =${useruuid} order by l.modified desc  offset ${cursor} limit ${limit}`)
    return res
}

export async function findPenMen(time: number) {
    let res = await getModel(modelName).findAll({ where: { points: { $gt: 0 }, modified: { $gt: Sequelize.literal(`now() - interval '${time} day'`) as any } } })
    let useruuids = res.map(r => r.get("useruuid"))
    let resss
    if (useruuids.length > 0) {
        resss = await getModel(modelName).findAll({ where: { modified: { $lt: Sequelize.literal(`now() - interval '${time} day'`) as any}, useruuid: { $notIn: useruuids } } })
    } else {
        resss = await getModel(modelName).findAll({ where: { modified: { $lt: Sequelize.literal(`now() - interval '${time} day'`) as any } } })
    }
    return resss.map(r => r.get("useruuid"))
}

export async function findByAdsuuid(sequelize: Sequelize, aduuid: string, cursor: number, limit: number) {
    let res = await sequelize.query(`
    select l.*,u.headurl,u.nickname,u.username as name from ads.adslog l , users.users u
     where l.useruuid =u.uuid and l.state = 'fin'
     and l.aduuid = '${aduuid}'
     order by l.modified desc  offset ${cursor} limit ${limit}`, { type: "select" }) as any[]
    return res
}

export async function getCountByAdsUUID(aduuid: string) {
    let res = await getModel(modelName).count({ where: { aduuid, state: "fin" } })
    return res
}