export interface Customer {
  id?: string
  mobile: string
  name: string
  address: string
  createdAt: Date
}

export interface MemoItem {
  itemName: string
  quantity: number
  unit: "yards" | "meters"
  rate: number
  amount: number
}

export interface Memo {
  id?: string
  customerId: string
  customerMobile: string
  customerName: string
  customerAddress: string
  date: Date
  items: MemoItem[]
  totalAmount: number
  createdAt: Date
}

export interface DailySales {
  date: string
  totalAmount: number
  totalMemos: number
  itemsSold: Record<string, { quantity: number; unit: string }>
}
