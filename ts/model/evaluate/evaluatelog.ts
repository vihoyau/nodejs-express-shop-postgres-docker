import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"

const modelName = "evaluate.evaluatelog"

export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        groupuuid: {                                 // 团uuid
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
        },
        users: DataTypes.ARRAY(DataTypes.JSONB),   //用户信息
        activityuuid: DataTypes.UUID,
        state: DataTypes.STRING,   //状态 fulfill cancelled
        goodtitle: DataTypes.STRING,    //商品名
        turnover: DataTypes.FLOAT,  //成交价
        created: DataTypes.TIME //开团时间
    }, {
            timestamps: false,
            schema: "evaluate",
            freezeTableName: true,
            tableName: "evaluatelog",
        })
}

export async function insertEvaluateLog(obj: any) {
    let res = await getModel(modelName).create(obj)
    return res.get()
}

export async function findByState(act: string, state: string, cursor: number, limit: number) {
    let res = await getModel(modelName).findAll({
        where: { activityuuid: act, state: state }, offset: cursor, limit: limit
    })
    return res ? res.map(r => r.get()) : undefined
}

export async function getCountByStateAndActUUID(state: string, activityuuid: string) {
    let res = await getModel(modelName).count({ where: { state, activityuuid } })
    return res ? res : 0
}