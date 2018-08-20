import { Sequelize } from "sequelize"
import { promisify } from "bluebird"
import * as assert from "assert"
import * as log from "winston"
import { stat } from "fs"
const statAsync = promisify(stat)
import path = require("path")

export async function init(seqz: Sequelize) {
    let models = [
        "./users/users",
        "./users/users_ext",
        "./users/address",
        "./users/levels",
        "./users/smscode",
        "./users/statistics",
        "./users/reward",
        "./users/message",
        "./users/usercoupon",
        "./users/userprize",
        "./users/lotterylog",
        "./users/amountlog",
        "./users/lotteryrulesrecord",
        "./pay/transfer",
        "./pay/wxtrade",
        "./pay/paylog",
        "./pay/alipay",
        "./mall/category",
        "./mall/goods",
        "./mall/comment",
        "./mall/favoriate",
        "./mall/goods_ext",
        "./mall/banner",
        "./mall/deduction",
        "./mall/crmuser",
        "./mall/goods_view",
        "./mall/consult",
        "./mall/business",
        "./mall/coupon",
        "./mall/prize",
        "./mall/collectionaward",
        "./mall/collectioncreate",
        "./mall/usercollection",
        "./mall/awardusers",
        "./mall/lotterylevel",
        "./ads/ads_view",
        "./ads/crmuser",
        "./ads/ads",
        "./ads/ads_ext",
        "./ads/adslog",
        "./ads/advertiser",
        "./ads/favoriate",
        "./ads/hotkey",
        "./ads/daysum",
        "./ads/monthsum",
        "./ads/category",
        "./ads/invitation",
        "./ads/inviterule",
        "./ads/applaud",
        "./ads/comment",
        "./logistics/logistics",
        "./logistics/shippercode",
        "./orders/shopping_cart",
        "./orders/orders",
        "./system/system",
        "./puton/plan",
        "./puton/unit",
        "./puton/controltime",
        "./ads/adsoperation",
        "./ads/paymoney",
        "./ads/incomemoney",
        "./evaluate/evaluateactivity",
        "./evaluate/evaluategroup",
        "./evaluate/evaluatejoin",
        "./evaluate/evaluatelog",
        "./ads/informationads",
        "./ads/informationcategory",
        "./ads/infocomment",
        "./trend/reflect",
        "./trend/trend",
        "./trend/trendcomment",
        "./trend/shielded"
    ]
    try {
        for (let modelPath of models) {
            let p = path.join(__dirname, modelPath) + ".js"
            log.debug("loading model", p)
            await statAsync(p)
            let m = require(modelPath)
            assert(m.defineFunction, "miss defineFunction")
            seqz.import(modelPath, m.defineFunction)
        }
    } catch (e) {
        log.error("init model fail ", e.message)
        process.exit(1)
    }
}

