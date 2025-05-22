import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import useAuthStore from "../store/useAuthStore";

const JobPost = () => {
  const user = useAuthStore((state) => state.user);
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState({ title: "", description: "" });
  const [editingJobId, setEditingJobId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false });

    if (!error) setJobs(data || []);
    setLoading(false);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const { title, description } = form;

    if (!title || !description) {
      setError("Title and description are required.");
      setSubmitting(false);
      return;
    }

    if (editingJobId) {
      // Update job
      const { error } = await supabase
        .from("jobs")
        .update({ title, description })
        .eq("id", editingJobId);

      if (error) {
        setError("❌ Failed to update job.");
      }
    } else {
      // Create new job
      const { error } = await supabase.from("jobs").insert([
        {
          title,
          description,
          created_by: user.id,
        },
      ]);

      if (error) {
        setError("❌ Failed to post job.");
      }
    }

    setForm({ title: "", description: "" });
    setEditingJobId(null);
    setSubmitting(false);
    fetchJobs();
  };

  const handleEdit = (job) => {
    setForm({ title: job.title, description: job.description });
    setEditingJobId(job.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    const confirmed = confirm("Are you sure you want to delete this job?");
    if (!confirmed) return;

    const { error } = await supabase.from("jobs").delete().eq("id", id);
    if (!error) fetchJobs();
  };

  useEffect(() => {
    if (user?.role === "business") fetchJobs();
  }, [user]);

  if (!user) return <p className="p-6">Please log in to post jobs.</p>;
  if (user.role !== "business")
    return <p className="p-6">Only business users can access this page.</p>;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-blue-700 mb-6">
          {editingJobId ? "Edit Job" : "Post a New Job"}
        </h2>

        {error && <p className="text-red-600 mb-4">{error}</p>}

        <form
          onSubmit={handleSubmit}
          className="bg-white shadow rounded-lg p-6 space-y-4 border"
        >
          <input
            name="title"
            type="text"
            placeholder="Job Title"
            value={form.title}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <textarea
            name="description"
            placeholder="Job Description"
            value={form.description}
            onChange={handleChange}
            rows={5}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="flex justify-between items-center">
            <button
              type="submit"
              disabled={submitting}
              className={`bg-blue-600 text-white px-4 py-2 rounded ${
                submitting
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-blue-700"
              }`}
            >
              {editingJobId ? "Update Job" : "Post Job"}
            </button>
            {editingJobId && (
              <button
                type="button"
                onClick={() => {
                  setForm({ title: "", description: "" });
                  setEditingJobId(null);
                }}
                className="text-sm text-gray-600 hover:underline"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>

        <div className="mt-10">
          <h3 className="text-xl font-semibold mb-4 text-blue-800">
            Your Posted Jobs
          </h3>
          {loading ? (
            <p>Loading jobs...</p>
          ) : jobs.length === 0 ? (
            <p className="text-gray-600">No jobs posted yet.</p>
          ) : (
            <ul className="space-y-4">
              {jobs.map((job) => (
                <li
                  key={job.id}
                  className="bg-white border rounded-lg shadow p-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-bold text-blue-700">
                        {job.title}
                      </h4>
                      <p className="text-gray-700 mt-1">{job.description}</p>
                      <p className="text-sm text-gray-400 mt-2">
                        Posted: {new Date(job.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="space-x-2">
                      <button
                        onClick={() => handleEdit(job)}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(job.id)}
                        className="text-sm text-red-600 hover:underline"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobPost;
