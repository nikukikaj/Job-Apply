import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

function AdminPanel() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching applications:', error);
      } else {
        setApplications(data);
      }

      setLoading(false);
    };

    fetchApplications();
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Panel — Job Applications</h1>
      {loading ? (
        <p>Loading applications...</p>
      ) : applications.length === 0 ? (
        <p>No applications submitted yet.</p>
      ) : (
        <div className="space-y-6">
          {applications.map((app) => (
            <div key={app.id} className="border rounded p-4 shadow-sm bg-white">
              <h2 className="text-xl font-semibold">{app.full_name}</h2>
              <p><strong>Email:</strong> {app.email}</p>
              <p><strong>Position:</strong> {app.position}</p>
              <p><strong>Cover Letter:</strong> {app.cover_letter}</p>
            {app.resume_url ? (
  <a
    href={app.resume_url}
    target="_blank"
    rel="noopener noreferrer"
    className="text-blue-600 underline mt-2 inline-block"
  >
    View Resume
  </a>
) : (
  <p>No resume uploaded</p>
)}

            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
