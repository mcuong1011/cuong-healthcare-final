// src/components/Hero.jsx
import React from 'react'
import doctorImg from '../../assets/doctor.jpg'
import avatar1 from '../../assets/avatar1.jpg'

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-cyan-50 min-h-screen flex items-center">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-100/40 to-cyan-100/40 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-green-100/40 to-blue-100/40 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
      
      <div className="container mx-auto px-6 lg:px-8 relative z-10">
        <div className="flex flex-col-reverse lg:flex-row items-center gap-12">
          {/* LEFT */}
          <div className="w-full lg:w-1/2 space-y-8">
            <div className="space-y-6">
              {/* <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                🏥 Nền tảng chăm sóc sức khỏe hàng đầu
              </div> */}
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
                  Healthcare
                </span>
                {/* <br />
                <span className="text-gray-900">sức khỏe</span>
                <br />
                <span className="bg-gradient-to-r from-green-500 to-teal-500 bg-clip-text text-transparent">
                  thông minh
                </span> */}
              </h1>
              {/* <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                Hệ thống chăm sóc sức khỏe toàn diện với công nghệ AI, giúp bạn quản lý sức khỏe một cách hiệu quả và tiện lợi.
              </p> */}
            </div>
            
            
          </div>

          
        </div>
      </div>
    </section>
  )
}
