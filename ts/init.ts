import express = require("express")
import winston = require("winston")
import { config as logConfig } from "./config/winston"
import { setApplication } from "./lib/global"
import { Sequelize, Options } from "sequelize"
import { pgOpt } from "./config/postgres"
import { run as daemonRun } from "./daemon/daemon"
import {
    run as timerRun/*, autoAdsOn*/, delexp, autoExpired, nautoAdsoff, autoCancelGroup,
    upAdsBynextdat, deletebyEmptyads, actStateCheck as stateCheck, autoSummaryAdsOperation
} from "./daemon/timer"
import redisPool = require("./lib/redispool")
import redisConfig = require("./config/redis")
import { init as modelInit } from "./model/init"

export async function initResource(app: express.Application) {
    // 日志
    winston.configure(logConfig)

    // 为Error添加stack打印函数
    let prototype: any = Error.prototype
    const print = function (logf: Function, e: Error, f: Function, ...args: any[]) {
        logf("%s", e.stack.substring(0, 300))
        if (f)
            f(...args)
    }

    prototype.info = function (f: Function, ...args: any[]) {
        return print(winston.info, this, f, ...args)
    }

    prototype.error = function (f: Function, ...args: any[]) {
        return print(winston.error, this, f, ...args)
    }

    // postgres
    let seqz = new Sequelize(pgOpt.database, pgOpt.username, pgOpt.password, pgOpt.options as Options)

    // redis
    redisPool.init(redisConfig.opt)

    // database model
    await modelInit(seqz)

    app.locals.sequelize = seqz
    setApplication(app)

    winston.info("initResource ok")

    // init daemon
    daemonRun()

    timerRun()

    stateCheck()

    delexp()
    
    nautoAdsoff()
    upAdsBynextdat()
    //广告自动上下架
    //autoAdsOn()

    //优惠券自动过期
    autoExpired()
    deletebyEmptyads();

    autoSummaryAdsOperation(seqz);

    autoCancelGroup(seqz)
}


import { stat } from "fs"
import { promisify } from "bluebird"

const statAsync = promisify(stat)
import path = require("path")

async function loadRouter(app: express.Application, maps: { cgiPath: string, filePath: string }[]) {
    for (let map of maps) {
        let p = path.join(__dirname, map.filePath) + ".js"
        winston.debug("loading router", p)
        await statAsync(p)
        let m = require(map.filePath)
        app.use(map.cgiPath, m.router)
    }
}

export async function initRouter(app: express.Application) {
    let maps = [
        { cgiPath: "/app/api/address", filePath: "./router/app/address" },
        { cgiPath: "/app/api/category", filePath: "./router/app/category" },
        { cgiPath: "/app/api/goods", filePath: "./router/app/goods" },
        { cgiPath: "/app/api/adlog", filePath: "./router/app/adlog" },
        { cgiPath: "/app/api/payment", filePath: "./router/app/payment" },
        { cgiPath: "/app/api/appuser", filePath: "./router/app/users" },
        { cgiPath: "/app/api/hotkey", filePath: "./router/app/hotkey" },
        { cgiPath: "/app/api/shopping_cart", filePath: "./router/app/shopping_cart" },
        { cgiPath: "/app/api/comment", filePath: "./router/app/comment" },
        { cgiPath: "/app/api/favoriate_mall", filePath: "./router/app/favoriate_mall" },
        { cgiPath: "/app/api/banner", filePath: "./router/app/banner" },
        { cgiPath: "/app/api/type", filePath: "./router/app/type" },
        { cgiPath: "/app/api/invitation", filePath: "./router/app/invitation" },
        { cgiPath: "/app/api/banner", filePath: "./router/app/banner" },
        { cgiPath: "/app/api/payment", filePath: "./router/app/payment" },
        { cgiPath: "/app/api/wxpay", filePath: "./router/app/wxpay" },
        { cgiPath: "/app/api/alipay", filePath: "./router/app/alipay" },
        { cgiPath: "/app/api/orders", filePath: "./router/app/orders" },
        { cgiPath: "/app/api/message", filePath: "./router/app/message" },
        { cgiPath: "/app/api/ads_view", filePath: "./router/app/ads_view" },
        //{ cgiPath: "/app/api/wxshare", filePath: "./router/app/wxshare" },
        { cgiPath: "/app/api/goods_view", filePath: "./router/app/goods_view" },
        { cgiPath: "/app/api/system", filePath: "./router/app/system" },
        { cgiPath: "/app/api/consult", filePath: "./router/app/consult" },
        { cgiPath: "/app/api/logistics", filePath: "./router/app/logistics" },
        { cgiPath: "/app/api/levels", filePath: "./router/app/levels" },
        { cgiPath: "/app/api/pointorbalance", filePath: "./router/app/pointorbalance" },
        { cgiPath: "/app/api/paylog", filePath: "./router/app/paylog" },
        { cgiPath: "/app/api/coupon", filePath: "./router/app/coupon" },
        { cgiPath: "/app/api/usercoupon", filePath: "./router/app/usercoupon" },
        { cgiPath: "/app/api/userprize", filePath: "./router/app/userprize" },
        { cgiPath: "/app/api/lotterylevel", filePath: "./router/app/lotterylevel" },
        { cgiPath: "/app/api/ads", filePath: "./router/app/ads" },
        { cgiPath: "/app/api/mall", filePath: "./router/app/mall" },
        { cgiPath: "/app/api/evaluate", filePath: "./router/app/evaluate" },
        { cgiPath: "/app/api/info", filePath: "./router/app/informationads" },
        { cgiPath: "/app/api/trend", filePath: "./router/app/trend" },
        { cgiPath: "/crm/api/trend", filePath: "./router/crm/trend" },
        { cgiPath: "/crm/api/info", filePath: "./router/crm/informationads" },
        { cgiPath: "/crm/api/evaluate", filePath: "./router/crm/evaluate" },
        { cgiPath: "/crm/api/deduction", filePath: "./router/crm/deduction" },
        { cgiPath: "/crm/api/system", filePath: "./router/crm/system" },
        { cgiPath: "/crm/api/adslog", filePath: "./router/crm/adslog" },
        { cgiPath: "/crm/api/advertiser", filePath: "./router/crm/advertiser" },
        { cgiPath: "/crm/api/crmads", filePath: "./router/crm/crmads" },
        { cgiPath: "/crm/api/crmuser", filePath: "./router/crm/crmuser" },
        { cgiPath: "/crm/api/levels", filePath: "./router/crm/levels" },
        { cgiPath: "/crm/api/type", filePath: "./router/crm/type" },
        { cgiPath: "/crm/api/system", filePath: "./router/crm/system" },
        { cgiPath: "/crm/api/message", filePath: "./router/crm/message" },
        { cgiPath: "/crm/api/statistics", filePath: "./router/crm/statistics" },
        { cgiPath: "/crm/api/statistics_ext", filePath: "./router/crm/statistics_ext" },
        { cgiPath: "/crm/api/inviterul", filePath: "./router/crm/inviterul" },
        { cgiPath: "/crm/api/collectioncreate", filePath: "./router/crm/collectioncreate" },
        { cgiPath: "/crm/api/collectionaward", filePath: "./router/crm/collectionaward" },
        { cgiPath: "/crm/api/balancepointslog", filePath: "./router/crm/balancepointslog" },
        { cgiPath: "/app/api/usercollection", filePath: "./router/app/usercollection" },
        { cgiPath: "/crm/api/comment", filePath: "./router/crm/comment" },
        { cgiPath: "/crm/api/puton", filePath: "./router/crm/puton" },
        { cgiPath: "/crm/api/adsoperation", filePath: "./router/crm/adsoperation" },
        { cgiPath: "/goodscrm/api/category", filePath: "./router/goodscrm/category" },
        { cgiPath: "/goodscrm/api/banner", filePath: "./router/goodscrm/banner" },
        { cgiPath: "/goodscrm/api/crmuser", filePath: "./router/goodscrm/crmuser" },
        { cgiPath: "/goodscrm/api/orders", filePath: "./router/goodscrm/orders" },
        { cgiPath: "/goodscrm/api/comment", filePath: "./router/goodscrm/comment" },
        { cgiPath: "/goodscrm/api/goods", filePath: "./router/goodscrm/goods" },
        { cgiPath: "/goodscrm/api/logistics", filePath: "./router/goodscrm/logistics" },
        { cgiPath: "/goodscrm/api/consult", filePath: "./router/goodscrm/consult" },
        { cgiPath: "/goodscrm/api/business", filePath: "./router/goodscrm/business" },
        { cgiPath: "/goodscrm/api/coupon", filePath: "./router/goodscrm/coupon" },
        { cgiPath: "/goodscrm/api/awardusers", filePath: "./router/goodscrm/awardusers" },
        { cgiPath: "/goodscrm/api/prize", filePath: "./router/goodscrm/prize" },
        { cgiPath: "/goodscrm/api/lotterylevel", filePath: "./router/goodscrm/lotterylevel" },
        { cgiPath: "/goodscrm/api/userprize", filePath: "./router/goodscrm/userprize" },
        { cgiPath: "/goodscrm/api/usercoupon", filePath: "./router/goodscrm/usercoupon" },
        { cgiPath: "/goodscrm/api/lotteryrulesrecord", filePath: "./router/goodscrm/lotteryrulesrecord" },
        { cgiPath: "/logistics/api/logistics", filePath: "./router/logistics/logistics" },
        // { cgiPath: "/pay/api/testwxpay", filePath: "./daemon/pay/testwxpay" },
        // { cgiPath: "/pay/api/testalipay", filePath: "./daemon/pay/testalipay" },
    ]

    await loadRouter(app, maps) 
    console.log("initRouter ok")
}
