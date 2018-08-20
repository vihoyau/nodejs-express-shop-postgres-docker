import * as validator from "validator"
import { ReqError } from "../lib/reqerror"

export function validate(str: string, rules: any): void {
    // console.log(str, typeof str, rules)
    for (let k in rules) {
        if (k == "require" || k === "transform")
            continue

        let method = (<any>validator)[k]
        if (typeof method !== "function") {
            throw new ReqError(`invalid validator method ${k}`, 400)
        }

        let rule = rules[k]
        let [errmsg, param] = [rule.errmsg, rule.param]
        if (Array.isArray(param)) {
            if (!method.call(null, str, ...param))
                throw new ReqError(errmsg, 400)
        } else if (typeof param == "object") {
            if (!method.call(null, str, param))
                throw new ReqError(errmsg, 400)
        } else if (!method.call(null, str)) {
            throw new ReqError(errmsg, 400)
        }
    }
}

export function validateCgi(param: any, cgiConfig: any): void {
    if (!param || !cgiConfig) {
        throw new ReqError("invalid param", 400)
    }

    for (let k in cgiConfig) {
        let rules = cgiConfig[k]
        let userParam = param[k]
        if (userParam == null || userParam == undefined) {
            if (rules.require === 0) {
                continue
            }
            throw new ReqError(`缺少参数${k}！`, 400)
        }

        if (typeof userParam === "number") {
            userParam = userParam.toString()
        }

        validate(userParam, rules)
    }
}
