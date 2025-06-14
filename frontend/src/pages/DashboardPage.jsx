// src/pages/DashboardPage.jsx
import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import ReportsTable from "../components/ReportsTable";
import Appointments from "../components/Appointments";
import {
  CalendarDaysIcon,
  ClockIcon,
  HeartIcon,
} from "@heroicons/react/24/outline";

export default function DashboardPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userData, setUserData] = useState(null);
  const [userRole, setUserRole] = useState("PATIENT");

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    // Get user data from localStorage
    const userDataStr = localStorage.getItem("user_data");
    const role = localStorage.getItem("user_role") || "PATIENT";

    setUserRole(role);

    if (userDataStr) {
      try {
        setUserData(JSON.parse(userDataStr));
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }

    return () => clearInterval(timer);
  }, []);

  const getUserDisplayInfo = () => {
    if (userData) {
      const fullName =
        `${userData.first_name || ""} ${userData.last_name || ""}`.trim() ||
        userData.username;
      return {
        name: userRole === "DOCTOR" ? `Dr. ${fullName}` : fullName,
        role:
          userRole === "DOCTOR"
            ? "Doctor"
            : userRole === "PATIENT"
            ? "Patient"
            : userRole === "NURSE"
            ? "Nurse"
            : userRole === "PHARMACIST"
            ? "Pharmacist"
            : userRole === "ADMIN"
            ? "Administrator"
            : "User",
      };
    }

    return {
      name: userRole === "DOCTOR" ? "Dr. User" : "User",
      role:
        userRole === "DOCTOR"
          ? "Doctor"
          : userRole === "PATIENT"
          ? "Patient"
          : userRole === "NURSE"
          ? "Nurse"
          : userRole === "PHARMACIST"
          ? "Pharmacist"
          : userRole === "ADMIN"
          ? "Administrator"
          : "User",
    };
  };

  const user = getUserDisplayInfo();

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Sidebar className="w-64" />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-auto">
          {/* Welcome Section */}
          <div className="bg-white border-b border-gray-200">
            <div className="px-6 py-8">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Welcome back!
                  </h1>
                  <div className="flex items-center space-x-4 mt-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <CalendarDaysIcon className="h-4 w-4" />
                      <span>
                        {currentTime.toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <ClockIcon className="h-4 w-4" />
                      <span>
                        {currentTime.toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Dashboard Content */}
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ReportsTable />
              <Appointments />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
