import { sendOK, sendError as se } from "../../lib/response"
import { checkLogin } from "../../redis/logindao"
import { Router, Request, Response, NextFunction } from "express"
import { findAllByTimeRange, findAllByTimeRangeCount, findCountVisitorByTimeRange, findAllVisitorByTimeRange } from "../../model/users/statistics"

export const router: Router = Router()

router.get("/timeRange", checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { timeRange } = req.query
    const { start, length, draw } = req.query
    try {
        let statistics = await findAllByTimeRange(req.app.locals.sequelize, JSON.parse(timeRange), parseInt(start), parseInt(length))
        statistics.forEach(r => {
            delete r.password
        })
        let recordsFiltered = await findAllByTimeRangeCount(req.app.locals.sequelize, JSON.parse(timeRange))
        return sendOK(res, { statistics, draw, recordsFiltered })
    } catch (e) {
        e.info(se, res, e)
    }
})

//app访客记录,以未登录用户请求推荐广告接口为一次访客进入
router.get('/visitors', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { start, length, timeRange } = req.query
    try {
        let recordsFiltered = await findCountVisitorByTimeRange(req.app.locals.sequelize, JSON.parse(timeRange))
        let visitors = await findAllVisitorByTimeRange(req.app.locals.sequelize, JSON.parse(timeRange), parseInt(start), parseInt(length))
        return sendOK(res, { visitors, recordsFiltered })
    } catch (e) {
        se(res, e)
    }
})