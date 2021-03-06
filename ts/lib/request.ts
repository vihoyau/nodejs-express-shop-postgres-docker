import * as request from "request"

function requestCommon(method: Function, opt: any, statusCode: number) {
    return new Promise<any>((resolve, reject) => {
        method(opt, function (error: any, response: any, body: any) {
            if (error)
                return reject(error)

            if (response.statusCode !== statusCode)
                return reject("bad code " + response.statusCode)

            resolve(body)
        })
    })
}

export function getAsync(opt: any, statusCode = 200) {
    return requestCommon(request, opt, statusCode)
}

export function patchAsync(opt: any, statusCode = 200) {
    return requestCommon(request.patch, opt, statusCode)
}

export function postAsync(opt: any, statusCode = 200) {
    return requestCommon(request.post, opt, statusCode)
}
