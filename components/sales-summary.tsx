"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Download, Printer, Eye } from "lucide-react"
import { format } from "date-fns"
import { memoService } from "@/lib/firebase-service"
import { generateSalesSummaryPDF, generateMemoPDF } from "@/lib/pdf-utils"
import type { DailySales, Memo } from "@/types"
import { cn } from "@/lib/utils"

export default function SalesSummary() {
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [salesData, setSalesData] = useState<DailySales[]>([])
  const [totalAmount, setTotalAmount] = useState(0)
  const [itemsSummary, setItemsSummary] = useState<Record<string, { quantity: number; unit: string }>>({})
  const [loading, setLoading] = useState(false)
  const [allMemos, setAllMemos] = useState<Memo[]>([])

  const generateSalesReport = async () => {
    setLoading(true)
    try {
      const memos = await memoService.getByDateRange(startDate, endDate)

      // Group by date
      const dailySalesMap = new Map<string, DailySales>()
      const itemsMap = new Map<string, { quantity: number; unit: string }>()
      let total = 0

      memos.forEach((memo) => {
        const dateKey = memo.date.toDateString()

        if (!dailySalesMap.has(dateKey)) {
          dailySalesMap.set(dateKey, {
            date: memo.date.toLocaleDateString(),
            totalAmount: 0,
            totalMemos: 0,
            itemsSold: {},
          })
        }

        const dailySale = dailySalesMap.get(dateKey)!
        dailySale.totalAmount += memo.totalAmount
        dailySale.totalMemos += 1
        total += memo.totalAmount

        // Process items
        memo.items.forEach((item) => {
          if (itemsMap.has(item.itemName)) {
            const existing = itemsMap.get(item.itemName)!
            existing.quantity += item.quantity
          } else {
            itemsMap.set(item.itemName, {
              quantity: item.quantity,
              unit: item.unit,
            })
          }
        })
      })

      setSalesData(Array.from(dailySalesMap.values()))
      setAllMemos(memos)
      setTotalAmount(total)
      setItemsSummary(Object.fromEntries(itemsMap))
    } catch (error) {
      console.error("Error generating sales report:", error)
    }
    setLoading(false)
  }

  const previewPDF = () => {
    const title = `Sales Summary (${format(startDate, "PP")} - ${format(endDate, "PP")})`
    const doc = generateSalesSummaryPDF(title, salesData, totalAmount, itemsSummary)
    const pdfBlob = doc.output("blob")
    const url = URL.createObjectURL(pdfBlob)
    window.open(url, "_blank")
  }

  const downloadPDF = () => {
    const title = `Sales Summary (${format(startDate, "PP")} - ${format(endDate, "PP")})`
    const doc = generateSalesSummaryPDF(title, salesData, totalAmount, itemsSummary)
    doc.save(`sales-summary-${format(startDate, "yyyy-MM-dd")}-${format(endDate, "yyyy-MM-dd")}.pdf`)
  }

  const printPDF = () => {
    const title = `Sales Summary (${format(startDate, "PP")} - ${format(endDate, "PP")})`
    const doc = generateSalesSummaryPDF(title, salesData, totalAmount, itemsSummary)
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
          <CardTitle>Sales Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date Range Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>Pick start date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : <span>Pick end date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Button onClick={generateSalesReport} disabled={loading}>
            {loading ? "Generating..." : "Generate Report"}
          </Button>

          {salesData.length > 0 && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">BDT. {totalAmount.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">Total Sales</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{salesData.reduce((sum, day) => sum + day.totalMemos, 0)}</div>
                    <div className="text-sm text-muted-foreground">Total Memos</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{Object.keys(itemsSummary).length}</div>
                    <div className="text-sm text-muted-foreground">Unique Items</div>
                  </CardContent>
                </Card>
              </div>

              {/* Items Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Items Sold</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(itemsSummary).map(([item, data]) => (
                      <div key={item} className="p-3 border rounded">
                        <div className="font-medium">{item}</div>
                        <div className="text-sm text-muted-foreground">
                          {data.quantity} {data.unit}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Daily Sales */}
              <Card>
                <CardHeader>
                  <CardTitle>Daily Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {salesData.map((day, index) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <div className="font-medium">{day.date}</div>
                          <div className="text-sm text-muted-foreground">{day.totalMemos} memos</div>
                        </div>
                        <div className="font-bold">BDT. {day.totalAmount.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* All Memos in Date Range */}
              {allMemos.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>All Memos ({allMemos.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {allMemos.map((memo) => (
                        <div
                          key={memo.id}
                          className="flex justify-between items-center p-3 border rounded hover:bg-gray-50"
                        >
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="font-medium">{memo.customerName}</div>
                                <div className="text-sm text-muted-foreground">{memo.customerMobile}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">BDT. {memo.totalAmount.toFixed(2)}</div>
                                <div className="text-sm text-muted-foreground">{memo.date.toLocaleDateString()}</div>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {memo.items.map((item) => `${item.itemName} (${item.quantity} ${item.unit})`).join(", ")}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const doc = generateMemoPDF(memo)
                              const pdfBlob = doc.output("blob")
                              const url = URL.createObjectURL(pdfBlob)
                              window.open(url, "_blank")
                            }}
                            className="ml-4"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* PDF Actions */}
              <div className="flex gap-2">
                <Button variant="outline" onClick={previewPDF}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview PDF
                </Button>
                <Button variant="outline" onClick={downloadPDF}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button variant="outline" onClick={printPDF}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print PDF
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
