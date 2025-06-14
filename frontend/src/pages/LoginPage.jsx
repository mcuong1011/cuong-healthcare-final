import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, getProfile } from "../services/api";

export function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Step 1: Login and get tokens
      const loginResponse = await loginUser(form);
      console.log("Login successful:", loginResponse);

      // Step 2: Get user profile to determine role
      const profileResponse = await getProfile();
      const user = profileResponse.data;
      console.log("User profile:", user);

      // Step 3: Store user info in localStorage for quick access
      localStorage.setItem("user_id", user.id);
      localStorage.setItem("user_role", user.role);
      localStorage.setItem("user_data", JSON.stringify(user));

      // Step 4: Navigate based on role
      if (user.role === "DOCTOR") {
        navigate("/doctor/dashboard");
      } else if (user.role === "PATIENT") {
        navigate("/dashboard");
      } else {
        // For other roles (NURSE, PHARMACIST, ADMIN), navigate to general dashboard
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.response?.data?.detail ||
          err.response?.data?.error ||
          "Đăng nhập thất bại"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Sign in</h2>
          <p className="text-gray-500 mb-8">
            Enter your account details to enter our platform.
          </p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md">
          {error && <p className="text-red-600 mb-4 text-center">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                name="username"
                type="text"
                value={form.username}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="********"
                required
              />
            </div>

            <div className="flex justify-end">
              <Link
                to="/forgot"
                className="text-sm text-indigo-600 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{" "}
            <Link to="/register" className="text-indigo-600 hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
