declare module "midtrans-client" {
  export class Snap {
    constructor(options: {
      isProduction: boolean
      serverKey: string
      clientKey: string
    })
    createTransaction(parameter: Record<string, unknown>): Promise<{
      token: string
      redirect_url?: string
    }>
  }

  export class CoreApi {
    constructor(options: {
      isProduction: boolean
      serverKey: string
      clientKey: string
    })
    transaction: {
      notification(payload: Record<string, string>): Promise<{
        order_id: string
        transaction_status: string
        fraud_status?: string
      }>
    }
  }

  const Midtrans: {
    Snap: typeof Snap
    CoreApi: typeof CoreApi
  }

  export default Midtrans
}
