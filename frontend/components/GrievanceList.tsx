import { MapPin, AlertTriangle, Calendar, CheckCircle, Clock, AlertCircle } from "lucide-react";

interface Grievance {
  id: number;
  description: string;
  status: string;
  category?: string;
  priority?: string;
  region?: string;
  created_at?: string;
}

interface GrievanceListProps {
  grievances: Grievance[];
}

export default function GrievanceList({ grievances }: GrievanceListProps) {
  
  // Helper to get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "resolved":
        return "bg-green-100 text-green-700 border-green-200";
      case "in progress":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  // Helper to get Status Icon
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "resolved": return <CheckCircle size={14} />;
      case "pending": return <Clock size={14} />;
      default: return <AlertCircle size={14} />;
    }
  };

  return (
    <ul className="space-y-4">
      {grievances.map((g) => (
        <li 
          key={g.id} 
          className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
        >
          {/* Top Row: Category Badge + Status */}
          <div className="flex justify-between items-start mb-3">
            <span className="px-3 py-1 text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full uppercase tracking-wider">
              {g.category || "General"}
            </span>
            
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${getStatusColor(g.status)}`}>
              {getStatusIcon(g.status)}
              <span>{g.status}</span>
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-800 dark:text-gray-200 font-medium leading-relaxed mb-4">
            {g.description}
          </p>

          {/* Bottom Row: Metadata (Priority, Region, Date) */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-3">
            
            {/* Priority */}
            <div className={`flex items-center gap-1.5 ${
              g.priority === 'High' || g.priority === 'Critical' ? 'text-red-500 font-semibold' : ''
            }`}>
              <AlertTriangle size={14} />
              <span>{g.priority || "Normal"} Priority</span>
            </div>

            {/* Region */}
            {g.region && (
              <div className="flex items-center gap-1.5">
                <MapPin size={14} />
                <span>{g.region}</span>
              </div>
            )}

            {/* Date (Optional) */}
            {g.created_at && (
              <div className="flex items-center gap-1.5 ml-auto">
                <Calendar size={14} />
                <span>{new Date(g.created_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
