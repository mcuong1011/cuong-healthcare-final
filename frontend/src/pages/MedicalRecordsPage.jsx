// src/pages/MedicalRecordsPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import {
  DocumentTextIcon,
  HeartIcon,
  BeakerIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  UserIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

export default function MedicalRecordsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  // Mock medical records data
  const [medicalRecords] = useState({
    overview: {
      totalRecords: 5,
      recentTests: 1,
      prescriptions: 3,
      upcomingAppointments: 1,
    },
    allRecords: [
      {
        id: 1,
        type: "consultation",
        date: "2024-01-22",
        title: "Tư vấn về dị ứng da",
        doctor: "Dr. Jame New",
        specialty: "Da liễu",
        status: "scheduled",
        details: {
          diagnosis: "Tư vấn về dị ứng da",
          symptoms: "Ngứa, phát ban",
          treatment: "Kem bôi, thuốc kháng histamine",
        },
      },
      {
        id: 2,
        type: "test",
        date: "2024-01-18",
        title: "Chụp X-quang ngực",
        doctor: "Dr. James New",
        status: "attention",
        details: {
          results: {
            Phổi: "Có dấu hiệu viêm nhẹ",
            Tim: "Bình thường",
            "Kết luận": "Cần theo dõi",
          },
        },
      },
      {
        id: 3,
        type: "prescription",
        date: "2024-01-15",
        title: "Đơn thuốc điều trị viêm đường hô hấp",
        doctor: "Dr. John Doe",
        status: "active",
        details: {
          medications: [
            {
              name: "Amoxicillin 500mg",
              dosage: "1 viên x 3 lần/ngày",
              duration: "7 ngày",
              instructions: "Uống sau ăn",
            },
            {
              name: "Paracetamol 500mg",
              dosage: "1-2 viên khi sốt",
              duration: "Theo triệu chứng",
              instructions: "Không quá 8 viên/ngày",
            },
          ],
        },
      },
      {
        id: 4,
        type: "consultation",
        date: "2024-01-15",
        title: "Viêm đường hô hấp trên",
        doctor: "Dr. John Doe",
        specialty: "Nội khoa",
        status: "completed",
        details: {
          diagnosis: "Viêm đường hô hấp trên",
          symptoms: "Ho, đau họng, sốt nhẹ",
          treatment: "Kháng sinh Amoxicillin, nghỉ ngơi",
        },
      },
      {
        id: 5,
        type: "test",
        date: "2024-01-12",
        title: "Xét nghiệm máu tổng quát",
        doctor: "Dr. John Doe",
        status: "normal",
        details: {
          results: {
            "Hồng cầu": "4.5 triệu/μL (Bình thường)",
            "Bạch cầu": "7,200/μL (Bình thường)",
            Hemoglobin: "14.2 g/dL (Bình thường)",
            "Tiểu cầu": "280,000/μL (Bình thường)",
          },
        },
      },
      {
        id: 6,
        type: "consultation",
        date: "2024-01-08",
        title: "Kiểm tra định kỳ",
        doctor: "Dr. Sam Jones",
        specialty: "Tim mạch",
        status: "completed",
        details: {
          diagnosis: "Kiểm tra định kỳ",
          symptoms: "Không có triệu chứng",
          treatment: "Duy trì thuốc huyết áp",
        },
      },
      {
        id: 7,
        type: "prescription",
        date: "2024-01-08",
        title: "Đơn thuốc huyết áp",
        doctor: "Dr. Sam Jones",
        status: "active",
        details: {
          medications: [
            {
              name: "Losartan 50mg",
              dosage: "1 viên x 1 lần/ngày",
              duration: "Dài hạn",
              instructions: "Uống vào buổi sáng",
            },
          ],
        },
      },
      {
        id: 8,
        type: "test",
        date: "2024-01-05",
        title: "Điện tim (ECG)",
        doctor: "Dr. Sam Jones",
        status: "normal",
        details: {
          results: {
            "Nhịp tim": "72 bpm (Bình thường)",
            Rhythm: "Sinus rhythm",
            "Kết luận": "Điện tim bình thường",
          },
        },
      },
    ],
  });

  useEffect(() => {
    const userDataStr = localStorage.getItem("user_data");
    if (userDataStr) {
      try {
        setUserData(JSON.parse(userDataStr));
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }

    // Simulate loading
    setTimeout(() => setLoading(false), 800);
  }, []);

  const getTypeIcon = (type) => {
    switch (type) {
      case "consultation":
        return { icon: UserIcon, color: "text-blue-600", bg: "bg-blue-100" };
      case "test":
        return {
          icon: BeakerIcon,
          color: "text-green-600",
          bg: "bg-green-100",
        };
      case "prescription":
        return {
          icon: DocumentTextIcon,
          color: "text-purple-600",
          bg: "bg-purple-100",
        };
      default:
        return {
          icon: DocumentTextIcon,
          color: "text-gray-600",
          bg: "bg-gray-100",
        };
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "normal":
        return "text-green-600 bg-green-100 border-green-200";
      case "attention":
        return "text-yellow-600 bg-yellow-100 border-yellow-200";
      case "critical":
        return "text-red-600 bg-red-100 border-red-200";
      case "active":
        return "text-blue-600 bg-blue-100 border-blue-200";
      case "completed":
        return "text-gray-600 bg-gray-100 border-gray-200";
      case "scheduled":
        return "text-purple-600 bg-purple-100 border-purple-200";
      default:
        return "text-gray-600 bg-gray-100 border-gray-200";
    }
  };

  const getStatusLabel = (status, type) => {
    if (type === "test") {
      switch (status) {
        case "normal":
          return "Bình thường";
        case "attention":
          return "Cần chú ý";
        case "critical":
          return "Nghiêm trọng";
        default:
          return status;
      }
    }

    switch (status) {
      case "active":
        return "Đang sử dụng";
      case "completed":
        return "Hoàn thành";
      case "scheduled":
        return "Đã lên lịch";
      default:
        return status;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

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
    );
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Medical Records
              </h1>
              <p className="text-gray-600">
                Your complete medical history and health information
              </p>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="p-3 rounded-xl bg-blue-100">
                    <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Total Records
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {medicalRecords.overview.totalRecords}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="p-3 rounded-xl bg-green-100">
                    <BeakerIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Recent Tests
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {medicalRecords.overview.recentTests}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="p-3 rounded-xl bg-purple-100">
                    <DocumentTextIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Prescriptions
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {medicalRecords.overview.prescriptions}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="p-3 rounded-xl bg-yellow-100">
                    <CalendarDaysIcon className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Upcoming
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {medicalRecords.overview.upcomingAppointments}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Medical Records Timeline */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Medical History
                </h2>
                <p className="text-gray-600 mt-1">
                  Chronological view of your medical records
                </p>
              </div>

              <div className="p-6">
                <div className="space-y-6">
                  {medicalRecords.allRecords.map((record, index) => {
                    const typeConfig = getTypeIcon(record.type);
                    const Icon = typeConfig.icon;

                    return (
                      <div key={record.id} className="relative">
                        {/* Timeline line */}
                        {index !== medicalRecords.allRecords.length - 1 && (
                          <div className="absolute left-6 top-12 w-0.5 h-full bg-gray-200"></div>
                        )}

                        <div className="flex items-start space-x-4">
                          {/* Icon */}
                          <div
                            className={`flex-shrink-0 w-12 h-12 ${typeConfig.bg} rounded-full flex items-center justify-center relative z-10`}
                          >
                            <Icon className={`h-6 w-6 ${typeConfig.color}`} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {record.title}
                                </h3>
                                <div className="flex items-center space-x-4 mt-1">
                                  <span className="text-sm text-gray-600 flex items-center">
                                    <ClockIcon className="h-4 w-4 mr-1" />
                                    {formatDate(record.date)}
                                  </span>
                                  <span className="text-sm text-gray-600">
                                    {record.doctor}
                                  </span>
                                  {record.specialty && (
                                    <span className="text-sm text-gray-500">
                                      • {record.specialty}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center space-x-2">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                    record.status
                                  )}`}
                                >
                                  {getStatusLabel(record.status, record.type)}
                                </span>
                                {record.type === "test" && (
                                  <button className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-white">
                                    <ArrowDownTrayIcon className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Record Details */}
                            <div className="space-y-3">
                              {record.type === "consultation" && (
                                <div className="grid md:grid-cols-3 gap-4">
                                  <div>
                                    <h4 className="font-medium text-gray-700 text-sm">
                                      Diagnosis
                                    </h4>
                                    <p className="text-sm text-gray-600 mt-1">
                                      {record.details.diagnosis}
                                    </p>
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-gray-700 text-sm">
                                      Symptoms
                                    </h4>
                                    <p className="text-sm text-gray-600 mt-1">
                                      {record.details.symptoms}
                                    </p>
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-gray-700 text-sm">
                                      Treatment
                                    </h4>
                                    <p className="text-sm text-gray-600 mt-1">
                                      {record.details.treatment}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {record.type === "test" && (
                                <div className="grid md:grid-cols-2 gap-4">
                                  {Object.entries(record.details.results).map(
                                    ([key, value]) => (
                                      <div
                                        key={key}
                                        className="flex justify-between"
                                      >
                                        <span className="font-medium text-gray-700 text-sm">
                                          {key}:
                                        </span>
                                        <span className="text-gray-600 text-sm">
                                          {value}
                                        </span>
                                      </div>
                                    )
                                  )}
                                </div>
                              )}

                              {record.type === "prescription" && (
                                <div className="space-y-3">
                                  {record.details.medications.map(
                                    (med, medIndex) => (
                                      <div
                                        key={medIndex}
                                        className="border-l-4 border-purple-400 pl-4"
                                      >
                                        <h4 className="font-medium text-gray-900 text-sm">
                                          {med.name}
                                        </h4>
                                        <div className="grid md:grid-cols-3 gap-2 mt-1">
                                          <p className="text-xs text-gray-600">
                                            <span className="font-medium">
                                              Dosage:
                                            </span>{" "}
                                            {med.dosage}
                                          </p>
                                          <p className="text-xs text-gray-600">
                                            <span className="font-medium">
                                              Duration:
                                            </span>{" "}
                                            {med.duration}
                                          </p>
                                          <p className="text-xs text-gray-600">
                                            <span className="font-medium">
                                              Instructions:
                                            </span>{" "}
                                            {med.instructions}
                                          </p>
                                        </div>
                                      </div>
                                    )
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
