import assert = require("assert")
export class LoginInfo {
    private uuid: string
    private key: string
    private token: string
    private login: string
    private perm: string
    private permMap?: any

    constructor(uuid: string, key: string, token: string, login: string, perm?: string) {
        [this.uuid, this.key, this.token, this.login] = [uuid, key, token, login]
        if (perm) {
            assert(typeof perm === "string")
            this.perm = perm
            this.permMap = JSON.parse(perm)
        }
    }

    public static valueOf(s: string): LoginInfo {
        assert(typeof s === "string")

        let obj = JSON.parse(s)
        if (!obj)
            throw new Error("invalid LoginInfo format")

        let { uuid, key, token, login, perm } = obj

        if (perm)
            assert(typeof perm === "string")

        return new LoginInfo(uuid, key, token, login, perm)
    }

    public getUuid() { return this.uuid }
    public getKey() { return this.key }
    public getToken() { return this.token }
    public getLogin() { return this.login }
	public getPerm() {return this.perm}

    /*
    root | adminRO | adminRW | adsRO | adsRW
    */
    /**
     * {
     *      root:1
     *      ro/rw:1
     *  }
     */

    private isCommon(field: string) {
        if (!this.permMap)
            return false
        return !!this.permMap[field]
    }

    public isRoot() {
        return this.isCommon("root")
    }

    public isAdminRO() {
        return this.isCommon("adminRO")
    }

    public isAdminRW() {
        return this.isCommon("adminRW")
    }

    //新添加的appuser权限
    public isAppUser() {
        return this.isCommon("appuser")
    }

    public isAdvertiserRW() {
        return this.isCommon("advertiserRW")
    }

    public isAdsRO() {
        return this.isCommon("adsRO")
    }

    public isAdsRW() {
        return this.isCommon("adsRW")
    }

    public isGoodsRO() {
        return this.isCommon("goodsRO")
    }

    public isGoodsRW() {
        return this.isCommon("goodsRW")
    }
}

import logger = require("winston")
import { getRedisClientAsync } from "../lib/redispool"

const [sessionDbOpt, Sessiontimeout] = [{ db: 15 }, 604800]

export async function setLoginAsync(uuid: string, loginInfo: LoginInfo) {
    const content = JSON.stringify(loginInfo)
    await getRedisClientAsync(async rds => await rds.setAsync(uuid, content, "ex", Sessiontimeout), sessionDbOpt)
}

export async function setAppLoginAsync(uuid: string, loginInfo: LoginInfo) {
    const content = JSON.stringify(loginInfo)
    await getRedisClientAsync(async rds => await rds.setAsync("app" + uuid, content, "ex", Sessiontimeout), sessionDbOpt)
}

export async function getLoginAsync(uuid: string, token: string): Promise<[LoginInfo, string]> {
    if (!uuid || !token)
        return [undefined, "没有登录！"]

    let s = await getRedisClientAsync(async rds => await rds.getAsync(uuid), sessionDbOpt)
    if (!s)
        return [undefined, "没有登录！"]

    let info = LoginInfo.valueOf(s)
    if (token !== info.getToken())
        return [undefined, "没有登录！"]

    return [info, undefined]
}

export async function delLogin(uuid: string) {
    try {
        await getRedisClientAsync(async rds => rds.delAsync(uuid), sessionDbOpt)
    } catch (e) {
        logger.error("delLogin error", e.message)
    }
}

export async function delAppLogin(uuid: string) {
    try {
        await getRedisClientAsync(async rds => rds.delAsync("app" + uuid), sessionDbOpt)
    } catch (e) {
        logger.error("delLogin error", e.message)
    }
}

import { sendError } from "../lib/response"
import { ReqError } from "../lib/reqerror"

//crm登录信息
export async function checkLogin(req: any, res: any, next: any) {
    let { token, uuid } = (req as any).cookies
    if (!token && !uuid) {
        token = (req as any).headers.token
        uuid = (req as any).headers.uuid
    }

    try {
        let [info, errMsg] = await getLoginAsync(uuid, token)
        if (info) {
            req.loginInfo = info
            return next()
        }

        return sendError(res, new ReqError(errMsg, 401))
    } catch (e) {
        e.info(sendError, res, e)
    }
}

//app登录信息和crm登录信息分开存，避免相互挤出登录状态
export async function checkAppLogin(req: any, res: any, next: any) {
    let { token, uuid } = (req as any).cookies
    if (!token && !uuid) {
        token = (req as any).headers.token
        uuid = (req as any).headers.uuid
    }

    try {
        let [info, errMsg] = await getLoginAsync("app" + uuid, token)
        if (info) {
            req.loginInfo = info
            return next()
        }

        return sendError(res, new ReqError(errMsg, 401))
    } catch (e) {
        e.info(sendError, res, e)
    }
}

export async function getLogininfo(req: any, res: any, next: any) {
    let { token, uuid } = (req as any).cookies
    if (!token && !uuid) {
        token = (req as any).headers.token
        uuid = (req as any).headers.uuid
    }

    try {
        let [info] = await getLoginAsync("app" + uuid, token)
        req.loginInfo = info
        return next();
    } catch (e) {
        e.info(sendError, res, e)
    }
}