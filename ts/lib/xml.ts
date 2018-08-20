import * as xml2js from "xml2js"
export function parseXmlAsync(s: string): Promise<any> {
    return new Promise((resolve, reject) => {
        xml2js.parseString(s, (err, res) => {
            if (err)
                return reject(err)
            resolve(res)
        })
    })
}

export function buildXml(obj: any, opt?: any): string {
    return new xml2js.Builder(opt).buildObject(obj)
}
