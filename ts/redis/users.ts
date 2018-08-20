import logger = require("winston")
import { getRedisClientAsync } from "../lib/redispool"
import { findByName } from "../model/system/system"
const [MessagesDbOpt, openidDbOpt] = [{ db: 1 }, { db: 2 }]

async function getInviteInterval() {
    let res = await findByName("invite")
    return res.content.val
}

export async function getSmsCode(username: string) {
    return await getRedisClientAsync(async rds => await rds.getAsync(username), MessagesDbOpt)
}

export async function saveSmsCode(username: string, content: string) {
    try {
        await getRedisClientAsync(async rds => await rds.setAsync(username, content, "ex", 600), MessagesDbOpt)
    } catch (e) {
        logger.error("saveSmsCode error", e.message)
    }
}

//???????????
export async function getCaptchaCode(username: string) {
    return await getRedisClientAsync(async rds => await rds.getAsync("Captcha" + username), MessagesDbOpt)
}

//????????????
export async function saveCaptchaCode(username: string, content: string) {
    try {
        await getRedisClientAsync(async rds => await rds.setAsync("Captcha" + username, content, "ex", 600), MessagesDbOpt)
    } catch (e) {
        logger.error("saveCaptchaCode error", e.message)
    }
}

// export async function getCaptchaCode2(username: string) {
//     return await getRedisClientAsync(async rds => await rds.getAsync("CaptchaCode" + username), MessagesDbOpt)
// }

// //???????????????
// export async function saveCaptchaCode2(username: string) {/*60S?????????????????????*/
//     try {
//         await getRedisClientAsync(async rds => await rds.setAsync("CaptchaCode" + username, "captcha", "ex", 60), MessagesDbOpt)
//     } catch (e) {
//         logger.error("saveCaptchaCode error", e.message)
//     }
// }

export async function getCaptchaCode3(username: string) {
    return await getRedisClientAsync(async rds => await rds.getAsync("passCaptchaCode" + username), MessagesDbOpt)
}


export async function saveCaptchaCode3(username: string) {
    try {
        await getRedisClientAsync(async rds => await rds.setAsync("passCaptchaCode" + username, "captcha", "ex", 600), MessagesDbOpt)
    } catch (e) {
        logger.error("saveCaptchaCode error", e.message)
    }
}

//
export async function getInvite(username: string) {
    return await getRedisClientAsync(async rds => await rds.getAsync("invite" + username), MessagesDbOpt)
}

//
export async function saveInvite(username: string, content: string) {//??งน????????????????
    try {
        const interval = await getInviteInterval()
        await getRedisClientAsync(async rds => {
            await rds.setAsync("invite" + username, content, "ex", interval)
        }, MessagesDbOpt)
    } catch (e) {
        logger.error("saveInvite error", e.message)
    }
}

export async function removeSmsCode(username: string) {
    try {
        await getRedisClientAsync(async rds => await rds.delAsync(username), MessagesDbOpt)
    } catch (e) {
        logger.error("removeSmsCode error", e.message)
    }
}

export async function removeCaptchCode(username: string) {
    try {
        await getRedisClientAsync(async rds => await rds.delAsync("Captch" + username), MessagesDbOpt)
    } catch (e) {
        logger.error("removeCaptchCode error", e.message)
    }
}

function getOpenidKey(openid: string) {
    return "openid_" + openid
}

export async function saveOpenid(openid: string) {
    await getRedisClientAsync(async rds => await rds.setAsync(getOpenidKey(openid), new Date().getTime(), "ex", 120), openidDbOpt)
}

export async function getOpenid(openid: string) {
    return await getRedisClientAsync(async rds => await rds.getAsync(getOpenidKey(openid)), openidDbOpt)
}
