'use client'

import { useMemo, useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { Activity, ActivityStatus, Dimension, TimeHorizon } from '@/types'
import { Download } from 'lucide-react'

const STATUS_COLORS: Record<ActivityStatus, string> = {
  not_started: '#94a3b8',
  in_progress: '#3b82f6',
  on_track: '#22c55e',
  at_risk: '#f59e0b',
  blocked: '#ef4444',
  complete: '#14b8a6',
}

interface Props {
  dimensions: Dimension[]
  timeHorizons: TimeHorizon[]
  activities: Activity[]
}

export default function ReportsDashboard({ dimensions, timeHorizons, activities }: Props) {
  const [statusFilter, setStatusFilter] = useState<ActivityStatus | 'all'>('all')
  const [dimFilter, setDimFilter] = useState<string>('all')

  const filtered = useMemo(
    () =>
      activities.filter(
        (a) =>
          (statusFilter === 'all' || a.status === statusFilter) &&
          (dimFilter === 'all' || a.dimension_id === dimFilter)
      ),
    [activities, statusFilter, dimFilter]
  )

  // Donut chart data per dimension
  const donutData = dimensions.map((d) => {
    const dimActivities = filtered.filter((a) => a.dimension_id === d.id)
    return {
      name: d.name,
      value: dimActivities.length,
      fill: d.color ?? '#94a3b8',
    }
  })

  // Bar chart: activities per time horizon
  const barData = timeHorizons.map((h) => {
    const horizActivities = filtered.filter((a) => a.time_horizon_id === h.id)
    const byStatus = horizActivities.reduce(
      (acc, a) => {
        acc[a.status] = (acc[a.status] ?? 0) + 1
        return acc
      },
      {} as Record<string, number>
    )
    return { name: h.label, ...byStatus }
  })

  function exportCSV() {
    const cols = ['title', 'description', 'status', 'progress_pct', 'owner_name', 'due_date', 'dimension', 'horizon', 'ai_suggested', 'created_at']
    const rows = filtered.map((a) => {
      const dim = dimensions.find((d) => d.id === a.dimension_id)?.name ?? ''
      const horiz = timeHorizons.find((h) => h.id === a.time_horizon_id)?.label ?? ''
      return [
        a.title,
        a.description ?? '',
        a.status,
        String(a.progress_pct),
        a.owner_name ?? '',
        a.due_date ?? '',
        dim,
        horiz,
        String(a.ai_suggested),
        a.created_at,
      ]
        .map((v) => `"${v.replace(/"/g, '""')}"`)
        .join(',')
    })
    const csv = [cols.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ai-transformation-export.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function exportPDF() {
    const { pdf } = await import('@react-pdf/renderer')
    const { createElement: h } = await import('react')
    const { Document, Page, Text, View, StyleSheet } = await import('@react-pdf/renderer')

    const styles = StyleSheet.create({
      page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10 },
      title: { fontSize: 18, marginBottom: 16, fontFamily: 'Helvetica-Bold' },
      row: { flexDirection: 'row', borderBottom: '1pt solid #e5e7eb', paddingVertical: 4 },
      cell: { flex: 1, paddingRight: 6 },
      header: { fontFamily: 'Helvetica-Bold', marginBottom: 4 },
    })

    const doc = h(
      Document,
      null,
      h(
        Page,
        { size: 'A4', style: styles.page },
        h(Text, { style: styles.title }, 'AI Transformation Planner — Export'),
        h(Text, { style: { marginBottom: 12, color: '#6b7280' } }, `${filtered.length} activities`),
        h(
          View,
          { style: { ...styles.row, backgroundColor: '#f9fafb' } },
          h(Text, { style: { ...styles.cell, ...styles.header } }, 'Title'),
          h(Text, { style: { ...styles.cell, ...styles.header } }, 'Status'),
          h(Text, { style: { ...styles.cell, ...styles.header } }, 'Dimension'),
          h(Text, { style: { ...styles.cell, ...styles.header } }, 'Horizon')
        ),
        ...filtered.map((a) =>
          h(
            View,
            { key: a.id, style: styles.row },
            h(Text, { style: styles.cell }, a.title),
            h(Text, { style: styles.cell }, a.status),
            h(
              Text,
              { style: styles.cell },
              dimensions.find((d) => d.id === a.dimension_id)?.name ?? ''
            ),
            h(
              Text,
              { style: styles.cell },
              timeHorizons.find((h) => h.id === a.time_horizon_id)?.label ?? ''
            )
          )
        )
      )
    )

    const blob = await pdf(doc).toBlob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'ai-transformation-planner.pdf'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Download className="h-4 w-4" /> CSV
          </button>
          <button
            onClick={exportPDF}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Download className="h-4 w-4" /> PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ActivityStatus | 'all')}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          {(Object.keys(STATUS_COLORS) as ActivityStatus[]).map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
        <select
          value={dimFilter}
          onChange={(e) => setDimFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="all">All dimensions</option>
          {dimensions.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <span className="flex items-center text-sm text-gray-500">
          {filtered.length} activities
        </span>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Donut chart */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Activities by Dimension</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90}>
                {donutData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar chart */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Activities by Time Horizon</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              {(Object.keys(STATUS_COLORS) as ActivityStatus[]).map((s) => (
                <Bar key={s} dataKey={s} stackId="a" fill={STATUS_COLORS[s]} name={s.replace('_', ' ')} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Activity table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Title</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Dimension</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Horizon</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Progress</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((a) => (
              <tr key={a.id}>
                <td className="px-4 py-3">{a.title}</td>
                <td className="px-4 py-3">
                  <span
                    className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{ backgroundColor: STATUS_COLORS[a.status] + '22', color: STATUS_COLORS[a.status] }}
                  >
                    {a.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {dimensions.find((d) => d.id === a.dimension_id)?.name ?? '—'}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {timeHorizons.find((h) => h.id === a.time_horizon_id)?.label ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 rounded-full bg-gray-200">
                      <div
                        className="h-1.5 rounded-full bg-blue-500"
                        style={{ width: `${a.progress_pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{a.progress_pct}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
