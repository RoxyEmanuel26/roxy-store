'use client'

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts'

interface AnalyticsLineChartProps {
    data: any[]
}

export function AnalyticsLineChart({ data }: AnalyticsLineChartProps) {
    const transformData = (rawData: any[]) => {
        // Group by date
        const grouped = rawData.reduce((acc, row) => {
            const date = new Date(row.date).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
            })
            if (!acc[date]) acc[date] = { date }
            acc[date][row.eventType] = Number(row.count)
            return acc
        }, {} as Record<string, any>)

        return Object.values(grouped)
    }

    const chartData = transformData(data)

    return (
        <div className="bg-white dark:bg-dark-surface rounded-2xl p-6 shadow-sm border border-brand-border mt-8">
            <h3 className="font-bold text-lg mb-6">Aktivitas Hari Ini / Terakhir</h3>

            <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#FFD6E7" />
                        <XAxis dataKey="date" tick={{ fill: '#6B6B8A', fontSize: 12 }} />
                        <YAxis tick={{ fill: '#6B6B8A', fontSize: 12 }} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #FFD6E7',
                                borderRadius: '12px',
                            }}
                        />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="view"
                            name="Views"
                            stroke="#FF6B9D"
                            strokeWidth={2}
                            dot={{ fill: '#FF6B9D', r: 4 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="shopee_click"
                            name="Klik Shopee"
                            stroke="#EE4D2D"
                            strokeWidth={2}
                            dot={{ fill: '#EE4D2D', r: 4 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="tokopedia_click"
                            name="Klik Tokopedia"
                            stroke="#42B549"
                            strokeWidth={2}
                            dot={{ fill: '#42B549', r: 4 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="wa_click"
                            name="Klik WA"
                            stroke="#25D366"
                            strokeWidth={2}
                            dot={{ fill: '#25D366', r: 4 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
