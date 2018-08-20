import { md5sum, randomInt } from "../lib/utils"
import * as moment from "moment"
import * as IM from "immutable"
import { buildXml, parseXmlAsync } from "../lib/xml"
import { postAsync } from "../lib/request"

// 订单起始和失效时间
function getStartExpire(timeout: number) {
    let start = moment()
    let expire = moment().add("seconds", timeout)
    return { start: start.format("YYYYMMDDHHmmss"), expire: expire.format("YYYYMMDDHHmmss") }
}

// 生成订单号
function getOutTradeNo() {
    // const prefix = "LS"
    const prefix = ""
    return `${prefix}${moment().format("YYYYMMDDHHmmss")}${randomInt(1000, 9999)}`
}

// 订单签名
function getSign(order: any, key: string) {
    let arr = new Array<any>()
    for (let k in order) {
        arr.push(`${k}=${order[k]}`)
    }
    arr.sort()
    arr.push(`key=${key}`)
    return md5sum(arr.join("&")).toUpperCase()
}

function splitWxResponse(res: any) {
    let sign
    let obj = {} as any
    for (let k in res) {
        if (k === "sign") {
            sign = res[k][0]
        } else {
            obj[k] = res[k][0]
        }
    }
    return [obj, sign]
}

function validateWxResponse(xml: any, sign: string, opt: { mch_id: string, appid: string, key: string }) {
    let return_code = xml.return_code
    if (return_code !== "SUCCESS") {
        throw new Error("准备订单失败2！")
    }

    if (!(opt.appid === xml.appid && opt.mch_id == xml.mch_id)) {
        throw new Error("准备订单失败4！")
    }

    let tmp = getSign(xml, opt.key)
    if (tmp !== sign)
        throw new Error("准备订单失败3！")
}

export async function genPrePayUnifiedOrder(
    obj: { body: string, total_fee: number, spbill_create_ip: string, trade: string },
    wxPayOpt: { mch_id: string, appid: string, timeout: number, key: string, notify_url: string }) {

    let out_trade_no = getOutTradeNo()
    const { start, expire } = getStartExpire(wxPayOpt.timeout)

    let $order = IM.Map({
        appid: wxPayOpt.appid,
        mch_id: wxPayOpt.mch_id,
        body: obj.body,
        notify_url: wxPayOpt.notify_url,
        spbill_create_ip: obj.spbill_create_ip,
        total_fee: obj.total_fee,
        trade_type: obj.trade,
        //device_info: "WEB",
        time_start: start,
        time_expire: expire,
        out_trade_no: out_trade_no,
        attach: out_trade_no,
        nonce_str: md5sum(`${randomInt(100000, 999999)}`),
    })

    let $signOrder = $order.set("sign", getSign($order.toJS(), wxPayOpt.key))
    let xmlx = buildXml($signOrder.toJS(), { headless: true, rootName: "xml" })
    let postOpt = {
        url: "https://api.mch.weixin.qq.com/pay/unifiedorder",
        body: xmlx
    }

    // 请求微信服务器生成订单
    let body = await postAsync(postOpt)

    // TODO
    if (body === 0) {
        // 解析结果
        let res = await parseXmlAsync(body)
        if (!res.xml || !res.xml.return_code)
            throw new Error("准备订单失败1！")

        let [resobj, sign] = splitWxResponse(res.xml)

        // 校验结果
        validateWxResponse(resobj, sign, wxPayOpt)
        return $order.set("prepay_id", resobj.prepay_id).toJS()
    } else {
        //let resobj = { prepay_id: 111 }
        let res = await parseXmlAsync(body)
        if (!res.xml || !res.xml.return_code)
            throw new Error("准备订单失败1！")

        let [resobj, sign] = splitWxResponse(res.xml)

        // 校验结果
        validateWxResponse(resobj, sign, wxPayOpt)
        return $order.set("prepay_id", resobj.prepay_id).toJS()
    }
}
export async function genPrePayUnifiedOrderh5(
    obj: { body: string, total_fee: number, spbill_create_ip: string, trade: string, openid: string },
    wxPaymentOpt: { mch_id: string, appid: string, timeout: number, key: string, notify_url: string }) {

    let out_trade_no = getOutTradeNo()
    const { start, expire } = getStartExpire(wxPaymentOpt.timeout)

    let $order = IM.Map({
        appid: wxPaymentOpt.appid,
        mch_id: wxPaymentOpt.mch_id,
        openid: obj.openid,
        body: obj.body,
        notify_url: wxPaymentOpt.notify_url,
        spbill_create_ip: obj.spbill_create_ip,
        total_fee: obj.total_fee,
        trade_type: obj.trade,
        device_info: "WEB",
        time_start: start,
        time_expire: expire,
        out_trade_no: out_trade_no,
        attach: out_trade_no,
        nonce_str: md5sum(`${randomInt(100000, 999999)}`),

    })
    let $signOrder = $order.set("sign", getSign($order.toJS(), wxPaymentOpt.key))
    let xmlx = buildXml($signOrder.toJS(), { headless: true, rootName: "xml" })
    let postOpt = {
        url: "https://api.mch.weixin.qq.com/pay/unifiedorder",
        body: xmlx
    }

    // 请求微信服务器生成订单
    let body = await postAsync(postOpt)
    // TODO
    if (body === 0) {
        // 解析结果
        let res = await parseXmlAsync(body)
        if (!res.xml || !res.xml.return_code)
            throw new Error("准备订单失败1！")

        let [resobj, sign] = splitWxResponse(res.xml)

        // 校验结果
        validateWxResponse(resobj, sign, wxPaymentOpt)
        return $order.set("prepay_id", resobj.prepay_id).toJS()
    } else {
        //let resobj = { prepay_id: 111 }
        let res = await parseXmlAsync(body)
        if (!res.xml || !res.xml.return_code)
            throw new Error("准备订单失败1！")

        let [resobj, sign] = splitWxResponse(res.xml)

        // 校验结果
        validateWxResponse(resobj, sign, wxPaymentOpt)
        return $order.set("prepay_id", resobj.prepay_id).toJS()
    }
}

/*
{ appid: 'wxd4d6f72d56dd0022',
  attach: 'ABCDEFG2017010918525986594',
  bank_type: 'CFT',
  cash_fee: '1',
  device_info: 'WEB',
  fee_type: 'CNY',
  is_subscribe: 'Y',
  mch_id: '1428010502',
  nonce_str: '42b141e65e335ea4026b33dfc3f74dbe',
  openid: 'oR60tw9Hs4Lf7BEk9lPjUCfyDcIE',
  out_trade_no: 'ABCDEFG2017010918525986594',
  result_code: 'SUCCESS',
  return_code: 'SUCCESS',
  time_end: '20170109185313',
  total_fee: '1',
  trade_type: 'JSAPI',
  transaction_id: '4002322001201701095757764932' }
*/
export async function validateNotify(s: string, opt: any) {
    let res = await parseXmlAsync(s)
    let [xml, sign] = splitWxResponse(res.xml)
    let return_code = xml.return_code
    if (return_code !== "SUCCESS") {
        console.log("ERx", xml.return_code, xml.return_code !== "SUCCESS")
        throw new Error("validateNotify")
    }

    /*
        // TODO
        if (!(opt.appid === xml.appid && opt.mch_id === xml.mch_id)) {
            console.log("ERx22", opt.appid, xml.appid, opt.appid === xml.appid, opt.mch_id, xml.mch_id, opt.mch_id === xml.mch_id)
            throw new Error("validateNotify2")
        }
    */
    let tmp = getSign(xml, opt.key)
    if (tmp === sign)
        return xml

    throw new Error("validateNotify3")
}

// 前端微信支付唤起参数
export async function getWebParam(prepay_id: string, appid: string, timestamp: string, key: string, mch_id: string) {
    let map = {
        appid: appid,
        noncestr: md5sum(`${randomInt(0, 9999999)}`),
        package: "Sign=WXPay",
        partnerid: mch_id,
        prepayid: prepay_id,
        timestamp: timestamp
    } as any
    // let map = {
    //     appid: appid,
    //     timestamp: timestamp,
    //     noncestr: md5sum(`${randomInt(0, 9999999)}`),
    //     package: "prepay_id=" + prepay_id,
    //     signtype: "MD5"
    // } as any
    map.paySign = getSign(map, key)
    map.mch_id = mch_id
    return map
}
export async function getWebParamh5(prepay_id: string, appid: string, timestamp: string, key: string, mch_id: string) {
    // let map = {
    //     appid: appid,
    //     noncestr: md5sum(`${randomInt(0, 9999999)}`),
    //     package: "Sign=WXPay",
    //     partnerid: mch_id,
    //     prepayid: prepay_id,
    //     timestamp: timestamp
    // } as any
    let map = {
        appId: appid,
        timeStamp: timestamp,
        nonceStr: md5sum(`${randomInt(0, 9999999)}`),
        package: "prepay_id=" + prepay_id,
        signType: "MD5"
    } as any
    map.paySign = getSign(map, key)
    return map
}