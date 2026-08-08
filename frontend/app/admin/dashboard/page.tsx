"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import {
  LayoutDashboard,
  ListChecks,
  LogOut,
  Search,
  Filter,
  CheckCircle,
  Eye,
  X,
  MapPin,
  Lightbulb
} from "lucide-react";

interface Grievance {
  id: number;
  description: string;
  category: string;
  priority: string;
  region: string;
  latitude: number | null;
  longitude: number | null;
  solution: string;
  status: string;
  created_at: string;
  user_id: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  // Modal State
  const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null);

  // --- 1. Fetch grievances on load ---
  useEffect(() => {
    const init = async () => {
      try {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");

        if (!token || role !== "admin") {
          router.push("/auth/login/admin");
          return;
        }

        const res = await api.get("/grievance/all");
        setGrievances(res.data);
      } catch (error) {
        console.error("Failed to load admin data", error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  // --- 2. Update grievance status ---
  const handleStatusUpdate = async (id: number, newStatus: string) => {
    const originalGrievances = [...grievances];

    // Optimistic update for list and modal
    setGrievances(prev =>
      prev.map(g => g.id === id ? { ...g, status: newStatus } : g)
    );

    if (selectedGrievance && selectedGrievance.id === id) {
      setSelectedGrievance(prev =>
        prev ? { ...prev, status: newStatus } : null
      );
    }

    try {
      await api.put(`/grievance/${id}/status`, null, {
        params: { status: newStatus }
      });
    } catch (error) {
      console.error("Update failed", error);
      alert("Failed to update status on server.");
      setGrievances(originalGrievances);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  // --- Computed Data ---
  const filteredGrievances = useMemo(() => {
    return grievances.filter(g => {
      const matchesSearch =
        g.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.region?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.category?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter =
        filterStatus === "All" || g.status === filterStatus;

      return matchesSearch && matchesFilter;
    });
  }, [grievances, searchTerm, filterStatus]);

  const stats = useMemo(() => ({
    total: grievances.length,
    pending: grievances.filter(g => g.status === "Pending").length,
    resolved: grievances.filter(g => g.status === "Resolved").length,
    critical: grievances.filter(
      g => g.priority === "High" || g.priority === "Critical"
    ).length,
  }), [grievances]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-gray-500">Loading Admin Dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-sans relative">

      {/* Top Navbar */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <LayoutDashboard className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">
            Admin Portal
          </h1>
        </div>

        <button
          onClick={handleLogout}
          className="text-red-500 hover:bg-red-50 p-2 rounded-full transition"
        >
          <LogOut size={20} />
        </button>
      </nav>

      {/* Main Content */}
      <main className="p-6 max-w-7xl mx-auto space-y-6">

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Total Grievances" value={stats.total} color="blue" />
          <StatCard label="Pending" value={stats.pending} color="yellow" />
          <StatCard label="Resolved" value={stats.resolved} color="green" />
          <StatCard label="Critical Priority" value={stats.critical} color="red" />
        </div>

        {/* LIST VIEW */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">

          {/* Toolbar */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50 dark:bg-gray-900/50">
            <div className="relative w-full md:w-96">
              <Search
                className="absolute left-3 top-2.5 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search grievances..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none"
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase text-xs">
                <tr>
                  <th className="px-6 py-4 font-semibold">ID</th>
                  <th className="px-6 py-4 font-semibold">Category</th>
                  <th className="px-6 py-4 font-semibold">Priority</th>
                  <th className="px-6 py-4 font-semibold">Region</th>
                  <th className="px-6 py-4 font-semibold">Description</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredGrievances.map((g) => (
                  <tr
                    key={g.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      #{g.id}
                    </td>

                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300">
                        {g.category}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold
                        ${g.priority === "High" || g.priority === "Critical"
                            ? "bg-red-100 text-red-600"
                            : g.priority === "Medium"
                              ? "bg-orange-100 text-orange-600"
                              : "bg-green-100 text-green-600"
                          }`}
                      >
                        {g.priority}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-gray-500">
                      {g.region || "Unknown"}
                    </td>

                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300 max-w-xs truncate">
                      {g.description}
                    </td>

                    <td className="px-6 py-4">
                      <select
                        value={g.status}
                        onChange={(e) =>
                          handleStatusUpdate(g.id, e.target.value)
                        }
                        className="px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-800 cursor-pointer hover:border-blue-500 focus:outline-none"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </td>

                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedGrievance(g)}
                        className="text-blue-600 hover:bg-blue-50 p-2 rounded-full transition"
                        title="View Details & AI Solution"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredGrievances.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center py-10 text-gray-400"
                    >
                      No records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* GRIEVANCE DETAILS MODAL */}
      {selectedGrievance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">

            {/* Modal Header */}
            <div className="bg-blue-600 px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  Grievance #{selectedGrievance.id}
                  <span className="bg-blue-500/50 text-xs px-2 py-0.5 rounded border border-blue-400">
                    {selectedGrievance.status}
                  </span>
                </h3>

                <p className="text-blue-100 text-sm mt-1 flex items-center gap-1">
                  <MapPin size={12} />
                  {selectedGrievance.region || "Unknown Region"}
                </p>
              </div>

              <button
                onClick={() => setSelectedGrievance(null)}
                className="text-white/80 hover:text-white hover:bg-blue-500 rounded-full p-2 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">

              {/* User Grievance */}
              <div>
                <h4 className="text-gray-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2">
                  Citizen Report
                </h4>

                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl text-gray-800 dark:text-gray-200 leading-relaxed border border-gray-100 dark:border-gray-700">
                  {selectedGrievance.description}
                </div>
              </div>

              {/* AI Solution */}
              <div>
                <h4 className="text-blue-600 dark:text-blue-400 text-sm font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Lightbulb size={16} />
                  Gemini AI Recommendation
                </h4>

                <div className="space-y-3">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                    <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-7">
                      <span
                        dangerouslySetInnerHTML={{
                          __html: selectedGrievance.solution
                            .replace(
                              /\*\*Short-term Action:\*\*/g,
                              '<strong class="text-blue-700 block text-base mb-1">🚀 Short-term Action:</strong>'
                            )
                            .replace(
                              /\*\*Long-term Solution:\*\*/g,
                              '<br/><strong class="text-green-700 block text-base mb-1 mt-4">🌳 Long-term Solution:</strong>'
                            ),
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex justify-between items-center border-t border-gray-100 dark:border-gray-700">
              <span className="text-xs text-gray-400">
                Submitted on{" "}
                {new Date(selectedGrievance.created_at).toLocaleDateString()}
              </span>

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedGrievance(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium transition"
                >
                  Close
                </button>

                <button
                  onClick={() => {
                    handleStatusUpdate(selectedGrievance.id, "Resolved");
                    setSelectedGrievance(null);
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-2"
                >
                  <CheckCircle size={16} />
                  Mark Resolved
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color
}: {
  label: string;
  value: number;
  color: "blue" | "green" | "red" | "yellow";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-green-50 text-green-600 border-green-100",
    red: "bg-red-50 text-red-600 border-red-100",
    yellow: "bg-yellow-50 text-yellow-600 border-yellow-100",
  };

  return (
    <div
      className={`p-5 rounded-xl border ${colors[color]} shadow-sm flex flex-col justify-between h-28`}
    >
      <span className="text-sm font-medium opacity-80">{label}</span>
      <span className="text-3xl font-bold">{value}</span>
    </div>
  );
}