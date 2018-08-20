import { insertComment, listAppComment, getcomentByparent } from "../../model/mall/comment"
import { findByPrimary } from "../../model/mall/goods"
import { updateState } from "../../model/orders/orders"
import { LoginInfo, checkAppLogin } from "../../redis/logindao"
import { sendOK, sendError as se, sendNotFound } from "../../lib/response"
import { commnetValidator, adscommentValidator } from "./validator"
import { validateCgi } from "../../lib/validator"
import { getPageCount } from "../../lib/utils"
import { Router, Request, Response, NextFunction } from "express"
import {
    querycommentRepliedCount, queryCommentParentDownLastcomment, queryCommentParentDownNum,
    queryadsCommentUpnumMAX, insertadsComment, insertParentComment, queryCommentNum,
    updateCommentNum, queryCommentParent, queryCommentByparentuuid, queryadsCommentNum
} from "../../model/ads/comment"
import * as assert from "assert"
import { timestamps } from "../../config/winston"
import { queryUphistory, deleteByCommentUseruuid, insertCommentApplaud } from "../../model/ads/applaud"
export const router = Router()

/**
 * 新增评论
 */
router.post("/", checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    let { contents, orderuuid } = (req as any).body
    contents = JSON.parse(contents)
    try {
        for (let i = 0; i < contents.length; i++) {
            validateCgi({ content: contents[i].content, goodsuuid: contents[i].uuid }, commnetValidator.insertOptions)
            const loginInfo: LoginInfo = (req as any).loginInfo
            let goods = await findByPrimary(contents[i].uuid)
            if (!goods) {
                return sendNotFound(res, "商品不存在！")
            }
            await insertComment(contents[i].content, contents[i].uuid, loginInfo.getUuid(), null, "new")
        }
        await updateState('finish', orderuuid)
        return sendOK(res, { comment: "新增成功！" })
    } catch (e) {
        e.info(se, res, e)
    }
})

/**
 * 列表显示已经通过审批的用户评论
 */
router.get("/", async function (req: Request, res: Response, next: NextFunction) {
    const { goodsuuid, page, count } = req.query
    try {
        validateCgi({ page: page, count: count }, commnetValidator.pageAndCount)
        let { cursor, limit } = getPageCount(page, count)
        let comment = await listAppComment(req.app.locals.sequelize, goodsuuid, cursor, limit)
        return sendOK(res, { comment: comment, page: parseInt(page) + 1 + "", count: count })
    } catch (e) {
        e.info(se, res, e)
    }
})

/**
 * 列表显示管理员评论
 */
router.get("/parent", async function (req: Request, res: Response, next: NextFunction) {
    const { parent } = req.query
    try {
        validateCgi({ parent: parent }, commnetValidator.parent)
        let comment = await getcomentByparent(parent)
        return sendOK(res, { comment: comment })
    } catch (e) {
        e.info(se, res, e)
    }
})

/**
 * 新增广告评论
 */
router.post("/newAdscomment", checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {

    let content = req.param('content');
    let adsuuid = req.param('adsuuid');
    let parent = req.param('parent');
    let useruuid = (req as any).headers.uuid
    try {
        if (parent != undefined && parent != null && parent != '') {
            validateCgi({ content: content, useruuid: useruuid, adsuuid: adsuuid, parent: parent }, adscommentValidator.insertparentComment);
            let re = await insertParentComment(content, useruuid, adsuuid, parent) as any;
            assert(re != undefined, 'insert fail');
            return sendOK(res, { 'data': 'succ' });
        } else {
            validateCgi({ content: content, useruuid: useruuid, adsuuid: adsuuid }, adscommentValidator.insertComment)
            let re = await insertadsComment(content, useruuid, adsuuid) as any;
            assert(re != undefined, 'insert fail');
            return sendOK(res, { 'data': 'succ2' });
        }
    } catch (e) {
        e.info(se, res, e);
    }
    return undefined;
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
        e.info(se, res, e);
    }
})

//找出最火的那个评论
router.get('/:adsuuid/commentOne', async function (req: Request, res: Response, next: NextFunction) {
    let adsuuid = req.params['adsuuid'];
    let commentarr = [];
    let tempre = null;
    let tempdownre = null;
    try {
        validateCgi({ commentUUID: adsuuid }, adscommentValidator.commentuuid);
        let num = await queryadsCommentNum(req.app.locals.sequelize, adsuuid);
        let re = await queryadsCommentUpnumMAX(req.app.locals.sequelize, adsuuid);
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
        e.info(se, res, e);
    }
});

//这个评论的回复数
router.get('/:commentuuid/repliedCount', async function (req: Request, res: Response, next: NextFunction) {
    let commentuuid = req.params['commentuuid'];
    try {
        validateCgi({ commentUUID: commentuuid }, adscommentValidator.commentuuid);
        let re = await querycommentRepliedCount(req.app.locals.sequelize, commentuuid);
        return sendOK(res, { 'num': re[0] });
    } catch (e) {
        e.info(se, req, e);
    }
})

//找出全部的根评论
router.get('/:adsuuid/commentAll', async function (req: Request, res: Response, next: NextFunction) {
    let adsuuid = req.params['adsuuid'];
    let commentarr = []
    try {
        validateCgi({ commentUUID: adsuuid }, adscommentValidator.commentuuid);
        let re = await queryCommentParent(req.app.locals.sequelize, adsuuid);

        for (let i = 0; i < re.length; i++) {
            re[i].created = timestamps(re[i].created);
            let num = await queryCommentParentDownNum(req.app.locals.sequelize, adsuuid, re[i].commentuuid);
            commentarr.push({
                'commentParent': re[i],
                'num': num
            });
        }
        return sendOK(res, { 'dataarr': commentarr });
    } catch (e) {
        e.info(se, res, e)
    }

})

//获得这个评论的子评论
router.get('/:commentuuid/commentAllByuuid', async function (req: Request, res: Response, next: NextFunction) {
    let commentuuid = req.params['commentuuid'];
    let commentarr = [];

    try {
        validateCgi({ commentUUID: commentuuid }, adscommentValidator.commentuuid);
        let re = await queryCommentByparentuuid(req.app.locals.sequelize, commentuuid);
        for (let i = 0; i < re.length; i++) {
            re[i].created = timestamps(re[i].created);
            commentarr.push(
                {
                    'comment': re[i]
                });
        }
        return sendOK(res, { 'data': commentarr });
    } catch (e) {
        e.info(se, res, e);
    }
})