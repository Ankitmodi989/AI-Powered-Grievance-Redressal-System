"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { AxiosError } from "axios";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";

interface AuthFormProps {
  type: "login" | "register";
  role: "user" | "admin";
}

export default function AuthForm({ type, role }: AuthFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const endpoint = type === "register" ? "/auth/register" : "/auth/login";
      const payload =
        type === "register"
          ? form
          : { email: form.email, password: form.password };

      const res = await api.post(endpoint, payload);
      const { access_token } = res.data;

      if (!access_token) throw new Error("Invalid response from server");

      localStorage.setItem("token", access_token);
      localStorage.setItem("role", role);

      setSuccess("Success! Redirecting...");

      setTimeout(() => {
        router.push(role === "admin" ? "/admin/dashboard" : "/user/dashboard");
      }, 1500);
    } catch (err) {
      const error = err as AxiosError<{ detail?: string }>;
      setError(error.response?.data?.detail || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col items-center justify-center">
      <Navbar />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md p-8 mt-20 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700"
      >
        <h2 className="text-3xl font-semibold text-center text-gray-900 dark:text-white mb-6">
          {type === "register"
            ? "Create Your Account"
            : role === "admin"
            ? "Admin Login"
            : "User Login"}
        </h2>

        {error && (
          <p className="text-red-500 text-sm text-center mb-3">{error}</p>
        )}
        {success && (
          <p className="text-green-500 text-sm text-center mb-3">{success}</p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {type === "register" && (
            <input
              type="text"
              placeholder="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-lg font-medium transition-all shadow-lg hover:shadow-xl"
          >
            {loading
              ? "Processing..."
              : type === "register"
              ? "Register"
              : "Login"}
          </button>
        </form>

        {role !== "admin" && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            {type === "register" ? (
              <>
                Already have an account?{" "}
                <span
                  onClick={() => router.push("/auth/login/user")}
                  className="text-blue-600 cursor-pointer hover:underline"
                >
                  Login here
                </span>
              </>
            ) : (
              <>
                New user?{" "}
                <span
                  onClick={() => router.push("/auth/register")}
                  className="text-blue-600 cursor-pointer hover:underline"
                >
                  Register now
                </span>
              </>
            )}
          </p>
        )}
      </motion.div>
    </div>
  );
}
