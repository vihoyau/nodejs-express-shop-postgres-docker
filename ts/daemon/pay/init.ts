import * as wxautopay from "./wxpay"

export function init(eventMap: Map<string, any>) {
    wxautopay.init(eventMap)
    wxautopay.run() //TODO
}

