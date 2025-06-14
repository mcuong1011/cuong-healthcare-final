// src/components/PerformanceCard.jsx
import React, { useState, useEffect } from 'react'
import { RadialBarChart, RadialBar, ResponsiveContainer, Cell } from 'recharts'
import { ArrowTrendingUpIcon, EyeIcon } from '@heroicons/react/24/outline'

export default function PerformanceCard() {
  const [performance, setPerformance] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading and animated counter
    const timer = setTimeout(() => {
      setIsLoading(false)
      let current = 0
      const target = 85
      const increment = target / 30
      const counter = setInterval(() => {
        current += increment
        if (current >= target) {
          current = target
          clearInterval(counter)
        }
        setPerformance(Math.round(current))
      }, 50)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  const data = [
    { name: 'Performance', value: performance, fill: '#3B82F6' },
    { name: 'Remaining', value: 100 - performance, fill: '#E5E7EB' }
  ]

  const getPerformanceLevel = (value) => {
    if (value >= 90) return { label: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-50' }
    if (value >= 75) return { label: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-50' }
    if (value >= 60) return { label: 'Average', color: 'text-yellow-600', bgColor: 'bg-yellow-50' }
    return { label: 'Needs Improvement', color: 'text-red-600', bgColor: 'bg-red-50' }
  }

  const level = getPerformanceLevel(performance)

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 animate-pulse">
        <div className="h-6 bg-gray-200 rounded mb-4 w-3/4"></div>
        <div className="flex items-center justify-center h-40">
          <div className="w-32 h-32 bg-gray-200 rounded-full"></div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Overall Performance</h3>
        <div className="flex items-center space-x-2">
          <ArrowTrendingUpIcon className="h-5 w-5 text-green-500" />
          <span className="text-sm font-medium text-green-600">+12.5%</span>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="relative mb-6">
        <ResponsiveContainer width="100%" height={200}>
          <RadialBarChart 
            cx="50%" 
            cy="50%" 
            innerRadius="60%" 
            outerRadius="90%" 
            data={data} 
            startAngle={90} 
            endAngle={450}
          >
            <RadialBar 
              dataKey="value" 
              cornerRadius={10}
              className="drop-shadow-sm"
            />
          </RadialBarChart>
        </ResponsiveContainer>
        
        {/* Center Content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {performance}%
            </div>
            <div className={`text-sm font-medium px-2 py-1 rounded-full ${level.bgColor} ${level.color}`}>
              {level.label}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-xl font-bold text-gray-900">847</div>
          <div className="text-xs text-gray-500">Total Patients</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-blue-600">98.2%</div>
          <div className="text-xs text-gray-500">Success Rate</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-green-600">24</div>
          <div className="text-xs text-gray-500">This Week</div>
        </div>
      </div>

      {/* Action Button */}
      <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2 group">
        <EyeIcon className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
        <span>View Detailed Report</span>
      </button>
    </div>
  )
}
