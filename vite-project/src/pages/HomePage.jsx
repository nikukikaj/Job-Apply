import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import useAuthStore from "../store/useAuthStore";

const HomePage = () => {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);

  const fetchJobs = async () => {
    const { data } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setJobs(data);
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleApplyClick = () => {
    if (user) {
      navigate("/jobs");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-white px-4 py-10">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Browse Available Jobs
        </h2>
        <p className="text-gray-600 text-lg">
          Login or create an account to apply
        </p>
      </div>

      {/* Job cards */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6">
        {jobs.length === 0 ? (
          <p className="text-gray-600">No job listings available.</p>
        ) : (
          jobs.map((job) => (
            <div
              key={job.id}
              className="border rounded-xl shadow p-6 bg-white hover:border-blue-500 transition"
            >
              <h3 className="text-xl font-semibold text-blue-800">
                {job.title}
              </h3>
              <p className="text-gray-700 mt-2 mb-4">{job.description}</p>
              <button
                onClick={handleApplyClick}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Apply
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HomePage;
