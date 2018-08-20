//import { crmuserValidator } from "./validator"
//import { validateCgi } from "../../lib/validator"
import {inserdeduction,searchdeduction} from "../../model/mall/deduction"
import { checkLogin } from "../../redis/logindao"
import { sendOK, sendError as se} from "../../lib/response"
import { Router, Request, Response, NextFunction } from "express"
export const router: Router = Router()
//更新添加汇率基本信息
router.post("/deductioncrm", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { exchange,deductiontext,usenumber } =(req as any).body
    try {
        // validateCgi({ exchange,deductiontext,usenumber }, crmuserValidator.pagination)
        let uuid="0c163e52-f26d-4d77-ae71-dd3ae8184333"
         await inserdeduction(exchange,deductiontext,usenumber,uuid)
        return sendOK(res, {"resdeduction":"ok" })
    } catch (e) {
        e.info(se, res, e)
    }
})
//查询汇率
router.get("/deductionsearch", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    try {
        // validateCgi({ exchange,deductiontext,usenumber }, crmuserValidator.pagination)
        let uuid="0c163e52-f26d-4d77-ae71-dd3ae8184333"
        let resdeduction= await searchdeduction(uuid)
        return sendOK(res, resdeduction)
    } catch (e) {
        e.info(se, res, e)
    }
})