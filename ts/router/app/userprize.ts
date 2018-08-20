import { userprizeValidator } from "./validator"
import { validateCgi } from "../../lib/validator"
import { checkAppLogin, LoginInfo } from "../../redis/logindao"
import { sendOK, sendError as se, sendNotFound } from "../../lib/response"
import { Router, Request, Response, NextFunction } from "express"
import { changeUsername } from "../../lib/utils"
import { getLotterylevels, findnumcout, updateLotterylevelNum } from "../../model/mall/lotterylevel"
import { findByLotterytype, get_user_event_prizenum } from "../../model/mall/awardusers"
import { findByName } from "../../model/system/system"
import { findByPrimary as findPrizeByPrimary } from "../../model/mall/prize"
import { insertAmountLog } from "../../model/users/amountlog"
import { insertOrder } from "../../model/orders/orders"
import { insertUserprize, updateUserprizeState, getUserprizes, getLotteryUserprizes, findPrizeCount, find_prize_state } from "../../model/users/userprize"
import { insertusercoupon } from "../../model/users/usercoupon"
import { findAwardusersByLevelCount, updateAwardusersInfo } from "../../model/mall/awardusers"
import { updatePoints } from "../../model/users/users_ext"
import { comparepro } from "../../router/app/orders"
import { findByStateVir, updateNumber } from "../../model/mall/goods"
import { findByPrimary, updatePointAndCashlottery, addPointAndCashlottery } from "../../model/users/users"
import { insertLotterylog } from "../../model/users/lotterylog"
import { exchange, findByPrimary as findByUsers } from "../../model/users/users_ext"
import logger = require("winston")
import * as moment from "moment"

import { amountcheck } from "../../lib/amountmonitor"

export const router: Router = Router()

//充值获得抽奖机会
router.put('/exchange', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    try {
        const { count } = (req as any).body
        const loginInfo: LoginInfo = (req as any).loginInfo
        let sys = await findByName('model')
        let system = await findByName('lotterycondition')
        let users_ext = await findByUsers(loginInfo.getUuid())
        if (sys.content.type === 'pointlottery') {//积分抽奖
            if (users_ext.points < parseInt(system.content.point) * parseInt(count))
                return sendNotFound(res, "您的积分不足！")
            await exchange(loginInfo.getUuid(), { points: parseInt(system.content.point) * parseInt(count), balance: 0 })
            await addPointAndCashlottery(loginInfo.getUuid(), parseInt(count), 0)
        } else {//现金抽奖
            if (users_ext.balance < parseFloat(system.content.cash) * 100 * parseInt(count))
                return sendNotFound(res, "您的零钱不足！")
            await exchange(loginInfo.getUuid(), { points: 0, balance: parseFloat(system.content.cash) * 100 * parseInt(count) })
            await addPointAndCashlottery(loginInfo.getUuid(), 0, parseInt(count))
        }
        return sendOK(res, "成功获得抽奖机会！")
    } catch (e) {
        e.info(se, res, e)
    }
})

//获得当前抽奖模式
router.get('/lotterytype', async function (req: Request, res: Response, next: NextFunction) {
    try {
        let sys = await findByName('model')
        return sendOK(res, { sys: sys })
    } catch (e) {
        e.info(se, res, e)
    }
})
//获奖名单
router.get('/lotteryusers', async function (req: Request, res: Response, next: NextFunction) {
    try {
        let sys = await findByName('model')
        let userprize = await getLotteryUserprizes(req.app.locals.sequelize, sys.content.type)
        userprize.forEach(r => {
            r.username = changeUsername(r.username)
        })
        return sendOK(res, { userprize: userprize })
    } catch (e) {
        e.info(se, res, e)
    }
})

//获得用户奖励列表
router.get('/userprize', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    try {
        const loginInfo: LoginInfo = (req as any).loginInfo
        let userprize = await getUserprizes(req.app.locals.sequelize, loginInfo.getUuid())
        return sendOK(res, { userprize: userprize })
    } catch (e) {
        e.info(se, res, e)
    }
})

//用户手动领取实物奖品
router.post('/receivegoods', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { uuid, prize, address, message } = (req as any).body
    try {
        const loginInfo: LoginInfo = (req as any).loginInfo
        let businessGoods = prize
        businessGoods.number = 1
        validateCgi({ uuid: uuid }, userprizeValidator.UUID)
        let obj = {
            useruuid: loginInfo.getUuid(),
            goods: [businessGoods],
            total_fee: 0,
            real_fee: 0,
            fee_info: {},
            address: address,
            message: message,
            goodpoint: 0,
            postage: 0,
            businessmen: businessGoods.businessmen,
            prize: 'true',//奖品
            state: 'wait-send'
        }
        //判断商品是否已下线
        let goods = await findByStateVir(businessGoods.uuid)
        goods.property = businessGoods.property
        goods.number = businessGoods.number
        let newpropertySet = businessGoods.property.split(",")
        if (businessGoods.tags) {
            let arr = await comparepro(goods.tags, newpropertySet, businessGoods.number)
            if (!arr) {
                return sendNotFound(res, "商品已售完！！")
            }
            for (let i = 0; i < arr.length; i++) {
                if (newpropertySet.length > 1 && !arr[i].data) {
                    return sendNotFound(res, "商品已售完！！")
                }
            }
            await updateNumber(arr, businessGoods.uuid)
        }
        if (!goods)
            return sendNotFound(res, businessGoods.title + "已删除或已下架")
        let orders = await insertOrder(obj)
        orders.total_fee = orders.total_fee / 100
        orders.real_fee = orders.real_fee / 100
        await updateUserprizeState(uuid)//将奖品设置为已领取
        return sendOK(res, { orders: orders })
    } catch (e) {
        e.info(se, res, e)
    }
})

//抽奖
router.get("/", checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    try {
        let sys = await findByName('model')//获得当前的奖励模式
        let lotterytype = sys.content.type
        const loginInfo: LoginInfo = (req as any).loginInfo
        validateCgi({ lotterytype: lotterytype }, userprizeValidator.lotterytype)
        let state = await findByName('state')//获得当前的奖励模式
        let operationstatus = await findByName('operationstatus')//获得当前的奖励模式       
        console.log(state.content.lotterystate)
        if (state.content.lotterystate === "on" && operationstatus.content.status === "1") {                                          //抽奖按钮开启
            let system = await findByName('timerange')//获得抽奖获得开始的时间
            if (system) {
                let time = (new Date())
                if (new Date(system.content.starttime) <= time && time <= new Date(system.content.endtime)) {//如果是在设置的时间内访问
                    let users = await findByPrimary(loginInfo.getUuid())
                    //**********************************减少用户可抽奖次数*************************************** */
                    let sys = await findByName("lotterycondition")
                    if (sys) {
                        if (lotterytype === "pointlottery") {//积分抽奖
                            if (users.pointlottery > 0) {
                                await updatePointAndCashlottery(loginInfo.getUuid(), 1, 0)//修改用户的积分抽奖次数
                            } else {
                                return sendOK(res, { point: sys.content.point })
                            }
                        } else {//零钱抽奖
                            if (users.cashlottery > 0) {
                                await updatePointAndCashlottery(loginInfo.getUuid(), 0, 1)//修改用户的零钱抽奖次数
                            } else {
                                return sendOK(res, { balance: sys.content.cash })
                            }
                        }
                    }
                    //***************************************************************************************** */
                    let awardusers = await findByLotterytype(loginInfo.getUuid(), lotterytype)
                    if (awardusers && (awardusers.receive === 'false' || awardusers.level === 0)) {//当前用户为后台设置的特殊用户
                        if (awardusers.level > 0) {
                            await acceptPrize(req, users, awardusers.level, lotterytype, loginInfo)//领取奖品
                            await updateAwardusersInfo({ receive: 'true' }, awardusers.uuid)//标记用户已经领取奖品
                        }
                        return sendOK(res, { code: awardusers.level })//返回后台设置的奖励等级
                    } else {//进行随机抽奖
                        let code: number = await randomDraw()//随机抽奖产生随机数（0,1,2,3,4,5）
                        console.log("实际值" + code)
                        //----------------------处理奖品已经被领取后再次抽到该等级奖品---------------------------//
                        //let lotterylevel
                        if (code > 0) {
                            //  lotterylevel = await findByLevel(res.app.locals.sequelize, code, lotterytype)//查找对应等级的奖品
                            let numcount = await findnumcout(res.app.locals.sequelize, code, lotterytype)//查找对应等级的奖品  (相同等级属性的奖品总数)
                            let count = await findAwardusersByLevelCount(req.app.locals.sequelize, code, lotterytype, 'false')//查找该等级设置的中奖用户的数量
                            if (parseInt(numcount) <= parseInt(count))
                                code = 0
                        }
                        code = await lottery_restrictions(req, users, code, lotterytype, loginInfo)         //普通用户抽奖限制设置
                        let newcode = await acceptPrize(req, users, code, lotterytype, loginInfo)//领取奖品
                        console.log("处理后值" + newcode)
                        //-------------------------------------------------------------------------------------//
                        return sendOK(res, { code: newcode })
                    }
                } else {//未在设置的时间内访问                                                                             
                    return sendNotFound(res, "活动未开放，敬请期待！")
                }
            }
        } else {//未在设置的时间内访问
            return sendNotFound(res, "活动未开放，敬请期待！")
        }
    } catch (e) {
        e.info(se, res, e)
    }
})

/**
 * 获得10的多少次幂
 * @param length
 */
/*async function power(length: number) {
    let num = 1
    for (let i = 0; i < length; i++) {
        num = num * 10
    }
    return num
}*/

/**
 * 随机抽奖
 */
async function randomDraw() {
    let possibility = await findByName('possibility')
   
    let one = possibility.content.one
    let two = possibility.content.two
    let three = possibility.content.three
    let four = possibility.content.four
    let five = possibility.content.five
   
    let ones=parseFloat(one)
    let twos=parseFloat(two)
    let threes=parseFloat(three)
    let fours=parseFloat(four)
    let fives=parseFloat(five)

 
    let cell = Math.random()

    let nums 
    let twoss=ones + twos
    
    if (cell >=0 && cell < ones) {
        nums = 1
    } else if (cell >= ones && cell < twoss) {
        nums = 2
    } else if (cell >= ones + twos && cell < ones + twos + threes) {
        nums = 3
    } else if (cell >= ones + twos + threes && cell < ones + twos + threes + fours) {
        nums = 4
    } else if (cell >= ones + twos + threes + fours && cell < ones + twos + threes + fours + fives) {
        nums = 5
    } else if (cell >=  ones + twos + threes + fours + fives && cell < 1) {
        nums = 0
    }
    return nums
}


//普通用户的抽奖限制设置
async function lottery_restrictions(req: Request, users: any, code: number, lotterytype: string, loginInfo: LoginInfo) {
   let lotterylevel = await getLotterylevels(req.app.locals.sequelize, code, lotterytype)//获得该奖励等级
    if (lotterylevel && lotterylevel.prizeuuid && lotterylevel.limitcount > 0) {
        let event = await findByName('eventname')//获得当前的活动名称记录
        let userprizenum = await findPrizeCount(loginInfo.getUuid(), lotterylevel.prizeuuid,event.content.event)//单个用户获得该奖品的中奖次数
        //            if (lotterylevel.awardnum * (lotterylevel.limitcount - 1) < userprizenum) {
        if (lotterylevel.limitcount <= userprizenum) {          //限制中奖次数
            return 0
        }             


        let prize_state = await find_prize_state(lotterylevel.prizeuuid)          //取得该奖品的state(balance,piont,goods,coupon)
        let prizenum = await get_user_event_prizenum(req.app.locals.sequelize, users.uuid, prize_state.state, event.content.event)        //该奖品类型的数目
        let limitmount = await findByName('limitmount')
        let balance=limitmount.content.balance
        let point=limitmount.content.point
        let goods=limitmount.content.goods
        let coupon=limitmount.content.coupon
        //数量
        if (prize_state.state === "balance") {          //同一用户现金获奖最多3次
            if (parseInt(prizenum[0].prizenum) >= parseInt(balance)) {
                return 0
            }
        } else if (prize_state.state === "point") {                                 //同一用户积分获奖最多1次
            if (parseInt(prizenum[0].prizenum) >= parseInt(point)) {
                return 0
            }
        } else if (prize_state.state === "goods") {                                 //同一用户实物类获奖最多1次
            if (parseInt(prizenum[0].prizenum) >= parseInt(goods)) {
                return 0
            }
        } else if (prize_state.prize.state === "coupon") {                             //同一用户优惠劵获奖最多1次
            if (parseInt(prizenum[0].prizenum) >= parseInt(coupon)) {
                return 0
            }
        }
    }
    return code
}

/**
 * 领奖
 * @param users
 */
async function acceptPrize(req: Request, users: any, code: number, lotterytype: string, loginInfo: LoginInfo) {
    //let lotterylevel = await findByLevel(req.app.locals.sequelize, code, lotterytype)
    let lotterylevel
    if (code != 0) {
         lotterylevel = await getLotterylevels(req.app.locals.sequelize, code, lotterytype)//获得该奖励等级

        if (lotterylevel && lotterylevel.prizeuuid) {//如果奖品存在
            for (let i = 0; i < lotterylevel.awardnum; i++) {
                let sys = await findByName('eventname')//获得活动名称
                let obj = {
                    useruuid: users.uuid,
                    username: users.username,
                    prizeuuid: lotterylevel.prizeuuid,
                    lotterytype: lotterytype,
                    level: code,
                    eventname: sys.content.event                        //活动名称
                }
                let userprize = await insertUserprize(obj)//领取奖品
                //******************************************************************************************************** */
                let prize = await findPrizeByPrimary(lotterylevel.prizeuuid)//获得所领取的奖品
                if (prize) {
                    if (prize.state === 'coupon') {//奖品是优惠券
                        await insertusercoupon(req.app.locals.sequelize, loginInfo.getUuid(), prize.prize.uuid)//发放优惠券到用户
                        await updateUserprizeState(userprize.uuid)//标记奖品已经被领取
                    } else if (prize.state === 'point') {//奖励是积分
                        await updatePoints(loginInfo.getUuid(), { points: parseInt(prize.prize.point), balance: 0, exp: 0 })//增加积分
                        await insertLotterylog({ useruuid: users.uuid, prizeinfo: prize, point: parseInt(prize.prize.point), balance: 0 })
                        logger.error(`用户${users.uuid}获得${prize.prize.point}积分奖励`)
                        await updateUserprizeState(userprize.uuid)//标记奖品已经被领取
                        let obj = {
                            useruuid: users.uuid,
                            points: prize.prize.point,
                            mode: "lottery",
                            time: moment().format('YYYY-MM-DD HH:mm:ss')
                        }
                        await insertAmountLog(obj)
                    } else if (prize.state === 'balance') {//奖励是零钱
                        await updatePoints(loginInfo.getUuid(), { points: 0, balance: parseFloat(prize.prize.balance) * 100, exp: 0 })//增加积分
                        await insertLotterylog({ useruuid: users.uuid, prizeinfo: prize, point: 0, balance: parseFloat(prize.prize.balance) * 100 })
                        logger.error(`用户${users.uuid}获得${parseFloat(prize.prize.balance) * 100}零钱奖励`)
                        await updateUserprizeState(userprize.uuid)//标记奖品已经被领取

                        await amountcheck(req.app.locals.sequelize, loginInfo.getUuid(), "lottery", parseFloat(prize.prize.balance), 0)
                    }
                }
                //******************************************************************************************************** */
            }
        }
        await updateLotterylevelNum(lotterylevel.uuid)//减少奖励等级的发放数量
    }
    return code
}