import { AppNavbar } from "@/components/app-navbar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { CodeAnalyzer } from "@/components/code-analyzer"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"

import data from "./data.json"

export default function Page() {
  return (
    <div className="min-h-screen">
      <AppNavbar />
      <main className="flex-1 space-y-4 p-4 md:p-8 pt-20">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <SectionCards />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <div className="col-span-4">
            <ChartAreaInteractive />
          </div>
          <div className="col-span-3">
            <DataTable data={data} />
          </div>
        </div>
        <div className="grid gap-4">
          <CodeAnalyzer />
        </div>
      </main>
    </div>
  )
}
