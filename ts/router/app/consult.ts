import { insertConsult, listConsult, findByPrimary as consultfind, findByGoodsuuidAndUseruuid, updateConsult } from "../../model/mall/consult"
import { findByPrimary } from "../../model/mall/goods"
import { LoginInfo, checkAppLogin } from "../../redis/logindao"
import { sendOK, sendError as se, sendNotFound } from "../../lib/response"
import { commnetValidator } from "./validator"
import { validateCgi } from "../../lib/validator"
import { Router, Request, Response, NextFunction } from "express"
import { timestamps } from "../../config/winston"
export const router = Router()

/**
 * 新增咨询
 */
router.post("/", checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { content, goodsuuid } = (req as any).body
    try {
        validateCgi({ content: content, goodsuuid: goodsuuid }, commnetValidator.consult)
        const loginInfo: LoginInfo = (req as any).loginInfo
        let goods = await findByPrimary(goodsuuid)
        if (!goods) {
            return sendNotFound(res, "商品不存在！")
        }
        //查找当前用户是否对当前商品评论
        let contents = await findByGoodsuuidAndUseruuid(goodsuuid, loginInfo.getUuid())
        let content1
        let comment
        if (!contents) {
            content1 = new Array
            content1.push(JSON.parse(content))
            comment = await insertConsult(content1, goodsuuid, loginInfo.getUuid(), "new")
        } else {
            content1 = contents
            content1.push(JSON.parse(content))
            comment = await updateConsult(content1, goodsuuid, loginInfo.getUuid(), "new")
        }
        return sendOK(res, { comment: comment })
    } catch (e) {
        e.info(se, res, e)
    }
})

/**
 * 列表显示商品客服信息
 */
router.get("/", async function (req: Request, res: Response, next: NextFunction) {
    const { goodsuuid } = req.query
    try {
        validateCgi({ uuid: goodsuuid }, commnetValidator.uuid)
        let comment = await listConsult(req.app.locals.sequelize, goodsuuid)
        comment.forEach(r => {
            r.content.forEach((rs: any) => {
                rs.time = timestamps(rs.time)
            })
        })
        return sendOK(res, { comment: comment })
    } catch (e) {
        e.info(se, res, e)
    }
})

/**
 * 显示客服信息详情
 */
router.get("/:uuid", async function (req: Request, res: Response, next: NextFunction) {
    const { uuid } = req.query
    try {
        validateCgi({ uuid: uuid }, commnetValidator.uuid)
        let comment = await consultfind(req.app.locals.sequelize, uuid)
        return sendOK(res, { comment: comment })
    } catch (e) {
        e.info(se, res, e)
    }
})