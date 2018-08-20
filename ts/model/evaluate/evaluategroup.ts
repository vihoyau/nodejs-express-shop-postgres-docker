import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"
import * as moment from "moment"

const modelName = "evaluate.evaluategroup"

export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid: {                                 // UUID
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
        },
        useruuids: DataTypes.ARRAY(DataTypes.UUID),   //用户uuid
        activityuuid: DataTypes.UUID,   //活动uuid
        state: DataTypes.STRING,    //团的状态
        created: DataTypes.TIME,
        modified: DataTypes.TIME
    }, {
            timestamps: false,
            schema: "evaluate",
            freezeTableName: true,
            tableName: "evaluategroup",
        })
}

export async function createGroup(obj: any) {
    let res = await getModel(modelName).create(obj)
    return res.get()
}

export async function groupGetCount(obj: any) {
    if (obj)
        return await getModel(modelName).count({ where: obj })
    return await getModel(modelName).count()
}

export async function updateGroup(uuid: string, obj: any) {
    let [number, res] = await getModel(modelName).update(obj, { where: { uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function findGroup(activityuuid: string, cursor: number, limit: number) {
    let res = await getModel(modelName).findAll({ where: { activityuuid }, offset: cursor, limit: limit })
    return res.map(r => r.get())
}

export async function findByGroupUUID(uuid: string) {
    let res = await getModel(modelName).findByPrimary(uuid)
    return res ? res.get() : undefined
}

export async function findByState(act: string, state: string) {
    let res = await getModel(modelName).findAll({ where: { activityuuid: act, state: state } })
    return res.map(r => r.get())
}

//查找过期的团
export async function findExpiredGroup(seqz: Sequelize) {
    let now = moment().format('YYYY-MM-DD HH:mm:ss')

    let res = await seqz.query(`
        select g.* from evaluate.evaluategroup g, evaluate.evaluateactivity a
        where g.activityuuid = a.uuid
        and a.endtime <= '${now}'
        and g.state = 'processing'
    `, { type: 'select' }) as any[]
    return res
}
