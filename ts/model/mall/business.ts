import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"

const modelName = "mall.business"
export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        openid: DataTypes.CHAR(48),///openid
        business: DataTypes.CHAR(128),//商家名
        contacts: DataTypes.CHAR(128),//联系人
        phone: DataTypes.CHAR(24),
        licence: DataTypes.TEXT,
        state: DataTypes.ENUM('on', 'off'),//状态：on - 启用 off- 禁用
        address: DataTypes.JSONB,
        detailaddr: DataTypes.STRING,    //详细地址
        description: DataTypes.TEXT,
        ext: DataTypes.JSONB,
        adminruuid: DataTypes.UUID, //被哪个admin管理员所管理
        mallcrmuuid: DataTypes.UUID,  //被哪个mallcrm管理员所管理
        commission: DataTypes.INTEGER,  //商家分成
        created: DataTypes.TIME,
        modified: DataTypes.TIME,
    }, {
            timestamps: false,
            schema: "mall",
            freezeTableName: true,
            tableName: "business"
        })
}

/**
 * 添加商家
 * @param obj
 */
export async function insertbusiness(obj: any) {
    await getModel(modelName).create(obj, { returning: true })
}

/**
 * 获得商家列表
 * @param cursor
 * @param limit
 * @param searchdata
 */
export async function getbusinesslist(cursor: number, limit: number, searchdata: string) {
    searchdata = '%' + searchdata + '%'
    let res = await getModel(modelName).findAll({
        where: {
            $or: [{ business: { $like: searchdata } }, { contacts: { $like: searchdata } }, { phone: { $like: searchdata } }],
        },
        order: [['modified', 'DESC']],
        limit: limit,
        offset: cursor
    })
    return res.map(r => r.get())
}

/**
 * 获得商家列表记录数
 * @param searchdata
 */
export async function getCount(searchdata: string) {
    searchdata = '%' + searchdata + '%'
    let res = await getModel(modelName).count({
        where: {
            $or: [{ business: { $like: searchdata } }, { contacts: { $like: searchdata } }, { phone: { $like: searchdata } }],
        }
    })
    return res ? res : undefined
}

/**
 * 获得所有商家名称
 */
export async function getbusiness() {
    let res = await getModel(modelName).findAll({ attributes: ['uuid', 'business'], order: [['business', 'asc']] })
    return res ? res.map(r => r.get()) : undefined
}

/**
 * 获得商家详情
 * @param uuid
 */
export async function getByPrimary(uuid: string) {
    let res = await getModel(modelName).findOne({ where: { uuid: uuid } })
    return res ? res.get() : undefined
}

/**
 * 修改商家信息（or 禁用商家）
 * @param business
 * @param uuid
 */
export async function updatebusiness(business: any, uuid: string) {
    let [number, res] = await getModel(modelName).update(business, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}