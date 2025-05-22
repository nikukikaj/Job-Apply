import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import useAuthStore from "../store/useAuthStore";

const JobApplicationsReceived = () => {
  const user = useAuthStore((state) => state.user);
  const [applications, setApplications] = useState([]);
  const [signedUrls, setSignedUrls] = useState({});
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchApplications = async () => {
    const { data, error } = await supabase
      .from("job_applications")
      .select(
        `
        id,
        status,
        resume_url,
        submitted_at,
        jobs (
          id,
          title,
          created_by
        ),
        applicant:profiles!job_applications_applicant_id_fkey (
          full_name,
          email
        )
      `
      )
      .order("submitted_at", { ascending: false });

    if (!error) {
      const filtered = data.filter((app) => app.jobs?.created_by === user.id);
      setApplications(filtered);
    }

    setLoading(false);
  };

  const updateStatus = async (id, newStatus) => {
    setUpdatingId(id);
    const { error } = await supabase
      .from("job_applications")
      .update({ status: newStatus })
      .eq("id", id);

    if (!error) fetchApplications();
    setUpdatingId(null);
  };

  const generateSignedUrl = async (path, appId) => {
    const { data, error } = await supabase.storage
      .from("resumes")
      .createSignedUrl(path, 60);

    if (!error) {
      setSignedUrls((prev) => ({ ...prev, [appId]: data.signedUrl }));
    }
  };

  useEffect(() => {
    if (user?.role === "business") fetchApplications();
  }, [user]);

  if (!user) return <p className="p-6">Please log in.</p>;
  if (user.role !== "business")
    return <p className="p-6">Only business users can view applications.</p>;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-blue-700 mb-6">
          Applications to Your Jobs
        </h2>

        {loading ? (
          <p>Loading applications...</p>
        ) : applications.length === 0 ? (
          <p className="text-gray-600">No applications received yet.</p>
        ) : (
          <div className="space-y-6">
            {applications.map((app) => (
              <div
                key={app.id}
                className="bg-white border rounded-xl shadow p-6"
              >
                <h3 className="text-lg font-semibold text-blue-800 mb-2">
                  {app.applicant?.full_name} —{" "}
                  <span className="text-gray-600">{app.applicant?.email}</span>
                </h3>

                <p className="text-gray-700 mb-2">
                  <strong>Job:</strong> {app.jobs?.title}
                </p>

                <p className="text-sm text-gray-500">
                  <strong>Status:</strong>{" "}
                  <span className="capitalize font-medium text-blue-700">
                    {app.status}
                  </span>{" "}
                  | Submitted: {new Date(app.submitted_at).toLocaleString()}
                </p>

                {app.resume_url && (
                  <div className="mt-3">
                    {!signedUrls[app.id] ? (
                      <button
                        onClick={() =>
                          generateSignedUrl(app.resume_url, app.id)
                        }
                        className="text-sm text-blue-600 underline"
                      >
                        📄 Generate Resume Link
                      </button>
                    ) : (
                      <a
                        href={signedUrls[app.id]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 underline"
                      >
                        📄 Download Resume
                      </a>
                    )}
                  </div>
                )}

                {app.status === "pending" && (
                  <div className="flex gap-4 mt-4">
                    <button
                      onClick={() => updateStatus(app.id, "accepted")}
                      disabled={updatingId === app.id}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded"
                    >
                      {updatingId === app.id ? "Accepting..." : "Accept"}
                    </button>
                    <button
                      onClick={() => updateStatus(app.id, "declined")}
                      disabled={updatingId === app.id}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded"
                    >
                      {updatingId === app.id ? "Declining..." : "Decline"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobApplicationsReceived;
