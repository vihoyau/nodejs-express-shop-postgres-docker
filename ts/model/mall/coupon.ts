import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"

const modelName = "mall.coupon"
export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        businessuuid: DataTypes.UUID,//商家uuid
        business: DataTypes.CHAR(225),//商家名
        title: DataTypes.CHAR(225),//优惠券标题
        kind: DataTypes.CHAR(25),//优惠券的种类
        content: DataTypes.JSONB,
        price: DataTypes.INTEGER,//售卖价格
        point: DataTypes.INTEGER,//兑换积分
        tsrange: DataTypes.RANGE(),
        coupontype: DataTypes.CHAR(225),
        state: DataTypes.CHAR(20),
        num: DataTypes.INTEGER,
        description: DataTypes.TEXT,//描述
        goodsuuids: DataTypes.ARRAY(DataTypes.UUID),
        created: DataTypes.TIME,
        modified: DataTypes.TIME,
    }, {
            timestamps: false,
            schema: "mall",
            freezeTableName: true,
            tableName: "coupon"
        })
}

/**
 * 创建优惠券
 */
export async function insertCoupon(obj: any) {
    await getModel(modelName).create(obj, { returning: true })
}

/**
 * 获得优惠券详情
 * @param uuid
 */
export async function findByPrimary(uuid: string) {
    let res = await getModel(modelName).findByPrimary(uuid)
    return res ? res.get() : undefined
}

/**
 * 获得APP优惠券列表
 * @param uuid
 */
export async function getAPPCouponList(cursor: number, limit: number, kind: string) {
    let res = await getModel(modelName).findAll({
        where: {
            state: 'on',
            $or: [
                    {  kind: 'entity' ,  num: { $gt: 0 } },
                    { kind: { $in: ['mall', 'business'] } }
                    ],
            kind: { $like: "%" + kind + "%" } 
        },
        offset: cursor,
        limit: limit,
        order: [["created", "desc"]]
    })
    return res ? res.map(r => r.get()) : undefined
}

/**
 * 获得APP商家优惠券列表
 * @param uuid
 */
export async function getAPPBusinessCouponList(business: string) {
    let res = await getModel(modelName).findAll({
        where: {
            $or: [
                {  kind: 'business' ,  business: business  },
                { kind: 'mall' }
            ],
            state: 'on',
            num: { $gt: 0 }
        },
        order: [["created", "desc"]]
    })
    return res ? res.map(r => r.get()) : undefined
    /*    let res = await sequelize.query(`SELECT
        "mall.coupon".*,
        uu.uuid as id
    FROM
        "mall"."coupon" AS "mall.coupon"
    left join users.usercoupon as uu
    on "mall.coupon".uuid = uu.couponuuid
    WHERE
        (
            (
                "mall.coupon"."kind" = 'business'
                AND "mall.coupon"."business" = '${business}'
            )
            OR "mall.coupon"."kind" = 'mall'
        )
    AND "mall.coupon"."state" = 'on'
    AND uu.useruuid = '${useruuid}'
    ORDER BY
        "mall.coupon"."created" DESC`, { type: 'select' }) as any[]
        return res*/
}

/**
 * 获得优惠券列表
 */
export async function getCouponList(cursor: number, limit: number, searchdata: string, coupontype: any, kind: string, state: string) {
    coupontype = '%' + coupontype + '%'
    searchdata = '%' + searchdata + '%'
    kind = '%' + kind + '%'
    state = '%' + state + '%'
    let res = await getModel(modelName).findAll({
       /*  where: {
            $and: [
                { $or: [{ business: { $like: searchdata } }, { title: { $like: searchdata } }] },
                { $and: [, { coupontype: { $like: coupontype } }, { kind: { $like: kind } }, { state: { $like: state } }] }
            ]
        }, */
        where:{
            $or:[{ business: { $like: searchdata } }, { title: { $like: searchdata } }] ,
            coupontype: { $like: coupontype } ,
            kind: { $like: kind } ,
            state: { $like: state } 
        },
        order: [['created', 'DESC']],
        limit: limit,
        offset: cursor
    })
    return res ? res.map(r => r.get()) : undefined
}

/**
 * 获得优惠券列表记录数
 */
export async function getCount(searchdata: string, coupontype: any, kind: string, state: string) {
    coupontype = '%' + coupontype + '%'
    searchdata = '%' + searchdata + '%'
    kind = '%' + kind + '%'
    state = '%' + state + '%'
    let res = await getModel(modelName).count({
        where: {
                $or: [{ business: { $like: searchdata } }, { title: { $like: searchdata } }] ,
                coupontype: { $like: coupontype } ,
                kind: { $like: kind } ,
                state: { $like: state } 
        }
    })
    return res
}

/**
 * 获得所有优惠券
 */
export async function getAllCoupon(state: string) {
    let res = await getModel(modelName).findAll({ where: { tsrange: { $ne: null }, state: state } })
    return res ? res.map(r => r.get()) : undefined
}

/**
 * 修改优惠券信息
 * @param coupon
 * @param uuid
 */
export async function updateCouponInfo(coupon: any, uuid: string) {
    let [number, res] = await getModel(modelName).update(coupon, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

/**
 * 修改优惠券信息
 * @param coupon
 * @param uuid
 */
export async function updateCouponNum(uuid: string) {
    let [number, res] = await getModel(modelName).update({ num: Sequelize.literal(`num-1`) }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

/**
 * 自动过期
 */
export async function couponAutoExpired(state: string, uuid: string) {
    let [number, res] = await getModel(modelName).update({ state: state }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

/**
 * 删除优惠券
 * @param uuid
 */
export async function deleteCoupon(uuid: string) {
    await getModel(modelName).destroy({ where: { uuid: uuid } })
}