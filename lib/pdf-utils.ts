import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import type { Memo, DailySales } from "@/types"

export const generateMemoPDF = (memo: Memo): jsPDF => {
  const doc = new jsPDF()

  // Header
  doc.setFontSize(20)
  doc.setFont("helvetica", "bold")
  doc.text("RAJ TRADERS", 105, 20, { align: "center" })
  doc.setFont("helvetica", "normal")

  // Customer Details
  doc.setFontSize(12)
  doc.text(`Date: ${memo.date.toLocaleDateString()} ${memo.date.toLocaleTimeString()}`, 20, 30)
  doc.text(`Customer: ${memo.customerName}`, 20, 35)
  doc.text(`Mobile: ${memo.customerMobile}`, 20, 40)
  doc.text(`Address: ${memo.customerAddress}`, 20, 45)

  // Items Table
  const tableData = memo.items.map((item) => [
    item.itemName,
    item.quantity.toString(),
    item.unit,
    item.rate.toFixed(2),
    item.amount.toFixed(2),
  ])

  autoTable(doc, {
    startY: 60,
    head: [["Item", "Quantity", "Unit", "Rate", "Amount"]],
    body: tableData,
    foot: [["", "", "", "Total:", "BDT. " + memo.totalAmount.toFixed(2)]],
    theme: "grid",
  })

  return doc
}

export const generateSalesSummaryPDF = (
  title: string,
  sales: DailySales[],
  totalAmount: number,
  itemsSummary: Record<string, { quantity: number; unit: string }>,
): jsPDF => {
  const doc = new jsPDF()

  // Header
  doc.setFontSize(20)
  doc.text(title, 105, 20, { align: "center" })

  // Summary
  doc.setFontSize(14)
  doc.text(`Total Sales: BDT.${totalAmount.toFixed(2)}`, 20, 40)

  // Items Summary
  let yPos = 60
  doc.text("Items Sold Summary:", 20, yPos)
  yPos += 10

  Object.entries(itemsSummary).forEach(([item, data]) => {
    doc.setFontSize(12)
    doc.text(`${item}: ${data.quantity} ${data.unit}`, 30, yPos)
    yPos += 8
  })

  // Daily Sales Table
  if (sales.length > 0) {
    const tableData = sales.map((sale) => [sale.date, sale.totalMemos.toString(), sale.totalAmount.toFixed(2)])

    autoTable(doc, {
      startY: yPos + 10,
      head: [["Date", "Total Memos", "Amount"]],
      body: tableData,
      theme: "grid",
    })
  }

  return doc
}
