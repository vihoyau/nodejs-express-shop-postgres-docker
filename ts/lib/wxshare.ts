
import { getAsync, postAsync } from "../lib/request"
import {wxOpt} from "../config/wechat"
import { getAccessToken, saveAccessToken,getticket ,saveticket} from "../redis/wxshare"
import  jsSHA = require('jssha');

export async function getToken() {
    let appid= wxOpt.appid
    let secret=wxOpt.secret
    let opt = {
     
        url: `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`
    }
    let res = await getAsync(opt)
    res = JSON.parse(res)
    if (res.access_token)
        return res.access_token
    // throw winston.error(`smssend fail. ${res.errmsg}`)
}
export async function sendWxShare() {
    //获取缓存中token
    let access_token = await getAccessToken("access_token")
    if (!access_token) {
        access_token = await getToken()
        await saveAccessToken("access_token", access_token)
    }
    let opt1 = {
        url: `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${access_token}&type=jsapi`,
    }
    //获取缓存中的ticket
    let jsapiticket = await getticket("jsapiticket")
    if (!jsapiticket) {
        let jsticket = await postAsync(opt1)
        jsticket =  JSON.parse(jsticket)
        jsapiticket= jsticket.ticket
        await saveticket("jsapiticket", jsapiticket)
    }
    return jsapiticket
}

//生成当前时间戳
let createTimestamp = function () {
    let datetime = new Date().getTime()
    let timestam:any=datetime/1000
    return parseInt(timestam);
};

var createNonceStr = function () {
    return Math.random().toString(36).substr(2, 15);
  };
  

  
  var raw = function (args:any) {
    var keys = Object.keys(args);
    keys = keys.sort()
    var newArgs:any = [];
    keys.forEach(function (key) {
      newArgs[key.toLowerCase()] = args[key];
    });
  
    var string = '';
    for (var k in newArgs) {
      string += '&' + k + '=' + newArgs[k];
    }
    string = string.substr(1);
    return string;
  };
  
  /**
  * @synopsis 签名算法 
  *
  * @param jsapi_ticket 用于签名的 jsapi_ticket
  * @param url 用于签名的 url ，注意必须动态获取，不能 hardcode
  *
  * @returns
  */
  export async function getsign(jsapi_ticket: any, url: string) {
    let appid= wxOpt.appid
    var ret = {
        jsapi_ticket: jsapi_ticket,
        noncestr: createNonceStr(),
        timestamp: createTimestamp(),
        url: url
      };
      var string = raw(ret);
      
      // let shaObj = new jsSHA(string, "TEXT");
     let shaObj = new jsSHA("SHA-1", "TEXT");
 //let signature = shaObj.getHash('SHA-1', 'HEX');
 shaObj.update(string);
 let signature=shaObj.getHash("HEX");
      return {ret,signature,appid}
  }