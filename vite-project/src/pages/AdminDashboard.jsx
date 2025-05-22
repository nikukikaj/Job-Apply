import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import useAuthStore from "../store/useAuthStore";

const AdminDashboard = () => {
  const user = useAuthStore((state) => state.user);
  const [users, setUsers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select("*");
    if (data) setUsers(data);
  };

  const fetchApplications = async () => {
    const { data } = await supabase
      .from("job_applications")
      .select(
        `
        id,
        status,
        resume_url,
        submitted_at,
        applicant:profiles!job_applications_applicant_id_fkey (
          full_name
        ),
        jobs (
          title
        )
      `
      )
      .order("submitted_at", { ascending: false });

    if (data) setApplications(data);
  };

  const deleteUser = async (id) => {
    if (id === user.id) return alert("⚠️ You can't delete yourself.");
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (!error) fetchUsers();
  };

  const deleteApplication = async (id) => {
    const { error } = await supabase
      .from("job_applications")
      .delete()
      .eq("id", id);
    if (!error) fetchApplications();
  };

  useEffect(() => {
    if (user?.role === "admin") {
      fetchUsers();
      fetchApplications();
      setLoading(false);
    }
  }, [user]);

  if (!user) return <p className="p-6">Please log in.</p>;
  if (user.role !== "admin")
    return <p className="p-6">Access denied. Admins only.</p>;

  return (
    <div className="min-h-screen px-6 py-10 bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-10">
        <h2 className="text-3xl font-bold text-blue-700">Admin Dashboard</h2>

        {/* USERS */}
        <div>
          <h3 className="text-xl font-semibold text-blue-600 mb-4">
            All Users
          </h3>
          <div className="bg-white shadow rounded-lg border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left px-4 py-2">Full Name</th>
                  <th className="text-left px-4 py-2">Email</th>
                  <th className="text-left px-4 py-2">Role</th>
                  <th className="text-left px-4 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">{u.full_name || "—"}</td>
                    <td className="px-4 py-2">{u.email}</td>
                    <td className="px-4 py-2 capitalize">{u.role}</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => deleteUser(u.id)}
                        disabled={u.id === user.id}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* APPLICATIONS */}
        <div>
          <h3 className="text-xl font-semibold text-blue-600 mb-4">
            All Job Applications
          </h3>
          <div className="space-y-4">
            {applications.length === 0 ? (
              <p className="text-gray-600">No applications available.</p>
            ) : (
              applications.map((app) => (
                <div
                  key={app.id}
                  className="bg-white border rounded shadow p-4"
                >
                  <p className="text-blue-700 font-medium">
                    Applicant: {app.applicant?.full_name} — Job:{" "}
                    {app.jobs?.title}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Status: <strong className="capitalize">{app.status}</strong>{" "}
                    | Submitted: {new Date(app.submitted_at).toLocaleString()}
                  </p>
                  <button
                    onClick={() => deleteApplication(app.id)}
                    className="mt-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-sm rounded"
                  >
                    Delete Application
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
