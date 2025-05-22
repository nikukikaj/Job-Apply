import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import useAuthStore from "../store/useAuthStore";

const JobList = () => {
  const user = useAuthStore((state) => state.user);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [resumeFile, setResumeFile] = useState(null);
  const [applyingId, setApplyingId] = useState(null);

  const fetchJobs = async () => {
    const { data } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setJobs(data);
  };

  const fetchApplications = async () => {
    const { data } = await supabase
      .from("job_applications")
      .select("job_id, status")
      .eq("applicant_id", user.id);

    if (data) setApplications(data);
  };

  const hasApplied = (jobId) =>
    applications.find((app) => app.job_id === jobId);

  const handleFileChange = (e) => setResumeFile(e.target.files[0]);

  const handleApply = async (jobId) => {
    const existing = hasApplied(jobId);
    if (existing || !resumeFile) return;

    setApplyingId(jobId);

    const fileExt = resumeFile.name.split(".").pop();
    const fileName = `${user.id}-${jobId}-${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from("resumes")
      .upload(fileName, resumeFile);

    if (uploadError) {
      alert("❌ Resume upload failed");
      setApplyingId(null);
      return;
    }

    const { error } = await supabase.from("job_applications").insert([
      {
        job_id: jobId,
        applicant_id: user.id,
        status: "pending",
        submitted_at: new Date(),
        resume_url: fileName,
      },
    ]);

    setResumeFile(null);
    setApplyingId(null);
    if (!error) fetchApplications();
  };

  useEffect(() => {
    if (user?.role === "user") {
      fetchJobs();
      fetchApplications();
    }
  }, [user]);

  if (!user) return <p className="p-6">Please log in to view jobs.</p>;
  if (user.role !== "user")
    return <p className="p-6">Only user accounts can apply for jobs.</p>;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-blue-700 mb-6">
          Available Jobs
        </h2>

        {jobs.length === 0 ? (
          <p className="text-gray-600">No jobs available.</p>
        ) : (
          <div className="space-y-6">
            {jobs.map((job) => {
              const app = hasApplied(job.id);

              return (
                <div
                  key={job.id}
                  className="bg-white rounded-lg shadow p-6 border hover:border-blue-500 transition"
                >
                  <h3 className="text-xl font-semibold text-blue-800">
                    {job.title}
                  </h3>
                  <p className="text-gray-700 mt-1">{job.description}</p>

                  <div className="mt-4 space-y-2">
                    {app ? (
                      <p className="text-sm text-green-600">
                        ✅ You already applied — <strong>{app.status}</strong>
                      </p>
                    ) : (
                      <>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handleFileChange}
                          className="block w-full border rounded px-3 py-2 text-sm"
                        />
                        <button
                          onClick={() => handleApply(job.id)}
                          disabled={!resumeFile || applyingId === job.id}
                          className={`bg-blue-600 text-white px-4 py-2 rounded ${
                            !resumeFile || applyingId === job.id
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:bg-blue-700"
                          }`}
                        >
                          {applyingId === job.id ? "Applying..." : "Apply"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobList;
