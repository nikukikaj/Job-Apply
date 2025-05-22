import useAuthStore from "../store/useAuthStore";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg text-gray-700">
        Please log in to view your dashboard.
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-10 bg-gradient-to-br from-gray-100 to-blue-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-700 mb-4">
          Welcome, {user.full_name}!
        </h1>
        <p className="text-gray-600 mb-8">
          Role: <strong>{user.role}</strong>
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Universal: View Profile */}
          <Link
            to="/profile"
            className="bg-white p-5 rounded-xl shadow hover:shadow-md transition border hover:border-blue-500"
          >
            <h3 className="text-lg font-semibold text-blue-700 mb-1">
              Your Profile
            </h3>
            <p className="text-sm text-gray-600">
              View or edit your account details.
            </p>
          </Link>

          {/* User role actions */}
          {user.role === "user" && (
            <Link
              to="/jobs"
              className="bg-white p-5 rounded-xl shadow hover:shadow-md transition border hover:border-blue-500"
            >
              <h3 className="text-lg font-semibold text-blue-700 mb-1">
                Browse Jobs
              </h3>
              <p className="text-sm text-gray-600">
                Apply to available job listings.
              </p>
            </Link>
          )}

          {/* Business role actions */}
          {user.role === "business" && (
            <>
              <Link
                to="/job-post"
                className="bg-white p-5 rounded-xl shadow hover:shadow-md transition border hover:border-blue-500"
              >
                <h3 className="text-lg font-semibold text-blue-700 mb-1">
                  Post a Job
                </h3>
                <p className="text-sm text-gray-600">
                  Create a new job listing.
                </p>
              </Link>
              <Link
                to="/applications"
                className="bg-white p-5 rounded-xl shadow hover:shadow-md transition border hover:border-blue-500"
              >
                <h3 className="text-lg font-semibold text-blue-700 mb-1">
                  View Applications
                </h3>
                <p className="text-sm text-gray-600">
                  Review applicants for your jobs.
                </p>
              </Link>
            </>
          )}

          {/* Admin role actions */}
          {user.role === "admin" && (
            <Link
              to="/admin"
              className="bg-white p-5 rounded-xl shadow hover:shadow-md transition border hover:border-blue-500"
            >
              <h3 className="text-lg font-semibold text-blue-700 mb-1">
                Admin Panel
              </h3>
              <p className="text-sm text-gray-600">
                Manage users, roles, and applications.
              </p>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
