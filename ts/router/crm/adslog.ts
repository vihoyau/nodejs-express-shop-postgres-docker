import { validateCgi } from "../../lib/validator"
import { adsLogValidator } from "./validator"
import { Router, Request, Response, NextFunction } from "express"
import { sendOK, sendError as se, sendNoPerm, sendErrMsg } from "../../lib/response"
import { checkLogin } from "../../redis/logindao"
import { getByAdsUuid, getByAdsUuid2, getPayReadyLogs, setPaymentDone, getCount, getCount2 } from "../../model/ads/adslog"
import { getLoginAsync } from "../../redis/logindao"
import { timestamps } from "../../config/winston"
export const router = Router()

router.get('/', async function (req: Request, res: Response, next: NextFunction) {
    let ip = req.header("remoteip")
    const { page, count } = req.query
    let { token, uuid } = (req as any).cookies

    try {
        if (ip !== "127.0.0.1")
            await getLoginAsync(uuid, token)

        validateCgi({ page: page, count: count }, adsLogValidator.pageCount)
        let result = await getPayReadyLogs(page, count)
        res.json(result)
    } catch (e) {
        e.info(se, res, e)
    }
})

//¹ã¸æ·Ã¿Í
router.get('/visitors/:adsuuid', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let adsuuid = req.params["adsuuid"]
    const { start, length, draw, search } = req.query
    try {
        let searchdata = (search as any).value
        validateCgi({ adsuuid: adsuuid, start: start, length: length, searchdata: searchdata }, adsLogValidator.pagination)
        let recordsFiltered = await getCount2(req.app.locals.sequelize, adsuuid, searchdata, )
        let adslogs = await getByAdsUuid2(req.app.locals.sequelize, adsuuid, searchdata, parseInt(start), parseInt(length))
        adslogs.forEach(r => {
            r.created = timestamps(r.created)
            r.modified = timestamps(r.modified)
        })
        return sendOK(res, { adslogs: adslogs, draw: draw, recordsFiltered: recordsFiltered })
    } catch (e) {
        e.info(se, res, e)
    }
})

router.patch('/payment', async function (req: Request, res: Response, next: NextFunction) {
    let ip = req.header("remoteip")
    if (ip !== "127.0.0.1")
        return sendNoPerm(res)

    try {
        const uuids = JSON.parse((<any>req).body.uuids) as Array<string>

        if (!uuids || uuids.length === 0) {
            return sendErrMsg(res, "bad request", 401)
        }
        uuids.forEach(uuid => validateCgi({ uuid: uuid }, adsLogValidator.uuid))
        let ret = await setPaymentDone(uuids)
        console.log(ret)
        res.json({ msg: ret })
    } catch (e) {
        e.info(se, res, e)
    }
})

/* GET adslog listing. */
router.get('/:adsuuid', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    let adsuuid = req.params["adsuuid"]
    const { start, length, draw, search } = req.query
    try {
        let searchdata = (search as any).value
        validateCgi({ adsuuid: adsuuid, start: start, length: length, searchdata: searchdata }, adsLogValidator.pagination)
        let recordsFiltered = await getCount(req.app.locals.sequelize, adsuuid, searchdata, )
        let adslogs = await getByAdsUuid(req.app.locals.sequelize, adsuuid, searchdata, parseInt(start), parseInt(length))
        adslogs.forEach(r => {
            r.created = timestamps(r.created)
            r.modified = timestamps(r.modified)
        })
        return sendOK(res, { adslogs: adslogs, draw: draw, recordsFiltered: recordsFiltered })
    } catch (e) {
        e.info(se, res, e)
    }
})

