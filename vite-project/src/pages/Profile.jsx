import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import useAuthStore from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const [form, setForm] = useState({ full_name: "", email: "", role: "" });
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error || !data) {
        setError("Failed to load profile.");
      } else {
        setForm({
          full_name: data.full_name,
          email: data.email,
          role: data.role,
        });
      }

      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    setError("");

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name,
        email: form.email,
      })
      .eq("id", user.id);

    if (error) {
      setError("Failed to update profile.");
    } else {
      setUser({ ...user, ...form });
      setEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete your account?")) return;

    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", user.id);

    const { error: authError } = await supabase.auth.admin.deleteUser(user.id);

    logout();
    navigate("/register");

    if (profileError || authError) {
      setError("Failed to delete account.");
    }
  };

  if (!user) return <p className="p-6">Please log in.</p>;
  if (loading) return <p className="p-6">Loading profile...</p>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-xl p-6">
        <h2 className="text-2xl font-bold text-blue-700 mb-6 text-center">
          Your Profile
        </h2>

        {error && <p className="text-red-600 mb-3 text-sm">{error}</p>}

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600">
              Full Name
            </label>
            <input
              name="full_name"
              type="text"
              value={form.full_name}
              onChange={handleChange}
              disabled={!editing}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                editing ? "focus:ring-blue-500" : "bg-gray-100"
              }`}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              disabled={!editing}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                editing ? "focus:ring-blue-500" : "bg-gray-100"
              }`}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Role</label>
            <input
              type="text"
              value={form.role}
              disabled
              className="w-full px-4 py-2 border rounded-lg bg-gray-100 text-gray-500"
            />
          </div>

          <div className="flex justify-between mt-6">
            {editing ? (
              <button
                onClick={handleUpdate}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                Save Changes
              </button>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                Edit Profile
              </button>
            )}

            <button
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
