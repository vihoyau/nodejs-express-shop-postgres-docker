export class BatchEmitter {
    private running: boolean = false
    private requestCount: number = 0
    private requestCache: any[] = []
    private cb: Function

    constructor(cb: Function) {
        this.cb = cb
    }

    public emit(args?: any) {
        let self = this
        self.requestCount++
        if (args)
            self.requestCache.push(args)

        if (self.running)
            return   // 已经在跑

        self.running = true  // 设置状态在跑
        process.nextTick(async () => {
            while (self.requestCount > 0) {
                const [count, cache] = [self.requestCount, self.requestCache]
                self.requestCount = 0
                self.requestCache = []
                await self.cb(count, cache)
            }
            self.running = false // 本轮完成
        })
    }
}

