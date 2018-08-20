import { getModel } from "../../lib/global"
import { DataTypes, Sequelize } from "sequelize"
import { findByName } from "../../model/system/system"
const [schema, table] = ["users", "lotteryrulesrecord"]
const modelName = `${schema}.${table}`

export const defineFunction = function (sequelize: Sequelize) {
  return sequelize.define(modelName, {
    uuid: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
    },
    lotteryrule: DataTypes.ARRAY(DataTypes.JSONB),
    awarduuid: DataTypes.ARRAY(DataTypes.JSONB),
    eventname: DataTypes.TEXT,
    created: DataTypes.TIME
  }, {
      timestamps: false,
      schema: schema,
      freezeTableName: true,
      tableName: table,
    })
}

//创建抽奖规则的历史记录表
export async function create_one_lotteryrulesrecord(lotteryrulesrecord: any) {
    console.log(lotteryrulesrecord)
    let res = await getModel(modelName).create(lotteryrulesrecord, { returning: true })
    return res ? res.get() : undefined
}


//查看users.lotteryrulesrecord表的单个记录
export async function find_one_lotteryrulesrecord(uuid: string) {
    console.log(uuid)
    //   let res = await getModel(modelName).findAll({ where: { uuid: uuid } }) as any[]
    //return res ? res.map(r => r.get()) : undefined
    let res = await getModel(modelName).findOne({ where: { uuid: uuid } });
    return res ? res.get() : undefined
}


export async function gelotteryrulesrecordList(sequelize: Sequelize) {
    //获取抽奖开关按钮关闭前的抽奖设置记录
    let res = await sequelize.query(`SELECT
 up.content 
 FROM
 system.system AS up
 where
 up.name = 'eventname'
 or  up.name='lotteryrules'
 or  up.name = 'lotterycondition'
 or  up.name = 'timerange'
 or  up.name = 'numcondition'
 or  up.name = 'possibility'
`, { type: "select" }) as any[]
    console.log(res)
    return res
}


export async function getlotteryuserprizeList(sequelize: Sequelize) {
    let event = await findByName('eventname')//获得当前的活动名称记录
    let eventstate = event.content.event     //获取活动名称
    /*    let time = await findByName('timerange')
       let starttime = time.content.starttime     //获取活动开始时间
       let endtime   = time.content.endtime       //获取活动结束时间 */
    //获取抽奖开关按钮关闭前的抽奖记录的uuid （通过时间和活动判断）
    let res = await sequelize.query(`SELECT
 up.uuid 
 FROM
 users.userprize AS up
 where
  up.eventname = '${eventstate}'
`, { type: "select" }) as any[]
    console.log(res)
    return res
}


/**
 * 获得活动的所有记录数
 */
export async function get_event_Count(sequelize: Sequelize, searchdata: string) {
  let res = await sequelize.query(`SELECT
count(*)
FROM
users.lotteryrulesrecord AS up
WHERE
up.eventname like '%${searchdata}%'
`, { type: "select" }) as any[]
  return res[0].count
}


//获取单个活动记录数
export async function get_one_event_Count(sequelize: Sequelize, searchdata: string, state: string, lotterytype: string, receive: string,eventname:string) {
  let res = await sequelize.query(`SELECT
count(*)
FROM
users.userprize AS up
LEFT JOIN mall.prize AS p ON up.prizeuuid = p.uuid
WHERE
  up.eventname = '${eventname}'
and  p.state like '%${state}%'
  and  up.state like '%${receive}%'
  and up.lotterytype like '%${lotterytype}%'
and(
up.username LIKE '%${searchdata}%'
OR p.title LIKE '%${searchdata}%'
)
`, { type: "select" }) as any[]
  return res[0].count
}


/**
 * 通过users.userprize的uuid获得活动获奖历史记录列表
 */
export async function getevent_prizeList(sequelize: Sequelize, cursor: number, limit: number, searchdata: string) {
  let res = await sequelize.query(`SELECT
up.uuid,
  up.eventname,
  up.lotteryrule,
  up.awarduuid
FROM
users.lotteryrulesrecord AS up
WHERE
up.eventname like '%${searchdata}%'
ORDER BY
up.created DESC
  OFFSET ${cursor}
LIMIT ${limit}`, { type: "select" }) as any[]
  return res
}



/**
 * 获得某个获奖用户列表
 */
export async function getlotterytUserprizeList(sequelize: Sequelize, searchdata: string, state: string, lotterytype: string, receive: string, eventname: string, cursor: number, limit: number) {
  let res = await sequelize.query(`SELECT
up.uuid,
  up.username,
  up.level,
  up.state as receive,
  up.created,
  up.lotterytype,
  up.eventname,
  p.title,
  p.state
FROM
users.userprize AS up
LEFT JOIN mall.prize AS p ON up.prizeuuid = p.uuid
WHERE
 up.eventname = '${eventname}'
 and p.state like '%${state}%'
 and  up.state like '%${receive}%'
 and up.lotterytype like '%${lotterytype}%'
 and(
 up.username LIKE '%${searchdata}%'
 OR p.title LIKE '%${searchdata}%'
 ) 
 ORDER BY
 up."username" ASC,
 up."level" ASC,
 up."created" DESC
 OFFSET ${cursor}
 LIMIT ${limit}
`, { type: "select" }) as any[]
  return res
}


/**
 * 获得某活动奖品列表记录数
 */
/* export async function getCount(sequelize: Sequelize, searchdata: string, state: string, lotterytype: string, receive: string) {
  let res = await sequelize.query(`SELECT
count(*)
FROM
users.userprize AS up
LEFT JOIN mall.prize AS P ON up.prizeuuid = P .uuid
WHERE
p.state like '%${state}%'
  and  up.state like '%${receive}%'
  and up.lotterytype like '%${lotterytype}%'
  and up.uuid like 
and(
up.username LIKE '%${searchdata}%'
OR P .title LIKE '%${searchdata}%'
)
`, { type: "select" }) as any[]
  return res[0].count
} */



