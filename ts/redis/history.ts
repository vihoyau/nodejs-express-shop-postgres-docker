import logger = require("winston")
import { getRedisClientAsync } from "../lib/redispool"
const MessagesDbOpt = { db: 3 }

export async function getAds(username: string) {
    return await getRedisClientAsync(async rds => await rds.getAsync(username), MessagesDbOpt)
}

export async function saveAds(username: string, ads: Array<any>) {
    try {
        await getRedisClientAsync(async rds => await rds.setAsync(username, ads, "ex", 600), MessagesDbOpt)
    } catch (e) {
        logger.error("saveAds error", e.message)
    }
}

export async function removeAds(username: string) {
    try {
        await getRedisClientAsync(async rds => await rds.delAsync(username), MessagesDbOpt)
    } catch (e) {
        logger.error("removeAds error", e.message)
    }
}

export async function getGoods(username: string) {
    return await getRedisClientAsync(async rds => await rds.getAsync(username), MessagesDbOpt)
}

export async function saveGoods(username: string, goods: Array<any>) {
    try {
        await getRedisClientAsync(async rds => await rds.setAsync(username, goods, "ex", 600), MessagesDbOpt)
    } catch (e) {
        logger.error("saveGoods error", e.message)
    }
}

export async function removeGoods(username: string) {
    try {
        await getRedisClientAsync(async rds => await rds.delAsync(username), MessagesDbOpt)
    } catch (e) {
        logger.error("removeGoods error", e.message)
    }
}

export async function getAnswerAds(opt: string) {
    return await getRedisClientAsync(async rds => await rds.getAsync(opt), MessagesDbOpt)
}

export async function saveAnswerAds(opt: string, val: string) {
    try {
        await getRedisClientAsync(async rds => await rds.setAsync(opt, val, "ex", 5), MessagesDbOpt)
    } catch (e) {
        logger.error("saveAds error", e.message)
    }
}