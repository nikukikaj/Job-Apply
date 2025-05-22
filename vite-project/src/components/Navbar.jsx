import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";
import { supabase } from "../supabaseClient";

const Navbar = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
    navigate("/");
  };

  return (
    <nav className="bg-white border-b shadow px-6 py-4 flex justify-between items-center sticky top-0 z-50">
      <div className="flex items-center space-x-6">
        <Link to="/" className="text-2xl font-bold text-blue-700">
          JobPortal
        </Link>

        {user && (
          <Link to="/dashboard" className="text-gray-700 hover:text-blue-600">
            Dashboard
          </Link>
        )}

        {user?.role === "user" && (
          <Link to="/jobs" className="text-gray-700 hover:text-blue-600">
            Browse Jobs
          </Link>
        )}

        {user?.role === "business" && (
          <>
            <Link to="/job-post" className="text-gray-700 hover:text-blue-600">
              Post Job
            </Link>
            <Link
              to="/applications"
              className="text-gray-700 hover:text-blue-600"
            >
              Applications
            </Link>
          </>
        )}

        {user?.role === "admin" && (
          <Link to="/admin" className="text-gray-700 hover:text-blue-600">
            Admin Panel
          </Link>
        )}
      </div>

      <div className="flex items-center space-x-4">
        {user ? (
          <>
            <Link
              to="/profile"
              className="text-sm text-blue-700 font-medium hover:underline"
            >
              {user.full_name} ({user.role})
            </Link>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-sm rounded"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-sm text-blue-600 hover:underline">
              Login
            </Link>
            <Link
              to="/register"
              className="text-sm text-blue-600 hover:underline"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
