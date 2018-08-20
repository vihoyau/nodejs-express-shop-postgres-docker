import { wxPayOpt } from "../../config/wxpay"
import { postAsync } from "../../lib/request"
import { getSign } from "../../lib/utils"
import { readFileAsync } from "../../lib/fs"
import * as logger from "winston"
import * as moment from 'moment'
import { BatchEmitter } from "../../lib/batchemiiter"
import { parseXmlAsync, buildXml } from "../../lib/xml"
import * as path from "path"
import { pemDir } from "../../config/wxpay"
import { findById, setTransferState, findNewUUIDs, setTransferStateAbandon, /*findTest*/ } from "../../model/pay/transfer"
import { createdPaylog } from "../../model/pay/paylog"
import { insertAmountLog } from "../../model/users/amountlog"

const abandonCount = 10
const minIntervel = 30 * 1000

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(() => resolve(), ms))
}

let pem: { ca: Buffer, key: Buffer, cert: Buffer }
async function readPemAsync() {
    if (pem)
        return pem

    let ca = await readFileAsync(path.join(pemDir, "..", "cert", "/rootca.pem"))
    let key = await readFileAsync(path.join(pemDir, "..", "cert", "/apiclient_key.pem"))
    let cert = await readFileAsync(path.join(pemDir, "..", "cert", "/apiclient_cert.pem"))
    pem = { ca: ca, key: key, cert: cert }
    return pem
}

async function postTransfer(xml: string): Promise<any> {
    let pem = await readPemAsync()
    let postOpt = {
        body: xml,
        ca: pem.ca,
        key: pem.key,
        cert: pem.cert,
        url: "https://api.mch.weixin.qq.com/mmpaymkttransfers/promotion/transfers",
    }

    let body = await postAsync(postOpt)
    let obj = await parseXmlAsync(body)
    if (!obj || !obj.xml)
        throw new Error("invalid result " + body)

    obj = obj.xml
    let res = {} as any
    for (let k in obj) {
        let v = obj[k]
        res[k] = v[0]
    }

    if (res.return_code !== "SUCCESS")
        throw new Error("invalid result " + body)

    return res
}

function getSignXml(r: any, key: string) {
    let obj: any = {
        mch_appid: r.mch_appid,
        mchid: r.mchid,
        nonce_str: r.nonce_str,
        partner_trade_no: r.partner_trade_no,
        openid: r.openid,
        check_name: r.check_name,
        amount: r.amount,
        desc: r.description,
        spbill_create_ip: r.spbill_create_ip,
    }

    if (r.re_user_name)
        obj.re_user_name = r.re_user_name

    obj.sign = getSign(obj, key)
    return buildXml(obj, { headless: true, rootName: "xml" })
}

class TimeInfo {
    private nextTime: number        // 下一次转账时间
    private failcount: number       // 失败次数，不算余额不足
    private failMsgSet: Set<string> // 失败消息
    constructor() {
        this.nextTime = 0
        this.failcount = 0
    }

    public getNextTime() {
        return this.nextTime
    }

    public shouldAbandon() {
        return this.failcount >= abandonCount
    }

    public getFailCount() {
        return this.failcount
    }

    public resetTime(ms: number): this {
        this.nextTime = new Date().getTime() + ms
        return this
    }

    public incFailCount(): this {
        this.failcount++
        return this
    }

    public setErrMsg(msg: string): this {
        if (!msg)
            return this

        if (!this.failMsgSet)
            this.failMsgSet = new Set<string>()

        this.failMsgSet.add(msg)
        return this
    }

    public getErrMsg() {
        return this.failMsgSet
    }
}

// ------------------------------------------------------------------------------------------------
let hasInit = false
let batchEmmiter: BatchEmitter
const eventPay = "payment.pay"
export function init(eventMap: Map<string, any>) {
    eventMap.set(eventPay, emit)
}

export function run() {
    hasInit = true
    logger.info("start wx auto pay daemon")

    batchEmmiter = new BatchEmitter(startPay)
    // setTimeout(() => emit("self"), 1000)
    setInterval(() => emit("self"), 30 * 1000)
    // setTimeout(findTest, 0)
}

export function emit(event: string, args?: any) {
    if (hasInit)
        batchEmmiter.emit(event)
}

let uuidTimeMap = new Map<string, TimeInfo>()
let num = 0
async function autoPay(uuid: string, info: TimeInfo, finish: Array<string>) {
    let transfer = await findById(uuid)
    let xml = getSignXml(transfer, wxPayOpt.key)
    // console.log(xml)
    let res = await postTransfer(xml)
    if (res.result_code === "SUCCESS") {
        let ext = {
            payment_no: res.payment_no,
            payment_time: res.payment_time,
            partner_trade_no: res.partner_trade_no
        }

        let trans = await setTransferState(uuid, ext, "fin") //finishTransfer(uuid, JSON.stringify(ext))
        finish.push(uuid)   // 转账成功
        if (trans) {    //插入提现记录，by qizhibiao
            let obj2 = {
                useruuid: trans.useruuid,
                amount: trans.amount / 100,
                mode: "withdraw",
                time: moment().format('YYYY-MM-DD HH:mm:ss')
            }
            await insertAmountLog(obj2)
        }

        await createdPaylog({ amount: transfer.amount, useruuid: transfer.useruuid, description: "转账成功" })
        logger.debug("pay success", uuid)
        return
    }

    switch (res.err_code) {
        case "NOTENOUGH":   // 余额不足
            info.resetTime(minIntervel)
            logger.warn("NOTENOUGH", uuid, res, num)
            if (num >= 3) {
                logger.warn("update 余额不足")
                await setTransferStateAbandon(transfer, "NOTENOUGH")
                await createdPaylog({ amount: transfer.amount, useruuid: transfer.useruuid, description: "转账失败" })
                finish.push(uuid)
                num = 0
            }
            num++
            await sleep(60 * 1000)  // 60s后再尝试下一个转账
            break

        // TODO 重新发送已经成功的请求？

        default:   // 其他错误
            info.setErrMsg(res.err_code_des).incFailCount().resetTime(minIntervel)
            uuidTimeMap.set(uuid, info)     // 设置下一次尝试

            logger.error("pay error", uuid, res)

            if (info.shouldAbandon()) {
                let ext = {
                    failCount: info.getFailCount(),
                    errMsg: info.getErrMsg(),
                }

                // 设置转账状态为放弃，不再尝试
                //await setTransferState(uuid, JSON.stringify(ext), "abandon") //await abandonTransfer(uuid, JSON.stringify(ext))
                await setTransferStateAbandon(transfer, JSON.stringify(ext))
                await createdPaylog({ amount: transfer.amount, useruuid: transfer.useruuid, description: "转账失败" })
                finish.push(uuid)
                logger.error("abandonTransfer", uuid, res)
            }
            break
    }
}

async function startPay() {
    const f = async () => {
        let finish = new Array<string>()
        for (let [uuid, info] of uuidTimeMap.entries()) {
            if (new Date().getTime() <= info.getNextTime())
                continue    // 两次尝试时间间隔没到

            try {
                await autoPay(uuid, info, finish)     // 一次转账尝试
            } catch (e) {
                logger.error(e)
            }
        }

        finish.forEach(uuid => uuidTimeMap.delete(uuid))    // 删除已经完成或者放弃的uuid
    }

    try {
        let uuids = await findNewUUIDs(10000)
        if (uuids.length > 0) {
            uuids.forEach(uuid => uuidTimeMap.has(uuid) ? 0 : uuidTimeMap.set(uuid, new TimeInfo()))
        }

        return await f()
    } catch (e) {
        logger.error("startPay", e.message)
    }
}

