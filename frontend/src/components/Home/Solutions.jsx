// src/components/Solutions.jsx
import React, { useState } from 'react'

const tabGroup1 = ['Virtual','Provider staffing']
const tabGroup2 = ['Telemedicine','Platform']

const features = [
  { title: 'Virtual Solutions For Brick And Mortar', icon: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
    <path stroke-linecap="round" stroke-linejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
  </svg>
    )
  },
  { title: '50 State Coverage', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
    <path stroke-linecap="round" stroke-linejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
  </svg>
  },
  { title: 'EHR/EMR', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
    <path stroke-linecap="round" stroke-linejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
  </svg>
  },
  { title: 'E-Prescribe', icon:<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
    <path stroke-linecap="round" stroke-linejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
  </svg>
   },
]

export default function Solutions() {
  const [active1, setActive1] = useState(tabGroup1[0])
  const [active2, setActive2] = useState(tabGroup2[0])

  // return (
  //   <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
  //     <div className="container mx-auto px-6 lg:px-8">
  //       {/* Header */}
  //       <div className="text-center max-w-4xl mx-auto mb-16">
  //         <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
  //           ⚡ Giải pháp toàn diện
  //         </div>
  //         <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
  //           Nâng tầm{" "}
  //           <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
  //             chăm sóc sức khỏe
  //           </span>{" "}
  //           với công nghệ hiện đại
  //         </h2>
  //         <p className="text-xl text-gray-600 leading-relaxed">
  //           Khám phá bộ giải pháp chăm sóc sức khỏe thông minh được thiết kế chuyên biệt cho nhu cầu của bạn.
  //         </p>
  //       </div>

  //       {/* Tabs */}
  //       <div className="flex flex-wrap justify-center gap-3 mb-12">
  //         {tabGroup1.map(tab => (
  //           <button
  //             key={tab}
  //             onClick={() => setActive1(tab)}
  //             className={`px-6 py-3 rounded-2xl font-medium transition-all duration-300 ${
  //               active1===tab 
  //                 ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg transform scale-105' 
  //                 : 'bg-white text-gray-600 hover:bg-gray-50 shadow-md'
  //             }`}
  //           >
  //             {tab}
  //           </button>
  //         ))}
  //         {tabGroup2.map(tab => (
  //           <button
  //             key={tab}
  //             onClick={() => setActive2(tab)}
  //             className={`px-6 py-3 rounded-2xl font-medium transition-all duration-300 ${
  //               active2===tab 
  //                 ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105' 
  //                 : 'bg-white text-gray-600 hover:bg-gray-50 shadow-md'
  //             }`}
  //           >
  //             {tab}
  //           </button>
  //         ))}
  //       </div>

  //       {/* Feature cards */}
  //       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
  //         {features.map((f, i) => (
  //           <div 
  //             key={i} 
  //             className="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
  //           >
  //             {/* Icon */}
  //             <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl text-white mb-6 group-hover:scale-110 transition-transform duration-300">
  //               {f.icon}
  //             </div>
              
  //             {/* Content */}
  //             <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-gray-800">
  //               {f.title}
  //             </h3>
              
  //             {/* Hover effect arrow */}
  //             <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
  //               <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
  //               </svg>
  //             </div>
  //           </div>
  //         ))}
  //       </div>

  //       {/* Additional info section */}
  //       <div className="mt-20 text-center">
  //         <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white">
  //           <h3 className="text-3xl font-bold mb-4">Sẵn sàng bắt đầu?</h3>
  //           <p className="text-xl mb-8 opacity-90">
  //             Trải nghiệm hệ thống chăm sóc sức khỏe thông minh ngay hôm nay
  //           </p>
  //           <div className="flex flex-col sm:flex-row gap-4 justify-center">
  //             <button className="px-8 py-4 bg-white text-blue-600 rounded-2xl font-semibold hover:bg-gray-100 transition-colors duration-300">
  //               Dùng thử miễn phí
  //             </button>
  //             <button className="px-8 py-4 border-2 border-white text-white rounded-2xl font-semibold hover:bg-white hover:text-blue-600 transition-all duration-300">
  //               Liên hệ tư vấn
  //             </button>
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   </section>
  // )
}
