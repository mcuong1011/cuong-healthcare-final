import React, { useState } from 'react'
import api from '../services/api' // axios instance (baseURL: http://localhost:8000/api)

export default function VirtualRobot() {
  const [form, setForm] = useState({
    fever: false,
    cough: false,
    sneezing: false,
    fatigue: false,
    loss_of_taste: false,
    itchy_eyes: false
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const suggestions = {
    fever: "Nếu bạn bị sốt, hãy uống đủ nước, nghỉ ngơi, và đo nhiệt độ thường xuyên. Nếu sốt trên 38.5°C kéo dài hơn 2 ngày, hãy liên hệ bác sĩ.",
    cough: "Ho có thể do nhiễm virus. Sử dụng mật ong, gừng, và nghỉ ngơi. Nếu ho kéo dài, khám bác sĩ.",
    sneezing: "Hắt hơi nhiều có thể do dị ứng. Hạn chế tiếp xúc với dị nguyên và dùng thuốc kháng histamine nếu cần.",
    fatigue: "Mệt mỏi thường do thiếu ngủ hoặc áp lực. Hãy ngủ đủ giấc, ăn uống điều độ.",
    loss_of_taste: "Mất vị giác có thể do nhiễm virus. Giữ vệ sinh mũi họng và theo dõi triệu chứng.",
    itchy_eyes: "Ngứa mắt thường do dị ứng hoặc khô mắt. Tránh dụi mắt, có thể dùng thuốc nhỏ mắt."
  }

  const handleChange = (e) => {
    const { name, checked } = e.target
    setForm(prev => ({ ...prev, [name]: checked }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/vr/diagnose/', form)
      setResult(res.data)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-2xl shadow-lg">
      <h2 className="text-2xl font-semibold mb-4">Virtual Robot</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.keys(form).map(key => (
          <label key={key} className="flex items-center space-x-2">
            <input
              type="checkbox"
              name={key}
              checked={form[key]}
              onChange={handleChange}
              className="h-5 w-5 text-green-600"
            />
            <span className="capitalize">{key.replace(/_/g, ' ')}</span>
          </label>
        ))}
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            {loading ? 'Đang phân tích...' : 'Phân tích'}
          </button>
        </div>
      </form>

      {result && (
        <div className="mt-8 bg-gray-50 p-6 rounded-lg space-y-6">
          <h3 className="text-xl font-semibold">Kết quả Dự đoán</h3>
          <p><span className="font-medium">Chẩn đoán:</span> <span className="text-green-700">{result.diagnosis}</span></p>

          <div>
            <h4 className="font-medium mb-1">Xác suất (probabilities):</h4>
            <ul className="list-disc list-inside">
              {Object.entries(result.probabilities).map(([k, v]) => (
                <li key={k} className="capitalize">{k}: {(v*100).toFixed(2)}%</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-1">Độ không chắc chắn (uncertainties):</h4>
            <ul className="list-disc list-inside">
              {Object.entries(result.uncertainties).map(([k, v]) => (
                <li key={k} className="capitalize">{k}: {(v*100).toFixed(2)}%</li>
              ))}
            </ul>
          </div>

          <div>
            <p><span className="font-medium">Xét nghiệm đề xuất:</span> {result.recommended_test}</p>
            <p><span className="font-medium">Thuốc đề xuất:</span> {result.recommended_medicine}</p>
          </div>

          <div>
            <h4 className="font-medium mb-1">Gợi ý chăm sóc:</h4>
            {Object.entries(result.probabilities)
              .filter(([k, v]) => form[k])
              .map(([k]) => (
                <p key={k} className="ml-4 text-gray-700">- {suggestions[k]}</p>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}