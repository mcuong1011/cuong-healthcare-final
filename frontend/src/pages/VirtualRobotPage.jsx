import React from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import VirtualRobot from '../components/VirtualRobot'

export default function VirtualRobotPage() {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="p-6 overflow-auto">
          <VirtualRobot />
        </main>
      </div>
    </div>
  )
}