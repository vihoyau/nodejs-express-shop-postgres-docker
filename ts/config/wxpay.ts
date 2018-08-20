export const wxPayOpt = {   //开放平台
    mch_id: "1447900702",
    appid: "wxfd17876d21533c23",
    timeout: 10 * 60,
    key0: "5347e12b28d35820855bdb37d4374a0e",   //微信登录的，别删我
    key: "hfkjahfkof88fdkfhahs8832jak33578",
    notify_url: "http://www.shijinsz.net:11880/app/api/wxpay/notify"
    //notify_url: "https://www.shijinsz.net/proxy/35001/notify"
}

export const wxGroupPayOpt = {
    mch_id: "1447900702",
    appid: "wxfd17876d21533c23",
    timeout: 10 * 60,
    // key: "5347e12b28d35820855bdb37d4374a0e",
    key: "hfkjahfkof88fdkfhahs8832jak33578",
    notify_url: "https://39.108.171.104/app/api/wxpay/groupnotify"
    //notify_url: "https://www.shijinsz.net/proxy/35001/notify"
}

export const testwxPayOpt = {
    mch_id: "1447900702",
    appid: "wxfd17876d21533c23",
    timeout: 10 * 60,
    // key: "5347e12b28d35820855bdb37d4374a0e",
    key: "hfkjahfkof88fdkfhahs8832jak33578",
    notify_url: "https://192.168.0.102:3000/pay/api/testwxpay/notify"
    //notify_url: "https://www.shijinsz.net/proxy/35001/notify"
}

export const wxPaymentOpt = {
    mch_id: "1436122702",
    appid: "wx094ca38ae618cf4c",
    timeout: 10 * 60,
    key: "hfkjahfkof88fdkfhahs8832jak33578",
    //notify_url: "http://yun.cheeruvr.com/charge/wxpay/notify"
    notify_url: "http://www.shijinsz.net:11880/app/api/wxpay/notify"
}

export const bidMaxCount = 2

export const pemDir = `${__dirname}/../../perm`