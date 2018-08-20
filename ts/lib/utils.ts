import { createHash } from "crypto"

export function checkPassword(real: string, current: string): void {
    let [a, b] = [real.length === 32 ? real : md5sum(real), current.length === 32 ? current : md5sum(current)]
    if (a !== b)
        throw new Error("密码不正确！")
}

export function changeUsername(username: string) {
    if (username.length == 11)
        return username.substr(0, 3) + '****' + username.substr(7)
    return username
}

//新添加
export function checkState(real_state: string, current_state: string): void {
    console.log(real_state.length)
    if (current_state != null)  {
    let [a, b] = [real_state.length === 32 ? real_state : md5sum(real_state), current_state.length === 32 ?current_state : md5sum(current_state)]
    if (a == b)
        throw new Error("账号已禁用，请联系管理员！")
    }
}

export function formatDate(d: Date) {
    return moment(d).format("yyyymmddHHMMss")
}

export function randomInt(from: number, to: number) {
    return Math.floor(Math.random() * (to - from) + from)
}

export function md5sum(str: string): string {
    return createHash('md5').update(str).digest("hex")
}

export function sleepAsync(ms: number): Promise<void> {
    return new Promise<void>(resolve => setTimeout(() => resolve(), ms))
}

export function getPageCount(page: string, count?: string) {
    let limit = parseInt(count)
    let cursor = 0
    if (page && page !== "0") {
        cursor = (parseInt(page) - 1) * parseInt(count)
    }
    return { cursor, limit }
}

export async function checkreq(param: Array<any>, sign: string, next: any) {
    param.sort()
    let s = param.join(",")
    if (sign === md5sum(s)) {
        return next()
    }
    return "参数错误!"
}

export function toJson(perm: string) {
    if (perm === "root")
        return { root: 1 }
    if (perm === "adminRO")
        return { adminRO: 1 }
    if (perm === "adminRW")
        return { adminRW: 1 }
    if (perm === "adsRW")
        return { adsRW: 1 }
    //if (perm === "adsRO")
    //    return { adsRO: 1 }
    return { adsRO: 1 }
}


export function getSign(order: any, key: string) {
    delete order.sign
    let arr = new Array<any>()
    for (let k in order) {
        arr.push(`${k}=${order[k]}`)
    }
    arr.sort()
    arr.push(`key=${key}`)
    return md5sum(arr.join("&")).toUpperCase()
}
