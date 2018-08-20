import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"

const modelName = "trend.shielded"
export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid: { //
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        useruuid: DataTypes.UUID,   //用户uuid
        shielduuid: DataTypes.UUID,  //屏蔽的那个用户uuid
        created: DataTypes.TIME
    }, {
            timestamps: false,
            schema: "trend",
            freezeTableName: true,
            tableName: "shielded",
        })
}

export async function insertShielded(obj: any) {
    let res = await getModel(modelName).create(obj, { returning: true })
    return res ? res.get() : undefined
}

export async function findAllByUserUUID(sequelize: Sequelize, useruuid: string, cursor: number, limit: number) {
    let res = await sequelize.query(`
    select u.nickname,u.username,u.headurl,s.shielduuid,s.useruuid,s.created from users.users u,trend.shielded s
    where u.uuid = s.shielduuid
    and s.useruuid = '${useruuid}'
    order by s.created desc
    offset ${cursor} limit ${limit}
    `, { type: 'select' }) as any[]
    return res
}


export async function findShielduuidByUserUUID(sequelize: Sequelize, useruuid: string) {
    let res = await sequelize.query(`
    select shielduuid from trend.shielded
    where useruuid = '${useruuid}'
    `, { type: 'select' }) as any[]
    return res
}


export async function deleteShielded(useruuid: string, shielduuid: string) {
    return await getModel(modelName).destroy({ where: { useruuid, shielduuid } })
}

export async function findAllShielded(sequelize: Sequelize, cursor: number, limit: number) {
    let res = await sequelize.query(`
    select u.nickname shieldnickname,u.username shieldusername,u.headurl shieldheadurl,s.created,s.useruuid
    from users.users u,trend.shielded s
    where u.uuid = s.shielduuid
    order by s.created desc
    offset ${cursor} limit ${limit}
    `, { type: 'select' }) as any[]
    return res
}

export async function getCount() {
    return await getModel(modelName).count()
}