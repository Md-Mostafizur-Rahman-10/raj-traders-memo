"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Search, Eye, Download, Printer } from "lucide-react"
import { format } from "date-fns"
import { customerService, memoService } from "@/lib/firebase-service"
import { generateMemoPDF, generateSalesSummaryPDF } from "@/lib/pdf-utils"
import type { Customer, Memo } from "@/types"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function CustomerHistory() {
  const [mobile, setMobile] = useState("")
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [memos, setMemos] = useState<Memo[]>([])
  const [loading, setLoading] = useState(false)
  const [realtimeSearchResult, setRealtimeSearchResult] = useState([] as Customer[])

  const realtimeCustomerSearch = async () => {
    if (!mobile) {
      return
    }
    const foundCustomer = await customerService.getManyByMobile(mobile)
    console.log("Realtime search found customer:", foundCustomer)
    setRealtimeSearchResult(foundCustomer)
  }

  useEffect(() => {
    realtimeCustomerSearch()
  }, [mobile])



  const searchCustomerHistory = async () => {
    if (!mobile) {
      toast("Please enter mobile number")
      return
    }

    setLoading(true)
    try {
      const foundCustomer = await customerService.getByMobile(mobile)
      if (!foundCustomer) {
        toast("Customer not found")
        setCustomer(null)
        setMemos([])
        setLoading(false)
        return
      }

      console.log("Found customer:", foundCustomer)

      setCustomer(foundCustomer)
      const customerMemos = await memoService.getByCustomer(foundCustomer.id!, startDate, endDate)
      setMemos(customerMemos)
    } catch (error) {
      console.error("Error searching customer history:", error)
      toast("Error searching customer history")
    }
    setLoading(false)
  }

  const viewMemo = (memo: Memo) => {
    const doc = generateMemoPDF(memo)
    const pdfBlob = doc.output("blob")
    const url = URL.createObjectURL(pdfBlob)
    window.open(url, "_blank")
  }

  const generateCustomerSummaryPDF = () => {
    if (!customer || memos.length === 0) return

    const totalAmount = memos.reduce((sum, memo) => sum + memo.totalAmount, 0)
    const itemsSummary: Record<string, { quantity: number; unit: string }> = {}

    memos.forEach((memo) => {
      memo.items.forEach((item) => {
        if (itemsSummary[item.itemName]) {
          itemsSummary[item.itemName].quantity += item.quantity
        } else {
          itemsSummary[item.itemName] = {
            quantity: item.quantity,
            unit: item.unit,
          }
        }
      })
    })

    const dailySales = memos.map((memo) => ({
      date: memo.date.toLocaleDateString(),
      totalAmount: memo.totalAmount,
      totalMemos: 1,
      itemsSold: {},
    }))

    const dateRange = startDate && endDate ? `${format(startDate, "PP")} - ${format(endDate, "PP")}` : "All Time"

    const title = `Customer Summary - ${customer.name} (${dateRange})`

    return generateSalesSummaryPDF(title, dailySales, totalAmount, itemsSummary)
  }

  const previewCustomerSummary = () => {
    const doc = generateCustomerSummaryPDF()
    if (!doc) return
    const pdfBlob = doc.output("blob")
    const url = URL.createObjectURL(pdfBlob)
    window.open(url, "_blank")
  }

  const downloadCustomerSummary = () => {
    const doc = generateCustomerSummaryPDF()
    if (!doc) return
    doc.save(`customer-summary-${customer?.name}-${Date.now()}.pdf`)
  }

  const printCustomerSummary = () => {
    const doc = generateCustomerSummaryPDF()
    if (!doc) return
    const pdfBlob = doc.output("blob")
    const url = URL.createObjectURL(pdfBlob)
    const printWindow = window.open(url, "_blank")
    printWindow?.addEventListener("load", () => {
      printWindow.print()
    })
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Customer History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Form */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input
                id="mobile"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="Enter mobile number"
              />
            </div>

            {/* Realtime Search Results */}
            {
              realtimeSearchResult.length > 0 && (
                <div className="col-span-4 border-2 border-black bg-gray-300 w-fit absolute mt-14 rounded-xl" hidden={!mobile || mobile.length === 11}>
                  <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-1">
                    {realtimeSearchResult.map((customer) => (
                      <div key={customer.id} className="cursor-pointer hover:bg-gray-200" onClick={() => {setCustomer(customer); setMobile(customer.mobile); setMemos([])}}>
                        <div className="p-1">
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-muted-foreground">{customer.mobile}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            }

            <div>
              <Label>Start Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PP") : <span>Start date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>End Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PP") : <span>End date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-end">
              <Button onClick={searchCustomerHistory} disabled={loading} className="w-full">
                <Search className="h-4 w-4 mr-2" />
                {loading ? "Searching..." : "Search"}
              </Button>
            </div>
          </div>

          {/* Customer Info */}
          {customer && (
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Name</Label>
                    <div className="font-medium">{customer.name}</div>
                  </div>
                  <div>
                    <Label>Mobile</Label>
                    <div className="font-medium">{customer.mobile}</div>
                  </div>
                  <div>
                    <Label>Address</Label>
                    <div className="font-medium">{customer.address}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary */}
          {memos.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{memos.length}</div>
                  <div className="text-sm text-muted-foreground">Total Memos</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">
                    BDT. {memos.reduce((sum, memo) => sum + memo.totalAmount, 0).toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Amount</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={previewCustomerSummary}>
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button variant="outline" size="sm" onClick={downloadCustomerSummary}>
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                    <Button variant="outline" size="sm" onClick={printCustomerSummary}>
                      <Printer className="h-4 w-4 mr-1" />
                      Print
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Memos List */}
          {memos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Purchase History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {memos.map((memo) => (
                    <div key={memo.id} className="flex justify-between items-center p-4 border rounded">
                      <div className="flex-1">
                        <div className="font-medium">{memo.date.toLocaleDateString()}</div>
                        <div className="text-sm text-muted-foreground">
                          {memo.items.length} items • BDT. {memo.totalAmount.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {memo.items.map((item) => `${item.itemName} (${item.quantity} ${item.unit})`).join(", ")}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => viewMemo(memo)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Memo
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


