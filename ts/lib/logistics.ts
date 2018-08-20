import { logistics } from '../config/logistics'
import { md5sum } from "../lib/utils"
import iconv = require('iconv-lite');
import { postAsync } from '../lib/request'
export function logisticsReturn() {
    let res = {
        "EBusinessID": logistics.EBusinessID,
        "UpdateTime": new Date(),
        "Success": true
    }
    return res
}


//await getOrderTracesByJson("YD", "3908740622276");
export async function getOrderTracesByJson(expCode: string, expNo: string, orderCode: string) {
    let requestData = {
        'OrderCode': orderCode,
        'ShipperCode': expCode,
        'LogisticCode': expNo
    }
    let dataSign = new Buffer(md5sum(JSON.stringify(requestData) + logistics.AppKey)).toString('base64')
    let options = {
        url: logistics.url,
        headers: {
            'accept': "*/*",
            'connection': "Keep-Alive",
            'user-agent': "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1;SV1)",
            'Content-Type': "application/x-www-form-urlencoded"
        },
        form: {
            RequestData: iconv.encode(JSON.stringify(requestData), "UTF-8"),
            EBusinessID: logistics.EBusinessID,
            RequestType: logistics.RequestType,
            DataSign: iconv.encode(dataSign, "UTF-8"),
            DataType: logistics.DataType
        }
    }
    let s = await postAsync(options)
    console.log(s)
    return s

}
