// src/components/AnalyticsCard.jsx
import React, { useState, useEffect } from 'react'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line
} from 'recharts'
import { ChartBarIcon, ArrowTrendingUpIcon, CalendarIcon } from '@heroicons/react/24/outline'

const weeklyData = [
  { day: 'Mon', appointments: 12, revenue: 2400, patients: 8 },
  { day: 'Tue', appointments: 19, revenue: 3800, patients: 15 },
  { day: 'Wed', appointments: 8, revenue: 1600, patients: 6 },
  { day: 'Thu', appointments: 25, revenue: 5000, patients: 20 },
  { day: 'Fri', appointments: 22, revenue: 4400, patients: 18 },
  { day: 'Sat', appointments: 15, revenue: 3000, patients: 12 },
  { day: 'Sun', appointments: 6, revenue: 1200, patients: 4 }
]

const monthlyData = [
  { month: 'Jan', appointments: 240, revenue: 48000, patients: 180 },
  { month: 'Feb', appointments: 280, revenue: 56000, patients: 210 },
  { month: 'Mar', appointments: 320, revenue: 64000, patients: 240 },
  { month: 'Apr', appointments: 300, revenue: 60000, patients: 220 },
  { month: 'May', appointments: 380, revenue: 76000, patients: 290 },
  { month: 'Jun', appointments: 420, revenue: 84000, patients: 320 }
]

export default function AnalyticsCard() {
  const [timeframe, setTimeframe] = useState('weekly')
  const [metric, setMetric] = useState('appointments')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300)
    return () => clearTimeout(timer)
  }, [timeframe, metric])

  const currentData = timeframe === 'weekly' ? weeklyData : monthlyData
  const xAxisKey = timeframe === 'weekly' ? 'day' : 'month'

  const getMetricConfig = () => {
    switch (metric) {
      case 'appointments':
        return {
          label: 'Appointments',
          color: '#3B82F6',
          value: currentData.reduce((sum, item) => sum + item.appointments, 0),
          change: '+18%'
        }
      case 'revenue':
        return {
          label: 'Revenue',
          color: '#10B981',
          value: `$${(currentData.reduce((sum, item) => sum + item.revenue, 0) / 1000).toFixed(1)}k`,
          change: '+24%'
        }
      case 'patients':
        return {
          label: 'Patients',
          color: '#8B5CF6',
          value: currentData.reduce((sum, item) => sum + item.patients, 0),
          change: '+12%'
        }
      default:
        return {
          label: 'Appointments',
          color: '#3B82F6',
          value: currentData.reduce((sum, item) => sum + item.appointments, 0),
          change: '+18%'
        }
    }
  }

  const metricConfig = getMetricConfig()

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{label}</p>
          <p className="text-sm" style={{ color: metricConfig.color }}>
            {metricConfig.label}: {payload[0].value}
          </p>
        </div>
      )
    }
    return null
  }

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 animate-pulse">
        <div className="flex justify-between items-center mb-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-8 bg-gray-200 rounded w-24"></div>
        </div>
        <div className="h-48 bg-gray-200 rounded"></div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
            <ChartBarIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Analytics</h3>
            <p className="text-sm text-gray-500">Performance insights</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <select 
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>

      {/* Metric Selector */}
      <div className="flex space-x-2 mb-4">
        {[
          { key: 'appointments', label: 'Appointments', icon: CalendarIcon },
          { key: 'revenue', label: 'Revenue', icon: ArrowTrendingUpIcon },
          { key: 'patients', label: 'Patients', icon: ChartBarIcon }
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setMetric(item.key)}
            className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              metric === item.key
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Metric Summary */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-2xl font-bold text-gray-900">{metricConfig.value}</div>
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-green-600 font-medium">{metricConfig.change}</span>
            <span className="text-gray-500">vs last {timeframe.slice(0, -2)}</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={currentData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={metricConfig.color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={metricConfig.color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey={xAxisKey} 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6B7280' }}
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey={metric}
              stroke={metricConfig.color}
              strokeWidth={3}
              fill="url(#colorGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
