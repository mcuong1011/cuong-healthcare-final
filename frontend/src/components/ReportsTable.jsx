// src/components/ReportsTable.jsx
import React, { useState, useEffect } from 'react'
import { 
  DocumentTextIcon,
  BeakerIcon,
  HeartIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'

const mockReports = [
  {
    id: 1,
    type: 'Lab Report',
    testName: 'Complete Blood Count',
    referredBy: 'Dr. Sarah Wilson',
    date: '2024-01-28',
    status: 'Normal',
    comments: 'All values within normal range',
    priority: 'Normal',
    category: 'blood'
  },
  {
    id: 2,
    type: 'Lab Report',
    testName: 'Lipid Panel',
    referredBy: 'Dr. Michael Chen',
    date: '2024-01-27',
    status: 'Abnormal',
    comments: 'Elevated cholesterol levels',
    priority: 'High',
    category: 'blood'
  },
  {
    id: 3,
    type: 'Imaging',
    testName: 'Chest X-Ray',
    referredBy: 'Dr. Emily Rodriguez',
    date: '2024-01-26',
    status: 'Normal',
    comments: 'Clear lung fields',
    priority: 'Normal',
    category: 'imaging'
  },
  {
    id: 4,
    type: 'Cardiology',
    testName: 'ECG',
    referredBy: 'Dr. James Parker',
    date: '2024-01-25',
    status: 'Normal',
    comments: 'Regular rhythm',
    priority: 'Normal',
    category: 'cardiology'
  }
]

export default function ReportsTable() {
  const [activeTab, setActiveTab] = useState('all')
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('date')

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setReports(mockReports)
      setLoading(false)
    }, 500)
  }, [])

  const tabs = [
    { key: 'all', label: 'All Reports', icon: DocumentTextIcon, count: reports.length },
    { key: 'blood', label: 'Lab Reports', icon: BeakerIcon, count: reports.filter(r => r.category === 'blood').length },
    { key: 'imaging', label: 'Imaging', icon: EyeIcon, count: reports.filter(r => r.category === 'imaging').length },
    { key: 'cardiology', label: 'Cardiology', icon: HeartIcon, count: reports.filter(r => r.category === 'cardiology').length }
  ]

  const filteredReports = reports
    .filter(report => 
      (activeTab === 'all' || report.category === activeTab) &&
      (searchTerm === '' || 
       report.testName.toLowerCase().includes(searchTerm.toLowerCase()) ||
       report.referredBy.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.date) - new Date(a.date)
        case 'name':
          return a.testName.localeCompare(b.testName)
        case 'priority':
          const priorityOrder = { 'High': 3, 'Medium': 2, 'Normal': 1 }
          return priorityOrder[b.priority] - priorityOrder[a.priority]
        default:
          return 0
      }
    })

  const getStatusConfig = (status) => {
    switch (status.toLowerCase()) {
      case 'normal':
        return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' }
      case 'abnormal':
        return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' }
      case 'pending':
        return { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' }
      default:
        return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' }
    }
  }

  const getPriorityConfig = (priority) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' }
      case 'medium':
        return { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' }
      default:
        return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' }
    }
  }

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 animate-pulse">
        <div className="flex space-x-2 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded-lg w-24"></div>
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
            <DocumentTextIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Medical Reports</h3>
            <p className="text-sm text-gray-500">{filteredReports.length} reports available</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-3">
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="date">Sort by Date</option>
            <option value="name">Sort by Name</option>
            <option value="priority">Sort by Priority</option>
          </select>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search reports..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-50 p-1 rounded-lg overflow-x-auto">
        {tabs.map((tab) => {
          const TabIcon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-white text-blue-700 shadow-sm border border-blue-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <TabIcon className="h-4 w-4" />
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                activeTab === tab.key ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
              }`}>
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="text-center py-8">
          <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h4 className="text-lg font-medium text-gray-900 mb-1">No reports found</h4>
          <p className="text-gray-500">
            {searchTerm ? `No reports match "${searchTerm}"` : 'No reports available in this category'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report) => {
            const statusConfig = getStatusConfig(report.status)
            const priorityConfig = getPriorityConfig(report.priority)

            return (
              <div 
                key={report.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 truncate">{report.testName}</h4>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${priorityConfig.bg} ${priorityConfig.text} ${priorityConfig.border}`}>
                        {report.priority}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                        {report.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Referred by:</span> {report.referredBy}
                    </div>
                    <div>
                      <span className="font-medium">Date:</span> {new Date(report.date).toLocaleDateString()}
                    </div>
                    <div className="truncate">
                      <span className="font-medium">Comments:</span> {report.comments}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                    <ArrowDownTrayIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })}

          {/* Load More Button */}
          <button className="w-full mt-4 py-3 text-center text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors duration-200 font-medium">
            Load More Reports
          </button>
        </div>
      )}
    </div>
  )
}
  