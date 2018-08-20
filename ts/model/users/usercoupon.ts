import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"

const modelName = "users.usercoupon"
export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        useruuid: DataTypes.UUID,//用户uuid
        couponuuid: DataTypes.UUID,//商家优惠券uuid
        state: DataTypes.ENUM('new', 'used', 'expired'),//new新建 used已使用 expired过期
        selected: DataTypes.CHAR(225),//   null未选中
        created: DataTypes.TIME,
        modified: DataTypes.TIME,
    }, {
            timestamps: false,
            schema: "users",
            freezeTableName: true,
            tableName: "usercoupon"
        })
}

/**
 * 用户购买获得优惠券
 * @param useruuid
 * @param couponuuid
 */
export async function createdUsercoupon(useruuid: string, couponuuid: string) {
    await getModel(modelName).create({ useruuid: useruuid, couponuuid: couponuuid, state: 'new' })
}
/**
 * 新增一条用户优惠券
 * @param useruuid
 * @param couponuuid
 * @param sequelize
 */
export async function insertusercoupon(sequelize: Sequelize, useruuid: string, couponuuid: string) {
    await sequelize.transaction(async t => {
        await getModel(modelName).create({ useruuid: useruuid, couponuuid: couponuuid, state: 'new' }, { transaction: t, returning: true })
        await getModel("mall.coupon").update({ num: Sequelize.literal(`num-1`) }, { where: { uuid: couponuuid, num: { $gt: 0 } }, transaction: t, returning: true })
    })
}

/**
 * 根据useruuid,couponuuid查询
 * @param useruuid
 * @param couponuuid
 */
export async function getbyuseruuidandcouponuuid(useruuid: string, couponuuid: string) {
    let res = await getModel(modelName).findOne({ where: { useruuid: useruuid, couponuuid: couponuuid, state: 'new' } })
    return res ? res.get() : undefined
}

/**
 * 获得用户优惠券列表
 * @param useruuid
 */
export async function getusercouponlist(sequelize: Sequelize, useruuid: string, kind: string, state: string) {
    let res = await sequelize.query(`SELECT
    C.*,
    uc.uuid as cuuid,
    uc.state as cstate
FROM
	users.usercoupon AS uc
LEFT JOIN mall.coupon AS C ON uc.couponuuid = C .uuid
WHERE
	uc.useruuid = '${useruuid}'
AND C .kind = '${kind}'
AND uc.state like '%${state}%'
ORDER BY
	uc.created DESC
    `, { type: "select" }) as any[]
    return res ? res : undefined
}

/**
 * 获得所有用户优惠券列表(goodscrm)
 * @param useruuid
 */
export async function getcouponlistCount(sequelize: Sequelize, businessuuids: any[], searchdata: string, coupontype: string, state: string) {
    let company1 = "and c.businessuuid in ("
    if (businessuuids) {
        for (let i = 0; i < businessuuids.length; i++) {
            if (i == businessuuids.length - 1) {
                company1 = company1 + "'" + businessuuids[i] + "'"
            } else {
                company1 = company1 + "'" + businessuuids[i] + "',"
            }
        }
        company1 = company1 + ")"
    } else {
        company1 = ""
    }
    let res = await sequelize.query(`SELECT
    count(*)
FROM
	users.usercoupon AS uc
LEFT JOIN mall.coupon AS C ON uc.couponuuid = C .uuid
LEFT JOIN users.users AS u ON u.uuid = uc .useruuid
WHERE
1=1
  ${company1}
and (u.username like '%${searchdata}%' or c.business like '%${searchdata}%' or c.title like '%${searchdata}%' )
and  c.coupontype like '%${coupontype}%'
and  uc.state like '%${state}%'
    `, { type: "select" }) as any[]
    return res ? res[0].count : 0
}

/**
 * 获得所有用户优惠券列表(goodscrm)
 * @param useruuid
 */
export async function getcouponlist(sequelize: Sequelize, businessuuids: any[], cursor: number, limit: number, searchdata: string, coupontype: string, state: string) {
    let company1 = "and c.businessuuid in ("
    if (businessuuids) {
        for (let i = 0; i < businessuuids.length; i++) {
            if (i == businessuuids.length - 1) {
                company1 = company1 + "'" + businessuuids[i] + "'"
            } else {
                company1 = company1 + "'" + businessuuids[i] + "',"
            }
        }
        company1 = company1 + ")"
    } else {
        company1 = ""
    }
    let res = await sequelize.query(`SELECT
    C.business,
    c.title,
    c.uuid as cuuid,
    c.content,
    uc.uuid,
    u.username,
    uc.state,
    c.coupontype
FROM
	users.usercoupon AS uc
LEFT JOIN mall.coupon AS C ON uc.couponuuid = C .uuid
LEFT JOIN users.users AS u ON u.uuid = uc .useruuid
WHERE
1=1
  ${company1}
  and (u.username like '%${searchdata}%' or c.business like '%${searchdata}%' or c.title like '%${searchdata}%' )
  and  c.coupontype like '%${coupontype}%'
  and  uc.state like '%${state}%'
ORDER BY
    uc.created DESC
offset ${cursor}
limit ${limit}
    `, { type: "select" }) as any[]
    return res ? res : undefined
}

/**
 * 获得下单可用的优惠券
 * @param useruuid
 */
export async function getGoodsCouponList(sequelize: Sequelize, useruuid: string, business: string) {
    let res = await sequelize.query(`SELECT
    c.*,
    uc.selected,
    uc.uuid as cuuid
FROM
	users.usercoupon AS uc
LEFT JOIN mall.coupon AS C ON uc.couponuuid = C .uuid
WHERE
	(
		(
			c."kind" = 'business'
			AND c."business" = '${business}'
		)
		OR c."kind" = 'mall'
	)
AND c."state" = 'on'
AND uc. STATE = 'new'
AND uc.useruuid='${useruuid}'
and (uc.selected is null or uc.selected ='${business}')
ORDER BY
	uc.created DESC`, { type: "select" }) as any[]
    return res ? res : undefined
}

/**
 * 获得用户选中优惠券列表
 * @param useruuid
 */
export async function getUserSelectGoodsCoupon(sequelize: Sequelize, useruuid: string, business: string) {
    let businesssman = "("
    for (let i = 0; i < business.length; i++) {
        if (i == business.length - 1) {
            businesssman = businesssman + "'" + business[i] + "'"
        } else {
            businesssman = businesssman + "'" + business[i] + "',"
        }
    }
    businesssman = businesssman + ")"
    let res = await sequelize.query(`SELECT
	c.*,
    uc.selected,
    uc.uuid as cuuid
FROM
	users.usercoupon AS uc
LEFT JOIN mall.coupon AS C ON uc.couponuuid = C .uuid
WHERE
	(
		(
			c."kind" = 'business'
			AND c."business" in ${businesssman}
		)
		OR c."kind" = 'mall'
	)
AND c."state" = 'on'
AND uc. STATE = 'new'
AND uc.useruuid='${useruuid}'
and uc.selected in ${businesssman}
ORDER BY
	uc.created DESC`, { type: "select" }) as any[]
    return res ? res : undefined
}
/**
 * 获得用户选中优惠券列表
 * @param useruuid
 */
export async function getGoodsCouponLists(sequelize: Sequelize, useruuid: string, business: string) {
    let res = await sequelize.query(`SELECT
	uc.*,
    uc.selected,
    uc.uuid as cuuid
FROM
	users.usercoupon AS uc
LEFT JOIN mall.coupon AS C ON uc.couponuuid = C .uuid
WHERE
	(
		(
			c."kind" = 'business'
			AND c."business" = '${business}'
		)
		OR c."kind" = 'mall'
	)
AND c."state" = 'on'
AND uc. STATE = 'new'
AND uc.useruuid='${useruuid}'
and uc.selected='${business}'
ORDER BY
	uc.created DESC`, { type: "select" }) as any[]
    return res ? res : undefined
}

/**
 * 获得用户优惠券详情
 * @param uuid
 */
export async function getbyprimary(uuid: string) {
    let res = await getModel(modelName).findOne({ where: { uuid: uuid } })
    return res ? res.get() : undefined
}
//获得用户优惠券状态
export async function searchCouponState(uuid: string) {
    let res = await getModel(modelName).findOne({ where: { uuid: uuid } })
    return res ? res.get() : undefined
}
/**
 * 用户领取的优惠券自动过期
 */
export async function usercouponAutoExpired(state: string, couponuuid: string) {
    let [number, res] = await getModel(modelName).update({ state: state }, { where: { couponuuid: couponuuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

/**
 * 商家or用户手动使用
 */
export async function usedUsercoupon(state: string, uuid: string) {
    let [number, res] = await getModel(modelName).update({ state: state }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

/**
 * 下单时选择优惠券
 */
export async function updateSelected(uuid: string, selected: string) {
    let [number, res] = await getModel(modelName).update({ selected: selected }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

/**
 * 修改优惠券状态
 */
export async function updateCouponState(uuid: string, state: string) {
    let [number, res] = await getModel(modelName).update({ state: state }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

/**
 * 根据用户优惠券uuid查找优惠券
 */
export async function findCouponByUsercouponuuid(cuuid: string) {
    let usercoupon = await getModel(modelName).findOne({ where: { uuid: cuuid } })
    let usercouponuuid = usercoupon.get('couponuuid')
    let coupon = await getModel('mall.coupon').findOne({ where: { uuid: usercouponuuid } })
    return coupon ? coupon.get() : undefined
}
/**
 * 根据用户优惠券uuid查找优惠券
 */
export async function getusercouponuuid(couponuuid: string,useruuid:any) {
    let usercoupon = await getModel(modelName).findOne({ where: { couponuuid, useruuid } })
    return usercoupon
}