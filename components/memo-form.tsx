/* eslint-disable */
"use client"

import { memo, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Plus, Trash2, Eye, Download, Printer } from "lucide-react"
import { format } from "date-fns"
import { customerService, memoService } from "@/lib/firebase-service"
import { generateMemoPDF } from "@/lib/pdf-utils"
import type { Customer, Memo, MemoItem } from "@/types"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function MemoForm() {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [mobile, setMobile] = useState("")
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [date, setDate] = useState<Date>(new Date())
  const [items, setItems] = useState<MemoItem[]>([{ itemName: "", quantity: 0, unit: "yards", rate: 0, amount: 0 }])
  const [customerHistory, setCustomerHistory] = useState<Memo[]>([])
  const [loading, setLoading] = useState(false)
  const [currentMemo, setCurrentMemo] = useState<Memo | null>(null)
  const [searchingCustomer, setSearchingCustomer] = useState(false)

  const [realtimeSearchResult, setRealtimeSearchResult] = useState([] as Customer[])
  const [realtimeItemSearchResult, setRealtimeItemSearchResult] = useState([] as MemoItem[])

  const realtimeItemSearch = async (itemName: string) => {
    if (!itemName) {
      return
    }
    const foundItems = await memoService.getItemsByName(itemName)
    console.log("Realtime search found items:", foundItems)
    setRealtimeItemSearchResult(foundItems)
  }

  const realtimeCustomerSearch = async () => {
    if (!mobile) {
      return
    }
    const foundCustomer = await customerService.getManyByMobile(mobile)
    console.log("Realtime search found customer:", foundCustomer)
    setRealtimeSearchResult(foundCustomer)
  }

  useEffect(() => {
    realtimeItemSearch(items[items.length - 1]?.itemName || "")
  }, [items])

  useEffect(() => {
    realtimeCustomerSearch()
  }, [mobile])

  const searchCustomer = async (mobileNumber: string) => {
    if (mobileNumber.length >= 10) {
      setSearchingCustomer(true)
      toast("Searching customer...")
      try {
        const existingCustomer = await customerService.getByMobile(mobileNumber)
        if (existingCustomer) {
          toast("Customer found!")
          setCustomer(existingCustomer)
          setName(existingCustomer.name)
          setAddress(existingCustomer.address)

          // Load customer history
          const history = await memoService.getByCustomer(existingCustomer.id!)
          setCustomerHistory(history)
        } else {
          toast("Customer not found!")
          setCustomer(null)
          setName("")
          setAddress("")
          setCustomerHistory([])
        }
      } catch (error) {
        console.error("Error searching customer:", error)
      }
      setSearchingCustomer(false)
    }
  }

  const addItem = () => {
    setItems([...items, { itemName: "", quantity: 0, unit: "yards", rate: 0, amount: 0 }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof MemoItem, value: any) => {
    const updatedItems = [...items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }

    if (field === "quantity" || field === "rate") {
      updatedItems[index].amount = updatedItems[index].quantity * updatedItems[index].rate
    }

    setItems(updatedItems)
  }

  const getTotalAmount = () => {
    return items.reduce((total, item) => total + item.amount, 0)
  }

  const saveMemo = async () => {
    if (!mobile || !name || !address || items.length === 0) {
      toast("Please fill all required fields")
      return
    }

    // Save new items if they do not exist
    await memoService.saveItems(items)

    setLoading(true)
    try {
      let customerId = customer?.id

      if (!customerId) {
        // Create new customer
        customerId = await customerService.create({
          mobile,
          name,
          address,
          createdAt: new Date(),
        })
      }

      const memo: Omit<Memo, "id"> = {
        customerId,
        customerMobile: mobile,
        customerName: name,
        customerAddress: address,
        date,
        items: items.filter((item) => item.itemName && item.quantity > 0),
        totalAmount: getTotalAmount(),
        createdAt: new Date(),
      }

      const memoId = await memoService.create(memo)
      setCurrentMemo({ ...memo, id: memoId })

      toast("Memo saved successfully!")

      // Reset form
      setMobile("")
      setName("")
      setAddress("")
      setItems([{ itemName: "", quantity: 0, unit: "yards", rate: 0, amount: 0 }])
      setCustomer(null)
      setCustomerHistory([])
    } catch (error) {
      console.error("Error saving memo:", error)
      toast("Error saving memo")
    }
    setLoading(false)
  }

  const previewPDF = () => {
    if (!currentMemo) return
    const doc = generateMemoPDF(currentMemo)
    const pdfBlob = doc.output("blob")
    const url = URL.createObjectURL(pdfBlob)
    window.open(url, "_blank")
  }

  const downloadPDF = () => {
    if (!currentMemo) return
    const doc = generateMemoPDF(currentMemo)
    doc.save(`memo-${currentMemo.id}.pdf`)
  }

  const printPDF = () => {
    if (!currentMemo) return
    const doc = generateMemoPDF(currentMemo)
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
          <CardTitle>Create New Memo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Customer Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="mobile">Mobile Number *</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="mobile"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      searchCustomer(mobile)
                    }
                  }}
                  placeholder="Enter mobile number to search"
                />
                <Button onClick={() => searchCustomer(mobile)} disabled={searchingCustomer}>
                  {searchingCustomer ? "Searching..." : "Search"}
                </Button>
              </div>
              {
                realtimeSearchResult.length > 0 && (
                  <div className="col-span-4 border-2 border-black bg-gray-300 w-fit absolute mt-0 rounded-xl" hidden={!mobile || mobile.length === 11}>
                    <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-1">
                      {realtimeSearchResult.map((customer) => (
                        <div key={customer.id} className="cursor-pointer hover:bg-gray-200" onClick={() => { setCustomer(customer); setName(customer.name); setAddress(customer.address); setMobile(customer.mobile); setCustomerHistory([]) }}>
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
            </div>
            <div>
              <Label htmlFor="name">Customer Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter customer name"
              />
            </div>
            <div>
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter address"
              />
            </div>
          </div>

          {/* Date Picker */}
          <div className="max-w-sm">
            <Label>Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={(date) => date && setDate(date)} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          {/* Items */}
          <div>
            <h2 className="text-3xl font-bold text-center">
              Items
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-2 p-4 border rounded font-bold">
              <div>Item Name</div>
              <div>Quantity</div>
              <div>Unit</div>
              <div>Rate</div>
              <div>Total</div>
              <div></div>
            </div>

            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-2 p-4 border rounded relative">
                <div className="relative">
                  <Input
                    placeholder="Item name"
                    value={item.itemName}
                    onChange={(e) => updateItem(index, "itemName", e.target.value)}
                  />
                  {realtimeItemSearchResult.length > 0 && index === items.length - 1 && item.itemName && (
                    <div className="z-10 border-2 border-black bg-gray-300 w-fit absolute mt-1 rounded-xl" hidden={item.itemName === realtimeItemSearchResult[0]?.itemName}>
                      <div className="grid grid-cols-1 gap-1">
                        {realtimeItemSearchResult.map((searchItem: MemoItem) => (
                          <div
                            key={searchItem.itemName}
                            className="cursor-pointer hover:bg-gray-200"
                            onClick={() => {
                              updateItem(index, "itemName", searchItem.itemName);
                              setItems((prevItems) => {
                                const updatedItems = [...prevItems];
                                updatedItems[index] = {
                                  ...updatedItems[index],
                                  itemName: searchItem.itemName,
                                  unit: searchItem.unit,
                                  rate: searchItem.rate,
                                  amount: (updatedItems[index].quantity || 0) * (searchItem.rate || 0),
                                };
                                return updatedItems;
                              });
                            }}
                          >
                            <div className="p-1">
                              <div className="font-medium">{searchItem.itemName}</div>
                              <div className="text-sm text-muted-foreground">{searchItem.rate} taka/{searchItem.unit}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <Input
                  type="number"
                  placeholder="Quantity"
                  value={item.quantity || ""}
                  onChange={(e) => updateItem(index, "quantity", Number.parseFloat(e.target.value) || 0)}
                />
                <Select value={item.unit} onValueChange={(value) => updateItem(index, "unit", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yards">Yards</SelectItem>
                    <SelectItem value="meters">Meters</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Rate"
                  value={item.rate || ""}
                  onChange={(e) => updateItem(index, "rate", Number.parseFloat(e.target.value) || 0)}
                />
                <Input type="number" placeholder="Amount" value={item.amount.toFixed(2)} readOnly />
                <Button variant="destructive" size="sm" onClick={() => removeItem(index)} disabled={items.length === 1}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <div className="w-full">
              <Button className="w-full" onClick={addItem} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </div>

          {/* Total */}
          <div className="text-right">
            <Label className="text-lg font-semibold">Total Amount: BDT. {getTotalAmount().toFixed(2)}</Label>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={saveMemo} disabled={loading}>
              {loading ? "Saving..." : "Save Memo"}
            </Button>

            {currentMemo && (
              <>
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
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Customer History */}
      {customerHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Customer Purchase History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {customerHistory.map((memo) => (
                <div key={memo.id} className="flex justify-between items-center p-2 border rounded">
                  <div>
                    <span className="font-medium">{memo.date.toLocaleDateString()}</span>
                    <span className="ml-4">BDT. {memo.totalAmount.toFixed(2)}</span>
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
                  >
                    View
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
