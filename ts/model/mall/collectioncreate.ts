import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"
//规格五张卡牌的情形下
const modelName = "mall.collectioncreate"
export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        ActivityName: DataTypes.CHAR(225),//活动名
        Tag: DataTypes.CHAR(225),//标签
        Starttime: DataTypes.CHAR(225),//开始时间
        Endtime: DataTypes.CHAR(225),//结束时间
        State: DataTypes.INTEGER,  // 状态：1-正在进行 0-未开启  2--已结束
        Point: DataTypes.INTEGER,//奖励积分
        ChipIdAmounts: DataTypes.INTEGER,//碎片1,2,3,4,5数量
        CardIdAmounts: DataTypes.INTEGER,
        Gooduuid: DataTypes.UUID,//商品id
        RedPacket: DataTypes.FLOAT,//红包金额
        Couponid: DataTypes.UUID,//优惠券id
        created: DataTypes.TIME,//创建时间
        modified: DataTypes.TIME,//修改时间
        Filename: DataTypes.ARRAY(DataTypes.STRING),//卡牌名称
        Images: DataTypes.ARRAY(DataTypes.STRING),//卡牌上传路径
        CardProbability: DataTypes.JSONB,//卡牌概率
        ChipProbability: DataTypes.JSONB,//碎片概率
        rewardmethod: DataTypes.INTEGER,//红包，商品，优惠券(0,1,2)
        goodtitle: DataTypes.STRING,//商品名称
        Coupontitle: DataTypes.STRING,//优惠券名称
        Reward: DataTypes.TEXT,//奖励说明
        ActivityRule: DataTypes.TEXT,//活动规则
        jrayImages: DataTypes.ARRAY(DataTypes.STRING),//灰色卡牌上传路径
        rewardImages: DataTypes.CHAR(225),//奖励图片
        backImages: DataTypes.CHAR(225),//背景图片
        primaryImages: DataTypes.CHAR(225),//主图图片
        isNoFortune:DataTypes.INTEGER,//是否展示运势
        collectiondone: DataTypes.ARRAY(DataTypes.STRING),//记录帮忙收集过该活动的用户
        rewardNumber:DataTypes.INTEGER,//获奖人数
        rewardDone:DataTypes.INTEGER//领奖人数
    }, {
            timestamps: false,
            schema: "mall",
            freezeTableName: true,
            tableName: "collectioncreate"
        })
}
//创建活动填写信息
export async function addcollection(addcollections: any) {
    try {
        console.log(addcollections)
        let res = await getModel(modelName).create(addcollections, { returning: true })
        return res ? res.get() : undefined
    } catch (e) {
        console.log(1111111)
        throw new Error(e)
    }

}

//查看收集卡牌活动名的信息
export async function find_ActivityName_Info() {
    let res = await getModel(modelName).findAll() as any[]
    return res.map(r => r.get())
}
//查找活动
export async function findByPrimary(uuid: string) {
    let res = await getModel(modelName).findByPrimary(uuid)
    return res ? res.get() : undefined
}
//一键激活
export async function updatecollection(tmp: any) {
    let res = await getModel(modelName).update({ State: 0, Starttime: tmp.Starttime, Endtime: tmp.Endtime }, { where: { uuid: tmp.uuid } })
    return res ? res : undefined
}
//运势开关
export async function getisNoFortune(isNoFortune: any,uuid:any) {
    let res = await getModel(modelName).update({ isNoFortune }, { where: { uuid } })
    return res ? res : undefined
}
//创建活动添加卡牌
export async function createCardcollection(tmp: any) {

    let res = await getModel(modelName).update({
        ChipIds: tmp.ChipIds,
        Filename: tmp.Filename,
        CardProbability: tmp.CardProbability,
        ChipProbability: tmp.ChipProbability
    }, { where: { uuid: tmp.uuid }, returning: true })
    return res ? res : undefined
}
/**
 * 创建收集卡牌活动
 */
export async function createActivity(obj: any) {
    await getModel(modelName).create(obj, { returning: true })
}
/**
 * 自动过期
 */
export async function activityAutoExpired(uuid: string) {
    let [number, res] = await getModel(modelName).update({ State: 2 }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}
export async function activityAutoOpen(uuid: string) {
    let [number, res] = await getModel(modelName).update({ State: 1 }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}
/**
 * 删除活动
 * @param uuid
 */
export async function deleteActivity(uuid: string) {
    await getModel(modelName).destroy({ where: { uuid: uuid } })
}
//查找查看所有的活动
export async function find_All_Activity() {
    let res = await getModel(modelName).findAll() as any[]
    return res ? res.map(r => r.get()) : undefined
}
/**
 * 修改活动
 * @param 
 * @param uuid
 */
export async function updateCollectionActivity(update: any, uuid: string) {
    // let [number, res] = await getModel(modelName).update({update}, { where: { uuid: uuid }, returning: true })
    let [number, res] = await getModel(modelName).update(update, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}
//模糊查询
export async function getCount(searchdata: String, Statedata: any) {
    let res = await getModel(modelName).count({
        where: {
            $or: [
                { ActivityName: { $like: '%' + searchdata + '%' } },
                { Tag: { $like: '%' + searchdata + '%' } }
            ], State: Statedata
        }
    })
    return res
}
//查询内容
export async function findColInfo(obj: any, cursor: number, limit: number) {
    let res = await getModel(modelName).findAll({ where: obj, order: [['created', "DESC"]], offset: cursor, limit: limit }) as any[]
    return res.map(r => r.get())
}
//模糊查询
export async function getCount1(searchdata: String) {
    let res = await getModel(modelName).count({
        where: {
            $or: [
                { ActivityName: { $like: '%' + searchdata + '%' } },
                { Tag: { $like: '%' + searchdata + '%' } }
            ]
        }
    })
    return res
}
//查询内容
export async function findColInfo1(obj1: any, cursor: number, limit: number) {
    let res = await getModel(modelName).findAll({ where: obj1, order: [['created', "DESC"]], offset: cursor, limit: limit }) as any[]
    return res.map(r => r.get())
}
//卡牌图片上传
export async function findimgByPrimary(uuid: string) {
    let res = await getModel(modelName).findByPrimary(uuid)
    return res ? res.get() : undefined
}
export async function addcollectionimg(Images: any, uuid: string) {
    let [number, res] = await getModel(modelName).update({ Images }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}
//黑白图片
export async function addcollectionjrayimg(jrayImages: any, uuid: string) {
    let [number, res] = await getModel(modelName).update({ jrayImages }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}
//奖励图片
export async function addcollectionrewardImage(rewardImages: any, uuid: string) {
    let res = await getModel(modelName).update({ rewardImages }, { where: { uuid: uuid }, returning: true })
    return res
}
//背景图片
export async function addcollectionbackimg(backImages: any, uuid: string) {
    let res = await getModel(modelName).update({ backImages }, { where: { uuid: uuid }, returning: true })
    return res
}
//主图图片
export async function addcollectionprimaryimg(primaryImages: any, uuid: string) {
    let res = await getModel(modelName).update({ primaryImages }, { where: { uuid: uuid }, returning: true })
    return res
}
//一键激活
export async function shutdown(uuid: any,Endtime:any,Starttime:any) {
    let res = await getModel(modelName).update({State: 0,Endtime,Starttime}, { where: { uuid:uuid } })
    return res ? res : undefined
}