// src/pages/MedicalRecordsPage.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { 
  DocumentTextIcon,
  HeartIcon,
  BeakerIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  UserIcon,
  BuildingOfficeIcon,
  PlusIcon
} from '@heroicons/react/24/outline'

export default function MedicalRecordsPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [dateRange, setDateRange] = useState('all')
  const [userData, setUserData] = useState(null)

  // Mock medical records data
  const [medicalRecords, setMedicalRecords] = useState({
    overview: {
      totalRecords: 45,
      recentTests: 8,
      prescriptions: 6,
      upcomingAppointments: 2
    },
    consultations: [
      {
        id: 1,
        date: '2024-01-15',
        doctor: 'Dr. Nguyễn Văn Anh',
        specialty: 'Nội khoa',
        diagnosis: 'Viêm đường hô hấp trên',
        symptoms: 'Ho, đau họng, sốt nhẹ',
        treatment: 'Kháng sinh Amoxicillin, nghỉ ngơi',
        status: 'completed'
      },
      {
        id: 2,
        date: '2024-01-08',
        doctor: 'Dr. Trần Thị Mai',
        specialty: 'Tim mạch',
        diagnosis: 'Kiểm tra định kỳ',
        symptoms: 'Không có triệu chứng',
        treatment: 'Duy trì thuốc huyết áp',
        status: 'completed'
      },
      {
        id: 3,
        date: '2024-01-22',
        doctor: 'Dr. Lê Minh Tuấn',
        specialty: 'Da liễu',
        diagnosis: 'Tư vấn về dị ứng da',
        symptoms: 'Ngứa, phát ban',
        treatment: 'Kem bôi, thuốc kháng histamine',
        status: 'scheduled'
      }
    ],
    testResults: [
      {
        id: 1,
        date: '2024-01-12',
        testName: 'Xét nghiệm máu tổng quát',
        type: 'lab',
        status: 'normal',
        results: {
          'Hồng cầu': '4.5 triệu/μL (Bình thường)',
          'Bạch cầu': '7,200/μL (Bình thường)',
          'Hemoglobin': '14.2 g/dL (Bình thường)',
          'Tiểu cầu': '280,000/μL (Bình thường)'
        },
        doctor: 'Dr. Nguyễn Văn Anh'
      },
      {
        id: 2,
        date: '2024-01-05',
        testName: 'Điện tim (ECG)',
        type: 'imaging',
        status: 'normal',
        results: {
          'Nhịp tim': '72 bpm (Bình thường)',
          'Rhythm': 'Sinus rhythm',
          'Kết luận': 'Điện tim bình thường'
        },
        doctor: 'Dr. Trần Thị Mai'
      },
      {
        id: 3,
        date: '2024-01-18',
        testName: 'Chụp X-quang ngực',
        type: 'imaging',
        status: 'attention',
        results: {
          'Phổi': 'Có dấu hiệu viêm nhẹ',
          'Tim': 'Bình thường',
          'Kết luận': 'Cần theo dõi'
        },
        doctor: 'Dr. Nguyễn Văn Anh'
      }
    ],
    prescriptions: [
      {
        id: 1,
        date: '2024-01-15',
        doctor: 'Dr. Nguyễn Văn Anh',
        medications: [
          {
            name: 'Amoxicillin 500mg',
            dosage: '1 viên x 3 lần/ngày',
            duration: '7 ngày',
            instructions: 'Uống sau ăn'
          },
          {
            name: 'Paracetamol 500mg',
            dosage: '1-2 viên khi sốt',
            duration: 'Theo triệu chứng',
            instructions: 'Không quá 8 viên/ngày'
          }
        ],
        status: 'active'
      },
      {
        id: 2,
        date: '2024-01-08',
        doctor: 'Dr. Trần Thị Mai',
        medications: [
          {
            name: 'Losartan 50mg',
            dosage: '1 viên x 1 lần/ngày',
            duration: 'Dài hạn',
            instructions: 'Uống vào buổi sáng'
          }
        ],
        status: 'active'
      }
    ],
    allergies: [
      {
        allergen: 'Penicillin',
        reaction: 'Phát ban, ngứa',
        severity: 'Trung bình',
        dateReported: '2023-06-15'
      },
      {
        allergen: 'Tôm cua',
        reaction: 'Sưng môi, khó thở',
        severity: 'Nghiêm trọng',
        dateReported: '2023-03-20'
      }
    ],
    vitals: [
      {
        date: '2024-01-15',
        bloodPressure: '120/80',
        heartRate: '72',
        temperature: '36.5',
        weight: '70',
        height: '170'
      },
      {
        date: '2024-01-08',
        bloodPressure: '118/78',
        heartRate: '68',
        temperature: '36.7',
        weight: '69.5',
        height: '170'
      }
    ]
  })

  useEffect(() => {
    const userDataStr = localStorage.getItem('user_data')
    if (userDataStr) {
      try {
        setUserData(JSON.parse(userDataStr))
      } catch (error) {
        console.error('Error parsing user data:', error)
      }
    }
    
    // Simulate loading
    setTimeout(() => setLoading(false), 1000)
  }, [])

  const tabs = [
    { id: 'overview', label: 'Tổng quan', icon: ChartBarIcon },
    { id: 'consultations', label: 'Khám bệnh', icon: UserIcon },
    { id: 'tests', label: 'Xét nghiệm', icon: BeakerIcon },
    { id: 'prescriptions', label: 'Đơn thuốc', icon: DocumentTextIcon },
    { id: 'vitals', label: 'Chỉ số sống', icon: HeartIcon },
    { id: 'allergies', label: 'Dị ứng', icon: ExclamationTriangleIcon }
  ]

  const filteredData = () => {
    let data = []
    switch (activeTab) {
      case 'consultations':
        data = medicalRecords.consultations
        break
      case 'tests':
        data = medicalRecords.testResults
        break
      case 'prescriptions':
        data = medicalRecords.prescriptions
        break
      default:
        return []
    }

    if (searchTerm) {
      data = data.filter(item => 
        JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterType !== 'all') {
      data = data.filter(item => item.type === filterType || item.status === filterType)
    }

    return data
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'normal':
        return 'text-green-600 bg-green-100'
      case 'attention':
        return 'text-yellow-600 bg-yellow-100'
      case 'critical':
        return 'text-red-600 bg-red-100'
      case 'active':
        return 'text-blue-600 bg-blue-100'
      case 'completed':
        return 'text-gray-600 bg-gray-100'
      case 'scheduled':
        return 'text-purple-600 bg-purple-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Nghiêm trọng':
        return 'text-red-600 bg-red-100'
      case 'Trung bình':
        return 'text-yellow-600 bg-yellow-100'
      case 'Nhẹ':
        return 'text-green-600 bg-green-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <div className="flex-1 overflow-x-hidden overflow-y-auto">
          <div className="container mx-auto px-6 py-8">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Hồ sơ y tế</h1>
              <p className="text-gray-600">
                Quản lý và theo dõi toàn bộ thông tin y tế của bạn
              </p>
            </div>

            {/* Search and Filter */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm trong hồ sơ y tế..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">Tất cả loại</option>
                <option value="normal">Bình thường</option>
                <option value="attention">Cần chú ý</option>
                <option value="active">Đang diễn ra</option>
                <option value="completed">Hoàn thành</option>
              </select>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8 overflow-x-auto">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center gap-2 ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {tab.label}
                    </button>
                  )
                })}
              </nav>
            </div>

            {/* Content */}
            <div className="space-y-6">
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {/* Stats Cards */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-blue-100">
                        <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Tổng hồ sơ</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {medicalRecords.overview.totalRecords}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-green-100">
                        <BeakerIcon className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Xét nghiệm gần đây</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {medicalRecords.overview.recentTests}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-purple-100">
                        <DocumentTextIcon className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Đơn thuốc</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {medicalRecords.overview.prescriptions}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-yellow-100">
                        <CalendarDaysIcon className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Lịch hẹn</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {medicalRecords.overview.upcomingAppointments}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'consultations' && (
                <div className="space-y-4">
                  {filteredData().map((consultation) => (
                    <div key={consultation.id} className="bg-white rounded-lg shadow p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {consultation.doctor}
                          </h3>
                          <p className="text-sm text-gray-600">{consultation.specialty}</p>
                          <p className="text-sm text-gray-500">{consultation.date}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(consultation.status)}`}>
                          {consultation.status === 'completed' ? 'Hoàn thành' : 
                           consultation.status === 'scheduled' ? 'Đã lên lịch' : consultation.status}
                        </span>
                      </div>
                      
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-700 mb-1">Chẩn đoán</h4>
                          <p className="text-sm text-gray-600">{consultation.diagnosis}</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-700 mb-1">Triệu chứng</h4>
                          <p className="text-sm text-gray-600">{consultation.symptoms}</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-700 mb-1">Điều trị</h4>
                          <p className="text-sm text-gray-600">{consultation.treatment}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'tests' && (
                <div className="space-y-4">
                  {filteredData().map((test) => (
                    <div key={test.id} className="bg-white rounded-lg shadow p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {test.testName}
                          </h3>
                          <p className="text-sm text-gray-600">Bác sĩ: {test.doctor}</p>
                          <p className="text-sm text-gray-500">{test.date}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(test.status)}`}>
                            {test.status === 'normal' ? 'Bình thường' : 
                             test.status === 'attention' ? 'Cần chú ý' : test.status}
                          </span>
                          <button className="p-2 text-gray-400 hover:text-blue-600">
                            <ArrowDownTrayIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        {Object.entries(test.results).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="font-medium text-gray-700">{key}:</span>
                            <span className="text-gray-600">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'prescriptions' && (
                <div className="space-y-4">
                  {filteredData().map((prescription) => (
                    <div key={prescription.id} className="bg-white rounded-lg shadow p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Đơn thuốc từ {prescription.doctor}
                          </h3>
                          <p className="text-sm text-gray-500">{prescription.date}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(prescription.status)}`}>
                          {prescription.status === 'active' ? 'Đang sử dụng' : prescription.status}
                        </span>
                      </div>
                      
                      <div className="space-y-3">
                        {prescription.medications.map((med, index) => (
                          <div key={index} className="border-l-4 border-blue-500 pl-4">
                            <h4 className="font-medium text-gray-900">{med.name}</h4>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Liều dùng:</span> {med.dosage}
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Thời gian:</span> {med.duration}
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Hướng dẫn:</span> {med.instructions}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'vitals' && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Chỉ số sống gần đây</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ngày
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Huyết áp
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Nhịp tim
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Nhiệt độ
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cân nặng
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Chiều cao
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {medicalRecords.vitals.map((vital, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {vital.date}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {vital.bloodPressure} mmHg
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {vital.heartRate} bpm
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {vital.temperature}°C
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {vital.weight} kg
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {vital.height} cm
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'allergies' && (
                <div className="space-y-4">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Thông tin dị ứng</h3>
                    {medicalRecords.allergies.map((allergy, index) => (
                      <div key={index} className="border-l-4 border-red-500 pl-4 mb-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900">{allergy.allergen}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              <span className="font-medium">Phản ứng:</span> {allergy.reaction}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              Báo cáo lần đầu: {allergy.dateReported}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSeverityColor(allergy.severity)}`}>
                            {allergy.severity}
                          </span>
                        </div>
                      </div>
                    ))}
                    
                    <button className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700">
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Thêm dị ứng mới
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
