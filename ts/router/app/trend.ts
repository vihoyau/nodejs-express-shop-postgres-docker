import { validateCgi } from "../../lib/validator"
import { trendValidator } from "./validator"
import { Router, Request, Response, NextFunction } from "express"
import { uploadAdsImage, uploadAdsMovie } from "../../lib/upload"
import { trendImgOpt, trendMovOpt } from "../../config/resource"
import { sendOK, createdOk, sendNotFound, sendErrMsg } from "../../lib/response"
import { checkAppLogin, LoginInfo } from "../../redis/logindao"
import { getAnswerAds, saveAnswerAds } from "../../redis/history"
import { amountcheck } from "../../lib/amountmonitor"
import { insertAmountLog } from "../../model/users/amountlog"
import { getPageCount, changeUsername } from "../../lib/utils"
import { removeAsync } from "../../lib/fs"
import { createMessage } from "../../model/users/message"
import * as child_process from "child_process"
import {
    deleteTrend, updateTrend, findByTrendUUID, insertTrend, trendUpdateNice, trendCutNice, findByUserUUID,
    trendUpdateShare, trendUpdateCom, findAllTrend, modifilyMov, findAllTrendByKeyWord
} from "../../model/trend/trend"
import { insertReflect } from "../../model/trend/reflect"
import { insertReward } from "../../model/users/reward"
import {
    /* delTrendComment, findByParent, findByTrenduuid,*/ findByPrimaryUUID, insertComment,
    queryCommentNum, updateCommentNum, querycommentRepliedCount, queryCommentByparentuuid,
    queryCommentParent, queryCommentParentDownNum, findFirstComByParent, updateReward
} from "../../model/trend/trendcomment"
import { findByPrimary as usersExtFindByPrimary, exchange, recharge, updatePoints } from "../../model/users/users_ext"
import { timestamps } from "../../config/winston"
import { findByPrimary } from "../../model/users/users"
import { getByTwoUuid, insertAdslog, getCountByAdsUUID, findByAdsuuid, updateAdslog } from "../../model/ads/adslog"
import {
    findByUseruuidAndAdsuuid, insertApplaud, deleteByAdsUuid, queryUphistory,
    insertCommentApplaud, deleteByCommentUseruuid
} from "../../model/ads/applaud"
import { findAllByUserUUID, findShielduuidByUserUUID, insertShielded, deleteShielded } from "../../model/trend/shielded"
import * as path from "path"
import * as winston from "winston"

export const router = Router()

async function array_remove_repeat(a: Array<string>) { // 去重
    let r = [];
    for (let i = 0; i < a.length; i++) {
        let flag = true;
        let temp = a[i];
        for (let j = 0; j < r.length; j++) {
            if (temp === r[j]) {
                flag = false;
                break;
            }
        }
        if (flag) {
            r.push(temp);
        }
    }
    return r;
}

async function array_union(a: Array<string>, b: Array<string>) { // 并集
    return await array_remove_repeat(a.concat(b));
}

async function array_intersection(a: Array<string>, b: Array<string>) { // 交集
    let result = [];
    for (let i = 0; i < b.length; i++) {
        let temp = b[i];
        for (let j = 0; j < a.length; j++) {
            if (temp === a[j]) {
                result.push(temp);
                break;
            }
        }
    }
    return await array_remove_repeat(result);
}

//随机红包
function randAlloc(total: any, min: any, max: any, length: any) {
    // 首先要判断是否符合 min 和 max 条件
    if (min * length > total || max * length < total) {
        throw Error(`没法满足最最少 ${min} 最大 ${max} 的条件`);
    }

    const result = [];
    let restValue = total;
    let restLength = length;
    for (let i = 0; i < length - 1; i++) {
        restLength--;
        // 这一次要发的数量必须保证剩下的要足最小量
        // 同进要保证剩下的不能大于需要的最大量
        const restMin = restLength * min;
        const restMax = restLength * max;
        // 可发的量
        const usable = restValue - restMin;
        // 最少要发的量
        const minValue = Math.max(min, restValue - restMax);
        // 以 minValue 为最左，max 为中线来进行随机，即随机范围是 (max - minValue) * 2
        // 如果这个范围大于 usable - minValue，取 usable - minValue
        const limit = Math.min(usable - minValue, (max - minValue) * 2);
        // 随机部分加上最少要发的部分就是应该发的，但是如果大于 max，最大取到 max
        result[i] = Math.min(max, minValue + Math.floor(limit * Math.random()));
        restValue -= result[i];
    }
    result[length - 1] = restValue;

    return result;
}

//预先添加一个动态
router.post('/add', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { useruuid } = (req as any).headers.uuid
    try {
        let obj = { useruuid, content: "" }
        let t = await insertTrend(obj)
        return sendOK(res, t)
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//删除动态
router.delete('/:uuid', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    let uuid = req.params['uuid']
    try {
        let mediaName
        let trend = await findByTrendUUID(uuid)
        if (trend.pics && trend.pics.length > 0) {  //删除图片
            for (let i = 0; i < trend.pics.length; i++) {
                mediaName = path.join(trendImgOpt.targetDir, trend.pics[i])
                await removeAsync(mediaName)
            }
        }
        if (trend.mov) {    //删除视频
            mediaName = path.join(trendImgOpt.targetDir, trend.mov)
            await removeAsync(mediaName)
            await removeAsync(trend.preview)
        }
        await deleteTrend(uuid)
        return sendOK(res, { msg: "删除成功" })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//上传动态图片
router.post('/:uuid/uploadPic', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    let uuid = req.params['uuid']
    try {
        let newPath = await uploadAdsImage(req, {
            uuid: uuid,
            glob: trendImgOpt.glob,
            tmpDir: trendImgOpt.tmpDir,
            maxSize: trendImgOpt.maxSize,
            extnames: trendImgOpt.extnames,
            maxFiles: trendImgOpt.maxFiles,
            targetDir: trendImgOpt.targetDir,
            fieldName: trendImgOpt.fieldName,
        })
        return createdOk(res, { path: newPath })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//删除动态图片
router.delete('/:trenduuid/image', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { mediaName } = (req as any).query
    //let trenduuid = req.params["trenduuid"]
    try {
        mediaName = path.join(trendImgOpt.targetDir, /* trenduuid, */ mediaName)
        await removeAsync(mediaName)
        return sendOK(res, { msg: "succ" })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//编辑提交动态
router.put('/update', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { uuid, content, pics, question_ext, answer_mold, mold, reward } = (req as any).body
    validateCgi({ uuid, /* content, */ mold }, trendValidator.newTrend)
    let useruuid = (req as any).headers.uuid

    try {
        /*  let trend = await findByTrendUUID(uuid)
         if (trend.content != '')
             return sendErrMsg(res, "已经发布", 500) */

        switch (mold) {
            case 'default': {
                await updateTrend(uuid, { useruuid, content, pics, mold, state: 'on' })
                break
            }
            case 'redpaper': {
                validateCgi({
                    mold: answer_mold.mold, type: answer_mold.type,
                    amount: answer_mold.amount, total: answer_mold.total
                }, trendValidator.answer_mold)

                let user_ext = await usersExtFindByPrimary(useruuid)
                if (answer_mold.mold == 'point') {
                    if (answer_mold.type == 'random') {
                        if (user_ext.points < answer_mold.total)
                            return sendErrMsg(res, "积分不足", 500)
                        await exchange(useruuid, { points: answer_mold.total, balance: 0 })
                    } else {    //定额积分，total意义是每人积分
                        if (user_ext.points < (answer_mold.total * answer_mold.amount))
                            return sendErrMsg(res, "积分不足", 500)
                        await exchange(useruuid, { points: answer_mold.total * answer_mold.amount, balance: 0 })
                    }
                } else {
                    if (user_ext.balance < answer_mold.total * 100)
                        return sendErrMsg(res, "零钱不足", 500)
                    await exchange(useruuid, { points: 0, balance: answer_mold.total * 100 })   //数据库的零钱，单位是分
                }

                let random
                if (answer_mold.type == 'random')   //产生随机红包
                    random = randAlloc(answer_mold.total, 1, 2 * (answer_mold.total / answer_mold.amount), answer_mold.amount)

                await updateTrend(uuid, { useruuid, content, pics, mold, answer_mold, question_ext, random, state: 'on' })
                break
            }
            case 'reward': {
                await updateTrend(uuid, { useruuid, content, pics, mold, reward, state: 'on' })
                break
            }
            default: return sendErrMsg(res, "mold异常", 500)
        }
        return sendOK(res, { msg: "succ" })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//动态搜索关键字
router.get('/keyword', async function (req: Request, res: Response, next: NextFunction) {
    let { page, count, keyword } = (req as any).query
    validateCgi({ page, count }, trendValidator.getAll)
    let useruuid = (req as any).headers.uuid
    try {
        let arr: any = []
        let { cursor, limit } = getPageCount(page, count)
        let trends = await findAllTrendByKeyWord(req.app.locals.sequelize, cursor, limit, keyword)
        for (let i = 0; i < trends.length; i++) {
            let applaud = 0
            if (useruuid)
                applaud = await findByUseruuidAndAdsuuid(trends[i].uuid, useruuid)

            trends[i].modified = timestamps(trends[i].modified)
            trends[i].created = timestamps(trends[i].created)
            trends[i].username = changeUsername(trends[i].username)
            arr.push({ trend: trends[i], applaud: applaud ? 1 : 0 })
        }
        return sendOK(res, arr)
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//查看自己屏蔽的人
router.get('/shield', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { useruuid, page, count } = (req as any).query
    let { cursor, limit } = getPageCount(page, count)
    let s = await findAllByUserUUID(req.app.locals.sequelize, useruuid, cursor, limit)
    s.forEach(r => {
        r.created = timestamps(r.created)
    })
    return sendOK(res, s)
})

//屏蔽某人的动态
router.post('/shield', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { useruuid, shielduuid } = (req as any).body
    let ress = await insertShielded({ useruuid, shielduuid })
    if (ress)
        return sendOK(res, { msg: "屏蔽成功" })
    return sendErrMsg(res, "屏蔽失败", 500)
})

//移除屏蔽
router.put('/shield', /* checkAppLogin, */ async function (req: Request, res: Response, next: NextFunction) {
    let { useruuid, shielduuid } = (req as any).body
    let r = await deleteShielded(useruuid, shielduuid)
    if (r)
        return sendOK(res, { msg: "移除成功" })
    return sendErrMsg(res, "移除失败", 500)
})

//查看动态列表
router.get('/list', async function (req: Request, res: Response, next: NextFunction) {
    let { page, count } = (req as any).query
    validateCgi({ page, count }, trendValidator.getAll)
    let useruuid = (req as any).headers.uuid
    try {
        let arr: any = []
        let { cursor, limit } = getPageCount(page, count)
        let trends
        if (useruuid) {
            let shield = await findShielduuidByUserUUID(req.app.locals.sequelize, useruuid)
            trends = await findAllTrend(req.app.locals.sequelize, 'on', cursor, limit, shield && shield.length > 0 ? shield : undefined)
        } else {
            trends = await findAllTrend(req.app.locals.sequelize, 'on', cursor, limit, undefined)
        }

        for (let i = 0; i < trends.length; i++) {
            let applaud = 0
            if (useruuid)
                applaud = await findByUseruuidAndAdsuuid(trends[i].uuid, useruuid)

            trends[i].modified = timestamps(trends[i].modified)
            trends[i].created = timestamps(trends[i].created)
            trends[i].username = changeUsername(trends[i].username)
            arr.push({ trend: trends[i], applaud: applaud ? 1 : 0 })
        }
        return sendOK(res, arr)
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//查看某个动态的详情
router.get('/detail', async function (req: Request, res: Response, next: NextFunction) {
    let { trenduuid } = (req as any).query
    let useruuid = (req as any).headers.uuid
    try {
        validateCgi({ uuid: trenduuid }, trendValidator.uuid)

        let trend = await findByTrendUUID(trenduuid)
        let user = await findByPrimary(trend.useruuid)
        let answered = 0    //答题标记
        let applaud = null  //点赞标记
        let own = false //是不是自己的动态
        if (useruuid) {
            //获取答题记录
            let adslog = await getByTwoUuid(trenduuid, useruuid)
            if (adslog && adslog.state)
                answered = 1

            if (!adslog) {
                let adlog = {
                    aduuid: trenduuid,
                    useruuid: user.uuid,
                    username: user.username,
                    openid: user.openid
                }
                await insertAdslog(adlog)
            }
            let laud = await findByUseruuidAndAdsuuid(trenduuid, useruuid)//点赞记录
            if (laud) {
                applaud = laud.state
            }

            if (trend.useruuid == useruuid) {
                own = true
            }
        }
        trend.created = timestamps(trend.created)
        trend.modified = timestamps(trend.modified)

        let answerCount = 0
        if (trend.mold == 'redpaper')
            answerCount = await getCountByAdsUUID(trend.uuid)

        let obj = Object.assign(trend, { headurl: user.headurl, username: changeUsername(user.username), nickname: user.nickname })

        return sendOK(res, { trend: obj, questionindex: 0, answer: answered, applaud, own, answerCount })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//答题
router.post('/answer', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { answer, trenduuid } = (req as any).body
    try {
        const loginInfo: LoginInfo = (req as any).loginInfo
        let opt = await getAnswerAds(trenduuid)
        if (opt && opt === loginInfo.getUuid()) {
            return sendNotFound(res, "不能重复提交")
        } else {
            await saveAnswerAds(trenduuid, loginInfo.getUuid())
        }

        let adslog = await getByTwoUuid(trenduuid, loginInfo.getUuid())
        if (adslog && adslog.state)
            return sendNotFound(res, "不能重复答题")
        let points = 0
        let rebalance = 0
        let appUser = await findByPrimary(loginInfo.getUuid())
        let trend = await findByTrendUUID(trenduuid)

        //*********************************************答题*********************************************** */

        let answerSet = Array.from(new Set<string>(trend.question_ext.answers))//真确答案
        let newAnswerSet = Array.from(new Set<string>(answer))//回答的答案
        let union = await array_union(answerSet, newAnswerSet)//并集
        let intersectionSet = await array_intersection(answerSet, newAnswerSet)//交集

        //*************************************************************************************************** */

        //全对用户加points广告totalpoints减广告points
        if (intersectionSet.length === answerSet.length && intersectionSet.length === newAnswerSet.length) {
            if (trend.answer_mold.type == 'quota') {    //定额
                switch (trend.answer_mold.mold) {
                    case "point":
                        points = trend.answer_mold.total    //定额积分红包的total意义是每人积分
                        rebalance = 0
                        break;
                    case "balance":
                        points = 0
                        rebalance = trend.answer_mold.total / trend.answer_mold.amount
                        trend.answer_mold.total -= rebalance
                        break;
                }
            } else {    //随机
                switch (trend.answer_mold.mold) {
                    case 'point':
                        points = trend.random[0]
                        trend.random.splice[0]
                        rebalance = 0
                        trend.answer_mold.total -= points
                        break;
                    case 'balance':
                        points = 0
                        rebalance = trend.random[0]
                        trend.random.splice[0]
                        trend.answer_mold.total -= rebalance
                        break;
                }
            }
            trend.answer_mold.amount--
        } else if ((union.length - intersectionSet.length) == (answerSet.length - newAnswerSet.length) && newAnswerSet.length > 0) {
            if (trend.answer_mold.type == 'quota') {    //定额
                switch (trend.answer_mold.mold) {
                    case "point":
                        points = Math.floor(trend.answer_mold.total / 2)
                        rebalance = 0
                        break;
                    case "balance":
                        points = 0
                        rebalance = Math.floor(trend.answer_mold.total / (trend.answer_mold.amount * 2))
                        trend.answer_mold.total -= rebalance
                        break;
                }
            } else {    //随机
                switch (trend.answer_mold.mold) {
                    case "point":
                        points = trend.random[0]
                        trend.random.splice[0]
                        rebalance = 0
                        trend.answer_mold.total -= points
                        break;
                    case "balance":
                        points = 0
                        rebalance = trend.random[0]
                        trend.random.splice[0]
                        trend.answer_mold.total -= rebalance
                        break;
                }
            }
            trend.answer_mold.amount--
        }

        let upd = {
            answer_mold: trend.answer_mold,
            random: trend.random
        }
        let updateUser = {
            points: points,
            balance: rebalance * 100,
            exp: points
        }

        await updateTrend(trend.uuid, upd)//广告减积分和零钱
        await updatePoints(appUser.uuid, updateUser)//用户加积分零钱和经验

        //修改广告记录
        if (!adslog) {//不存在广告记录
            let newadslog = {
                aduuid: trenduuid,
                useruuid: loginInfo.getUuid(),
                points: points,
                balance: rebalance,
                openid: appUser.openid,
                answercount: 1,
                state: 'fin'
            }
            await insertAdslog(newadslog)//添加广告记录
        } else {//存在广告记录
            if (!adslog.points) {//如果积分不存在
                adslog.points = points
            } else {//积分存在
                adslog.points = adslog.points + points
            }
            if (adslog.answercount) {//答题数不存在
                adslog.answercount = 1
            } else {//答题数存在
                adslog.answercount = adslog.answercount + 1
            }
            if (adslog.balance) {//积分不存在
                adslog.balance = rebalance
            } else {//积分存在
                adslog.balance = adslog.balance + rebalance
            }
            let updateadslog = {
                points: adslog.points,
                balance: adslog.rebalance,
                answercount: adslog.answercount,
                state: 'fin'
            }
            await updateAdslog(updateadslog, adslog.uuid)//修改答题记录
        }

        let reward = {
            useruuid: loginInfo.getUuid(),
            username: appUser.username,
            realname: appUser.realname,
            point: points,
            balance: rebalance,
            type: 'answer'
        }
        if (reward.point !== -1 || reward.balance !== -1) {
            await insertReward(reward)
            await amountcheck(req.app.locals.sequelize, loginInfo.getUuid(), "answer", rebalance, reward.point)
        }

        return createdOk(res, { answers: trend.question_ext.answers, points: points + '', balance: rebalance + '', trend: trend })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//评论动态
router.post('/com', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { trenduuid, parent, content } = (req as any).body
    validateCgi({ trenduuid, content }, trendValidator.com)
    let useruuid = req.headers['uuid']

    try {
        let obj = { trenduuid, parent, content, useruuid, reward: false, state: 'on' }
        if (!parent)
            delete obj.parent

        await insertComment(obj)
        await trendUpdateCom(trenduuid)
        return sendOK(res, { msg: "succ" })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//点赞动态
router.post('/nice', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { trenduuid } = (req as any).body
    try {
        const loginInfo: LoginInfo = (req as any).loginInfo
        let applaud = await findByUseruuidAndAdsuuid(trenduuid, loginInfo.getUuid())
        if (applaud)
            return sendErrMsg(res, "不能重复点赞", 500)

        await trendUpdateNice(trenduuid)
        let r = await insertApplaud(trenduuid, loginInfo.getUuid(), 'nice')
        if (r)
            return sendOK(res, { msg: "succ" })
        else
            return sendErrMsg(res, "点赞失败", 500)
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//取消点赞
router.put('/cancel/:trenduuid', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const trenduuid: string = req.params["trenduuid"]
    try {
        const loginInfo: LoginInfo = (req as any).loginInfo

        await trendCutNice(trenduuid)//减少好评

        let laud = await findByUseruuidAndAdsuuid(trenduuid, loginInfo.getUuid())//点赞记录
        await deleteByAdsUuid(laud.uuid)
        return sendOK(res, { msg: "succ" })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//点赞评论，取消点赞评论
router.post("/upcommentNum", checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    let commentuuid = (req as any).body.commentuuid;
    const loginInfo: LoginInfo = (req as any).loginInfo;
    try {
        validateCgi({ commentUUID: commentuuid }, trendValidator.commentuuid);
        let isexist = await queryUphistory(loginInfo.getUuid(), commentuuid)
        let re = await queryCommentNum(commentuuid);

        if (!isexist) {
            re = await updateCommentNum(commentuuid, parseInt(re.getDataValue('upnum')) + 1);
            await insertCommentApplaud(commentuuid, loginInfo.getUuid(), "nice");
            return sendOK(res, { "data": 'up' });
        } else {
            await deleteByCommentUseruuid(loginInfo.getUuid(), commentuuid);
            re = await updateCommentNum(commentuuid, parseInt(re.getDataValue('upnum')) - 1);
            return sendOK(res, { "data": 'down' });
        }

    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//这个评论的回复数
router.get('/:commentuuid/repliedCount', async function (req: Request, res: Response, next: NextFunction) {
    let commentuuid = req.params['commentuuid'];
    try {
        validateCgi({ commentUUID: commentuuid }, trendValidator.commentuuid)
        let re = await querycommentRepliedCount(req.app.locals.sequelize, commentuuid)
        let com1 = null
        if (re[0].length > 0) {    //如果有回复，就把第一条回复给前端
            com1 = await findFirstComByParent(req.app.locals.sequelize, commentuuid)
        }
        return sendOK(res, { 'num': re[0], com1 });
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//获得这个评论的全部子评论
router.get('/:commentuuid/commentAllByuuid', async function (req: Request, res: Response, next: NextFunction) {
    let commentuuid = req.params['commentuuid'];
    let useruuid = (req as any).headers.uuid
    let commentarr = [];
    try {
        validateCgi({ commentUUID: commentuuid }, trendValidator.commentuuid);
        let re = await queryCommentByparentuuid(req.app.locals.sequelize, commentuuid);
        for (let i = 0; i < re.length; i++) {
            re[i].created = timestamps(re[i].created);
            re[i].username = changeUsername(re[i].username)
            let applaud = null
            if (useruuid)
                applaud = await queryUphistory(useruuid, re[i].commentuuid)

            commentarr.push({ 'comment': re[i], applaud });
        }
        return sendOK(res, { 'data': commentarr });
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//查看某个动态的全部评论
router.get('/:trenduuid/commentAll', async function (req: Request, res: Response, next: NextFunction) {
    let trenduuid = req.params['trenduuid']
    let { page, count } = req.query
    validateCgi({ page, count }, trendValidator.getTrend)
    let commentarr = []
    let useruuid = (req as any).headers.uuid
    try {
        validateCgi({ commentUUID: trenduuid }, trendValidator.commentuuid)
        let { cursor, limit } = getPageCount(page, count)
        let re = await queryCommentParent(req.app.locals.sequelize, trenduuid, cursor, limit)
        for (let i = 0; i < re.length; i++) {
            re[i].created = timestamps(re[i].created);
            re[i].username = changeUsername(re[i].username)
            let num = await queryCommentParentDownNum(req.app.locals.sequelize, trenduuid, re[i].commentuuid)
            let applaud = null
            if (useruuid)
                applaud = await queryUphistory(useruuid, re[i].commentuuid)

            commentarr.push({ commentParent: re[i], num, applaud })
        }
        return sendOK(res, commentarr)
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//举报评论&动态
router.post('/reflect', async function (req: Request, res: Response, next: NextFunction) {
    let { commentuuid, trenduuid, reason } = (req as any).body
    const useruuid = req.headers.uuid

    if (commentuuid)
        validateCgi({ uuid: commentuuid }, trendValidator.reflect)
    if (trenduuid)
        validateCgi({ uuid: trenduuid }, trendValidator.reflect)

    try {
        let obj = { state: "new", commentuuid, trenduuid, useruuid, reason }
        if (!obj.commentuuid && !obj.trenduuid)
            return sendErrMsg(res, "参数不对", 500)

        if (!obj.commentuuid)
            delete obj.commentuuid
        if (!obj.trenduuid)
            delete obj.trenduuid
        if (!obj.useruuid)
            delete obj.useruuid

        await insertReflect(obj)
        return sendOK(res, { msg: "举报成功" })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//打赏
router.post('/reward', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { commentuuid, trenduuid } = (req as any).body
    validateCgi({ commentuuid, trenduuid }, trendValidator.reward)
    const info: LoginInfo = (req as any).loginInfo
    const useruuid = info.getUuid()

    try {
        let trend = await findByTrendUUID(trenduuid)
        let user_ext = await usersExtFindByPrimary(useruuid)
        if (trend.useruuid != useruuid)
            return sendErrMsg(res, "不是自己的动态", 500)

        if (user_ext.balance < trend.reward * 100)
            return sendErrMsg(res, "余额不足", 500)

        let com = await findByPrimaryUUID(commentuuid)
        if (com.reward == true)
            return sendErrMsg(res, "不能重复打赏", 500)

        let comUser = await findByPrimary(com.useruuid)
        let r1 = await recharge(com.useruuid, trend.reward * 100)
        let r2 = await exchange(useruuid, { points: 0, balance: trend.reward * 100 })
        if (r1 && r2) {
            await updateReward(commentuuid, true)
            let obj = {
                useruuid: com.useruuid,
                username: comUser.username,
                content: `您的评论被打赏了${trend.reward}元`,
                state: 'send',
                title: '打赏消息'
            }
            await createMessage(obj)
            let obj2 = {
                useruuid: com.useruuid,
                amount: trend.reward,
                mode: "reward",
                time: timestamps()
            }
            await insertAmountLog(obj2)
            return sendOK(res, "打赏成功")
        }
        else
            return sendErrMsg(res, "打赏失败", 500)

    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//查看自己的全部动态
router.get('/allTrend', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { page, count } = (req as any).query
    validateCgi({ page, count }, trendValidator.getTrend)
    const info: LoginInfo = (req as any).loginInfo
    const useruuid = info.getUuid()

    try {
        let { cursor, limit } = getPageCount(page, count)
        let trends = await findByUserUUID(req.app.locals.sequelize, useruuid, cursor, limit)
        let arr = []
        for (let i = 0; i < trends.length; i++) {
            trends[i].created = timestamps(trends[i].created)
            let applaud = 0
            if (useruuid)
                applaud = await findByUseruuidAndAdsuuid(trends[i].uuid, useruuid)

            arr.push({ trend: trends[i], applaud: applaud ? 1 : 0 })
        }

        return sendOK(res, arr)
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//增加分享数
router.put('/addShare', async function (req: Request, res: Response, next: NextFunction) {
    let { trenduuid } = (req as any).body
    validateCgi({ uuid: trenduuid }, trendValidator.uuid)

    try {
        await trendUpdateShare(trenduuid)
        return sendOK(res, "")
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//查看某个动态的答题记录
router.get('/:trenduuid', /* checkAppLogin, */ async function (req: Request, res: Response, next: NextFunction) {
    let trenduuid = req.params['trenduuid']
    let { page, count } = (req as any).query
    validateCgi({ trenduuid, page, count }, trendValidator.getAnswer)

    try {
        /*  let trend = await findByTrendUUID(trenduuid)
         if (trend.useruuid != useruuid)
             return sendErrMsg(res, "这不是您的动态", 500) */

        let { cursor, limit } = getPageCount(page, count)
        let logs = await findByAdsuuid(req.app.locals.sequelize, trenduuid, cursor, limit)
        logs.forEach((r: any) => {
            r.created = timestamps(r.created)
            r.name = changeUsername(r.name)
        })
        return sendOK(res, logs)
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//上传动态视频
router.post('/:trenduuid/movie', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    let trenduuid = req.params["trenduuid"] as string
    winston.info(`------enter ------`)
    try {
        validateCgi({ uuid: trenduuid }, trendValidator.uuid)
        let newPath = await uploadAdsMovie(req, {
            uuid: trenduuid,
            glob: trendMovOpt.glob,
            tmpDir: trendMovOpt.tmpDir,
            maxSize: trendMovOpt.maxSize,
            extnames: trendMovOpt.extnames,
            maxFiles: trendMovOpt.maxFiles,
            targetDir: trendMovOpt.targetDir,
            fieldName: trendMovOpt.fieldName,
        })
        let mediaName = path.join(trendMovOpt.targetDir, newPath)   //视频的路径
        let cmdthumb = mediaName.substring(0, mediaName.lastIndexOf('.'))
        cmdthumb += '.jpg'   //预览图，同名同路径，只是后缀是jpg
        let preview = newPath.substring(0, newPath.lastIndexOf('.'))
        preview += '.jpg'

        child_process.exec("ffmpeg -ss 00:00:01 -i " + mediaName + " -t 0.001 " + cmdthumb + "", async () => {
            let infoo = await modifilyMov(trenduuid, newPath, cmdthumb)
            return createdOk(res, { path: newPath, infoo, preview })
        })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//删除动态视频
router.delete('/:trenduuid/movie', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    let mediaName: any = (req as any).query.mediaName
    let trenduuid = req.params["trenduuid"] as string
    try {
        validateCgi({ uuid: trenduuid }, trendValidator.uuid)
        mediaName = path.join(trendMovOpt.targetDir, /* trenduuid, */ mediaName)
        let preview = mediaName.substring(0, mediaName.lastIndexOf('.')); preview += '.jpg'
        await removeAsync(mediaName)    //删除视频
        await removeAsync(preview)  //删除预览图
        await modifilyMov(trenduuid, null, null)
        return sendOK(res, { msg: 'succ' })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})