import { validateCgi } from "../../lib/validator"
import { levelsValidator } from "./validator"
import { checkLogin } from "../../redis/logindao"
import { Router, Request, Response, NextFunction } from "express"
import { sendOK, sendError as se } from "../../lib/response"
import { createLevels, deleteLevels, updateLevels, findByid, findAll, findByExp, getCount } from "../../model/users/levels"

export const router = Router()

// TODO
router.post('/', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { levels, fromexp, discount } = (req as any).body
    try {
        validateCgi({ levels: levels, discount: parseInt(discount) }, levelsValidator.levels_add)
        let obj = {
            levels: levels,
            fromexp: JSON.parse(fromexp),
            discount: parseInt(discount)
        }
        let result = await createLevels(obj)
        return sendOK(res, result)
    } catch (e) {
        e.info(se, res, e)
    }
})

// TODO
router.delete('/:uuid', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const uuid = req.params["uuid"]
    try {
        validateCgi({ uuid: uuid }, levelsValidator.uuid)
        await deleteLevels(uuid)
        return sendOK(res, "删除成功")
    } catch (e) {
        e.info(se, res, e)
    }
})

// TODO
router.put('/:uuid', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const uuid = req.params["uuid"]
    const { levels, fromexp, discount } = (req as any).body
    try {
        validateCgi({ uuid: uuid, levels: levels, fromexp: fromexp, discount: parseInt(discount) }, levelsValidator.levels_update)
        let obj = {
            levels: levels,
            fromexp: JSON.parse(fromexp),
            discount: parseInt(discount)
        }
        let result = await updateLevels(uuid, obj);
        return sendOK(res, result)
    } catch (e) {
        e.info(se, res, e)
    }
})

// TODO
router.get('/user/:exp', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const exp = req.params["exp"]
    try {
        validateCgi({ exp: exp }, levelsValidator.levels_exp)
        let result = await findByExp(parseInt(exp))
        return sendOK(res, result)
    } catch (e) {
        e.info(se, res, e)
    }
})

// TODO
router.get('/:uuid', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    const uuid = req.params["uuid"]
    try {
        validateCgi({ uuid: uuid }, levelsValidator.uuid)
        let result = await findByid(uuid)
        return sendOK(res, result)
    } catch (e) {
        e.info(se, res, e)
    }
})

// TODO
router.get('/', checkLogin, async function (req: Request, res: Response, next: NextFunction) {
    try {
        let { start, length, draw, search} = req.query

        //TODO validateCgi
        let searchdata = (search as any).value
        let obj = {}
        if (searchdata) {
            obj = {
                $or: [
                    { levels: { $like: '%' + searchdata + '%' } }
                ]
            }
        }
        let recordsFiltered = await getCount(obj)
        let result = await findAll(obj, parseInt(start), parseInt(length))
        return sendOK(res, { result: result, draw: draw, recordsFiltered: recordsFiltered })
    } catch (e) {
        e.info(se, res, e)
    }
})

// TODO
router.get('/user/:exp', /*checkLogin,*/ async function (req: Request, res: Response, next: NextFunction) {
    const exp = req.params["exp"]
    try {
        validateCgi({ exp: exp }, levelsValidator.levels_exp)
        let result = await findByExp(parseInt(exp))
        return sendOK(res, result)
    } catch (e) {
        e.info(se, res, e)
    }
})