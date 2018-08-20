import { formatDate } from "../lib/utils"
let fs = require("fs")
let crypto = require('crypto')

//将所有生成有序数列
export async function getVerifyParams(params: any) {
    let sPara = []
    if (!params) return null
    for (let key in params) {
        // if ((!params[key]) || key == "sign" || key == "sign_type") {    //去掉sign sign_type参数
        //     continue
        // }
        sPara.push([key, params[key]])
    }
    sPara = sPara.sort()
    let prestr = ''
    for (let i = 0; i < sPara.length; i++) {
        let obj = sPara[i]
        if (i == sPara.length - 1) {
            prestr = prestr + obj[0] + '=' + obj[1] + ''
        } else {
            prestr = prestr + obj[0] + '=' + obj[1] + '&'
        }
    }
    return prestr
}

//签名
export async function getSign(params: any) {
    try {
        let privatePem = await fs.readFileSync("./js/config/rsa_private.pem")
        let Key = privatePem.toString()
        let sign = crypto.createSign('RSA-SHA256')
        sign.update(params)
        sign = sign.sign(Key, 'base64')
        return sign
    } catch (err) {
        console.log('veriSign err', err)
        return err
    }
}

//将支付宝发来的数据生成有序数列以及做decodeURIComponent，生成待验签字符串
export async function getAliParams(params: any) {
    let sPara = []
    if (!params) return null
    for (let key in params) {
        if ((!params[key]) || key == "sign" || key == "sign_type") {
            continue
        }
        sPara.push([key, params[key]])
    }
    sPara = sPara.sort()
    let prestr = ''
    for (let i = 0; i < sPara.length; i++) {
        let obj = sPara[i]
        if (i == sPara.length - 1) {
            prestr = prestr + obj[0] + '=' + decodeURIComponent(obj[1]) + ''
        } else {
            prestr = prestr + obj[0] + '=' + decodeURIComponent(obj[1]) + '&'
        }
    }
    return prestr
}

//通过支付宝公钥验签
export async function veriySign(params: any) {
    try {
        let publicPem = fs.readFileSync('./js/config/rsa_public.pem')
        let publicKey = publicPem.toString()
        let prestr = await getAliParams(params)        //去掉了 并且decode
        let sign = params['sign'] ? params['sign'] : ""
        let verify = crypto.createVerify('RSA-SHA256')
        verify.update(prestr)
        let signResult = verify.verify(publicKey, sign, 'base64')
        return signResult

    } catch (err) {
        console.log('veriSign err', err)
    }
}

// datetime.format("YYYY-MM-DD HH:mm:ss")
export async function getStartExpire(timeout: number) {
    let start = new Date()
    let expire = new Date(start.getTime() + timeout * 1000)
    return { start: formatDate(start), expire: formatDate(expire) }
}
