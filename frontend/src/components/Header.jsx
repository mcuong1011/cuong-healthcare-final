import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MagnifyingGlassIcon,
  BellIcon,
  ChatBubbleLeftIcon,
  Cog6ToothIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

export default function Header() {
  const navigate = useNavigate();
  const [notifications] = useState(3);
  const [messages] = useState(5);
  const [userData, setUserData] = useState(null);
  const [userRole, setUserRole] = useState("PATIENT");

  useEffect(() => {
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
  }, []);

  const handleProfileClick = () => {
    navigate("/profile");
  };

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
        avatar: `https://i.pravatar.cc/150?u=${userData.email || "user"}`,
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
      avatar: "https://i.pravatar.cc/150?u=default",
    };
  };

  const userInfo = getUserDisplayInfo();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left Section - Search or Logo can go here */}
        <div className="flex items-center space-x-4">
          {/* You can add search, logo, or other left-aligned items here */}
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        </div>

        {/* Right Section - Profile Dropdown */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200">
            <BellIcon className="h-6 w-6" />
            {notifications > 0 && (
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400"></span>
            )}
          </button>

          

          

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={handleProfileClick}
              className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-50 transition-colors duration-200"
            >
              <img
                src={userInfo.avatar}
                alt="Profile"
                className="w-8 h-8 rounded-full border-2 border-gray-200 cursor-pointer"
              />
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">
                  {userInfo.name}
                </p>
                <p className="text-xs text-gray-500">{userInfo.role}</p>
              </div>
              <ChevronDownIcon className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
