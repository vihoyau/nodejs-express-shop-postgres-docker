import { validateCgi } from "../../lib/validator"
import { systemValidator } from "../crm/validator"
import { Router, Request, Response, NextFunction } from "express"
import { sendOK, sendError as se, sendNoPerm, sendErrMsg } from "../../lib/response"
import { LoginInfo, checkLogin } from "../../redis/logindao"
import { create_one_lotteryrulesrecord, find_one_lotteryrulesrecord, gelotteryrulesrecordList, getlotteryuserprizeList, get_event_Count, getevent_prizeList, getlotterytUserprizeList ,get_one_event_Count} from "../../model/users/lotteryrulesrecord"
import { findByName, updateSystem } from "../../model/system/system"
import { userprizeValidator, crmuserValidator } from "./validator"
import { timestamps } from "../../config/winston"
export const router = Router()


//点击抽奖管理菜单栏中的活动历史记录，获取活动历史抽奖记录
router.get("/history", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
  try {
    const { start, length, draw, search } = req.query
    const loginInfo: LoginInfo = (req as any).loginInfo
    if (!loginInfo.isRoot() && !loginInfo.isGoodsRW())
      return sendNoPerm(res)
    console.log(search)
    /*     let ads = JSON.parse(search)
        console.log(ads) */
    let searchdata = (search as any).value
    validateCgi({ start: start, length: length, searchdata: searchdata }, crmuserValidator.pagination)
    if (!searchdata || searchdata === 'undefined' || searchdata == undefined)
      searchdata = ''
    let recordsFiltered = await get_event_Count(req.app.locals.sequelize,searchdata)               //获得活动的所有记录数
    let prize = await getevent_prizeList(req.app.locals.sequelize, parseInt(start), parseInt(length), searchdata)   //得到所有的活动信息并分页显示
    return sendOK(res, { draw: draw, prize: prize, recordsFiltered: parseInt(recordsFiltered) })

  } catch (e) {
    e.info(se, res, e)
  }
})

//获取抽奖活动状态
router.get("/eventstate", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
  try {
    let operation = await findByName('operationstatus')//获得system.system表中的开关操作标志状态值记录
    let status = operation.content.status     //获得system.system表中的开关操作标志状态值
    let result = await findByName('state')//获得system.system表中的开关状态标志状态值记录
    let lotterystate = result.content.lotterystate     //获得system.system表中的开关状态标志状态值   
    return sendOK(res, { lotterystate: lotterystate, status: status })        //返回开关状态信息    {"on" "1"} => 已开启  {"off","2"} : 已关闭
  } catch (e) {
    e.info(se, res, e)
  }
})







//切换抽奖开关按钮 按钮为关的时候保存历史数据 并修改时间
router.put('/', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
  const { name, content } = (req as any).body

  try {
    const loginInfo: LoginInfo = (req as any).loginInfo
    if (!loginInfo.isRoot() && !loginInfo.isGoodsRW())
      return sendNoPerm(res)
    validateCgi({ name, content }, systemValidator.contentValidator)
    let result = await updateSystem(JSON.parse(content), name)          //更新抽奖开关状态

    let operation = await findByName('operationstatus')//获得system.system表中的开关操作标志状态值记录
    let status = operation.content.status     //获得system.system表中的开关操作标志状态值

    if (result.content.lotterystate === "off" && status === "2") {
      return sendOK(res, { message: '设置的结束时间已到，活动后台自动关闭,无需再手动关闭' })
    }

    //抽奖开关为关闭状态
    if (result.content.lotterystate === "off" && status === "1") {
      let event_time = await findByName('timerange')//获得当前的活动名称的时间限制记录
      event_time.content.endtime = (new Date())     //把当前的时间作为活动的结束时间
      event_time.content.endtime = timestamps(event_time.content.endtime)     //格式化结束时间
      console.log(event_time)
      let time_change = await updateSystem(event_time.content, 'timerange')          //更新抽奖活动的结束时间 
      console.log(time_change)
      //  validateCgi({ level: parseInt(level), state: state, limitcount: parseInt(limitcount) }, lotterylevelValidator.insertOptions)
      let lotteryrules = await gelotteryrulesrecordList(req.app.locals.sequelize)  //获取抽奖开关按钮关闭前的抽奖设置记录
      let mesg = new Array()
      for (let i = 0; i < lotteryrules.length; i++) {
        mesg[i] = lotteryrules[i].content
      }

      let event = await findByName('eventname')//获得当前的活动名称记录
      let eventstate = event.content.event     //获取活动名称
      //查找users.userprize的中奖记录
      let uuidnum = await getlotteryuserprizeList(req.app.locals.sequelize)
      let lotteryrulesrecord = {
        lotteryrule: mesg,  //规则
        awarduuid: uuidnum, //对应的中奖用户的UUID
        eventname: eventstate //活动名称
      }
      console.log(lotteryrulesrecord)
      await create_one_lotteryrulesrecord(lotteryrulesrecord)       //创建历史的抽奖记录
      await updateSystem(JSON.parse('{"status": "2"}'), 'operationstatus')          //更新system.system表中的开关操作标志状态值
      return sendOK(res, { message: '强制关闭成功' })     //返回操作信息和按钮状态
    }

    if (result.content.lotterystate === "on" && status === "0") {
      let statename = await findByName(name)//获得当前的活动名称记录
      statename.content.lotterystate = content   //获取活动名称
      //判断设置的活动结束时间不能小于当前的时间
      let event_time = await findByName('timerange')//获得当前的活动名称记录
      let nowtime = (new Date())
      if (new Date(event_time.content.endtime) <= nowtime) {
        return sendErrMsg(res, "设置的活动结束时间不能比当前时间早，请重新设置活动的结束时间", 409)
      }
      await updateSystem(JSON.parse('{"status": "1"}'), 'operationstatus')          //更新system.system表中的开关操作标志状态值
      await auto_check(req, res, next, result.content.lotterystate)                                                                  //自动检测结束时间
      return sendOK(res, { message: '开启成功' }) //返回操作信息和按钮状态
    }

    if (result.content.lotterystate === "on" && status === "2") {
      return sendOK(res, { message: '该活动已结束，不能再次打开，请重新设置新的活动名称',lotterystate:result.content.lotterystate,status:status })
    }
  } catch (e) {
    e.info(se, res, e)
  }
})

let timer: any

//创建历史抽奖记录功能函数
export async function close_lottery_button(req: Request, res: Response, next: NextFunction, lotterystate: string) {
  /*   let lotterystat = lotterystate */
  let statename = await findByName('state')//获得lotterystate当前状态 off 或 on
  try {
    if ("off" === statename.content.lotterystate) {
      clearInterval(timer)          //关闭定时器
    } else {
    let lotteryrules = await gelotteryrulesrecordList(req.app.locals.sequelize)  //获取抽奖开关按钮关闭前的抽奖设置记录
    let mesg = new Array()
    for (let i = 0; i < lotteryrules.length; i++) {
      mesg[i] = lotteryrules[i].content
    }

    let event = await findByName('eventname')//获得当前的活动名称记录
    let eventstate = event.content.event     //获取活动名称
    //查找users.userprize的中奖记录
    let uuidnum = await getlotteryuserprizeList(req.app.locals.sequelize)
    let lotteryrulesrecord = {
      lotteryrule: mesg,  //规则
      awarduuid: uuidnum, //对应的中奖用户的UUID
      eventname: eventstate //活动名称
    }
    console.log(lotteryrulesrecord)
    let message = await create_one_lotteryrulesrecord(lotteryrulesrecord)       //创建历史的抽奖记录
    console.log(message)
    await updateSystem(JSON.parse('{"status": "2"}'), 'operationstatus')          //更新system.system表中的开关操作标志状态值
    await updateSystem(JSON.parse('{"lotterystate": "off"}'), 'state')          //更新system.system表中的抽奖开关为关
    clearInterval(timer)          //关闭定时器
  }
  } catch (e) {
    e.info(se, res, e)
  }
}

//抽奖按钮开启后，自动检测活动的结束时间，若没有强行关闭，则结束时间到了就自动关闭
export async function auto_check(req: Request, res: Response, next: NextFunction, lotterystate: string) {
  try {
    timer = setInterval(async () => {
      let event_time = await findByName('timerange')//获得当前的活动名称的时间限制记录
      let nowtime = (new Date())     //把当前的时间作为活动的结束时间
      if (new Date(event_time.content.endtime) < nowtime ) {                      //此刻的时间大于设置的结束时间
         close_lottery_button(req, res, next,lotterystate)

      }
    }, 1000)        //每1秒检测一次
  } catch (e) {
    e.info(se, res, e)
  }
}


//通过users.lotteryrulesrecord表中的uuid来获取不同活动相对应的中奖用户名单
router.get("/:uuid", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
  //users.lotteryrulesrecord表中的uuid
  let uuid = req.params.uuid
  const { start, length, draw, search } = req.query
  let { state, lotterytype, receive } = req.query
  try {
    const loginInfo: LoginInfo = (req as any).loginInfo
    if (!loginInfo.isRoot() && !loginInfo.isGoodsRW())
      return sendNoPerm(res)

    let event_record = await find_one_lotteryrulesrecord(uuid)       //某个活动的历史记录
    console.log(event_record)
    console.log(search)
    /*     let ads = JSON.parse(search)
        console.log(ads) */
    let searchdata = (search as any).value
    validateCgi({ start: start, length: length, searchdata: searchdata }, crmuserValidator.pagination)
    validateCgi({ state: state, lotterytype: lotterytype, receive }, userprizeValidator.stateAndlotterytype)
    if (!state || state === 'undefined' || state == undefined)
      state = ''
    if (!searchdata || searchdata === 'undefined' || searchdata == undefined)
      searchdata = ''

    let recordsFiltered = await  get_one_event_Count(req.app.locals.sequelize, searchdata, state, lotterytype, receive,event_record.eventname)
    let usersprize_message_select = await getlotterytUserprizeList(req.app.locals.sequelize, searchdata, state, lotterytype, receive, event_record.eventname, parseInt(start), parseInt(length))
    console.log(usersprize_message_select)

    for (let i = 0 ; i < usersprize_message_select.length;i++) {
      usersprize_message_select[i].created = timestamps( usersprize_message_select[i].created)            //创建时间的格式转换
  }
    return sendOK(res, { draw: draw, usersprize_message_select: usersprize_message_select, recordsFiltered:  parseInt(recordsFiltered) })
  } catch (e) {
    e.info(se, res, e)
  }
})
