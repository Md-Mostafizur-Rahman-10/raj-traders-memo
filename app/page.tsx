"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import MemoForm from "@/components/memo-form"
import SalesSummary from "@/components/sales-summary"
import CustomerHistory from "@/components/customer-history"

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-center mb-8">RAJ TRADERS</h1>

        <Tabs defaultValue="memo" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="memo">Create Memo</TabsTrigger>
            <TabsTrigger value="sales">Sales Summary</TabsTrigger>
            <TabsTrigger value="history">Customer History</TabsTrigger>
          </TabsList>

          <TabsContent value="memo">
            <MemoForm />
          </TabsContent>

          <TabsContent value="sales">
            <SalesSummary />
          </TabsContent>

          <TabsContent value="history">
            <CustomerHistory />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

