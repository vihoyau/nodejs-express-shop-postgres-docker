import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"
import * as moment from "moment"

const modelName = "users.amountlog"

export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid: {                                 // UUID
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
        },
        useruuid: DataTypes.UUID,               // 对应的用户UUID
        amount: DataTypes.FLOAT,  //金额,单位是元
        points: DataTypes.INTEGER,  //积分
        mode: DataTypes.STRING, //方式
        time: DataTypes.STRING  //时间
    }, {
            timestamps: false,
            schema: "users",
            freezeTableName: true,
            tableName: "amountlog",
        })
}

export async function insertAmountLog(obj: any) {
    let res = await getModel(modelName).create(obj)
    return res.get()
}

export async function findTodayAmount(sequelize: Sequelize, useruuid: string) {
    let [now, zeroHour] = [moment().format('YYYY-MM-DD HH:mm:ss'), moment().format('YYYY-MM-DD 00:00:00')]
    let res = await sequelize.query(`
        select
            sum(amount)
        from users.amountlog a
        where a.useruuid='${useruuid}'
        and a.time>'${zeroHour}'
        and a.time<'${now}'
        `, { type: 'SELECT' })
    return parseInt(res[0].sum)
}

export async function findPointByUserUUID(sequelize: Sequelize, useruuid: string, start: number, length: number, starttime: string, endtime: string) {
    let res = await sequelize.query(`
        select a.*,u.username from users.amountlog a, users.users u
        where a.useruuid=u.uuid
        and a.time>'${starttime}'
        and a.time<'${endtime}'
        and a.points is not null
        and a.points >0
        and a.useruuid = '${useruuid}'
        order by a.time desc
        offset ${start}
        limit ${length}
    `, { type: 'select' }) as any[]
    return res
}

export async function findBalanceByUserUUID(sequelize: Sequelize, useruuid: string, start: number, length: number, starttime: string, endtime: string) {
    let res = await sequelize.query(`
        select a.*,u.username from users.amountlog a, users.users u
        where a.useruuid=u.uuid
        and a.time>'${starttime}'
        and a.time<'${endtime}'
        and a.amount is not null
        and a.amount >0
        and a.useruuid = '${useruuid}'
        order by a.time desc
        offset ${start}
        limit ${length}
    `, { type: 'select' }) as any[]
    return res
}

export async function getPointCountByUser(sequelize: Sequelize, useruuid: string, starttime: string, endtime: string) {
    let res = await sequelize.query(`
        select count(*) from users.amountlog a
        where a.useruuid='${useruuid}'
        and a.time>'${starttime}'
        and a.time<'${endtime}'
        and a.points is not null
        and a.points >0
    `, { type: 'SELECT' }) as any[]
    return res[0].count
}

export async function getBalanceCountByUser(sequelize: Sequelize, useruuid: string, starttime: string, endtime: string) {
    let res = await sequelize.query(`
        select count(*) from users.amountlog a
        where a.useruuid='${useruuid}'
        and a.time>'${starttime}'
        and a.time<'${endtime}'
        and a.amount is not null
        and a.amount >0
    `, { type: 'SELECT' }) as any[]
    return res[0].count
}
