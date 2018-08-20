import { Router, Request, Response, NextFunction } from "express"
import { checkLogin, LoginInfo } from "../../redis/logindao"
export const router = Router()
import { sendOK, sendError as se, /*sendNotFound,*/ sendNoPerm } from "../../lib/response"
// import { validateCgi } from "../../lib/validator"
// import { collectionValidator } from "./validator"
import {awardcollection,find_All_award,deleteAward} from "../../model/mall/collectionaward"
//创建收集活动运势信息
router.post('/collectAward', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let {fortune, emolument, longevity, property, happiness } = (req as any).body
    try {
        // const info: LoginInfo = (req as any).loginInfo
        // if (!info.isAdminRW() && !info.isRoot())
        //     return sendNoPerm(res)
        let tmp = {
            fortune: fortune,
            emolument: emolument,
            longevity: longevity,
            property: property,
            happiness: happiness
        }
        let uuid="99e892f2-24b8-467c-bc68-c710a8b95206"
        // let addcollections = await awardcollection(tmp)
       let addcollections = await awardcollection(tmp,uuid)
        return sendOK(res, addcollections)
    } catch (e) {
        e.info(se, res, e)
    }
})
//收集道具活动查看运势管理功能
router.get('/selectAll', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    try {
        const info: LoginInfo = (req as any).loginInfo
        //              validateCgi({ uuid: uuid }, advertiserValidator.UUID)
        if (!info.isAdminRW() && !info.isRoot())
            return sendNoPerm(res)
        let ac_ext = await find_All_award()
        return sendOK(res, ac_ext)            //返回ac_ext的信息
    } catch (e) {
        e.info(se, res, e);
    }
})
//收集道具活动运势删除功能
router.post('/delete', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
        try {
            const info: LoginInfo = (req as any).loginInfo
            if (!info.isAdminRW() && !info.isRoot())
                return sendNoPerm(res)
            await deleteAward()   //删除
            return sendOK(res, { "data": "deleteOk" })
        } catch (e) {
            e.info(se, res, e)
        }
    })