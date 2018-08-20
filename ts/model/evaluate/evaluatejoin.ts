import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"

const modelName = "evaluate.evaluatejoin"

export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid: {                                 // UUID
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
        },
        useruuid: DataTypes.UUID,   //用户uuid
        activityuuid: DataTypes.UUID,   //活动uuid
        bid: DataTypes.FLOAT,   //出价
        addressuuid: DataTypes.UUID,    //地址uuid
        inputcount: DataTypes.INTEGER,  //输入出价次数
        leader: DataTypes.BOOLEAN,  //是否团员
        pay: DataTypes.BOOLEAN, //是否已经支付
        groupuuid: DataTypes.UUID,  //团uuid
        property: DataTypes.JSONB,  //选择的商品属性，大小颜色尺码等
        created: DataTypes.TIME,
        modified: DataTypes.TIME
    }, {
            timestamps: false,
            schema: "evaluate",
            freezeTableName: true,
            tableName: "evaluatejoin",
        })
}

export async function createEvaluatejoin(obj: any) {
    let res = await getModel(modelName).create(obj, { returning: true })
    return res.get()
}

export async function updateEvaluatejoin(uuid: string, obj: any) {
    let [number, res] = await getModel(modelName).update(obj, { where: { uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function findAllEvaluateJoinByActivityUUID(sequelize: Sequelize, activityuuid: string, cursor: number, limit: number) {
    let res = await sequelize.query(`
    select * from evaluate.evaluatejoin a
    where a.activityuuid = '${activityuuid}'
    and a.pay = true
    offset ${cursor} limit ${limit}
    `, { type: "SELECT" })
    return res
}

export async function findByUseruuidAndActuuid(useruuid: string, activityuuid: string) {
    let res = await getModel(modelName).findOne({ where: { useruuid: useruuid, activityuuid: activityuuid } })
    return res ? res.get() : undefined
}

export async function findUserByGroupUUID(groupuuid: string) {
    let res = await getModel(modelName).findAll({ where: { groupuuid: groupuuid }, order: [['bid', 'asc']] })
    return res.map(r => r.get())
}

export async function findJoinUUID(uuid: string) {
    let res = await getModel(modelName).findByPrimary(uuid)
    return res ? res.get() : undefined
}

export async function findByUserUUID(uuid: string) {
    let res = await getModel(modelName).findAll({ where: { useruuid: uuid } })
    return res.map(r => r.get())
}

export async function findByUseruuidAndGroupuuid(useruuid: string, groupuuid: string) {
    let res = await getModel(modelName).findOne({ where: { useruuid: useruuid, groupuuid: groupuuid } })
    return res ? res.get() : undefined
}