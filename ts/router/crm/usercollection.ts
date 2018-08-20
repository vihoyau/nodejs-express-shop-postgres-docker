import { Router, Request, Response, NextFunction } from "express"
import { checkLogin, LoginInfo } from "../../redis/logindao"
export const router = Router()
import { sendOK, sendNotFound, sendError as se } from "../../lib/response"
import { find_All_Activity } from "../../model/mall/collectioncreate"
import { insertOrder } from "../../model/orders/orders"
import { insertusercoupon } from "../../model/users/usercoupon"
import { updatePoints } from "../../model/users/users_ext"
import { insertLotterylog } from "../../model/users/lotterylog"
import { amountcheck } from "../../lib/amountmonitor"
import { insertAmountLog } from "../../model/users/amountlog"
import { findByStateVir } from "../../model/mall/goods"
import { getModel } from "../../lib/global"
import * as moment from "moment"
import { validateCgi } from "../../lib/validator"
import { collectionValidator,advertiserValidator } from "./validator"
//创建活动
import {
    addUserCollection, selectUserCollection, UserCollectionCard
    , selectUserCollectionCard, UserCollectionCardHelp, UserCollectionchipHelp
    , find_Info_Activity, find_UserInfo_Activity, findUserBirthday, findisNoFor, getreward, findfortune
    , find_User, findColInfo1, getCount1, find_UserInfoLog,insertUserCollection,insertrewardDone
} from "../../model/mall/usercollection"
import { findByPrimary } from "../../model/mall/goods"
// 用户参加活动
router.post('/useractivity', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { Activityuuid } = (req as any).body
     validateCgi({ Activityuuid: Activityuuid }, collectionValidator.UUID)
    try {
        const info: LoginInfo = (req as any).loginInfo
        let Useruuid = info.getUuid()
        let CollectionState = 0
        // if (!info.isAdminRW() && !info.isRoot())
        //     return sendNoPerm(res)
        let tmp = {
            Activityuuid: Activityuuid,//活动uuid
            Useruuid: Useruuid,//用户uuid
            CollectionState: CollectionState
        }
        //查询该活动用户是否已经参加过
        let selectUserCollections = await selectUserCollection(tmp)
        if (selectUserCollections && selectUserCollections.CardAmount !== 0) {
            let ac_ext = await find_UserInfo_Activity(Activityuuid, Useruuid)
            let resState = { "CollectionState": "false", ac_ext }
            return sendOK(res, resState)
        } else if (!selectUserCollections) {
            await addUserCollection(tmp)
            let resw = await find_Info_Activity(Activityuuid)
            let resState = { "CollectionState": "true", resw }
            return sendOK(res, resState)
        } else if (selectUserCollections && selectUserCollections.CardAmount === 0) {
            let resw = await find_Info_Activity(Activityuuid)
            let resState = { "CollectionState": "true", resw }
            return sendOK(res, resState)
        }
    } catch (e) {
        e.info(se, res, e)
    }
})
//收集卡牌
router.post('/userjoinactivity', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { Activityuuid } = (req as any).body
     validateCgi({ Activityuuid: Activityuuid }, collectionValidator.UUID)
    try {
        const info: LoginInfo = (req as any).loginInfo
        // if (!info.isAppUser())
        //     return sendNoPerm(res)
        let Useruuid = info.getUuid()
        let tmp = {
            Activityuuid: Activityuuid,//活动uuid
            Useruuid: Useruuid//用户uuid
        }
        //判断该用户是否已经收集过该活动的卡牌
        let selectUserCollections = await selectUserCollection(tmp)
        let CollectionStates = 1
        if (selectUserCollections.ChipIdAmounts) {
            return sendOK(res, { "addUserCollections": "false" })//返回已参加过
        } else {
            let tmp = {
                Activityuuid: Activityuuid,//活动uuid
                Useruuid: Useruuid,//用户uuid
                CollectionState: CollectionStates
            }
            //给数据赋初始值
            let Collections = await UserCollectionCard(tmp)
            let addUserCollections = { "addUserCollections": "true", Collections }
            return sendOK(res, addUserCollections)
        }
    } catch (e) {
        e.info(se, res, e)
    }
})
//帮我收藏卡牌
router.post('/helpothercollection', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    //UserId是用户发出链接的用户id
    let { Activityuuid, UserId } = (req as any).body
     validateCgi({ Activityuuid: Activityuuid, UserId: UserId }, collectionValidator.UserId)
    try {
        const info: LoginInfo = (req as any).loginInfo
        let Useruuid = info.getUuid()
        //查看该用户是否在该活动有帮别人收集过的记录
        let rs: any = await getModel("mall.collectioncreate").findOne({ where: { uuid: Activityuuid } });
        let collectiondone=rs.collectiondone
        let helpUser;
        if(collectiondone){
            collectiondone.forEach((r: any) => {
                    if (r === Useruuid) {
                        helpUser = { "res": "done" }
                    }
            });
        }
        if (helpUser) {
            return sendOK(res, helpUser)
        }
        // if (!info.isAppUser())
        //     return sendNoPerm(res)
        
        let tmp = {
            Activityuuid: Activityuuid,//活动uuid
            Useruuid: Useruuid,//用户uuid
            UserId: UserId//该链接的对象
        }
        //判断该用户是否已经帮他收集过该活动的卡牌
        let selectUserCollectionCards = await selectUserCollectionCard(tmp)
        let isNoColletion = selectUserCollectionCards.CollectionGetUserId
        let tmp2 = {
            Activityuuid: Activityuuid,//活动uuid
            Useruuid: Useruuid,//用户uuid
        }
        let selectUserCollections = await selectUserCollection(tmp2)
        if (!selectUserCollections) {
            await addUserCollection(tmp2)
        }
        let helpfalse;
        if (isNoColletion) {
            isNoColletion.forEach((r: any) => {
                if (r === Useruuid) {
                    helpfalse = { "res": "false" }
                }
            });
        }
        if (helpfalse) {
            return sendOK(res, helpfalse)
        }
        let tmp1 = {
            Activityuuid: Activityuuid,//活动uuid
            Useruuid: Useruuid,//用户uuid
            UserId: UserId//该链接的对象
        }
        
        let rss: any = await getModel("mall.usercollection").findOne({ where: { Activityuuid, Useruuid: UserId } });
        if (rs.State === 2) {
            return sendNotFound(res, "活动已经结束，停止收集")
        }
        if (rss.CollectionState === 2 || rss.CollectionState === 3) {
            return sendNotFound(res, "该用户已收集完成，停止帮他收集")
        }
        //给卡牌数据赋值
        let Collections = await UserCollectionCardHelp(tmp)
        //录入该活动帮忙的用户
        await insertUserCollection(Activityuuid,Useruuid)
        //给碎片数据赋值
        let Collections2 = await UserCollectionchipHelp(tmp1)
        let join = { "res": "true", Collections, Collections2 }
        return sendOK(res, join)
    } catch (e) {
        e.info(se, res, e)
    }
})
//APP活动详情展示
router.get('/activityInfo/:Activityuuid', async function (req: Request, res: Response, next: NextFunction) {
    try {
        let Activityuuid = req.params["Activityuuid"];
         validateCgi({ Activityuuid: Activityuuid }, collectionValidator.UUID)
        let ac_ext = await find_Info_Activity(Activityuuid)
        return sendOK(res, ac_ext)            //返回ac_ext的信息
    } catch (e) {
        e.info(se, res, e);
    }
})
//APP用户活动详情展示

router.get('/activityUserInfo/:Activityuuid/:Useruuid', async function (req: Request, res: Response, next: NextFunction) {
    try {
        let Activityuuid = req.params["Activityuuid"];
        let Useruuid = req.params["Useruuid"];
        validateCgi({ Activityuuid: Activityuuid, Useruuid: Useruuid }, collectionValidator.lofo)
        let ac_ext = await find_UserInfo_Activity(Activityuuid, Useruuid)
        return sendOK(res, ac_ext)            //返回ac_ext的信息
    } catch (e) {
        e.info(se, res, e);
    }
})
//收集道具活动查看所有的活动管理功能
router.get('/selectAll', async function (req: Request, res: Response, next: NextFunction) {
    try {
        let ac_ext = await find_All_Activity()
        return sendOK(res, ac_ext)            //返回ac_ext的信息
    } catch (e) {
        e.info(se, res, e);
    }
})
//查看用户出生年份
router.get('/userbirthday/:Activityuuid', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    try {
        let Activityuuid = req.params["Activityuuid"];
        // validateCgi({ Activityuuid: Activityuuid }, collectionValidator.UUID)
        const info: LoginInfo = (req as any).loginInfo
        let uuid = info.getUuid()
        let fortuneuuid = "99e892f2-24b8-467c-bc68-c710a8b95206"
        validateCgi({ uuid: uuid }, advertiserValidator.UUID)
        let answer = await findisNoFor(Activityuuid)
        let birthday = await findUserBirthday(uuid)
        let fortuneall: any = await findfortune(fortuneuuid)
        let fortune = fortuneall.fortune
        let emolument = fortuneall.emolument
        let longevity = fortuneall.longevity
        let property = fortuneall.property
        let happiness = fortuneall.happiness
        let fortunejson = JSON.parse(fortune)
        let emolumentjson = JSON.parse(emolument)
        let longevityjson = JSON.parse(longevity)
        let propertyjson = JSON.parse(property)
        let happinessjson = JSON.parse(happiness)
        let isNoFortune
        if (answer === 1) {
            return sendOK(res, { birthday, "answer": "true", fortune: fortunejson, emolument: emolumentjson, longevity: longevityjson, property: propertyjson, happiness: happinessjson })
        } else { isNoFortune === 0 } {
            return sendOK(res, { birthday, "answer": "false", fortune: fortunejson, emolument: emolumentjson, longevity: longevityjson, property: propertyjson, happiness: happinessjson })
        }
        //返回年份及活动信息的信息
    } catch (e) {
        e.info(se, res, e);
    }
})

//领取奖励
router.post('/getreward', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    try {
        let { Activityuuid, address } = (req as any).body
        const info: LoginInfo = (req as any).loginInfo
        let uuid = info.getUuid()
        let stateaward: any = await find_UserInfo_Activity(Activityuuid, uuid)
        let colstate = stateaward.res
        let CollectionState = colstate.CollectionState
        //判断收集状态
        if (CollectionState !== 2) {
            sendOK(res, { "reward": "false" })
        } else if (CollectionState === 2) {
            let selectCollections: any = await find_Info_Activity(Activityuuid)
            let rewardmethod=selectCollections.rewardmethod
            let Couponid = selectCollections.Couponid
            let Gooduuid = selectCollections.Gooduuid
            let RedPacket = selectCollections.RedPacket
            let point = selectCollections.Point
            let rewardNumber=selectCollections.rewardNumber
            let rewardDoneNumber=selectCollections.rewardDone
            if(rewardDoneNumber>=rewardNumber){
                return sendOK(res, { "reward": "done" })
            }
            let rewardDone=rewardDoneNumber++
            await insertrewardDone(Activityuuid,rewardDone)
            // validateCgi({ Activityuuid: Activityuuid, Useruuid: Useruuid }, collectionValidator.lofo)
            let ac_ext: any = await find_UserInfo_Activity(Activityuuid, uuid)
            let act: any = await find_Info_Activity(Activityuuid)
            let CardAmount: any = ac_ext.res
            let cardcard = CardAmount.CardIdAmounts
            let amount = act.CardIdAmounts
            let pointTotal: any = 0
            //累计获取的积分
            for (let i = 1; i < amount + 1; i++) {
                let card = "card" + i
                pointTotal += ((cardcard[card])-1) * point
            }
            let pointtitle = point + "积分"
            let redpacktitle = RedPacket + "元"
            let created = new Date
            //积分详情
            let awardpointinfo = {
                "uuid": uuid
                , "prize": { "balance": point }, "state": "balance", "title": pointtitle
                , "created": created, "modified": created
            }
            //红包详情
            let awardredpacketinfo = {
                "uuid": uuid
                , "prize": { "balance": point }, "state": "balance", "title": redpacktitle
                , "created": created, "modified": created
            }
            //添加积分
            await updatePoints(uuid, { points: pointTotal, balance: 0, exp: 0 })//增加积分
            let obj = {
                useruuid: uuid,
                points: pointTotal,
                mode: "collection",
                time: moment().format('YYYY-MM-DD HH:mm:ss')
            }
            await insertAmountLog(obj)
            //积分记录
            await insertLotterylog({ useruuid: uuid, prizeinfo: awardpointinfo, point: parseInt(pointTotal), balance: 0 })
            // if (RedPacket === 0 && !Couponid) {
                if (rewardmethod===1) {
                let goods = await findByPrimary(Gooduuid)
                let goodpoints = { "goodpoint": goods.points }
                let goodprices = { "goodprice": goods.price }
                let gooduuids = { "gooduuid": goods.uuid }
                let number = { "number":1 }
                let businessGoods = { ...goods, ...goodpoints, ...goodprices, ...gooduuids,...number }
                // let number = 1
                let obj = {
                    useruuid: uuid,
                    goods: [businessGoods],
                    total_fee: 0,
                    real_fee: 0,
                    fee_info: {},
                    address: address,
                    message: "",
                    goodpoint: 0,
                    postage: 0,
                    businessmen: businessGoods.businessmen,
                    // businessmen: "官方活动",
                    prize: 'true',//奖品
                    state: 'wait-send'
                }
                // 判断商品是否已下线
                let goodsOnline = await findByStateVir(Gooduuid)
                if (!goodsOnline)
                    return sendNotFound(res, businessGoods.title + "已删除或已下架")
                let orders = await insertOrder(obj)
                orders.total_fee = orders.total_fee / 100
                orders.real_fee = orders.real_fee / 100
                let rewardtimestamp = new Date().getTime()
                let timestamp4 = new Date(rewardtimestamp);
                await getreward(uuid, Activityuuid, timestamp4)//将奖品设置为已领取
                return sendOK(res, { "reward": "true" })
                //获取优惠券
            // } else if (!Gooduuid && RedPacket === 0) {
            } else if (rewardmethod === 2) {
                await insertusercoupon(req.app.locals.sequelize, uuid, Couponid)//发放优惠券到用户
                let rewardtimestamp = new Date().getTime()
                let timestamp4 = new Date(rewardtimestamp);
                await getreward(uuid, Activityuuid, timestamp4)//将奖品设置为已领取
                return sendOK(res, { "reward": "true" })
                //获取红包
            // } else if (!Gooduuid && !Couponid) {
            } else if (rewardmethod===0) {
                await updatePoints(uuid, { points: 0, balance: parseFloat(RedPacket) * 100, exp: 0 })//增加积分
                await insertLotterylog({ useruuid: uuid, prizeinfo: awardredpacketinfo, point: 0, balance: parseFloat(RedPacket) * 100 })
                await amountcheck(req.app.locals.sequelize, uuid, "collection", parseFloat(RedPacket), 0)
                let rewardtimestamp = new Date().getTime()
                let timestamp4 = new Date(rewardtimestamp);
                await getreward(uuid, Activityuuid, timestamp4)//将奖品设置为已领取
                return sendOK(res, { "reward": "true" })
            }
        }
    } catch (e) {
        e.info(se, res, e);
    }
})
//查看活动crm记录
router.get('/getrewardinfo/:Activityuuid', async function (req: Request, res: Response, next: NextFunction) {
    try{
    let  Activityuuid  = req.params["Activityuuid"];
    // let Activityuuid = req.params["Activityuuid"];
    let { start, length, State } = req.query
    let CollectionState = State
    let recordsFiltered
    let userreward
    if (State) {
        let obj1 = {}
        obj1 = {
            $and: [
                { CollectionState: CollectionState },
                { Activityuuid}
            ]
        }

        userreward = await findColInfo1(obj1, parseInt(start), parseInt(length))
        let recordsFiltereds = await getCount1(Activityuuid, CollectionState)
        recordsFiltered = recordsFiltereds.length
    } else {
        let obj = {}
        obj = {
            $or: [
                { Activityuuid }
            ]
        }
        userreward = await findColInfo1(obj, parseInt(start), parseInt(length))
        let recordsFiltereds = await find_UserInfoLog(Activityuuid)
        recordsFiltered = recordsFiltereds.length
    }
    let activity: any = await find_Info_Activity(Activityuuid)
    let userlog: any = []
    if (userreward.length !== 0) {
        for (let i = 0; i < userreward.length; i++) {
            let userinfo
            let rewardinfo: any = userreward[i]
            let Useruuid = rewardinfo.Useruuid
            let User = await find_User(Useruuid)
            let username = User.username
            let createtime = User.created.getTime()
            let jointime=userreward[i].createTime.getTime()
            let CollectionState = rewardinfo.CollectionState
            let CardIdAmounts = rewardinfo.CardIdAmounts
            let Filename = activity.Filename
            let rewardtimestamp
            if (CollectionState == 3) {
                rewardtimestamp = (rewardinfo.rewardtimestamp).getTime()
            }
            userinfo = { CollectionState, username, Useruuid, createtime, Filename, CardIdAmounts, rewardtimestamp,jointime }
            userlog.push(userinfo)
        }
        return sendOK(res, { userlog, recordsFiltered: recordsFiltered })
    } else {
        return sendOK(res, { userlog, recordsFiltered: userreward.length })
    }
} catch (e) {
    e.info(se, res, e);
}
})
router.get('/getuserinfo/:Activityuuid/:useruuid', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { start, length } = req.query
    let Activityuuid = req.params["Activityuuid"];
    let Useruuid = req.params["useruuid"];
    let userinfo = await find_UserInfo_Activity(Activityuuid, Useruuid)
    let UserCollection = userinfo.UserCollection
    let Start = parseInt(start)
    let Length = parseInt(length)
    let userCollection:any = []
    if (UserCollection) {
        if (UserCollection.length < (Start + Length)) {
            for (let i = Start; i < UserCollection.length; i++) {
                userCollection.push(UserCollection[i])
            }
        } else {
            for (let i = Start; i < Start + Length; i++) {
                userCollection.push(UserCollection[i])
            }
        }
        return sendOK(res, { userCollection, recordsFiltered: UserCollection.length })
    }else{
        return sendOK(res, { userCollection, recordsFiltered:0 })
    }
})