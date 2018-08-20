import { Router, Request, Response, NextFunction } from "express"
import { checkAppLogin, LoginInfo } from "../../redis/logindao"
import { sendOK, createdOk, sendErrMsg, sendNotFound } from "../../lib/response"
import {
    updateByUuid, findByPrimarys,
    findByCategory, findByKeyWord
} from "../../model/ads/informationads"
import { timestamps } from "../../config/winston"
import { insertStatistics } from "../../model/users/statistics"

import {
    queryCommentParentDownNum, querycommentRepliedCount, queryCommentParentDownLastcomment,
    insertadsComment, insertParentComment, queryadsCommentNum, queryCommentNum,
    queryCommentParent, queryCommentByparentuuid, queryadsCommentUpnumMAX, updateCommentNum
} from "../../model/ads/infocomment"

import { getByUserAds, favoriateInsert, deleteByUserAds, getAdsUuids } from "../../model/ads/favoriate"

import { getAnswerAds, saveAnswerAds } from "../../redis/history"
import { updatePoints } from "../../model/users/users_ext"
import { infoUpdateNice, infoUpdateLow, updateApplaud, getBanner, getFavoriteByUuid } from "../../model/ads/informationads"
import { usersValidator } from "./validator"
import { getAllInfoCate } from "../../model/ads/informationcategory"
import { getByTwoUuid, insertAdslog, updateAdslog } from "../../model/ads/adslog"
import { findByPrimary } from "../../model/users/users"
import { amountcheck } from "../../lib/amountmonitor"
import { insertReward } from "../../model/users/reward"
import { getPageCount } from "../../lib/utils"
import {
    findByUseruuidAndAdsuuid, insertApplaud, deleteByAdsUuid, queryUphistory,
    insertCommentApplaud, deleteByCommentUseruuid
} from "../../model/ads/applaud"

import { infoValidator, adscommentValidator } from "./validator"
import * as assert from "assert"
import * as winston from "winston"
import { validateCgi } from "../../lib/validator"
export const router = Router()

//获得banner资讯
router.get('/banner', async function (req: Request, res: Response, next: NextFunction) {
    try {
        let ads = await getBanner()
        return sendOK(res, { banner: ads })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//查看全部资讯（按照类别）
router.get('/info', async function (req: Request, res: Response, next: NextFunction) {
    const { category, page, count } = req.query
    validateCgi({ category, page, count }, infoValidator.getInfo)

    try {
        let useruuid = (req as any).headers.uuid
        let { cursor, limit } = getPageCount(page, count)
        let arr = await findByCategory(category, cursor, limit)
        for (let i = 0; i < arr.length; i++) {
            let read = false, answered = false
            if (useruuid) {
                let adslog = await getByTwoUuid(arr[i].uuid, useruuid)
                if (adslog) {
                    read = true
                    if (adslog.state)
                        answered = true
                }
            }
            arr[i].read = read
            arr[i].answered = answered
        }
        return sendOK(res, { arr })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//资讯搜索关键字
router.get('/keyword', async function (req: Request, res: Response, next: NextFunction) {
    const { keyword, page, count } = req.query
    validateCgi({ page, count }, infoValidator.getKey)
    let useruuid = (req as any).headers.uuid

    try {
        let { cursor, limit } = getPageCount(page, count)
        let arr = await findByKeyWord(req.app.locals.sequelize, keyword, cursor, limit)
        for (let i = 0; i < arr.length; i++) {
            let read = false, answered = false
            if (useruuid) {
                let adslog = await getByTwoUuid(arr[i].uuid, useruuid)
                if (adslog) {
                    read = true
                    if (adslog.state)
                        answered = true
                }
            }
            arr[i].read = read
            arr[i].answered = answered
        }
        return sendOK(res, { arr })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//查看全部类别
router.get('/category', async function (req: Request, res: Response, next: NextFunction) {
    let arr = await getAllInfoCate()
    return sendOK(res, { arr })
})

//查看某个咨询的详情
router.get('/detail', async function (req: Request, res: Response, next: NextFunction) {
    let { infouuid } = (req as any).query
    let useruuid = (req as any).headers.uuid
    try {
        validateCgi({ uuid: infouuid }, usersValidator.uuid)

        let info = await findByPrimarys(infouuid)
        let answered = 0    //答题标记
        let applaud = null  //点赞标记
        let favo = "0"  //收藏标记
        if (useruuid) {
            let user = await findByPrimary(useruuid);
            //获取答题记录
            let adslog = await getByTwoUuid(infouuid, useruuid)
            if (adslog && adslog.state)
                answered = 1

            if (!adslog) {
                let adlog = {
                    aduuid: infouuid,
                    useruuid: user.uuid,
                    username: user.username,
                    openid: user.openid
                }
                await insertAdslog(adlog)
            }
            let laud = await findByUseruuidAndAdsuuid(infouuid, useruuid)//点赞记录
            if (laud) {
                applaud = laud.state
            }

            //拿到广告收藏
            let favorite = await getByUserAds(infouuid, useruuid)
            if (favorite)
                favo = "1"
        }
        let questionindex = null//随机问题下标
        if (info.question_ext && info.question_ext.length != 0) {
            questionindex = Math.floor(Math.random() * (info.question_ext.length))//产生随机数

            //***************************************数组随机排列函数******************************************* */
            /**
             * 随机打乱数组顺序
             * @param input
             */
            async function shuffle(input: any[]) {
                for (let i = input.length - 1; i >= 0; i--) {
                    let randomIndex = Math.floor(Math.random() * (i + 1));
                    let itemAtIndex = input[randomIndex]
                    input[randomIndex] = input[i]
                    input[i] = itemAtIndex
                }
                return input
            }
            //************************************************************************************************* */
            let newquestion = await shuffle(info.question_ext[questionindex].option)
            info.question_ext[questionindex].option = newquestion//改变答案的位置
            info.question_ext = info.question_ext[questionindex]//输出随机出的答案
        }
        info.totalbalance = info.totalbalance
        info.balance = info.balance
        info.allbalance = info.allbalance
        return sendOK(res, { info, questionindex: questionindex, answer: answered, applaud, favorite: favo })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//点赞资讯
router.post('/nice', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { infouuid } = (req as any).body
    try {
        const loginInfo: LoginInfo = (req as any).loginInfo
        await infoUpdateNice(infouuid)
        await insertApplaud(infouuid, loginInfo.getUuid(), 'nice')
        return sendOK(res, { applaud: "nice" })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//取消点赞，踩
router.put('/cancel/:infouuid', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { applaud } = (req as any).body
    const infouuid: string = req.params["infouuid"]
    try {
        const loginInfo: LoginInfo = (req as any).loginInfo
        if (applaud === 'low') {//low/nice
            await updateApplaud(infouuid, 1, 0)//减少差评
        } else {
            await updateApplaud(infouuid, 0, 1)//减少好评
        }
        let laud = await findByUseruuidAndAdsuuid(infouuid, loginInfo.getUuid())//点赞记录
        await deleteByAdsUuid(laud.uuid)
        return sendOK(res, { applaud: null })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//评论资讯
router.post('/comment', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { content, infouuid, parent } = (req as any).body
    let useruuid = (req as any).headers.uuid
    try {
        if (parent != undefined && parent != null && parent != '') {
            validateCgi({ content: content, useruuid: useruuid, adsuuid: infouuid, parent: parent }, adscommentValidator.insertparentComment);
            let re = await insertParentComment(content, useruuid, infouuid, parent) as any;
            assert(re != undefined, 'insert fail');
            return sendOK(res, { 'data': 'succ' });
        } else {
            validateCgi({ content: content, useruuid: useruuid, adsuuid: infouuid }, adscommentValidator.insertComment)
            let re = await insertadsComment(content, useruuid, infouuid) as any;
            assert(re != undefined, 'insert fail');
            return sendOK(res, { 'data': 'succ2' });
        }
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//收藏资讯
router.post('/favorite/:infouuid', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const infouuid: string = req.params["infouuid"]
    try {
        const loginInfo: LoginInfo = (req as any).loginInfo
        //validateCgi({ adsuuid: adsuuid }, usersValidator.uuid)
        let user = await findByPrimary(loginInfo.getUuid())
        if (!user) {
            return sendNotFound(res, "用户不存在！")
        }

        let info = await findByPrimarys(infouuid)
        if (!info) {
            return sendNotFound(res, "广告不存在！")
        }

        let favorite = await getByUserAds(loginInfo.getUuid(), infouuid)

        let obj = {
            useruuid: loginInfo.getUuid(),
            loginnumber: 0,
            searchnumber: 0,
            favoritenumber: 1,
            type: 'ads',
        }
        await insertStatistics(obj)
        let state
        if (!favorite) {
            await favoriateInsert(user.uuid, infouuid)
            state = "1"
        }
        return createdOk(res, { favorite: state })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//取消收藏资讯
router.delete('/favorite/:adsuuid', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const adsuuid: string = req.params["adsuuid"]
    try {
        const loginInfo: LoginInfo = (req as any).loginInfo
        //validateCgi({ adsuuid: adsuuid }, usersValidator.uuid)
        await deleteByUserAds(adsuuid, loginInfo.getUuid())
        return sendOK(res, { favorite: "0" })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//获取某人全部的收藏资讯
router.get('/favorite', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { page, count } = req.query

    try {
        const loginInfo: LoginInfo = (req as any).loginInfo
        validateCgi({ page: page, count: count }, usersValidator.pagecount)
        let { cursor, limit } = getPageCount(page, count)
        let favorite = await getAdsUuids(loginInfo.getUuid(), cursor, limit)
        let favo = new Array<string>()
        let ads = new Array<any>()
        if (favorite) {
            for (let i = 0; i < favorite.length; i++) {
                favo[i] = favorite[i].aduuid
            }

            if (favo.length > 0) {
                ads = await getFavoriteByUuid(req.app.locals.sequelize, favo)
            }
        }

        return sendOK(res, { ads: ads, page: parseInt(page) + 1, count: count })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

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

//答题
router.post('/answer', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { answer, questionindex, infouuid } = (req as any).body
    try {
        const loginInfo: LoginInfo = (req as any).loginInfo
        let opt = await getAnswerAds(infouuid)
        if (opt && opt === loginInfo.getUuid()) {
            return sendNotFound(res, "不能重复提交")
        } else {
            await saveAnswerAds(infouuid, loginInfo.getUuid())
        }
        winston.info(infouuid, loginInfo.getUuid(), "answer");
        //validator.validateCgi({ adsuuid: adsuuid, answer: answer }, adsValidator["answers"])
        let adslog = await getByTwoUuid(infouuid, loginInfo.getUuid())
        if (adslog && adslog.state)
            return sendNotFound(res, "不能重复答题")
        let points = 0
        let rebalance = 0
        let appUser = await findByPrimary(loginInfo.getUuid())
        let info = await findByPrimarys(infouuid)
        let answerSet
        let newAnswerSet
        let union
        let intersectionSet
        //*********************************************答题*********************************************** */
        if (questionindex === null || questionindex === undefined) {//之前版本题目
            answerSet = Array.from(new Set<string>(info.question.answer))//正确答案
            newAnswerSet = Array.from(new Set<string>(answer))//回答的答案
            union = await array_union(answerSet, newAnswerSet)//并集
            intersectionSet = await array_intersection(answerSet, newAnswerSet)//交集
        } else {
            answerSet = Array.from(new Set<string>(info.question_ext[questionindex].answer))//真确答案
            newAnswerSet = Array.from(new Set<string>(answer))//回答的答案
            union = await array_union(answerSet, newAnswerSet)//并集
            intersectionSet = await array_intersection(answerSet, newAnswerSet)//交集
        }
        //*************************************************************************************************** */

        //全对用户加points广告totalpoints减广告points
        if (intersectionSet.length === answerSet.length && intersectionSet.length === newAnswerSet.length) {
            switch (info.mold) {
                case "point":
                    points = info.points
                    rebalance = 0
                    break;
                case "balance":
                    points = 0
                    rebalance = info.balance
                    break;
                case "two":
                    points = info.points
                    rebalance = info.balance
                    break;
            }
        } else if ((union.length - intersectionSet.length) == (answerSet.length - newAnswerSet.length) && newAnswerSet.length > 0) {
            switch (info.mold) {
                case "point":
                    points = Math.floor(info.points / 2)
                    rebalance = 0
                    break;
                case "balance":
                    points = 0
                    rebalance = Math.floor(info.balance / 2)
                    break;
                case "two":
                    points = Math.floor(info.points / 2)
                    rebalance = Math.floor(info.balance / 2)
                    break;
            }
        }
        let adstotalpoints = info.totalpoints - points
        let adstotalbalance = info.totalbalance - rebalance
        let upd = {
            totalpoints: adstotalpoints,
            totalbalance: adstotalbalance
        }
        let updateUser = {
            points: points,
            balance: rebalance * 100,
            exp: points
        }
        if (adstotalpoints >= 0 && adstotalbalance >= 0) {//修改后的积分和零钱大于零
            await updateByUuid(upd, info.uuid)//广告减积分和零钱
            await updatePoints(appUser.uuid, updateUser)//用户加积分零钱和经验
        } else {
            points = -1
            rebalance = -1
        }

        //修改广告记录
        if (!adslog) {//不存在广告记录
            let newadslog = {
                aduuid: infouuid,
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

        info.totalbalance = info.totalbalance - rebalance
        info.balance = info.balance
        info.allbalance = info.allbalance
        info.totalpoints = info.totalpoints - points
        if (questionindex != null && questionindex != undefined) {
            return createdOk(res, { answers: info.question_ext[questionindex].answer, points: points + '', balance: rebalance + '', info: info })
        } else {
            return createdOk(res, { answers: info.question.answer, points: points + '', balance: rebalance + '', info: info })
        }
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//广告踩（差评）
router.put('/low/:infouuid', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const infouuid: string = req.params["infouuid"]
    try {
        const loginInfo: LoginInfo = (req as any).loginInfo
        await infoUpdateLow(infouuid)
        await insertApplaud(infouuid, loginInfo.getUuid(), 'low')
        return sendOK(res, { applaud: "low" })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//查看某个资讯的全部评论
router.get('/:infouuid/commentAll', async function (req: Request, res: Response, next: NextFunction) {
    let infouuid = req.params['infouuid']
    let commentarr = []
    let useruuid = (req as any).headers.uuid
    try {
        validateCgi({ commentUUID: infouuid }, adscommentValidator.commentuuid)
        let re = await queryCommentParent(req.app.locals.sequelize, infouuid)
        for (let i = 0; i < re.length; i++) {
            re[i].created = timestamps(re[i].created);
            let num = await queryCommentParentDownNum(req.app.locals.sequelize, infouuid, re[i].commentuuid)
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

//获得这个评论的全部子评论
router.get('/:commentuuid/commentAllByuuid', async function (req: Request, res: Response, next: NextFunction) {
    let commentuuid = req.params['commentuuid'];
    let useruuid = (req as any).headers.uuid
    let commentarr = [];
    try {
        validateCgi({ commentUUID: commentuuid }, adscommentValidator.commentuuid);
        let re = await queryCommentByparentuuid(req.app.locals.sequelize, commentuuid);
        for (let i = 0; i < re.length; i++) {
            re[i].created = timestamps(re[i].created);
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

//这个评论的回复数
router.get('/:commentuuid/repliedCount', async function (req: Request, res: Response, next: NextFunction) {
    let commentuuid = req.params['commentuuid'];
    try {
        validateCgi({ commentUUID: commentuuid }, adscommentValidator.commentuuid);
        let re = await querycommentRepliedCount(req.app.locals.sequelize, commentuuid);
        return sendOK(res, { 'num': re[0] });
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//找出最火的那个评论
router.get('/:infouuid/commentOne', async function (req: Request, res: Response, next: NextFunction) {
    let infouuid = req.params['infouuid'];
    let commentarr = [];
    let tempre = null;
    let tempdownre = null;
    try {
        validateCgi({ commentUUID: infouuid }, adscommentValidator.commentuuid);
        let num = await queryadsCommentNum(req.app.locals.sequelize, infouuid);
        let re = await queryadsCommentUpnumMAX(req.app.locals.sequelize, infouuid);
        let downre = undefined;
        if (re[0] != undefined) {
            tempre = re[0];
            downre = await queryCommentParentDownLastcomment(req.app.locals.sequelize, re[0].commentuuid);
        }

        for (let i = 0; i < re.length; i++) {
            re[i].created = timestamps(re[i].created);
        }

        if (downre == undefined) {
            downre == null
        } else {
            tempdownre = downre[0]
        }

        commentarr.push({
            'commentnum': num,
            'commentupnumMAX': tempre,
            'downcomment': tempdownre
        });
        return sendOK(res, { 'data': commentarr })
    } catch (e) {
        return sendErrMsg(res, e, 500)
    }
})

//点赞评论，取消点赞评论
router.post("/upcommentNum", checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    let commentuuid = (req as any).body.commentuuid;
    const loginInfo: LoginInfo = (req as any).loginInfo;
    try {
        validateCgi({ commentUUID: commentuuid }, adscommentValidator.commentuuid);
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
