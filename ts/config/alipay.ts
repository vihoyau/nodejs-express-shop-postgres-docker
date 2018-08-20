export const aliPayOpt = {
    app_id: "2017030906138138", //真实环境
    timeout_express: (10 * 10) + "m",
    method: "alipay.trade.app.pay",
    seller_id: "shijinsz2016@163.com",
    format: "JSON",     //仅支持json
    charset: "utf-8",
    sign_type: "RSA2",  //签名算法
    version: "1.0",
    partner: "2088521662881283",    //签约合作者身份ID
    notify_url: "https://39.108.171.104/app/api/alipay/notify",
    groupnotify_url: "https://39.108.171.104/app/api/alipay/groupnotify",
    geteway: "https://www.alipay.com/cooperate/gateway.do"  //统一网关
}

export const bidMaxCount = 2
