
import { validateCgi } from "../../lib/validator"
import { checkLogin } from "../../redis/logindao"
import { evaluateValidator } from "./validator"
import { sendOK, sendNoPerm, sendErrMsg } from "../../lib/response"
import { LoginInfo } from "../../redis/logindao"
import { Router, Request, Response, NextFunction } from "express"
import {
    createEvaluateActivity, updateEvaluateActivity, delEvaluateActivity, actGetCount, findAllEvaluateActivityByTag,
    findAllEvaluateActivity, findByPrimaryUUID, updateEvaluateActivityUUID, actGetCountByTag
} from "../../model/evaluate/evaluateactivity"
import { groupGetCount, findGroup, findByGroupUUID, updateGroup } from "../../model/evaluate/evaluategroup"
import { findUserByGroupUUID } from "../../model/evaluate/evaluatejoin"
import { insertEvaluateLog, findByState, getCountByStateAndActUUID } from "../../model/evaluate/evaluatelog"
import { insertOrder } from "../../model/orders/orders"
import { findByPrimary } from "../../model/mall/goods"
import { recharge } from "../../model/users/users_ext"
import { findByPrimary as findUserByUUID } from "../../model/users/users"
import { findByUuid } from "../../model/users/address"
import { timestamps } from "../../config/winston"

export const router: Router = Router()

//增加一个暗拼活动
router.post("/add", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { tag, starttime, endtime, amount, gooduuid, marketprice, reserveprice, freeprobability } = (req as any).body
    let obj = { tag, starttime, endtime, amount, gooduuid, marketprice, reserveprice, freeprobability }
    validateCgi(obj, evaluateValidator.add)

    try {
        if (parseFloat(marketprice) <= parseFloat(reserveprice))
            return sendErrMsg(res, "底价应该低于市场价", 500)

        const info: LoginInfo = (req as any).loginInfo
        if (!info.isAdvertiserRW() && !info.isAdminRW() && !info.isRoot())
            return sendNoPerm(res)

        await createEvaluateActivity(obj)
        return sendOK(res, { msg: "创建成功" })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//修改一个暗拼活动
router.put("/update", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { uuid, tag, starttime, endtime, amount, gooduuid, marketprice, reserveprice, freeprobability } = (req as any).body
    let obj = { uuid, tag, starttime, endtime, amount, gooduuid, marketprice, reserveprice, freeprobability }
    validateCgi(obj, evaluateValidator.update)

    try {
        if (parseFloat(marketprice) <= parseFloat(reserveprice))
            return sendErrMsg(res, "底价应该低于市场价", 500)

        const info: LoginInfo = (req as any).loginInfo
        if (!info.isAdvertiserRW() && !info.isAdminRW() && !info.isRoot())
            return sendNoPerm(res)

        let nowtime = timestamps()
        let act = await findByPrimaryUUID(uuid)
        if (act.starttime < nowtime)
            return sendErrMsg(res, "已经开始，不能修改", 501)

        delete obj.uuid
        await updateEvaluateActivity(uuid, obj)
        return sendOK(res, { msg: "修改成功" })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//删除一个暗拼活动
router.delete("/act", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { uuid } = (req as any).body
    validateCgi({ uuid }, evaluateValidator.del)

    try {
        const info: LoginInfo = (req as any).loginInfo
        if (!info.isAdvertiserRW() && !info.isAdminRW() && !info.isRoot())
            return sendNoPerm(res)

        let nowtime = timestamps()
        let activity = await findByPrimaryUUID(uuid)
        if (activity.starttime < nowtime /* && activity.endtime > nowtime */)
            return sendErrMsg(res, "暂时不能删除", 501)

        await delEvaluateActivity(uuid)
        return sendOK(res, { msg: "删除成功" })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//查询全部暗拼活动
router.get("/act", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { search, start, length } = (req as any).query
    validateCgi({ start, length }, evaluateValidator.getAllact)
    if (search.value)
        validateCgi({ search: search.value }, evaluateValidator.getAllactTag)

    try {
        let recordsFiltered
        let arr
        if (search.value) {
            recordsFiltered = await actGetCountByTag(req.app.locals.sequelize, search.value)
            arr = await findAllEvaluateActivityByTag(search.value, start, length)
        } else {
            recordsFiltered = await actGetCount()
            arr = await findAllEvaluateActivity(start, length)
        }

        let nowtime = timestamps()
        let array = []
        for (let i = 0; i < arr.length; i++) {
            arr[i].created = timestamps(arr[i].created)
            arr[i].modified = timestamps(arr[i].modified)

            if (nowtime < arr[i].starttime)
                arr[i]['status'] = '未开始'
            else if (nowtime > arr[i].endtime)
                arr[i]['status'] = '已结束'
            else if (nowtime > arr[i].starttime && nowtime < arr[i].endtime && !arr[i].state)
                arr[i]['status'] = '进行中'
            else
                arr[i]['status'] = '已结束'

            let good = await findByPrimary(arr[i].gooduuid)
            let obj = Object.assign(arr[i], { title: good.title })

            array.push(obj)
        }

        return sendOK(res, { array, recordsFiltered })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//停止一个暗拼活动,提前结束
router.put("/stop", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { uuid } = (req as any).body
    validateCgi({ uuid }, evaluateValidator.stop)

    try {
        const info: LoginInfo = (req as any).loginInfo
        if (!info.isAdvertiserRW() && !info.isAdminRW() && !info.isRoot())
            return sendNoPerm(res)

        let nowtime = timestamps()
        let activity = await findByPrimaryUUID(uuid)
        if (nowtime < activity.starttime || nowtime > activity.endtime)
            return sendErrMsg(res, "活动未开始或已经结束", 501)

        let obj = { state: "finish" }
        await updateEvaluateActivity(uuid, obj)
        return sendOK(res, { msg: "已提前结束" })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//查询某活动全部的团
router.get("/group", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { activityuuid, start, length } = (req as any).query
    validateCgi({ activityuuid, start, length }, evaluateValidator.getAll)

    try {
        let recordsFiltered = await groupGetCount({ activityuuid })
        let arr = await findGroup(activityuuid, start, length)

        let array = []
        for (let i = 0; i < arr.length; i++) {
            arr[i].created = timestamps(arr[i].created)
            arr[i].modified = timestamps(arr[i].modified)

            let useruuids = arr[i].useruuids
            let usernames = []
            for (let j = 0; j < useruuids.length; j++) {
                let user = await findUserByUUID(useruuids[j])
                if (user)
                    usernames.push(user.username)
            }
            arr[i]['usernames'] = usernames

            let act = await findByPrimaryUUID(arr[i].activityuuid)
            let good = await findByPrimary(act.gooduuid)
            let obj = Object.assign(arr[i], { title: good.title });
            array.push(obj)
        }
        return sendOK(res, { array, recordsFiltered })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

/* router.put("/fulfill", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { groupuuid } = (req as any).body
    validateCgi({ groupuuid }, evaluateValidator.fulfill)

    try {
        const info: LoginInfo = (req as any).loginInfo
        if (!info.isAdvertiserRW() && !info.isAdminRW() && !info.isRoot())
            return sendNoPerm(res)

        let group = await findByGroupUUID(groupuuid)
        if (group.state != 'finish')
            return sendErrMsg(res, "这个团还没达到人数,或者已经生成订单", 501)

        let act = await findByPrimaryUUID(group.activityuuid)
        let good = await findByPrimary(act.gooduuid)
        if (good.state != 'onsale' || good.delete == 1)
            return sendErrMsg(res, "商品已经下架", 502)

        let obj: any = {}
        obj.groupuuid = groupuuid
        obj.state = 'fulfill'
        obj.created = group.created
        obj.goodtitle = good.title
        obj.activityuuid = act.uuid

        let join = await findUserByGroupUUID(groupuuid)
        const rand = Math.random()
        let index = undefined
        if (rand < act.freeprobability) {//有人要免单了
            index = Math.floor(Math.random() * join.length)
        }

        let users: any = []
        for (let i = 0; i < join.length; i++) {
            if (i > 0)  //退回多余的钱
                await recharge(join[i].useruuid, (join[i].bid - join[0].bid) * 100)

            if (i == index) //给这个人免单
                await recharge(join[i].useruuid, join[i].bid * 100)

            let addr = await findByUuid(join[i].addressuuid)
            let obj = Object.assign(good, { property: join[i].property })
            let ord = {
                useruuid: join[i].useruuid,
                goods: [obj],
                total_fee: join[0].bid * 100,
                real_fee: join[0].bid * 100,
                fee_info: "以团内最低出价为成交价，多付部分退回钱包",
                address: addr,
                state: 'wait-send',
                fee_type: 'wxpay'   //这里就写微信支付吧，没关系
            }
            let order = await insertOrder(ord)
            users.push({ useruuid: join[i].useruuid, orderuuid: order.uuid, bid: join[i].bid, refund: join[i].bid - join[0].bid })
        }
        obj.users = users
        obj.turnover = join[0].bid
        group.state = 'fulfill'
        await updateGroup(group.uuid, group)    //更新团的状态为fulfill

        await insertEvaluateLog(obj)   //插入日志记录

        return sendOK(res, { msg: "已经生成订单" })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
}) */

//兑现一个团，也就是,1.给团成员生成订单，2.退回多余的钱，3.按规则免单
export async function fulfillGroup(groupuuid: string) {
    try {

        let group = await findByGroupUUID(groupuuid)
        let act = await findByPrimaryUUID(group.activityuuid)
        let good = await findByPrimary(act.gooduuid)

        let obj: any = {}
        obj.groupuuid = groupuuid
        obj.state = 'fulfill'
        obj.created = group.created
        obj.goodtitle = good.title
        obj.activityuuid = act.uuid

        let join = await findUserByGroupUUID(groupuuid)
        const rand = Math.random()
        let index = undefined
        if (rand < act.freeprobability) {//有人要免单了
            index = Math.floor(Math.random() * join.length)
        }

        let users: any = []
        for (let i = 0; i < join.length; i++) {
            if (i > 0)  //退回多余的钱
                await recharge(join[i].useruuid, (join[i].bid - join[0].bid) * 100)

            if (i == index) //给这个人免单
                await recharge(join[i].useruuid, join[i].bid * 100)

            let addr = await findByUuid(join[i].addressuuid)
            let obj = Object.assign(good, { property: join[i].property })
            let ord = {
                useruuid: join[i].useruuid,
                goods: [obj],
                total_fee: join[0].bid * 100,
                real_fee: join[0].bid * 100,
                fee_info: "以团内最低出价为成交价，多付部分退回钱包",
                address: addr,
                state: 'wait-send',
                fee_type: 'wxpay'   //这里就写微信支付吧，没关系
            }
            let order = await insertOrder(ord)
            users.push({ useruuid: join[i].useruuid, orderuuid: order.uuid, bid: join[i].bid, refund: join[i].bid - join[0].bid })
        }
        obj.users = users
        obj.turnover = join[0].bid
        group.state = 'fulfill'
        await updateGroup(group.uuid, group)    //更新团的状态为fulfill

        await insertEvaluateLog(obj)   //插入日志记录

        return '生成订单成功'
    } catch (e) {
        return e
    }
}

//重启一个活动
router.post("/restart", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { uuid, starttime, endtime } = (req as any).body
    validateCgi({ uuid, starttime, endtime }, evaluateValidator.restart)

    try {
        const info: LoginInfo = (req as any).loginInfo
        if (!info.isAdvertiserRW() && !info.isAdminRW() && !info.isRoot())
            return sendNoPerm(res)

        await updateEvaluateActivityUUID(req.app.locals.sequelize, uuid, starttime, endtime)
        return sendOK(res, { msg: "重启成功，克隆了一个活动，旧活动保留" })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

/*
router.put("/cancel", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { groupuuid } = (req as any).body
    validateCgi({ groupuuid }, evaluateValidator.fulfill)

    try {
        const info: LoginInfo = (req as any).loginInfo
        if (!info.isAdvertiserRW() && !info.isAdminRW() && !info.isRoot())
            return sendNoPerm(res)

        let nowtime = timestamps()
        let group = await findByGroupUUID(groupuuid)
        let act = await findByPrimaryUUID(group.activityuuid)
        let good = await findByPrimary(act.gooduuid)
        if (nowtime < act.endtime && act.state == '')
            return sendErrMsg(res, "活动还在进行，不能取消团", 501)

        if (group.state == 'cancelled')
            return sendErrMsg(res, "团已经取消，不能重复操作", 502)

        let obj: any = {}
        obj.groupuuid = groupuuid
        obj.goodtitle = good.title
        obj.created = group.created
        obj.state = 'cancelled'
        obj.activityuuid = act.uuid

        let users: any = []
        let join = await findUserByGroupUUID(groupuuid)
        for (let i = 0; i < join.length; i++) { //退回到零钱
            await recharge(join[i].useruuid, join[i].bid * 100)
            users.push({ useruuid: join[i].useruuid, bid: join[i].bid })
        }
        obj.users = users
        group.state = 'cancelled'
        await updateGroup(group.uuid, group)    //更新团的状态为cancelled

        await insertEvaluateLog(obj)   //插入日志记录

        return sendOK(res, { msg: "团取消，钱退回到用户零钱" })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
}) */

//人数不足，取消团
export async function cancelGroup(groupuuid: string) {
    try {
        let group = await findByGroupUUID(groupuuid)
        let act = await findByPrimaryUUID(group.activityuuid)
        let good = await findByPrimary(act.gooduuid)

        let obj: any = {}
        obj.groupuuid = groupuuid
        obj.goodtitle = good.title
        obj.created = group.created
        obj.state = 'cancelled'
        obj.activityuuid = act.uuid

        let users: any = []
        let join = await findUserByGroupUUID(groupuuid)
        for (let i = 0; i < join.length; i++) { //退回到零钱
            await recharge(join[i].useruuid, join[i].bid * 100)
            users.push({ useruuid: join[i].useruuid, bid: join[i].bid })
        }
        obj.users = users
        group.state = 'cancelled'
        await updateGroup(group.uuid, group)    //更新团的状态为cancelled

        await insertEvaluateLog(obj)   //插入日志记录

        return "团取消，钱退回到用户零钱"

    } catch (e) {
        return e
    }
}

//查看组团历史记录
router.get('/his', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { activityuuid, state, start, length } = (req as any).query
    validateCgi({ activityuuid, state, start, length }, evaluateValidator.his)
    try {
        const info: LoginInfo = (req as any).loginInfo
        if (!info.isAdvertiserRW() && !info.isAdminRW() && !info.isRoot())
            return sendNoPerm(res)

        let groups = await findByState(activityuuid, state, start, length)
        let recordsFiltered = await getCountByStateAndActUUID(state, activityuuid)

        for (let i = 0; i < groups.length; i++) {
            let users = groups[i].users
            for (let j = 0; j < users.length; j++) {
                let someOne = await findUserByUUID(users[j].useruuid)
                groups[i].users[j] = Object.assign({ userInfo: someOne }, groups[i].users[j])
            }
        }
        return sendOK(res, { groups, recordsFiltered })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})
