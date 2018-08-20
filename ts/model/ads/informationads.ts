import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"

const modelName = "ads.informationads"
export const defineFunction = function (sequelize: Sequelize) {

    return sequelize.define(modelName, {
        uuid: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        state: DataTypes.INTEGER,   //on, wait-ack, rejected
        advertiseruuid: DataTypes.UUID, //广告商uuid
        username: DataTypes.STRING, //帐号，就是创建这个资讯的crm帐号
        title: DataTypes.TEXT,  //标题
        content: DataTypes.TEXT,    //描述
        pics: DataTypes.ARRAY(DataTypes.TEXT),  //图片数组
        video: DataTypes.ARRAY(DataTypes.TEXT), //视频数组
        category: DataTypes.UUID,   //大类uuid
        company: DataTypes.TEXT,    //公司名
        banner: DataTypes.ENUM('on', 'off'),    //banner
        address: DataTypes.JSONB,   //地址
        adsinfourl: DataTypes.TEXT, //投放详细地址
        addressinfo: DataTypes.TEXT,    //地址信息
        rejectmsg: DataTypes.TEXT,  //审核失败信息
        balance: DataTypes.DOUBLE,  //零钱
        totalbalance: DataTypes.DOUBLE, //总零钱
        totalpoints: DataTypes.DOUBLE,  //总积分
        points: DataTypes.DOUBLE,   //积分
        question_ext: DataTypes.JSONB,  //题目
        created: DataTypes.TIME,
        modified: DataTypes.TIME,
        sumcontent: DataTypes.TEXT, //副文本内容
        coverpic: DataTypes.ARRAY(DataTypes.TEXT),  //标题图片
        pic_mode: DataTypes.ENUM('big', 'small', 'three'),    //封面的图片模式
        low: DataTypes.INTEGER, //差评
        nice: DataTypes.INTEGER, //好评
        mold: DataTypes.STRING  //points balance two
    }, {
            timestamps: false,
            schema: "ads",
            freezeTableName: true,
            tableName: "informationads",
        })
}


export async function getCount(sequelize: Sequelize, searchdata: string, state: string, company: any) {
    let selectads


    if (company === undefined || company.length === 0) {

        if (state === "") {
            selectads = `SELECT
	count(*)
FROM
	ads.informationads AS A
WHERE
	A ."state" not In ('wait-ack')
AND (
	A .company LIKE '%${searchdata}%'
	OR title LIKE '%${searchdata}%'
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
	ads.informationads AS A
WHERE
	A ."state" in ('${state}')
AND (
	A .company LIKE '%${searchdata}%'
	OR title LIKE '%${searchdata}%'
	OR
 to_char(
		A .created,
		'YYYY-MM-DD HH24:MI:SS'
	) like '%${searchdata}%'
)`

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
	count(*)
FROM
	ads.informationads AS A
WHERE
	A ."state" not In ('wait-ack')
AND (
	A .company LIKE '%${searchdata}%'
	OR title LIKE '%${searchdata}%'
	OR
 to_char(
		A .created,
		'YYYY-MM-DD HH24:MI:SS'
	) like '%${searchdata}%'
)
and a.company in ${company1}`

        } else {
            selectads = `SELECT
	count(*)
FROM
	ads.informationads AS A
WHERE
	A ."state" in ('${state}')
AND (
	A .company LIKE '%${searchdata}%'
	OR title LIKE '%${searchdata}%'
	OR
 to_char(
		A .created,
		'YYYY-MM-DD HH24:MI:SS'
	) like '%${searchdata}%'
)
and a.company in ${company1}`
        }
    }
    let res = await sequelize.query(selectads, { type: "select" }) as any[]
    return parseInt(res[0].count)
}

export async function getCount2(sequelize: Sequelize, searchdata: string, state: string, advertiseruuid: any) {
    let selectads

    if (advertiseruuid === undefined || advertiseruuid.length === 0) {

        if (state === "") {
            selectads = `SELECT
	count(*)
FROM
	ads.informationads AS A
WHERE
	A ."state" not In ('wait-ack')
AND (
	A .company LIKE '%${searchdata}%'
	OR title LIKE '%${searchdata}%'
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
	ads.informationads AS A
WHERE
	A ."state" in ('${state}')
AND (
	A .company LIKE '%${searchdata}%'
	OR title LIKE '%${searchdata}%'
	OR
 to_char(
		A .created,
		'YYYY-MM-DD HH24:MI:SS'
	) like '%${searchdata}%'
)`

        }
    } else {
        let advertiseruuid1 = "("
        for (let i = 0; i < advertiseruuid.length; i++) {
            if (i == advertiseruuid.length - 1) {
                advertiseruuid1 = advertiseruuid1 + "'" + advertiseruuid[i] + "'"
            } else {
                advertiseruuid1 = advertiseruuid1 + "'" + advertiseruuid[i] + "',"
            }
        }
        advertiseruuid1 = advertiseruuid1 + ")"
        if (state === "") {
            selectads = `SELECT
	count(*)
FROM
	ads.informationads AS A
WHERE
	A ."state" not In ('wait-ack')
AND (
	A .company LIKE '%${searchdata}%'
	OR title LIKE '%${searchdata}%'
	OR
 to_char(
		A .created,
		'YYYY-MM-DD HH24:MI:SS'
	) like '%${searchdata}%'
)
and a.advertiseruuid in ${advertiseruuid1}`

        } else {
            selectads = `SELECT
	count(*)
FROM
	ads.informationads AS A
WHERE
	A ."state" in ('${state}')
AND (
	A .company LIKE '%${searchdata}%'
	OR title LIKE '%${searchdata}%'
	OR
 to_char(
		A .created,
		'YYYY-MM-DD HH24:MI:SS'
	) like '%${searchdata}%'
)
and a.advertiseruuid in ${advertiseruuid1}`
        }
    }

    let res = await sequelize.query(selectads, { type: "select" }) as any[]
    return parseInt(res[0].count)
}

export async function getByCompany(sequelize: Sequelize, searchdata: string, state: string, company: any, cursor: number, limit: number) {
    let selectads

    if (company === undefined || company.length === 0) {

        if (state === "") {
            selectads = `SELECT
	A.*
FROM
	ads.informationads AS A
WHERE
	A ."state" not In ('wait-ack')
AND (
	A .company LIKE '%${searchdata}%'
	OR title LIKE '%${searchdata}%'
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
	A.*
FROM
	ads.informationads AS A
WHERE
	A ."state" in ('${state}')
AND (
	A .company LIKE '%${searchdata}%'
	OR title LIKE '%${searchdata}%'
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
	A.*
FROM
	ads.informationads AS A
WHERE
	A ."state" not In ('wait-ack')
AND (
	A .company LIKE '%${searchdata}%'
    OR title LIKE '%${searchdata}%'
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
	A.*
FROM
	ads.informationads AS A
WHERE
	A ."state"  in ('${state}')
AND (
	A .company LIKE '%${searchdata}%'
	OR title LIKE '%${searchdata}%'
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

export async function getByAdvertiseruuid(sequelize: Sequelize, searchdata: string, state: string, advertiseruuid: any, cursor: number, limit: number) {
    let selectads

    if (advertiseruuid === undefined || advertiseruuid.length === 0) {

        if (state === "") {
            selectads = `SELECT
	A.*
FROM
	ads.informationads AS A
WHERE
	A ."state" not In ('wait-ack')
AND (
	A .company LIKE '%${searchdata}%'
	OR title LIKE '%${searchdata}%'
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
	A.*
FROM
	ads.informationads AS A
WHERE
	A ."state" in ('${state}')
AND (
	A .company LIKE '%${searchdata}%'
	OR title LIKE '%${searchdata}%'
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
        let advertiseruuid1 = "("
        for (let i = 0; i < advertiseruuid.length; i++) {
            if (i == advertiseruuid.length - 1) {
                advertiseruuid1 = advertiseruuid1 + "'" + advertiseruuid[i] + "'"
            } else {
                advertiseruuid1 = advertiseruuid1 + "'" + advertiseruuid[i] + "',"
            }
        }
        advertiseruuid1 = advertiseruuid1 + ")"
        if (state === "") {
            selectads = `SELECT
	A.*
FROM
	ads.informationads AS A
WHERE
	A ."state" not In ('wait-ack')
AND (
	A .company LIKE '%${searchdata}%'
    OR title LIKE '%${searchdata}%'
    OR
 to_char(
		A .created,
		'YYYY-MM-DD HH24:MI:SS'
	) like '%${searchdata}%'
)
and a.advertiseruuid in ${advertiseruuid1}
order by a.created desc
offset ${cursor}
limit ${limit}`

        } else {
            selectads = `SELECT
	A.*
FROM
	ads.informationads AS A
WHERE
	A ."state"  in ('${state}')
AND (
	A .company LIKE '%${searchdata}%'
	OR title LIKE '%${searchdata}%'
	OR
 to_char(
		A .created,
		'YYYY-MM-DD HH24:MI:SS'
	) like '%${searchdata}%'
)
and a.advertiseruuid in ${advertiseruuid1}
order by a.created desc
offset ${cursor}
limit ${limit}`
        }
    }
    let res = await sequelize.query(selectads, { type: "select" }) as any[]
    return res
}


export async function insertInfoAds(seqz: Sequelize, company: string, username: string, getAdvertiseruuid: string) {
    let obj = { company: company, username, advertiseruuid: getAdvertiseruuid, title: '', totalbalance: 0, totalpoints: 0 }
    let info = await getModel(modelName).create(obj, { returning: true })
    return info ? info.get() : undefined
}


export async function updateByUuid(upde: any, uuid: string) {
    let [number, res] = await getModel(modelName).update(upde, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}


export async function delet(uuid: string) {
    await getModel(modelName).destroy({ where: { uuid: uuid } })
}

export async function findByPrimarys(uuid: string) {
    let res = await getModel(modelName).findByPrimary(uuid)
    return res.get()
}

export async function modifilyCoverpic(uuid: string, coverpic: any) {
    let [num, res] = await getModel(modelName).update({ coverpic }, { where: { uuid }, returning: true })
    return num > 0 ? res[0].get() : undefined
}

export async function modifilyPics(uuid: string, pics: any) {
    let [num, res] = await getModel(modelName).update({ pics }, { where: { uuid }, returning: true })
    return num > 0 ? res[0].get() : undefined
}

export async function modifilyVideo(uuid: string, video: any) {
    let [num, res] = await getModel(modelName).update({ video }, { where: { uuid }, returning: true })
    return num > 0 ? res[0].get() : undefined
}

//如果修改资讯的时候有给资讯加钱，顺便给广告商扣钱，23333
export async function addPointsBalance(seqz: Sequelize, iuuid: string, balance: any, points: any, exuuid: any) {
    return await seqz.transaction(async function (t) {
        //获得广告商的积分零钱
        let advertiserModel = await getModel('users.users_ext').findOne({ where: { uuid: exuuid } })
        let advertiser = advertiserModel.get()

        //获得广告的积分零钱
        let adsModel = await getModel(modelName).findOne({ where: { uuid: iuuid } })
        let info = adsModel.get()

        if (info.totalbalance < balance) {//给广告加钱，给广告商扣钱
            balance = balance - info.totalbalance

            if (advertiser.crm_balance < balance * 100) {//余额不足
                return undefined
            }

            await getModel(modelName).update({
                totalbalance: Sequelize.literal(`totalbalance+${balance}`),
            }, { where: { uuid: iuuid }, transaction: t })

            await getModel('users.users_ext').update({
                crm_balance: Sequelize.literal(`crm_balance-${balance * 100}`),
            }, { where: { uuid: exuuid }, transaction: t, returning: true })

        } else if (info.totalbalance > balance) {
            balance = info.totalbalance - balance

            await getModel(modelName).update({
                totalbalance: Sequelize.literal(`totalbalance-${balance}`),
            }, { where: { uuid: iuuid }, transaction: t })

            await getModel('users.users_ext').update({
                crm_balance: Sequelize.literal(`crm_balance+${balance * 100}`),
            }, { where: { uuid: exuuid }, transaction: t, returning: true })
        }


        if (info.totalpoints < points) {
            points = points - info.totalpoints

            if (advertiser.crm_points < points) {
                return undefined
            }

            await getModel(modelName).update({
                totalpoints: Sequelize.literal(`totalpoints+${points}`),
            }, { where: { uuid: iuuid }, returning: true, transaction: t })

            await getModel('users.users_ext').update({
                crm_points: Sequelize.literal(`crm_points-${points}`),
            }, { where: { uuid: exuuid }, returning: true, transaction: t })

        } else if (info.totalpoints > points) {
            points = info.totalpoints - points

            await getModel(modelName).update({
                totalpoints: Sequelize.literal(`totalpoints-${points}`),
            }, { where: { uuid: iuuid }, returning: true, transaction: t })

            await getModel('users.users_ext').update({
                crm_points: Sequelize.literal(`crm_points+${points}`),
            }, { where: { uuid: exuuid }, returning: true, transaction: t })
        }

        return 1
    })
}

//
export async function findByCategory(category: string, cursor: number, limit: number) {
    let res = await getModel(modelName).findAll({ where: { category, state: 'on' }, order: [['created', 'desc']], offset: cursor, limit: limit })
    return res.map(r => r.get())
}

export async function findByKeyWord(seqz: Sequelize, keyword: any, cursor: number, limit: number) {
    let res = await seqz.query(`
    select i.* from ads.informationads i
    where i.state = 'on'
    and (i.content like '%${keyword}%' or i.title like '%${keyword}%')
    order by i.created desc
    offset ${cursor}
    limit ${limit}
    `, { type: "select" }) as any[]
    return res
}

export async function infoUpdateNice(uuid: string) {
    let [number, res] = await getModel(modelName).update({ nice: Sequelize.literal(`nice+ 1`) }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function infoUpdateLow(uuid: string) {
    let [number, res] = await getModel(modelName).update({ low: Sequelize.literal(`low+ 1`) }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function updateApplaud(uuid: string, low: number, nice: number) {
    let [number, res] = await getModel(modelName).update({ low: Sequelize.literal(`low- ${low}`), nice: Sequelize.literal(`nice- ${nice}`) }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}

export async function getBanner() {
    let res = await getModel(modelName).findAll({ where: { state: "on", banner: 'on' }, order: [['created', 'DESC']] })
    return res.map(r => r.get())
}

export async function deleteEmptyinfo(date: Date) {
    await getModel(modelName).destroy({ where: { title: '', created: { $lt: date } } });
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
	ads.informationads AS A
WHERE
	A .uuid IN ${uuids}
AND A ."state" = 'on'`, { type: "select" }) as any[]
    return res
}
