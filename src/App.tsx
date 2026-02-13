import { useState, useMemo, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { AppHeader } from "@/components/app-header"
import { DashboardHeader } from "@/components/dashboard-header" 
import { DashboardStats } from "@/components/dashboard-stats" 
import { DashboardCharts } from "@/components/dashboard-charts" 
import { DashboardInvoiceTable } from "@/components/dashboard-invoice-table"
import type { DateRange } from "react-day-picker"
import { startOfMonth, endOfMonth, subMonths, startOfYear, isWithinInterval, startOfDay, endOfDay, startOfWeek, endOfWeek } from "date-fns"

export default function App() {
  const [period, setPeriod] = useState("Today")
  // Default to this month
  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfDay(new Date()),
    to: endOfDay(new Date()),
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        setLoading(true)
        const mod = await import("@/lib/data")
        const items = await mod.loadInvoices()
        if (mounted) setInvoices(items ?? [])
      } catch (err) {
        console.error("Failed to load invoices:", err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    const today = new Date()
    if (period === "Today") {
      setDate({ from: startOfDay(today), to: endOfDay(today) })
    } else if (period === "This-week") {
      setDate({ from: startOfWeek(today), to: endOfWeek(today) })
    } else if (period === "This-month") {
      setDate({ from: startOfMonth(today), to: endOfMonth(today) })
    } else if (period === "Last-month") {
      const lastMonth = subMonths(today, 1)
      setDate({ from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) })
    } else if (period === "This-year") {
      setDate({ from: startOfYear(today), to: endOfDay(today) })
    }
  }, [period])

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesSearch =
  searchQuery === "" ||
  Object.values(invoice).some((value) =>
    typeof value === "string"&&
    value.toLowerCase().includes(searchQuery.toLowerCase())
  )

      let matchesDate = true
      if (date?.from && date?.to) {
        const processedDate = new Date(invoice.processedDate)
        matchesDate = isWithinInterval(processedDate, { start: date.from, end: date.to })
      }
      const matchesStatus = !statusFilter || invoice.status === statusFilter
      
      return matchesSearch && matchesDate && matchesStatus
    })
  }, [invoices, searchQuery, date, statusFilter])


  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="overflow-x-hidden">
        <AppHeader searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        {loading ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center text-muted-foreground">Loading invoices…</div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col gap-4 p-4">
            <DashboardHeader 
              period={period} 
              setPeriod={setPeriod} 
              date={date} 
              setDate={setDate} 
            />
            <DashboardStats data={filteredInvoices} onFilterStatus={setStatusFilter} activeStatus={statusFilter} />
            <DashboardCharts data={filteredInvoices} />
            <DashboardInvoiceTable data={filteredInvoices} />
          </div>
        )}
      </SidebarInset>
    </SidebarProvider>
  )
}
