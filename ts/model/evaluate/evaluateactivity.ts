import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"

const modelName = "evaluate.evaluateactivity"

export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid: {                                 // UUID
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
        },
        tag: DataTypes.STRING,  //标签
        amount: DataTypes.INTEGER,  //需要的人数
        starttime: DataTypes.STRING,    //开始时间
        endtime: DataTypes.STRING,  //结束时间
        state: DataTypes.STRING,    //状态
        gooduuid: DataTypes.UUID,   //商品uuid
        marketprice: DataTypes.FLOAT,   //市场价
        reserveprice: DataTypes.FLOAT,  //底价
        freeprobability: DataTypes.FLOAT,   //免单概率，【0，1】
        created: DataTypes.TIME,
        modified: DataTypes.TIME
    }, {
            timestamps: false,
            schema: "evaluate",
            freezeTableName: true,
            tableName: "evaluateactivity",
        })
}

export async function createEvaluateActivity(obj: any) {
    let res = await getModel(modelName).create(obj)
    return res.get()
}

export async function delEvaluateActivity(uuid: string) {
    await getModel(modelName).destroy({ where: { uuid: uuid } })
}

export async function actGetCount() {
    return await getModel(modelName).count()
}

export async function actGetCountByTag(sequelize: Sequelize, tag: string) {
    let res = await sequelize.query(`
    select count(*) from evaluate.evaluateactivity a
    where a.tag like '%${tag}%'`, { type: "SELECT" })
    return res[0].count
}

export async function findAllEvaluateActivityByTag(tag: string, cursor: number, limit: number) {
    let res = await getModel(modelName).findAll({
        where: {
            $or: [
                { tag: { $like: '%' + tag + '%' } }
            ]
        }, offset: cursor, limit: limit, order: [['created', 'desc']]
    })
    return res ? res.map(r => r.get()) : undefined
}

export async function updateEvaluateActivity(uuid: string, obj: any) {
    let [number, res] = await getModel(modelName).update(obj, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function findAllEvaluateActivity(cursor: number, limit: number) {
    let res = await getModel(modelName).findAll({ offset: cursor, limit: limit, })
    return res.map(r => r.get())
}

export async function findAllProcessingActivity(sequelize: Sequelize, cursor: number, limit: number, now: string) {
    let res = await sequelize.query(`
    select * from evaluate.evaluateactivity a
    where a.starttime<'${now}'
    and a.endtime>'${now}'
    and (a.state is null or a.state = '')
    offset ${cursor} limit ${limit}
    `, { type: "SELECT" })
    return res
}

export async function findByTag(sequelize: Sequelize, keyword: string) {
    return await sequelize.query(`
        select * from evaluate.evaluateactivity a
        where a.tag like '%${keyword}%'`)
}

//克隆一个活动，并重新定义时间段，旧的活动并没有删除，是为了不混淆旧活动的参与者
export async function updateEvaluateActivityUUID(sequelize: Sequelize, uuid: string, starttime: string, endtime: string) {
    return await sequelize.transaction(async t => {
        let res = await getModel(modelName).findByPrimary(uuid, { transaction: t })
        let obj = res.get()
        obj.starttime = starttime
        obj.endtime = endtime
        obj.state = ''
        delete obj.uuid

        let newres = await getModel(modelName).create(obj, { transaction: t })
        return newres.get()
    })
}

export async function findByPrimaryUUID(uuid: string) {
    let res = await getModel(modelName).findByPrimary(uuid)
    return res ? res.get() : undefined
}
