import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"

const [schema, table] = ["ads", "crmuser"]
const modelName = `${schema}.${table}`

export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
        },
        username: DataTypes.CHAR(128),
        password: DataTypes.CHAR(128),
        description: DataTypes.TEXT,
        state: DataTypes.ENUM("on", "off"),
        role: DataTypes.CHAR(24),
        perm: DataTypes.JSONB,
        phone: DataTypes.CHAR(24),
        email: DataTypes.CHAR(64),
        realname: DataTypes.CHAR(64),
        address: DataTypes.TEXT,
        mgruuids: DataTypes.ARRAY(DataTypes.UUID),
        ext: DataTypes.JSONB,
        created: DataTypes.TIME,
        modified: DataTypes.TIME,
    }, {
            timestamps: false,
            schema: schema,
            freezeTableName: true,
            tableName: table,
        })
}

export async function findByUsername(username: string) {
    let res = await getModel(modelName).findOne({ where: { username: username, $or: [{ state: 'on' }, { state: null },{state:'off'}] } })
    return res ? res.get() : undefined
}

export async function findByPrimary(uuid: string) {
    let res = await getModel(modelName).findOne({ where: { uuid: uuid } })
    return res ? res.get() : undefined
}

export async function insertCrmUser(obj: any) {
    let res = await getModel(modelName).create(obj)
    return res ? res.get() : undefined
}

export async function findAllBy(sequelize: Sequelize, searchdata: string, cursor: number, limit: number) {
    let res = await sequelize.query(`select * from "mall"."crmuser" where username like '%${searchdata}%' and phone like '%${searchdata}%' and email like '%${searchdata}%' and description like '%${searchdata}%' or state='on' or state='off' order by created desc offset ${cursor} limit ${limit}`, { type: "SELECT" })
    return res
}

export async function findAllByCount(sequelize: Sequelize, searchdata: string) {
    let res = await sequelize.query(`select count(*) from "mall"."crmuser" where username like '%${searchdata}%' or phone like '%${searchdata}%' or email like '%${searchdata}%' or description like '%${searchdata}%'`, { type: "SELECT" })
    return parseInt(res[0].count)
}

export async function resetPassword(useruuid: string, password: string) {
    let [number, res] = await getModel(modelName).update({ password: password }, { where: { uuid: useruuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function resetState(useruuid: string, state: string) {
    let [number, res] = await getModel(modelName).update({ state: state }, { where: { uuid: useruuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function deleteGoodsUser(useruuid: string) {
    await getModel(modelName).destroy({ where: { uuid: useruuid } })
}