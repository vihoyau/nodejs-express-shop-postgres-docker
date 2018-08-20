import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"

const modelName = "ads.applaud"
export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        useruuid: DataTypes.UUID,
        adsuuid: DataTypes.UUID,
        state: DataTypes.ENUM('nice', 'low'),//赞   踩
        created: DataTypes.TIME,
        modified: DataTypes.TIME,
        commentuuid: DataTypes.UUID
    }, {
            timestamps: false,
            schema: "ads",
            freezeTableName: true,
            tableName: "applaud",
        })
}

/**
 *  根据adsuuid和useruuid查找点赞记录
 * @param adsuuid
 * @param useruuid
 */
export async function findByUseruuidAndAdsuuid(adsuuid: string, useruuid: string) {
    let res = await getModel(modelName).findOne({ where: { useruuid: useruuid, adsuuid: adsuuid } })
    return res ? res.get() : undefined
}

/**
 * 增加点赞记录
 * @param adsuuid
 * @param useruuid
 */
export async function insertApplaud(adsuuid: string, useruuid: string, state: string) {
    let res = await getModel(modelName).create({ adsuuid: adsuuid, useruuid: useruuid, state: state }, { returning: true })
    return res ? res.get() : undefined
}

/**
 * 取消点赞记录
 * @param uuid
 */
export async function deleteByAdsUuid(uuid: string) {
    await getModel(modelName).destroy({ where: { uuid: uuid } })
}

export async function queryUphistory (useruuid:string , commentuuid:string){
    let res = await getModel(modelName).findOne({ where: { useruuid: useruuid, commentuuid: commentuuid } })
    return res ? res.get() : undefined
}

export async function deleteByCommentUseruuid(useruuid:string , commentuuid:string){
    await getModel(modelName).destroy({ where: {  useruuid: useruuid, commentuuid: commentuuid } })
}

export async function insertCommentApplaud(commentuuid: string, useruuid: string, state: string) {
    let res = await getModel(modelName).create({ commentuuid: commentuuid, useruuid: useruuid, state: state }, { returning: true })
    return res ? res.get() : undefined
}