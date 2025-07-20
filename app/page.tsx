"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import MemoForm from "@/components/memo-form"
import SalesSummary from "@/components/sales-summary"
import CustomerHistory from "@/components/customer-history"
import Header from "@/components/header"
import ProtectedRoute from "@/components/protected-route"

export default function Home() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto py-8">
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
    </ProtectedRoute>
  )
}
