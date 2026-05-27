'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  HardDrive,
  Image as ImageIcon,
  Database,
  Cloud,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Activity,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface TableInfo {
  name: string
  sizeBytes: number
  rowCount: number
}

interface CreditMetric {
  usage: number
  limit: number
  used_percent: number
}

interface CloudinaryMetric {
  usage: number
  credits_usage: number
  used_percent: number
}

interface QuotaData {
  database: {
    totalSizeBytes: number
    limitSizeBytes: number
    tables: TableInfo[]
  }
  cloudinary: {
    plan?: string
    credits?: CreditMetric | null
    transformations?: CloudinaryMetric | null
    storage?: CloudinaryMetric | null
    bandwidth?: CloudinaryMetric | null
    resources?: number
  } | null
  redis: {
    configured: boolean
    keysCount: number
    status: string
  }
  vercel: {
    liveStatsConfigured: boolean
    hasTokenOnly: boolean
  }
}

// Convert bytes to human-readable format
function formatBytes(bytes: number, decimals = 2): string {
  if (!bytes || bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

// Format number safely
function formatNum(val: number | undefined | null): string {
  if (val === null || val === undefined || isNaN(val)) return '0'
  return val.toLocaleString('id-ID')
}

// Helper to determine color class based on percentage
function getPercentageColor(percent: number): string {
  if (percent >= 90) return 'bg-red-500'
  if (percent >= 70) return 'bg-amber-500'
  return 'bg-emerald-500'
}

function getPercentageTextColor(percent: number): string {
  if (percent >= 90) return 'text-red-600 dark:text-red-400'
  if (percent >= 70) return 'text-amber-600 dark:text-amber-400'
  return 'text-emerald-600 dark:text-emerald-400'
}

export default function QuotaUsagePage() {
  const [data, setData] = useState<QuotaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchQuota = useCallback(async (showNotification = false) => {
    try {
      if (showNotification) setRefreshing(true)
      setError(null)
      const res = await fetch('/api/admin/system/quota')

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`)
      }

      const json = await res.json()
      if (json.success) {
        setData(json)
        if (showNotification) toast.success('Data kuota sistem berhasil diperbarui')
      } else {
        setError(json.error || 'Gagal mengambil data kuota')
        toast.error('Gagal mengambil data kuota')
      }
    } catch (err: any) {
      const msg = err?.message || 'Terjadi kesalahan koneksi'
      setError(msg)
      toast.error('Terjadi kesalahan koneksi saat memuat data kuota')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchQuota()
  }, [fetchQuota])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-8 w-64 bg-gray-200 dark:bg-dark-border rounded" />
          <div className="h-10 w-24 bg-gray-200 dark:bg-dark-border rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-36 bg-gray-200 dark:bg-dark-border rounded-2xl" />
          <div className="h-36 bg-gray-200 dark:bg-dark-border rounded-2xl" />
          <div className="h-36 bg-gray-200 dark:bg-dark-border rounded-2xl" />
        </div>
        <div className="h-96 bg-gray-200 dark:bg-dark-border rounded-2xl" />
      </div>
    )
  }

  // Error state
  if (error && !data) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-brand-text dark:text-dark-text tracking-tight flex items-center gap-2">
              <Activity className="h-6 w-6 text-brand-primary" />
              Kuota & Penggunaan Sistem
            </h1>
          </div>
        </div>
        <div className="bg-white dark:bg-dark-surface rounded-2xl border border-red-200 dark:border-red-900 p-8 text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto" />
          <h2 className="text-lg font-bold text-brand-text dark:text-dark-text">
            Gagal Memuat Data Kuota
          </h2>
          <p className="text-sm text-brand-muted dark:text-dark-muted max-w-md mx-auto">
            {error}
          </p>
          <Button
            onClick={() => fetchQuota(true)}
            disabled={refreshing}
            className="bg-brand-primary hover:bg-brand-accent text-white"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Coba Lagi
          </Button>
        </div>
      </div>
    )
  }

  // Calculate Database usage percent
  const dbUsedBytes = data?.database?.totalSizeBytes || 0
  const dbLimitBytes = data?.database?.limitSizeBytes || 500 * 1024 * 1024
  const dbPercent = dbLimitBytes > 0 ? Math.min(Math.round((dbUsedBytes / dbLimitBytes) * 100), 100) : 0

  // Cloudinary Credit usage details
  const cloudCredits = data?.cloudinary?.credits
  const cloudPercent = cloudCredits?.used_percent ? Math.round(cloudCredits.used_percent) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-text dark:text-dark-text tracking-tight flex items-center gap-2">
            <Activity className="h-6 w-6 text-brand-primary" />
            Kuota & Penggunaan Sistem
          </h1>
          <p className="text-sm text-brand-muted dark:text-dark-muted">
            Pantau sisa penyimpanan, batasan transfer, dan performa infrastruktur server Roxy Store Anda.
          </p>
        </div>
        <Button
          onClick={() => fetchQuota(true)}
          disabled={refreshing}
          variant="outline"
          className="w-full sm:w-auto h-10 border-brand-border/50 dark:border-dark-border bg-white dark:bg-dark-surface shadow-sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Memuat...' : 'Refresh Data'}
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Neon Database Card */}
        <div className="bg-white dark:bg-dark-surface rounded-2xl border border-brand-border/50 dark:border-dark-border p-5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-brand-muted dark:text-dark-muted uppercase tracking-wider">
                Neon Database (Postgres)
              </span>
              <p className="text-2xl font-bold text-brand-text dark:text-dark-text">
                {formatBytes(dbUsedBytes)}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <HardDrive className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-brand-muted dark:text-dark-muted">
                Batas Penggunaan Free Tier
              </span>
              <span className={getPercentageTextColor(dbPercent)}>
                {dbPercent}% ({formatBytes(dbLimitBytes)})
              </span>
            </div>
            <div className="w-full h-2 bg-gray-100 dark:bg-dark-border rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getPercentageColor(dbPercent)}`}
                style={{ width: `${dbPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Cloudinary Card */}
        <div className="bg-white dark:bg-dark-surface rounded-2xl border border-brand-border/50 dark:border-dark-border p-5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-brand-muted dark:text-dark-muted uppercase tracking-wider">
                Cloudinary Credits
              </span>
              <p className="text-2xl font-bold text-brand-text dark:text-dark-text">
                {cloudCredits
                  ? `${formatNum(cloudCredits.usage)} / ${formatNum(cloudCredits.limit)}`
                  : data?.cloudinary ? 'Memuat...' : 'N/A'}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-sky-50 dark:bg-sky-950/20 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <ImageIcon className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-brand-muted dark:text-dark-muted">
                Transformasi, Storage & Bandwidth
              </span>
              <span className={getPercentageTextColor(cloudPercent)}>
                {cloudPercent}% Terpakai
              </span>
            </div>
            <div className="w-full h-2 bg-gray-100 dark:bg-dark-border rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getPercentageColor(cloudPercent)}`}
                style={{ width: `${cloudPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Upstash Redis Card */}
        <div className="bg-white dark:bg-dark-surface rounded-2xl border border-brand-border/50 dark:border-dark-border p-5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-brand-muted dark:text-dark-muted uppercase tracking-wider">
                Upstash Redis Rate Limit
              </span>
              <p className="text-2xl font-bold text-brand-text dark:text-dark-text">
                {data?.redis?.configured ? `${formatNum(data.redis.keysCount)} Keys` : 'Tidak Aktif'}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Database className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <span className="text-xs text-brand-muted dark:text-dark-muted">Status Koneksi Redis</span>
            {data?.redis?.status === 'ACTIVE' ? (
              <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200">
                <CheckCircle className="h-3 w-3 mr-1" /> Aktif (Free)
              </Badge>
            ) : (
              <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200">
                <AlertTriangle className="h-3 w-3 mr-1" /> Non-Aktif
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Main Quota Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Postgres Tables breakdown */}
        <div className="lg:col-span-2 bg-white dark:bg-dark-surface rounded-2xl border border-brand-border/50 dark:border-dark-border shadow-sm overflow-hidden">
          <div className="p-5 border-b border-brand-border/50 dark:border-dark-border">
            <h2 className="font-bold text-base text-brand-text dark:text-dark-text">
              Rincian Penyimpanan Database
            </h2>
            <p className="text-xs text-brand-muted dark:text-dark-muted mt-0.5">
              Detail pemakaian ruang disk dan jumlah baris per tabel database Neon PostgreSQL.
            </p>
          </div>
          <div className="overflow-x-auto">
            {data?.database?.tables && data.database.tables.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/55 dark:bg-dark-bg/20">
                    <TableHead>Nama Tabel</TableHead>
                    <TableHead className="text-right">Jumlah Baris</TableHead>
                    <TableHead className="text-right">Ukuran Fisik</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.database.tables.map((table) => (
                    <TableRow key={table.name} className="hover:bg-gray-50/40 dark:hover:bg-dark-bg/10">
                      <TableCell className="font-semibold text-brand-text dark:text-dark-text">
                        {table.name}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatNum(table.rowCount)} baris
                      </TableCell>
                      <TableCell className="text-right font-semibold text-brand-primary">
                        {formatBytes(table.sizeBytes)}
                      </TableCell>
                      <TableCell className="text-center">
                        {table.rowCount > 50000 ? (
                          <Badge className="bg-amber-50 text-amber-700 border-amber-200">Perlu Pruning</Badge>
                        ) : (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Optimal</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-8 text-center text-sm text-brand-muted dark:text-dark-muted">
                Tidak ada data tabel database yang terdeteksi.
              </div>
            )}
          </div>
        </div>

        {/* Cloudinary Detail Usage */}
        <div className="bg-white dark:bg-dark-surface rounded-2xl border border-brand-border/50 dark:border-dark-border shadow-sm p-5 space-y-6">
          <div>
            <h2 className="font-bold text-base text-brand-text dark:text-dark-text">
              Detail Media Cloudinary
            </h2>
            <p className="text-xs text-brand-muted dark:text-dark-muted mt-0.5">
              Rincian alokasi transformasi, penyimpanan berkas gambar, dan bandwidth.
            </p>
          </div>

          {data?.cloudinary ? (
            <div className="space-y-4">
              {/* Overall Credits Gauge */}
              {data.cloudinary.credits && (
                <div className="space-y-1.5 pb-3 border-b border-brand-border/50 dark:border-dark-border">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-brand-text dark:text-dark-text">
                      Total Kredit ({data.cloudinary.plan || 'Free'})
                    </span>
                    <span className={getPercentageTextColor(data.cloudinary.credits.used_percent)}>
                      {data.cloudinary.credits.usage.toFixed(2)} / {formatNum(data.cloudinary.credits.limit)} credits ({Math.round(data.cloudinary.credits.used_percent)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 dark:bg-dark-border rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getPercentageColor(data.cloudinary.credits.used_percent)}`}
                      style={{ width: `${Math.min(data.cloudinary.credits.used_percent, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Transformations */}
              {data.cloudinary.transformations && (
                <CloudinaryMetricBar
                  label="Transformasi Gambar"
                  metric={data.cloudinary.transformations}
                />
              )}

              {/* Storage */}
              {data.cloudinary.storage && (
                <CloudinaryMetricBar
                  label="Ruang Penyimpanan (Storage)"
                  metric={data.cloudinary.storage}
                  formatAsBytes
                />
              )}

              {/* Bandwidth */}
              {data.cloudinary.bandwidth && (
                <CloudinaryMetricBar
                  label="Bandwidth Gambar"
                  metric={data.cloudinary.bandwidth}
                  formatAsBytes
                />
              )}

              {/* Resources count */}
              {data.cloudinary.resources != null && (
                <div className="flex justify-between items-center text-xs pt-2 border-t border-brand-border/50 dark:border-dark-border">
                  <span className="text-brand-muted dark:text-dark-muted">Jumlah File Gambar Terdaftar</span>
                  <span className="font-bold text-brand-text dark:text-dark-text">
                    {formatNum(data.cloudinary.resources)} file
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-brand-muted dark:text-dark-muted">
              Data Cloudinary tidak tersedia.
            </div>
          )}

          <div className="rounded-xl border border-brand-border/50 dark:border-dark-border bg-gray-50/50 dark:bg-dark-bg/20 p-3 text-xs leading-relaxed text-brand-muted dark:text-dark-muted">
            💡 <strong>Tips Hemat Cloudinary:</strong> Pastikan tidak mengunggah ulang produk yang sudah ada agar hemat kapasitas penyimpanan dan transformasi kredit Cloudinary Anda.
          </div>
        </div>
      </div>

      {/* Vercel Quota Information */}
      <div className="bg-white dark:bg-dark-surface rounded-2xl border border-brand-border/50 dark:border-dark-border shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
          <div className="space-y-1">
            <h2 className="font-bold text-base text-brand-text dark:text-dark-text flex items-center gap-2">
              <Cloud className="h-5 w-5 text-brand-primary" />
              Batas Quota Vercel (Hobby Plan)
            </h2>
            <p className="text-xs text-brand-muted dark:text-dark-muted">
              Vercel membatasi waktu pemrosesan serverless (CPU), origin transfer, dan optimasi gambar.
            </p>
          </div>
          {data?.vercel?.liveStatsConfigured ? (
            <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200">
              <ShieldCheck className="h-3 w-3 mr-1" /> Live Sync Aktif
            </Badge>
          ) : (
            <Badge className="bg-gray-100 text-gray-600 dark:bg-dark-bg/30 dark:text-dark-muted">
              Static Monitoring (Bawaan)
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
          <VercelLimitCard
            title="Edge Requests"
            limit="1M / bulan"
            description="Jumlah request HTTP yang diproses oleh CDN Vercel."
          />
          <VercelLimitCard
            title="Serverless CPU Time"
            limit="4 Jam / bulan"
            description="Waktu aktif pemrosesan serverless function API & dynamic routes."
          />
          <VercelLimitCard
            title="Fast Origin Transfer"
            limit="10 GB / bulan"
            description="Bandwidth transfer data dari database/API ke Edge Network Vercel."
          />
        </div>

        {/* Integration Instructions */}
        {!data?.vercel?.liveStatsConfigured && (
          <div className="mt-4 p-4 rounded-xl border border-brand-border/50 bg-gray-50/50 dark:bg-dark-bg/20 text-xs leading-relaxed text-brand-muted dark:text-dark-muted space-y-2">
            <p className="font-semibold text-brand-text dark:text-dark-text">🔗 Ingin Menghubungkan Statistik Vercel Secara Real-Time?</p>
            <p>
              Anda bisa melihat metrik penggunaan Vercel secara langsung di halaman ini dengan menambahkan variabel lingkungan berikut ke dalam berkas <strong>.env.local</strong> dan dashboard Vercel settings:
            </p>
            <ul className="list-disc list-inside pl-2 space-y-1">
              <li><code>VERCEL_API_TOKEN</code> — Token akses Vercel Anda (buat di Vercel Account Settings → Tokens)</li>
              <li><code>VERCEL_PROJECT_ID</code> — ID Proyek Vercel Anda (ditemukan di project settings)</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

// ==== SUB-COMPONENTS ====

function CloudinaryMetricBar({
  label,
  metric,
  formatAsBytes = false,
}: {
  label: string
  metric: { usage: number; credits_usage: number; used_percent: number }
  formatAsBytes?: boolean
}) {
  const usageStr = formatAsBytes ? formatBytes(metric.usage) : formatNum(metric.usage)
  const creditsStr = metric.credits_usage > 0 ? metric.credits_usage.toFixed(2) : '0'
  const percent = metric.used_percent || 0

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="font-medium text-brand-text dark:text-dark-text">{label}</span>
        <span className="text-brand-muted dark:text-dark-muted">
          {usageStr}
        </span>
      </div>
      <div className="w-full h-1.5 bg-gray-100 dark:bg-dark-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${getPercentageColor(percent)}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-brand-muted/70 dark:text-dark-muted/70">
        <span>Kredit terpakai: {creditsStr} credits</span>
        <span className={getPercentageTextColor(percent)}>{percent}% dari total</span>
      </div>
    </div>
  )
}

function VercelLimitCard({
  title,
  limit,
  description,
}: {
  title: string
  limit: string
  description: string
}) {
  return (
    <div className="bg-gray-50/40 dark:bg-dark-bg/10 rounded-xl p-4 border border-brand-border/20 dark:border-dark-border/40">
      <span className="text-[11px] font-semibold text-brand-muted dark:text-dark-muted uppercase tracking-wider">
        {title}
      </span>
      <p className="text-lg font-bold text-brand-text dark:text-dark-text mt-1">
        Limit: {limit}
      </p>
      <p className="text-xs text-brand-muted dark:text-dark-muted mt-2">
        {description}
      </p>
    </div>
  )
}
