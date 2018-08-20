import { validateCgi } from "../../lib/validator"
import { addressValidator } from "./validator"
import { Router, Request, Response, NextFunction } from "express"
import { checkAppLogin, LoginInfo } from "../../redis/logindao"
import { sendOK, sendError as se, sendNotFound } from "../../lib/response"
import { createAddress, getCount, deleteAddress, updateAddress, findByUuid, findByUseruuid, updateState, getDefaultAddress, updatedefaul } from "../../model/users/address"

export const router = Router()

// TODO
router.post('/', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const { address, contact, phone, defaul } = (req as any).body
    const loginInfo: LoginInfo = (req as any).loginInfo
    let useruuid = loginInfo.getUuid()
    try {
        validateCgi({ useruuid: useruuid, address: address, contact: contact, phone: phone, defaul: defaul }, addressValidator.create)
        let count = await getCount(useruuid)
        if (count < 5) {
            let obj = {
                useruuid: useruuid,
                address: address,
                contact: contact,
                phone: phone,
                defaul: defaul
            }
            if (count == 0) {
                obj = {
                    useruuid: useruuid,
                    address: address,
                    contact: contact,
                    phone: phone,
                    defaul: "yes"
                }
            }
            if (defaul === "yes")
                await updatedefaul(useruuid)
            let result = await createAddress(obj)
            return sendOK(res, { address: result })
        } else {
            return sendNotFound(res, "对不起，您已经拥有5个收货地址！")
        }
    } catch (e) {
        e.info(se, res, e)
    }
})

// TODO
router.delete('/:uuid', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const uuid = req.params["uuid"]
    try {
        validateCgi({ uuid: uuid }, addressValidator.uuid)
        await deleteAddress(uuid)
        return sendOK(res, { msg: "删除成功" })
    } catch (e) {
        e.info(se, res, e)
    }
})

// TODO
router.put('/:uuid', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const uuid = req.params["uuid"]
    const { address, contact, phone, defaul } = (req as any).body
    try {
        const loginInfo: LoginInfo = (req as any).loginInfo
        validateCgi({ uuid: uuid, contact: contact, phone: phone, defaul: defaul }, addressValidator.update)
        let addre = JSON.parse(address)
        console.log(addre)
        let obj = {
            address: address,
            contact: contact,
            phone: phone,
            defaul: defaul
        }
        await updatedefaul(loginInfo.getUuid())
        let result = await updateAddress(uuid, obj);
        return sendOK(res, result)
    } catch (e) {
        e.info(se, res, e)
    }
})

//TODO
router.get("/default", checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    try {
        const loginInfo: LoginInfo = (req as any).loginInfo
        let address = await getDefaultAddress(loginInfo.getUuid())
        return sendOK(res, { address: address })
    } catch (e) {
        e.info(se, res, e)
    }
})

// TODO
router.get('/user/:useruuid', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const useruuid = req.params["useruuid"]
    try {
        validateCgi({ uuid: useruuid }, addressValidator.uuid)
        let result = await findByUseruuid(useruuid)
        return sendOK(res, result)
    } catch (e) {
        e.info(se, res, e)
    }
})

// TODO
router.get('/:uuid', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const uuid = req.params["uuid"]
    try {
        validateCgi({ uuid: uuid }, addressValidator.uuid)
        let result = await findByUuid(uuid)
        return sendOK(res, result)
    } catch (e) {
        e.info(se, res, e)
    }
})

// TODO
router.patch('/:uuid', checkAppLogin, async function (req: Request, res: Response, next: NextFunction) {
    const uuid = req.params["uuid"]
    try {
        const loginInfo: LoginInfo = (req as any).loginInfo
        validateCgi({ useruuid: loginInfo.getUuid(), uuid: uuid }, addressValidator.state)
        let result = await updateState(req.app.locals.sequelize, loginInfo.getUuid(), uuid)
        return sendOK(res, { result: result })
    } catch (e) {
        e.info(se, res, e)
    }
})