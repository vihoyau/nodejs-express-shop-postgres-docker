import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"
const modelName = "ads.ads"
export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        state: DataTypes.ENUM('new', 'on', 'off', 'approved', 'rejected', 'wait-ack'),
        deleted: DataTypes.INTEGER,
        advertiseruuid: DataTypes.UUID,
        title: DataTypes.CHAR(256),
        username: DataTypes.STRING, //创建这个广告的crm帐号
        content: DataTypes.TEXT,
        sumcontent: DataTypes.TEXT,
        pics: DataTypes.ARRAY(DataTypes.TEXT),
        video: DataTypes.ARRAY(DataTypes.TEXT),
        category: DataTypes.UUID,
        subcategory: DataTypes.UUID,
        typedesc: DataTypes.TEXT,
        company: DataTypes.TEXT,
        address: DataTypes.JSONB,
        addressinfo: DataTypes.TEXT,
        question: DataTypes.JSONB,
        question_ext: DataTypes.JSONB,//广告题目
        points: DataTypes.DOUBLE,
        totalpoints: DataTypes.DOUBLE,
        hot: DataTypes.INTEGER,
        tsrange: DataTypes.RANGE(DataTypes.DATE),
        keyword: DataTypes.TEXT,
        rejectmsg: DataTypes.TEXT,
        ext: DataTypes.JSONB,
        adsinfourl: DataTypes.TEXT,
        mold: DataTypes.ENUM('point', 'balance', 'two'),
        balance: DataTypes.DOUBLE,
        banner: DataTypes.ENUM('on', 'off'),
        totalbalance: DataTypes.DOUBLE,
        allbalance: DataTypes.DOUBLE,
        allpoint: DataTypes.DOUBLE,
        newaddress: DataTypes.TEXT,
        nice: DataTypes.INTEGER,//好评数
        low: DataTypes.INTEGER,//差评数
        position: DataTypes.INTEGER,//排列位置
        heat: DataTypes.INTEGER,//热度（是否为推荐商品）
        gooduuid: DataTypes.UUID,//广告所关联的商品id
        goodtitle: DataTypes.CHAR(50),//所关联商品名称
        commentsort: DataTypes.INTEGER,//推荐广告排序
        commentcatg: DataTypes.UUID,//推荐广告大类备份字段
        commentsubcatg: DataTypes.UUID,//推荐广告小类备份字段
        modified: DataTypes.TIME,
        created: DataTypes.TIME,
        coverpic: DataTypes.JSONB,
        ncommentcount: DataTypes.INTEGER,  //新的推荐广告排序
        unituuid: DataTypes.UUID,
        showamount: DataTypes.INTEGER,
        pointmount: DataTypes.INTEGER,
        status: DataTypes.INTEGER,
        description: DataTypes.TEXT,
        pic_mode: DataTypes.INTEGER,
        tempstatus:DataTypes.INTEGER,
        isads:DataTypes.INTEGER
    }, {
            timestamps: false,
            schema: "ads",
            freezeTableName: true,
            tableName: "ads",
        })
}

export async function findAdsByOn() {
    let res = await getModel(modelName).findAll({ where: { state: "on" } })
    return res.map(r => r.get())
}

export async function findadsByApproved() {
    let res = await getModel(modelName).findAll({ where: { state: "approved" } })
    return res.map(r => r.get())
}

export async function getByType(seque: Sequelize, subcategory: string, addressComponent: any, controltimeadsarr: any[], cursor: any, limit: any) {
    let r = await seque.query(`SELECT
	adv.uuid
    FROM
	ads.advertiser adv,
	ads.crmuser crmu,
	users.users_ext uext
    WHERE
	adv.crmuuid = crmu.uuid
    AND crmu.uuid = uext.uuid
    AND uext.crm_balance > 0`, { type: "SELECT" }) as any[]
    let advuuid = "("
    for (let j = 0; j < r.length; j++) {
        if (j == r.length - 1) {
            advuuid = advuuid + "'" + r[j].uuid + "'"
        } else {
            advuuid = advuuid + "'" + r[j].uuid + "',"
        }
    }
    advuuid = advuuid + ")"
    let ctrl = "("
    for (let i = 0; i < controltimeadsarr.length; i++) {
        if (i == controltimeadsarr.length - 1) {
            ctrl = ctrl + "'" + controltimeadsarr[i] + "'"
        } else {
            ctrl = ctrl + "'" + controltimeadsarr[i] + "',"
        }
    }
    ctrl = ctrl + ")"
    if (subcategory) {
        let res = await seque.query(`select * from ads.ads a, ads.ads_ext b where a.uuid=b.uuid and subcategory='${subcategory}' and state = 'on'
         and deleted=0 and a.uuid in ${ctrl} and a.advertiseruuid in ${advuuid} order by a.created desc offset ${cursor} limit ${limit}`, { type: "SELECT" }) as any[]
        return res
    }
    let res = await seque.query(`select * from ads.ads a, ads.ads_ext b where a.uuid=b.uuid  and state = 'on' and deleted=0
    and a.uuid in ${ctrl}  and a.advertiseruuid in ${advuuid} order by a.created desc offset ${cursor} limit ${limit}`, { type: "SELECT" }) as any[]
    return res
}

export async function getByCategory(seque: Sequelize, category: string, addressComponent: any, controltimeadsarr: any[], cursor: any, limit: any) {
    let r = await seque.query(`SELECT
	adv.uuid
    FROM
	ads.advertiser adv,
	ads.crmuser crmu,
	users.users_ext uext
    WHERE
	adv.crmuuid = crmu.uuid
    AND crmu.uuid = uext.uuid
    AND uext.crm_balance > 0`, { type: "SELECT" }) as any[]
    let advuuid = "("
    for (let j = 0; j < r.length; j++) {
        if (j == r.length - 1) {
            advuuid = advuuid + "'" + r[j].uuid + "'"
        } else {
            advuuid = advuuid + "'" + r[j].uuid + "',"
        }
    }
    advuuid = advuuid + ")"
    let ctrl = "("
    for (let i = 0; i < controltimeadsarr.length; i++) {
        if (i == controltimeadsarr.length - 1) {
            ctrl = ctrl + "'" + controltimeadsarr[i] + "'"
        } else {
            ctrl = ctrl + "'" + controltimeadsarr[i] + "',"
        }
    }
    ctrl = ctrl + ")"
    if (category) {
        let res = await seque.query(`select * from ads.ads a, ads.ads_ext b where a.uuid=b.uuid and category='${category}'
        and state = 'on' and deleted=0 and status=1 and a.uuid in ${ctrl}
        and a.advertiseruuid in ${advuuid} order by a.created desc offset ${cursor} limit ${limit}`, { type: "SELECT" }) as any[]
        return res
    }
    let res = await seque.query(`select * from ads.ads a, ads.ads_ext b where a.uuid=b.uuid  and state = 'on'
    and deleted=0 and status=1 and a.uuid in ${ctrl} and a.advertiseruuid in ${advuuid} order by a.created desc offset ${cursor} limit ${limit}`, { type: "SELECT" }) as any[]
    return res
}
/**
 * 推荐广告列表（推荐页）
 * @param subcategory
 */
export async function encommentedlist(subcategory: string) {
    let res = await getModel(modelName).findAll({
        where: {
            commentcatg: { $ne: null },
            commentsubcatg: { $ne: null },
            subcategory: subcategory,
            state:'on',
            status:1
        },
        order: [['ncommentcount', 'asc']]
    })
    return res ? res.map(r => r.get()) : undefined
}


export async function getCount(sequelize: Sequelize, searchdata: string, state: string, advertiseruuids: any) {
    let selectads


    if (advertiseruuids === undefined || advertiseruuids.length === 0) {

        if (state === "") {
            selectads = `SELECT
	count(*)
FROM
	ads.ads AS A
WHERE
	A ."state" not In ('wait-ack')
AND A .deleted = 0
AND (
	 title LIKE '%${searchdata}%'
	OR A .keyword LIKE '%${searchdata}%'
	OR
 to_char(
		A .created,
		'YYYY-MM-DD HH24:MI:SS'
	) like '%${searchdata}%'
)`
        } else {
            selectads = `SELECT
	count(*)
FROM
	ads.ads AS A
WHERE
	A ."state" in ('${state}')
AND A .deleted = 0
AND (
	 title LIKE '%${searchdata}%'
	OR A .keyword LIKE '%${searchdata}%'
	OR
 to_char(
		A .created,
		'YYYY-MM-DD HH24:MI:SS'
	) like '%${searchdata}%'
)`
        }
    } else {
        let advertiseruuid = "("
        for (let i = 0; i < advertiseruuids.length; i++) {
            if (i == advertiseruuids.length - 1) {
                advertiseruuid = advertiseruuid + "'" + advertiseruuids[i] + "'"
            } else {
                advertiseruuid = advertiseruuid + "'" + advertiseruuids[i] + "',"
            }
        }
        advertiseruuid = advertiseruuid + ")"
        if (state === "") {
            selectads = `SELECT
	count(*)
FROM
	ads.ads AS A
WHERE
	A ."state" not In ('wait-ack')
AND A .deleted = 0
AND (
	 title LIKE '%${searchdata}%'
	OR A .keyword LIKE '%${searchdata}%'
	OR
 to_char(
		A .created,
		'YYYY-MM-DD HH24:MI:SS'
	) like '%${searchdata}%'
)
and a.advertiseruuid in ${advertiseruuid}`

        } else {
            selectads = `SELECT
	count(*)
FROM
	ads.ads AS A
WHERE
	A ."state" in ('${state}')
AND A .deleted = 0
AND (
	 title LIKE '%${searchdata}%'
	OR A .keyword LIKE '%${searchdata}%'
	OR
 to_char(
		A .created,
		'YYYY-MM-DD HH24:MI:SS'
	) like '%${searchdata}%'
)
and a.advertiseruuid in ${advertiseruuid}`
        }
    }

    let res = await sequelize.query(selectads, { type: "select" }) as any[]
    return parseInt(res[0].count)
}

export async function getadsAll(sequelize: Sequelize, searchdata: string, state: string, company: any, cursor: number, limit: number) {
    let selectads

    if (company === undefined || company.length === 0) {

        if (state === "") {
            selectads = `SELECT
	A.*,
    ae.views,
    ae.virtviews
FROM
	ads.ads AS A
    ,ads.ads_ext as ae
WHERE
a.uuid=ae.uuid
and
	A ."state" not In ('wait-ack')
AND A .deleted = 0
AND (
	A .company LIKE '%${searchdata}%'
	OR title LIKE '%${searchdata}%'
	OR A .keyword LIKE '%${searchdata}%'
	OR
 to_char(
		A .created,
		'YYYY-MM-DD HH24:MI:SS'
	) like '%${searchdata}%'
)

order by a.created desc
offset ${cursor}
limit ${limit}`
        } else {
            selectads = `SELECT
	A.*,
    ae.views,
    ae.virtviews
FROM
	ads.ads AS A
    ,ads.ads_ext as ae
WHERE
a.uuid=ae.uuid
and
	A ."state" in ('${state}')
AND A .deleted = 0
AND (
	A .company LIKE '%${searchdata}%'
	OR title LIKE '%${searchdata}%'
	OR A .keyword LIKE '%${searchdata}%'
	OR
 to_char(
		A .created,
		'YYYY-MM-DD HH24:MI:SS'
	) like '%${searchdata}%'
)
order by a.created desc
offset ${cursor}
limit ${limit}`

        }
    } else {
        let company1 = "("
        for (let i = 0; i < company.length; i++) {
            if (i == company.length - 1) {
                company1 = company1 + "'" + company[i] + "'"
            } else {
                company1 = company1 + "'" + company[i] + "',"
            }
        }
        company1 = company1 + ")"
        if (state === "") {
            selectads = `SELECT
	A.*,
    ae.views,
    ae.virtviews
FROM
	ads.ads AS A
    ,ads.ads_ext as ae
WHERE
a.uuid=ae.uuid
and
	A ."state" not In ('wait-ack')
AND A .deleted = 0
AND (
	A .company LIKE '%${searchdata}%'
	OR title LIKE '%${searchdata}%'
	OR A .keyword LIKE '%${searchdata}%'
	OR
 to_char(
		A .created,
		'YYYY-MM-DD HH24:MI:SS'
	) like '%${searchdata}%'
)
and a.company in ${company1}
order by a.created desc
offset ${cursor}
limit ${limit}`

        } else {
            selectads = `SELECT
	A.*,
    ae.views,
    ae.virtviews
FROM
	ads.ads AS A
    ,ads.ads_ext as ae
WHERE
a.uuid=ae.uuid
and
	A ."state"  in ('${state}')
AND A .deleted = 0
AND (
	A .company LIKE '%${searchdata}%'
	OR title LIKE '%${searchdata}%'
	OR A .keyword LIKE '%${searchdata}%'
	OR
 to_char(
		A .created,
		'YYYY-MM-DD HH24:MI:SS'
	) like '%${searchdata}%'
)
and a.company in ${company1}
order by a.created desc
offset ${cursor}
limit ${limit}`
        }
    }
    let res = await sequelize.query(selectads, { type: "select" }) as any[]
    return res
}

export async function getByCompany(sequelize: Sequelize, searchdata: string, state: string, advertiseruuids: any, cursor: number, limit: number) {
    let selectads

    if (advertiseruuids === undefined || advertiseruuids.length === 0) {

        if (state === "") {
            selectads = `SELECT
	A.*,
    ae.views,
    ae.virtviews
FROM
	ads.ads AS A
    ,ads.ads_ext as ae
WHERE
a.uuid=ae.uuid
and
	A ."state" not In ('wait-ack')
AND A .deleted = 0
AND (
	 title LIKE '%${searchdata}%'
	OR A .keyword LIKE '%${searchdata}%'
	OR
 to_char(
		A .created,
		'YYYY-MM-DD HH24:MI:SS'
	) like '%${searchdata}%'
)

order by a.created desc
offset ${cursor}
limit ${limit}`
        } else {
            selectads = `SELECT
	A.*,
    ae.views,
    ae.virtviews
FROM
	ads.ads AS A
    ,ads.ads_ext as ae
WHERE
a.uuid=ae.uuid
and
	A ."state" in ('${state}')
AND A .deleted = 0
AND (
	 title LIKE '%${searchdata}%'
	OR A .keyword LIKE '%${searchdata}%'
	OR
 to_char(
		A .created,
		'YYYY-MM-DD HH24:MI:SS'
	) like '%${searchdata}%'
)
order by a.created desc
offset ${cursor}
limit ${limit}`
        }
    } else {
        let advertiseruuid = "("
        for (let i = 0; i < advertiseruuids.length; i++) {
            if (i == advertiseruuids.length - 1) {
                advertiseruuid = advertiseruuid + "'" + advertiseruuids[i] + "'"
            } else {
                advertiseruuid = advertiseruuid + "'" + advertiseruuids[i] + "',"
            }
        }
        advertiseruuid = advertiseruuid + ")"
        if (state === "") {
            selectads = `SELECT
	A.*,
    ae.views,
    ae.virtviews
FROM
	ads.ads AS A
    ,ads.ads_ext as ae
WHERE
a.uuid=ae.uuid
and
	A ."state" not In ('wait-ack')
AND A .deleted = 0
AND (
	 title LIKE '%${searchdata}%'
	OR A .keyword LIKE '%${searchdata}%'
	OR
 to_char(
		A .created,
		'YYYY-MM-DD HH24:MI:SS'
	) like '%${searchdata}%'
)
and a.advertiseruuid in ${advertiseruuid}
order by a.created desc
offset ${cursor}
limit ${limit}`

        } else {
            selectads = `SELECT
	A.*,
    ae.views,
    ae.virtviews
FROM
	ads.ads AS A
    ,ads.ads_ext as ae
WHERE
a.uuid=ae.uuid
and
	A ."state"  in ('${state}')
AND A .deleted = 0
AND (
	 title LIKE '%${searchdata}%'
	OR A .keyword LIKE '%${searchdata}%'
	OR
 to_char(
		A .created,
		'YYYY-MM-DD HH24:MI:SS'
	) like '%${searchdata}%'
)
and a.advertiseruuid in ${advertiseruuid}
order by a.created desc
offset ${cursor}
limit ${limit}`
        }
    }
    let res = await sequelize.query(selectads, { type: "select" }) as any[]
    return res
}

export async function getHot(seque: Sequelize, cursor: number, limit: number, addressComponent: any) {
    let city = addressComponent.city
    let province = addressComponent.province
    let area = addressComponent.area
    let sql = ''
    if (city === '全国') {
        city = null
    }
    if (city && province && area) {
        sql = "AND(newaddress LIKE '%全国%' or newaddress LIKE '%" + city + "%'  or newaddress = '" + province + "' or newaddress LIKE '%" + area + "%')"
    }
    let res = await seque.query(`SELECT
	*
FROM
	ads.ads A,
	ads.ads_ext b
WHERE
	A .uuid = b.uuid
AND STATE = 'on'
AND deleted = 0
${sql}
ORDER BY
	A .heat DESC,
        A.POSITION ASC
offset ${cursor} limit ${limit}`, { type: "SELECT" }) as any[]
    return res
}

/**
 * 获得热门广告列表
 * @param seque
 * @param cursor
 * @param limit
 * @param searchdata
 */
export async function getCrmHotCount(seque: Sequelize, searchdata: string) {
    let res = await seque.query(`select count(*) from ads.ads a, ads.ads_ext b where a.uuid = b.uuid and state = 'on' and deleted= 0 and a.heat = 1  and(newaddress like '%${searchdata}%' or title like '%${searchdata}%' or keyword like '%${searchdata}%' ) `, { type: "SELECT" }) as any[]
    return res[0].count
}

/**
 * 获得热门广告列表
 * @param seque
 * @param cursor
 * @param limit
 * @param searchdata
 */
export async function getCrmHot(seque: Sequelize, cursor: number, limit: number, searchdata: string) {
    let res = await seque.query(`select * from ads.ads a, ads.ads_ext b where a.uuid = b.uuid and state = 'on' and deleted= 0 and a.heat = 1 and(newaddress like '%${searchdata}%' or title like '%${searchdata}%' or keyword like '%${searchdata}%' ) order by  a.position asc offset ${cursor} limit ${limit}`, { type: "SELECT" }) as any[]
    return res
}

export async function getByKeyword(seque: Sequelize, keyword: string, cursor: number, limit: number, addressComponent: any) {
    let res = await seque.query(`SELECT
			A .*, ae.views,
        ae.virtviews
		FROM
			ads.ads AS A
		LEFT JOIN ads.ads_ext AS ae ON A .uuid = ae.uuid
		WHERE
			A .STATE = 'on'
		AND A .deleted = 0
        AND (A .keyword LIKE '%${keyword}%' or A.title like '%${keyword}%')
        order by A.created desc
         OFFSET ${cursor}
		LIMIT ${limit}`, { type: "SELECT" }) as any[]
    return res
}
export async function getFavoriteByUuid(seque: Sequelize, uuid: Array<string>) {
    // let res = await getModel(modelName).findAll({ where: { uuid: { $in: uuid }, deleted: 0 } })
    let uuids = "("
    for (let i = 0; i < uuid.length; i++) {
        if (i == uuid.length - 1) {
            uuids = uuids + "'" + uuid[i] + "'"
        } else {
            uuids = uuids + "'" + uuid[i] + "',"
        }
    }
    uuids = uuids + ")"
    let res = await seque.query(`SELECT
        *
        FROM
	ads.ads AS A
LEFT JOIN ads.ads_ext AS ae ON A .uuid = ae.uuid
WHERE
	A .uuid IN ${uuids}
AND A .deleted = 0
AND A ."state" = 'on'`, { type: "select" }) as any[]
    return res
}

export async function findByPrimary(uuid: string) {
    let res = await getModel(modelName).findByPrimary(uuid)
    return res ? res.get() : undefined
}

export async function delet(uuid: string) {
    //return await collection.update({ _id: new ObjectID(uuid) }, { $set: { del: 1 } })
    let [number] = await getModel(modelName).update({ deleted: 1 }, { where: { uuid: uuid }, returning: true })
    return number

}

export async function insertAds(seqz: Sequelize, company: string, username: string, getAdvertiseruuid: string) {
    return await seqz.transaction(async t => {

        let ads = await getModel(modelName).create({ company, username, advertiseruuid: getAdvertiseruuid }, { transaction: t, returning: true })
        let uuid = ads.get("uuid")
        return getModel("ads.ads_ext").create({ uuid: uuid }, { transaction: t })
    })
}


export async function updateByUuid(upde: any, uuid: string) {
    let [number, res] = await getModel(modelName).update(upde, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function updateByStateUuid(state: string, uuid: string) {
    let [number, res] = await getModel(modelName).update({ state: state }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function updateBanner(uuid: string) {
    let [number, res] = await getModel(modelName).update({ banner: 'on' }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function deleteBanner(uuid: string) {
    let [number, res] = await getModel(modelName).update({ banner: 'off' }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function getBanner() {
    let res = await getModel(modelName).findAll({ where: { state: "on", deleted: 0, banner: 'on', status: 1 }, order: [['position', 'asc']] })
    return res.map(r => r.get())
}

export async function updateDeletedsub(subcategory: string) {
    let [number, res] = await getModel(modelName).update({ deleted: 1, subcategory: null }, { where: { subcategory: subcategory }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function updateDeleted(category: string) {
    let [number, res] = await getModel(modelName).update({ deleted: 1, category: null, subcategory: null }, { where: { category: category }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function modifilyPics(uuid: string, pics: string) {
    let [number, res] = await getModel(modelName).update({ pics: pics }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function modifilyVideo(uuid: string, video: string) {
    let [number, res] = await getModel(modelName).update({ video: video }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

/**
 * 广告点赞
 * @param uuid
 */
export async function updateNice(uuid: string) {
    let [number, res] = await getModel(modelName).update({ nice: Sequelize.literal(`nice+ 1`) }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

/**
 * 广告踩
 * @param uuid
 */
export async function updateLow(uuid: string) {
    let [number, res] = await getModel(modelName).update({ low: Sequelize.literal(`low+ 1`) }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

/**
 * 取消点赞
 * @param uuid
 * @param low
 * @param nice
 */
export async function updateApplaud(uuid: string, low: number, nice: number) {
    let [number, res] = await getModel(modelName).update({ low: Sequelize.literal(`low- ${low}`), nice: Sequelize.literal(`nice- ${nice}`) }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

/**
 * 修改广告排列位置
 * @param sequelize
 * @param rise
 * @param drop
 */
export async function updateHotAdsPosition(sequelize: Sequelize, rise: string, drop: string) {
    await sequelize.transaction(async t => {
        let before = await getModel(modelName).findByPrimary(rise, { transaction: t })
        let beforeposition = before.get('position')
        let after = await getModel(modelName).findByPrimary(drop, { transaction: t })
        let afterposition = after.get('position')
        await getModel(modelName).update({ position: beforeposition }, { where: { uuid: drop }, returning: true })
        await getModel(modelName).update({ position: afterposition }, { where: { uuid: rise }, returning: true })
    })
}

/**
 * 修改广告排列位置
 * @param sequelize
 * @param uuid
 */
export async function adsTop(sequelize: Sequelize, uuid: string) {
    await sequelize.transaction(async t => {
        let before = await getModel(modelName).findAll({ order: [["position", "asc"]], limit: 1 })
        let minposition = before[0].get('position')
        await getModel(modelName).update({ position: minposition - 1 }, { where: { uuid: uuid }, returning: true })
    })
}
/**
 * 设置热门广告
 * @param sequelize
 * @param uuid
 * @param heat
 */
export async function updateHeat(uuid: string, heat: number) {
    let [number, res] = await getModel(modelName).update({ heat: heat }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

/**
 * 设置为推荐广告（推荐页）
 * @param sequelize
 * @param category
 * @param subcategory
 * @param uuid
 */
export async function commentedads(sequelize: Sequelize, category: string, subcategory: string, uuid: string) {
    await sequelize.transaction(async t => {
        await getModel(modelName).update({ commentcatg: Sequelize.literal(`category`), commentsubcatg: Sequelize.literal(`subcategory`) }, { where: { uuid: uuid }, returning: true, transaction: t })
        let [number, res] = await getModel(modelName).update({ category: category, subcategory: subcategory }, { where: { uuid: uuid }, returning: true, transaction: t })
        return number > 0 ? res[0].get() : undefined
    })
}

/**
 * 取消推荐广告（推荐页）
 * @param sequelize
 * @param uuid
 */
export async function encommentedads(sequelize: Sequelize, uuid: string) {
    await sequelize.transaction(async t => {
        await getModel(modelName).update({ category: Sequelize.literal(`commentcatg`), subcategory: Sequelize.literal(`commentsubcatg`) }, { where: { uuid: uuid }, returning: true, transaction: t })
        let [number, res] = await getModel(modelName).update({ commentcatg: null, commentsubcatg: null }, { where: { uuid: uuid }, returning: true, transaction: t })
        return number > 0 ? res[0].get() : undefined
    })
}


/**
 * 修改推荐广告排列位置
 * @param sequelize
 * @param rise
 * @param drop
 */
export async function updateCommentAds(sequelize: Sequelize, rise: string, drop: string) {
    await sequelize.transaction(async t => {
        let before = await getModel(modelName).findByPrimary(rise, { transaction: t })
        let beforeposition = before.get('commentsort')
        let after = await getModel(modelName).findByPrimary(drop, { transaction: t })
        let afterposition = after.get('commentsort')
        await getModel(modelName).update({ commentsort: beforeposition }, { where: { uuid: drop }, returning: true })
        await getModel(modelName).update({ commentsort: afterposition }, { where: { uuid: rise }, returning: true })
    })
}

export async function modifilyCoverpic(uuid: string, pic: any) {
    let [number, res] = await getModel(modelName).update({ coverpic: pic }, { where: { uuid: uuid }, returning: true });
    return number > 0 ? res[0].get() : undefined;
}

export async function queryCoverpic(uuid: string) {
    let res = getModel(modelName).findOne({ where: { uuid: uuid } });
    return res.get('coverpic') ? res.get('coverpic') : undefined;
}
export async function updateAdsCommentsort(adsUuid: string, position: number) {
    let [number, res] = await getModel(modelName).update({ ncommentcount: position }, { where: { uuid: adsUuid }, returning: true });
    return number > 0 ? res : undefined;
}

export async function insertBeforePutonads(sequelize: Sequelize, company: string, unituuid: string, advertiseruuid: any, username: any) {
    let date = new Date();
    let date1 = new Date(1);
    let tsrange = [];
    tsrange.push(date1.toLocaleString());
    tsrange.push(date.toLocaleString());
    if (advertiseruuid == undefined) {
        let ads = await getModel(modelName).create({ company: company, unituuid: unituuid, tsrange: tsrange,pic_mode:1,state:'off' }, { returning: true })
        let uuid = ads.get("uuid")
        getModel("ads.ads_ext").create({ uuid: uuid })
        return ads ? ads : undefined
    } else {
        let ads = await getModel(modelName).create({ username, company: advertiseruuid.company, advertiseruuid: advertiseruuid.uuid, unituuid: unituuid, tsrange: tsrange, pic_mode: 1, state: 'off' }, { returning: true })
        let uuid = ads.get("uuid")
        getModel("ads.ads_ext").create({ uuid: uuid }, );
        return ads ? ads : undefined
    }

}
export async function updatePutonads(adsuuid: string, ads: any) {
    let [num, res] = await getModel(modelName).update(ads, { where: { uuid: adsuuid }, returning: true })
    return num > 0 ? res[0].get() : undefined;
}

export async function queryPutonadsByuuid(adsuuid: string) {
    let res = await getModel(modelName).findOne({ where: { uuid: adsuuid } });
    return res ? res.get() : undefined;
}
export async function queryPutonadsbyunituuid(sequelize: Sequelize, unitarr: any[]) {
    if (unitarr != undefined && unitarr.length != 0) {
        let stringunit = "(";
        for (let j = 0; j < unitarr.length; j++) {
            stringunit = stringunit + "'" + unitarr[j].uuid + "'";
            if (j != unitarr.length - 1) {
                stringunit = stringunit + ","
            }
        }
        stringunit = stringunit + ")";
        let res = await sequelize.query(`select uuid from ads.ads where unituuid in ${stringunit}`, { type: 'select' })
        return res
    } else {
        return [];
    }
}
export async function queryPutonadsbyunituuid2(sequelize: Sequelize, unitarr: any[], category: any) {
    if (unitarr != undefined && unitarr.length != 0) {
        let stringunit = "(";
        for (let j = 0; j < unitarr.length; j++) {
            stringunit = stringunit + "'" + unitarr[j].uuid + "'";
            if (j != unitarr.length - 1) {
                stringunit = stringunit + ","
            }
        }
        stringunit = stringunit + ")";
        let res = await sequelize.query(`select uuid from ads.ads where unituuid in ${stringunit} and category='${category}'`, { type: 'select' })
        return res
    } else {
        return [];
    }
}

export async function queryPutonadsbyunituuid3(sequelize: Sequelize, unitarr: any[], category: any) {
    if (unitarr != undefined && unitarr.length != 0) {
        let stringunit = "(";
        for (let j = 0; j < unitarr.length; j++) {
            stringunit = stringunit + "'" + unitarr[j].uuid + "'";
            if (j != unitarr.length - 1) {
                stringunit = stringunit + ","
            }
        }
        stringunit = stringunit + ")";
        let res = await sequelize.query(`select uuid from ads.ads where unituuid in ${stringunit} and subcategory='${category}'`, { type: 'select' })
        return res
    } else {
        return [];
    }
}

export async function upadsBrowser(adsuuid: string) {
    let ads = await getModel(modelName).findOne({ where: { uuid: adsuuid } });
    let [number, res] = await getModel(modelName).update({ showamount: ads.get('showamount') + 1 }, { where: { uuid: adsuuid } });
    return number > 0 ? res : undefined;
}
export async function upadspoints(adsuuid: string) {
    let ads = await getModel(modelName).findOne({ where: { uuid: adsuuid } });
    let [number, res] = await getModel(modelName).update({ pointmount: ads.get('pointmount') + 1 }, { where: { uuid: adsuuid } });
    return number > 0 ? res : undefined;
}

export async function queryadvertiserAdsAll(advertiseruuid?: string) {
    if (advertiseruuid) {
        let re = await getModel(modelName).findAll({ where: { advertiseruuid: advertiseruuid, state: 'on' } });
        return re ? re : undefined;
    } else {
        let re = await getModel(modelName).findAll({ where: { state: 'on' } });
        return re ? re : undefined;
    }

}
export async function queryadvertiserAdsBypage(searchdata: string, start: number, length: number, advertiseruuid?: string) {
    if (advertiseruuid) {
        let re = await getModel(modelName).findAll({
            where: {
                advertiseruuid: advertiseruuid,
                $or: [{ state: 'on' }, { state: 'wait-ack' }, { state: 'rejected' }],
                title: { $like: '%' + searchdata + '%' },
                deleted: 0
            }, offset: start, limit: length
        });
        return re ? re.map(r => r.get()) : undefined;
    } else {
        let re = await getModel(modelName).findAll({ where: { $or: [{ state: 'on' }, { state: 'wait-ack' }, { state: 'rejected' }], name: { $like: '%' + searchdata + '%' }, deleted: 0 }, offset: start, limit: length });
        return re ? re.map(r => r.get()) : undefined;
    }
}

export async function queryadvertiserAdsBypagecount(sequelize: Sequelize, advertiseruuid?: string) {
    if (advertiseruuid) {
        let re = await sequelize.query(`select count(*) from ads.ads where advertiseruuid = '${advertiseruuid}' and(state = 'on' or state = 'wait-ack' or state = 'rejected') and deleted = 0 `, { type: 'select' });
        return re ? re : undefined;
    } else {
        let re = await sequelize.query(`select count(*) from ads.ads where (state = 'on' or state = 'wait-ack' or state = 'rejected') and deleted = 0 `, { type: 'select' });
        return re ? re : undefined;
    }
}

export async function queryadsByunituuid(start: number, length: number, unituuid: string) {
    let re = await getModel(modelName).findAll({
        where: { unituuid: unituuid, $or: [{ state: 'on' }, { state: 'wait-ack' }, { state: 'rejected' }], deleted: 0 },
        order: [['created', 'desc']], offset: start, limit: length
    });
    return re ? re.map(r => r.get()) : undefined;
}

export async function queryadsByunituuidcount(sequelize: Sequelize, unituuid: string) {
    let re = await sequelize.query(`select count(*) as count from ads.ads where unituuid = '${unituuid}' and (state = 'on' or state = 'wait-ack' or state = 'rejected') and deleted = 0`, { type: 'select' });
    return re ? re : undefined;
}

export async function queryBalanceByadsuuid(sequelize: Sequelize, adsuuid: string) {
    let re = await sequelize.query(`select ue.crm_balance,ads.advertiseruuid
    from users.users_ext as ue , ads.advertiser as ad, ads.ads as ads
    where ue.uuid = ad.crmuuid
    and ad.uuid = ads.advertiseruuid
    and ads.uuid = '${adsuuid}'`, { type: 'select' });
    return re ? re : undefined;
}

export async function queryunitByadauuid(sequelize: Sequelize, adsuuid: string) {
    let re = await sequelize.query(`select unit.method,unit.cpe_type
    from puton.unit as unit, ads.ads as ads
    where unit.uuid = ads.unituuid and ads.uuid = '${adsuuid}'`, { type: 'select' });
    return re ? re : undefined;
}

export async function updateadsStatus(adsuuid: string, status: number) {
    let [number, res] = await getModel(modelName).update({ status: status,tempstatus: status}, { where: { uuid: adsuuid } });
    return number > 0 ? res : undefined;
}

export async function queryBidByadsuuid(sequelize: Sequelize, adsuuid: string) {
    let res = await sequelize.query(`select unit.bid as bid from ads.ads as ads , puton.unit as unit where unit.uuid = ads.unituuid and ads.uuid = '${adsuuid}'`, { type: 'select' });
    return res ? res : undefined
}

export async function updateBalanceByadsuuid(sequelize: Sequelize, adsuuid: string, money: number) {
    let res = await sequelize.query(`UPDATE users.users_ext
    SET crm_balance = ${money}
    WHERE
        users.users_ext.uuid IN (
            SELECT
                ad.crmuuid
            FROM
                ads.advertiser AS ad,
                ads.ads AS ads
            WHERE
                ad.uuid = ads.advertiseruuid
            AND ads.uuid = '${adsuuid}'
        ) `, { type: 'update' });
    return res ? res : undefined
}

export async function queryplanunitByadsuuid(sequelize: Sequelize, adsuuid: string) {
    let res = await sequelize.query(`select plan.name as planname , unit.name as unitname from ads.ads as ads , puton.unit as unit ,puton.plan as plan where ads.unituuid = unit.uuid and unit.planuuid = plan.uuid and ads.uuid = '${adsuuid}'`, { type: 'select' });
    return res ? res : undefined
}

export async function deleteadsByunituuid(sequelize: Sequelize, unituuid: string) {
    sequelize.query(`update  ads.ads set deleted = 1 , state = 'on' where unituuid = '${unituuid}'`, { type: 'update' });
}

export async function queryadvertiserByadsuuid(sequelize: Sequelize, adsuuid: string) {
    let res = await sequelize.query(`SELECT
	puton.plan.advertiseruuid as advertiseruuid
FROM
	ads.ads ,
	puton.unit ,
	puton.plan 
WHERE
	unit.planuuid = plan.uuid
AND unit.uuid = ads.unituuid
AND ads.uuid = '${adsuuid}'`, { type: 'select' });
    return res ? res : undefined;
}


export async function querycrmuuidByadsuuid(sequelize: Sequelize, adsuuid: string) {
    let re = await sequelize.query(`select ad.crmuuid from ads.ads as ads, ads.advertiser as ad where ad.uuid = ads.advertiseruuid and ads.uuid ='${adsuuid}'`, { type: 'select' });
    return re ? re : undefined;
}

export async function queryviewsByadsuuid(sequelize: Sequelize, adsuuid: string) {
    let re = await sequelize.query(`select ads_e.virtviews from Ads.ads AS ads, ads.ads_ext as ads_e where ads.uuid = ads_e.uuid and ads.uuid = '${adsuuid}'`, { type: 'select' });
    return re ? re : undefined
}


export async function updateshowamountByadsuuid(adsuuid: string) {
    let temp = await getModel(modelName).findOne({ where: { uuid: adsuuid } });
    await getModel(modelName).update({ showamount: temp.get('showamount') + 1 }, { where: { uuid: adsuuid } });
}

export async function updatepointamountByadsuuid(adsuuid: string) {
    let temp = await getModel(modelName).findOne({ where: { uuid: adsuuid } });
    await getModel(modelName).update({ pointmount: temp.get('pointmount') + 1 }, { where: { uuid: adsuuid } });
}

export async function queryPutonadsByunituuids(sequelize: Sequelize, unituuids: any[]) {
    if (unituuids != undefined && unituuids.length != 0) {
        let stringunit = "(";
        for (let i = 0; i < unituuids.length; i++) {
            stringunit = stringunit + "'" + unituuids[i].uuid + "'";
            if (i != unituuids.length - 1) {
                stringunit = stringunit + ",";
            }
        }
        stringunit = stringunit + ")";
        let ads = await sequelize.query(`select * from ads.ads where unituuid in ${stringunit}  and deleted = 0`, { type: 'select' });
        return ads ? ads : undefined;
    } else {
        return undefined;
    }
}

export async function findadsByunituuid(unituuid: string) {
    let res = await getModel(modelName).findAll({ where: { unituuid: unituuid } });
    return res ? res.map(r => r.get()) : undefined;
}

export async function queryAdsByunituuid(unituuid: string) {
    let ads = await getModel(modelName).findAll({ where: { unituuid: unituuid,deleted:0 } })
    return ads ? ads.map(r => r.get()) : undefined;
}


export async function updateAdsByunituuid(unituuid: string){
    getModel(modelName).update({status:0,tempstatus:0},{where:{unituuid:unituuid}})
}

export async function undateAdsstatusByunituuids(sequelize:Sequelize,unituuids:any[]){
    if(unituuids!=undefined||unituuids.length!=0){
        let stringunit="(";
        for(let i=0;i<unituuids.length;i++){
            stringunit = stringunit + "'" +unituuids[i].uuid +"'";
            if(i!=unituuids.length-1){
                stringunit = stringunit + ",";
            }
        }
        stringunit = stringunit +")";
        sequelize.query(`update ads.ads set status = 0, tempstatus = 0 where unituuid in ${stringunit}`,{type:'update'});
    }
}


export async function undateAdsstatusByunituuids1(unituuids:any[]){
        if(unituuids!=undefined||unituuids.length!=0){
            // let stringunit="";
            // for(let i=0;i<unituuids.length;i++){
            //     stringunit = stringunit + "'" +unituuids[i].uuid +"'";
            //     if(i!=unituuids.length-1){
            //         stringunit = stringunit + ",";
            //     }
            // }
            let stringunit=[];
            for(let i=0;i<unituuids.length;i++){
                stringunit.push(unituuids[i].uuid.toString());
            }
            getModel(modelName).update({status : 0},{where:{unituuid:{$in:stringunit}}})
        }
}

export async function updateAdvertiserByadsuuid(sequelize:Sequelize,adsuuid:string,state:number){
    sequelize.query(`update ads.advertiser set balance_state = ${state} where uuid = (select advertiseruuid from ads.ads where uuid = '${adsuuid}')`,{type:'update'});
}

export async function findadvertiserByadsuuid(sequelize:Sequelize,adsuuid:string){
    let advertiser = await sequelize.query(`select * from ads.ads as ads ,ads.advertiser as adv where adv.uuid = ads.advertiseruuid and ads.uuid = '${adsuuid}' `,{type:'select '});
    return advertiser[0]? advertiser[0]:undefined
}

export async function updateAdstempStatus(){
    getModel(modelName).update({status:1},{where:{tempstatus:1}})
}

export async function updateadsstatus(advertiseruuids:any[]){
    if(advertiseruuids.length!=0){
        let uuidStr
        for(let i =0;i<advertiseruuids.length;i++){
            uuidStr = uuidStr + "'" + advertiseruuids[i] + "'"
            if(i!=advertiseruuids.length-1){
                uuidStr = uuidStr + ","
            }
        }
        getModel(modelName).update({status:0},{where:{advertiseruuid:{$in:[uuidStr]}}});
    }
}

export async function deleteEmptyads(date:Date){
    getModel(modelName).update({deleted:1},{where:{title:'',created:{$lt:date}}});
}

export async function getrent(sequelize: Sequelize,adsuuid?:string){
    if(adsuuid!=undefined&&adsuuid!=null){
        let res = await sequelize.query(`select * from ads.ads as ads , ads.advertiser as adv where ads.advertiseruuid = adv.uuid and ads.uuid = '${adsuuid}'`,{type:'select'});
        return res?res:[];
    }else{
        let res = await sequelize.query(`select * from ads.ads as ads , ads.advertiser as adv where ads.advertiseruuid = adv.uuid `,{type:'select'});
        return res?res:[];
    }
}

export async function addPointsBalance(seqz: Sequelize, iuuid: string, balance: any, points: any, exuuid: any) {
    return await seqz.transaction(async function (t) {

        //获得广告商的积分零钱
        let advertiserModel = await getModel('users.users_ext').findOne({ where: { uuid: exuuid } })
        let advertiser = advertiserModel.get()

        //获得广告的积分零钱
        let adsModel = await getModel(modelName).findOne({ where: { uuid: iuuid } })
        let ads = adsModel.get()

        if (ads.allbalance < balance) {//给广告加钱，给广告商扣钱
            balance = balance - ads.allbalance

            if (advertiser.crm_balance < balance * 100) {//余额不足
                return undefined
            }

            await getModel(modelName).update({
                totalbalance: Sequelize.literal(`totalbalance+${balance}`),
                allbalance: Sequelize.literal(`allbalance+${balance}`),
            }, { where: { uuid: iuuid }, transaction: t })

            await getModel('users.users_ext').update({
                crm_balance: Sequelize.literal(`crm_balance-${balance * 100}`),
            }, { where: { uuid: exuuid }, transaction: t, returning: true })

        } else if (ads.allbalance > balance) {    //给广告减钱，给广告商退钱
            balance = ads.allbalance - balance

            await getModel(modelName).update({
                totalbalance: Sequelize.literal(`totalbalance-${balance}`),
                allbalance: Sequelize.literal(`allbalance-${balance}`),
            }, { where: { uuid: iuuid }, transaction: t })

            await getModel('users.users_ext').update({
                crm_balance: Sequelize.literal(`crm_balance+${balance * 100}`),
            }, { where: { uuid: exuuid }, transaction: t, returning: true })
        }

        if (ads.allpoint < points) {
            points = points - ads.allpoint

            if (advertiser.crm_points < points) {//积分不足
                return undefined
            }

            await getModel(modelName).update({
                totalpoints: Sequelize.literal(`totalpoints+${points}`),
                allpoint: Sequelize.literal(`allpoint+${points}`)
            }, { where: { uuid: iuuid }, transaction: t })

            await getModel('users.users_ext').update({
                crm_points: Sequelize.literal(`crm_points-${points}`),
            }, { where: { uuid: exuuid }, transaction: t, returning: true })

        } else if (ads.allpoint > points) {
            points = ads.allpoint - points

            await getModel(modelName).update({
                totalpoints: Sequelize.literal(`totalpoints-${points}`),
                allpoint: Sequelize.literal(`allpoint-${points}`)
            }, { where: { uuid: iuuid }, transaction: t })

            await getModel('users.users_ext').update({
                crm_points: Sequelize.literal(`crm_points+${points}`),
            }, { where: { uuid: exuuid }, transaction: t, returning: true })
        }

        return 1
    })
}