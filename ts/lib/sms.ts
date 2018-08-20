import { createHash } from "crypto"
import { smsOpt } from "../config/sms"
import { postAsync } from "../lib/request"
import { randomInt } from "./utils"

export async function sendSms(mobile: string) {
    let curTime = Math.round(new Date().getTime() / 1000).toString()
    let nonce = randomInt(100000, 999999)
    let str = `${smsOpt.app_secret}${nonce}${curTime}`
    let checkSum = createHash('sha1').update(str).digest("hex")

    let options = {
        url: smsOpt.url,
        headers: {
            'Content-Type': "application/x-www-form-urlencoded",
            'AppKey': smsOpt.appKey,
            'CurTime': curTime,
            'CheckSum': checkSum,
            "Nonce": nonce
        },
        form: {
            mobile: mobile,
            templateid: smsOpt.templateid,
        }
    }

    return await postAsync(options)
}