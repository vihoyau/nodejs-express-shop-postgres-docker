import { validateCgi } from "../../lib/validator"
import { checkAppLogin } from "../../redis/logindao"
import { evaluateValidator } from "./validator"
import { sendOK, sendErrMsg, sendNotFound } from "../../lib/response"
import { LoginInfo } from "../../redis/logindao"
import { Router, Request, Response, NextFunction } from "express"
import { findByUseruuidAndActuuid, updateEvaluatejoin, createEvaluatejoin, findByUserUUID } from "../../model/evaluate/evaluatejoin"
import { findByPrimaryUUID, findAllProcessingActivity } from "../../model/evaluate/evaluateactivity"
import { createGroup, findByGroupUUID, updateGroup, findByState } from "../../model/evaluate/evaluategroup"
import { findByPrimary } from "../../model/mall/goods"
import { findByPrimary as usersExtFindByPrimary, exchange } from "../../model/users/users_ext"
import { findByPrimary as findByUUID } from "../../model/users/users"
import { fulfillGroup } from "../../router/crm/evaluate"
import { timestamps } from "../../config/winston"
import { getPageCount } from "../../lib/utils"
import { bidMaxCount } from "../../config/wxpay"

export const router: Router = Router()

//开团,试图开团
router.post("/tryopen", checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { activityuuid,/* addressuuid,*/ bid } = (req as any).body
    const info: LoginInfo = (req as any).loginInfo
    const useruuid = info.getUuid()
    validateCgi({ activityuuid, /*addressuuid,*/ bid }, evaluateValidator.opengroup)

    try {
        let act = await findByPrimaryUUID(activityuuid)
        let nowtime = timestamps()
        if (act.endtime < nowtime || act.state == 'finish')
            return sendErrMsg(res, "活动已经结束", 502)

        let join = await findByUseruuidAndActuuid(useruuid, activityuuid)//获取参团信息
        if (join && join.groupuuid)
            return sendErrMsg(res, "您已经参团本活动", 501)

        if (join && join.inputcount > bidMaxCount)
            return sendErrMsg(res, "您尝试次数太多啦", 501)

        if (join && join.guess)
            return sendErrMsg(res, "您已经猜成功过啦", 500)

        if (join) {
            join.inputcount++
            join.bid = bid
            join.leader = true
            await updateEvaluatejoin(join.uuid, join)
        } else {
            let obj = {
                useruuid,
                activityuuid,
                bid,
                /*addressuuid,*/
                inputcount: 1,
                leader: true,
                pay: false
            }
            join = await createEvaluatejoin(obj)
        }

        if (bid < (act.reserveprice) * 0.8) {
            let msg = "亲，您太小看咱家宝贝了吧！" +
                ((bidMaxCount - join.inputcount + 1) > 0 ? "还有" + (bidMaxCount - join.inputcount + 1) + "次机会" : "没有猜价机会了哦")
            return sendErrMsg(res, msg, 503)
        }

        if (bid < act.reserveprice) {
            let msg = "您距离专家只剩一步之遥!" +
                ((bidMaxCount - join.inputcount + 1) > 0 ? "还有" + (bidMaxCount - join.inputcount + 1) + "次机会" : "没有猜价机会了哦")
            return sendErrMsg(res, msg, 504)
        }

        await updateEvaluatejoin(join.uuid, { guess: true })

        if (bid == act.reserveprice)
            return sendOK(res, { msg: "大神！请受我一拜！", joinuuid: join.uuid })

        if (bid > act.reserveprice && bid <= act.marketprice)
            return sendOK(res, { msg: "高手，不愧为识货大师！", joinuuid: join.uuid })

        if (bid > act.marketprice)
            return sendOK(res, { msg: "豪，请收下我的膝盖吧！", joinuuid: join.uuid })

    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})


//更新商品属性
router.post("/updateProperty", checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { uuid, property, groupuuid } = (req as any).body
    await updateEvaluatejoin(uuid, { property, groupuuid })
    return sendOK(res, { msg: "ok" })
})

//支付成功，创建一个团
export async function createGroupAfterPay(activityuuid: string, useruuid: string) {
    try {
        let obj = {
            activityuuid,
            useruuids: [useruuid],
            state: "processing",
        }
        let group = await createGroup(obj)

        let join = await findByUseruuidAndActuuid(useruuid, activityuuid)
        join.pay = true
        join.groupuuid = group.uuid
        await updateEvaluatejoin(join.uuid, join)

        return "成功开团，快去邀请好友"
    } catch (e) {
        return e
    }
}

//参团，试图参团
router.put("/tryjoin", checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { groupuuid, /*addressuuid,*/ bid } = (req as any).body
    const info: LoginInfo = (req as any).loginInfo
    const useruuid = info.getUuid()
    validateCgi({ groupuuid, /*addressuuid,*/ bid }, evaluateValidator.joingroup)

    try {
        let group = await findByGroupUUID(groupuuid)
        let act = await findByPrimaryUUID(group.activityuuid)
        let nowtime = timestamps()
        if (act.endtime < nowtime || act.state == 'finish')
            return sendErrMsg(res, "活动已经结束", 502)

        let join = await findByUseruuidAndActuuid(useruuid, group.activityuuid)//获取参团信息
        if (join && join.groupuuid)
            return sendErrMsg(res, "您已经参团本活动", 501)

        if (join && join.inputcount > bidMaxCount)
            return sendErrMsg(res, "您尝试次数太多啦", 501)

        if (join && join.guess)
            return sendErrMsg(res, "您已经猜成功过啦", 500)

        if (join) {
            join.inputcount++
            join.bid = bid
            join.leader = false
            await updateEvaluatejoin(join.uuid, join)
        } else {
            let obj = {
                useruuid,
                activityuuid: group.activityuuid,
                bid,
                inputcount: 1,
                leader: false,
                pay: false
            }
            join = await createEvaluatejoin(obj)
        }

        if (bid < (act.reserveprice) * 0.8) {
            let msg = "亲，您太小看咱家宝贝了吧！" +
                ((bidMaxCount - join.inputcount + 1) > 0 ? "还有" + (bidMaxCount - join.inputcount + 1) + "次机会" : "没有猜价机会了哦")
            return sendErrMsg(res, msg, 503)
        }

        if (bid < act.reserveprice) {
            let msg = "您距离专家只剩一步之遥!" +
                ((bidMaxCount - join.inputcount + 1) > 0 ? "还有" + (bidMaxCount - join.inputcount + 1) + "次机会" : "没有猜价机会了哦")
            return sendErrMsg(res, msg, 504)
        }

        await updateEvaluatejoin(join.uuid, { guess: true })

        if (bid == act.reserveprice)
            return sendOK(res, { msg: "大神！请受我一拜！", joinuuid: join.uuid })

        if (bid > act.reserveprice && act.marketprice)
            return sendOK(res, { msg: "高手，不愧为识货大师！", joinuuid: join.uuid })

        if (bid > act.marketprice)
            return sendOK(res, { msg: "豪，请收下我的膝盖吧！", joinuuid: join.uuid })

    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//支付成功，加入一个团
export async function joinGroupAfterPay(groupuuid: string, useruuid: string) {
    try {
        let group = await findByGroupUUID(groupuuid)
        let join = await findByUseruuidAndActuuid(useruuid, group.activityuuid)
        join.pay = true
        join.groupuuid = groupuuid

        await updateEvaluatejoin(join.uuid, join)   //更新参与表的支付记录和所属团

        group.useruuids.push(useruuid)
        let act = await findByPrimaryUUID(group.activityuuid)
        if (act.amount == group.useruuids.length) {
            group.state = 'finish'  //达到人数就把状态改为完成
            //todo  自动生成订单
            await fulfillGroup(group.uuid)
        }

        await updateGroup(groupuuid, group) //更新这个团的信息

        return "成功加入团"
    } catch (e) {
        return e
    }
}

//零钱支付 参团&开团
router.post("/chargePay", checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { activityuuid, groupuuid, addressuuid, property } = (req as any).body
    if (activityuuid)
        validateCgi({ uuid: activityuuid }, evaluateValidator.uuid)
    if (groupuuid)
        validateCgi({ uuid: groupuuid }, evaluateValidator.uuid)

    let useruuid = req.headers.uuid
    try {
        let join = await findByUseruuidAndActuuid(useruuid, activityuuid)
        let act = await findByPrimaryUUID(activityuuid)
        if (!join)
            return sendNotFound(res, "没有参团信息！")

        if (join && join.pay)
            return sendNotFound(res, "已经支付参团")

        if (join && join.inputcount > bidMaxCount)
            return sendNotFound(res, "您尝试次数太多啦")

        if (join.bid < act.reserveprice)
            return sendNotFound(res, "出价不对")

        let user_ext = await usersExtFindByPrimary(useruuid)
        if (user_ext.balance < join.bid * 100)
            return sendNotFound(res, "余额不足")

        await exchange(useruuid, { points: 0, balance: join.bid * 100 })
        await updateEvaluatejoin(join.uuid, { groupuuid, addressuuid, property })
        if (groupuuid)
            await joinGroupAfterPay(groupuuid, useruuid)
        else
            await createGroupAfterPay(activityuuid, useruuid)

        return sendOK(res, { msg: "succ" })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//查找只缺一个成员的团
router.get("/findgroup", /* checkAppLogin, */ async function (req: Request, res: Response, next: NextFunction) {
    let { activityuuid } = (req as any).query
    try {
        validateCgi({ activityuuid }, evaluateValidator.creategroup)
        let groups = await findByState(activityuuid, 'processing')
        let array = []

        for (let i = 0; i < groups.length; i++) {
            let act = await findByPrimaryUUID(groups[i].activityuuid)
            if (act.amount == groups[i].useruuids.length + 1) {

                let user = []
                for (let j = 0; j < groups[i].useruuids.length; j++) {
                    let someOne = await findByUUID(groups[i].useruuids[j])
                    delete someOne.password
                    user.push(someOne)
                }

                let good = await findByPrimary(act.gooduuid)
                let obj = Object.assign(groups[i], { title: good.title }, { userInfo: user }, { endtime: act.endtime })
                array.push(obj)
            }
        }

        return sendOK(res, array)
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//查找正在进行的活动
router.get("/processing",/* checkAppLogin, */async function (req: Request, res: Response, next: NextFunction) {
    let { page, count } = (req as any).query
    validateCgi({ page, count }, evaluateValidator.get)

    try {
        let { cursor, limit } = getPageCount(page, count)
        let array = []
        let nowtime = timestamps()
        let act = await findAllProcessingActivity(req.app.locals.sequelize, cursor, limit, nowtime)

        for (let i = 0; i < act.length; i++) {
            act[i].created = timestamps(act[i].created)
            act[i].modified = timestamps(act[i].modified)

            let good = await findByPrimary(act[i].gooduuid)
            good.price = good.price / 100
            good.realprice = good.realprice / 100
            let obj = Object.assign(act[i], { good }, { page: parseInt(page) + 1, count })
            array.push(obj)
        }

        return sendOK(res, array)
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//获取某个活动的详情
router.get("/theAct/:uuid", async function (req: Request, res: Response, next: NextFunction) {
    let activityuuid = req.params.uuid
    validateCgi({ uuid: activityuuid }, evaluateValidator.uuid)

    try {
        let act = await findByPrimaryUUID(activityuuid)
        act.created = timestamps(act.created)
        act.modified = timestamps(act.modified)

        let good = await findByPrimary(act.gooduuid)
        good.price = good.price / 100
        good.realprice = good.realprice / 100
        let obj = Object.assign(act, { good })
        return sendOK(res, obj)
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//获取自己参团信息
router.get('/joinInfo', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const info: LoginInfo = (req as any).loginInfo
    const useruuid = info.getUuid()
    let arr = []
    try {
        let join = await findByUserUUID(useruuid)
        for (let i = 0; i < join.length; i++) {
            let act = await findByPrimaryUUID(join[i].activityuuid)
            let good = await findByPrimary(act.gooduuid)
            good.price = good.price / 100
            good.realprice = good.realprice / 100
            let obj
            if (join[i].groupuuid) {
                let group = await findByGroupUUID(join[i].groupuuid)
                obj = Object.assign(
                    { actEndtime: act.endtime, actAmount: act.amount },
                    { join: join[i] },
                    { good },
                    { groupUsers: group.useruuids, groupState: group.state })
            } else {
                obj = Object.assign(
                    { actEndtime: act.endtime, actAmount: act.amount },
                    { join: join[i] },
                    { good })
            }
            arr.push(obj)
        }
        return sendOK(res, arr)
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//获取某个团的信息
router.get('/theGroup', async function (req: Request, res: Response, next: NextFunction) {
    let { groupuuid } = (req as any).query
    validateCgi({ groupuuid }, evaluateValidator.addgroup)
    try {
        let group = await findByGroupUUID(groupuuid)
        let user = []
        for (let i = 0; i < group.useruuids.length; i++) {
            let someOne = await findByUUID(group.useruuids[i])
            delete someOne.password
            user.push(someOne)
        }
        let act = await findByPrimaryUUID(group.activityuuid)
        group = Object.assign({ endtime: act.endtime, amount: act.amount }, { userInfo: user }, group)
        return sendOK(res, group)
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})