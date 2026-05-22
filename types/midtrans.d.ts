export type MidtransSnapResult = {
  order_id?: string
  transaction_status?: string
  status_code?: string
  status_message?: string
}

export type MidtransSnapHandlers = {
  onSuccess?: (result: MidtransSnapResult) => void
  onPending?: (result: MidtransSnapResult) => void
  onError?: (result: MidtransSnapResult) => void
  onClose?: () => void
}

declare global {
  interface Window {
    snap?: {
      pay: (token: string, handlers?: MidtransSnapHandlers) => void
    }
  }
}

export {}
