import { ReqError } from "../lib/reqerror"

import { Response } from "express"

export function sendError(res: Response, e: Error): void {
    if (e instanceof ReqError) {
        res.status(e.getCode()).json({ error: e.message })
        return
    }
    res.status(500).json({ error: e.message })
}

export function sendErrMsg(res: Response, msg: string, code: number): void {
    sendError(res, new ReqError(msg, code))
}

export function sendNoPerm(res: Response, msg?: string): void {
    sendError(res, new ReqError(msg ? msg : "没有权限！", 403))
}

export function sendNotFound(res: Response, msg?: string): void {
    sendError(res, new ReqError(msg ? msg : "资源不存在！", 404))
}

export function sendOk(res: Response, data: any): void {
    res.send(JSON.stringify(data))
}

export function sendOK(res: Response, data: any): void {
    sendOk(res, data)
}

export function createdOk(res: Response, data: any): void {
    res.statusCode = 201
    sendOk(res, data)
}

export function deleteOK(res: Response, data: any): void {
    res.statusCode = 204
    sendOk(res, data)
}
