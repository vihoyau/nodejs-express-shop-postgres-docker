import { getRedisClientAsync } from "../lib/redispool"
const [MessagesDbOpt] = [{ db: 1 }]

export async function getUserAdsOperation(key: string) {
    return await getRedisClientAsync(async rds => await rds.getAsync(key), MessagesDbOpt)
}

export async function saveUserAdsOperation(key: string, value: string) {
    await getRedisClientAsync(async rds => await rds.setAsync(key, value, "ex", 600), MessagesDbOpt)
}