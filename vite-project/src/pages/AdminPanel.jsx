
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

function AdminPanel() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('Job_Application')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) {
      setApplications(data);
    }
    setLoading(false);
  };

  const updateStatus = async (id, status) => {
  setUpdating(true);

  if (status === 'declined') {
    const confirmDelete = window.confirm("Do you want to remove this application after declining?");
    if (confirmDelete) {
      const { error: deleteError } = await supabase
        .from('Job_Application')
        .delete()
        .eq('id', id);

      if (!deleteError) {
        setApplications(prev => prev.filter(app => app.id !== id));
      }
      setSelectedApp(null);
      setUpdating(false);
      return;
    }
  }

  const { error } = await supabase
    .from('Job_Application')
    .update({ status })
    .eq('id', id);

  if (!error) {
    setApplications(prev =>
      prev.map(app => app.id === id ? { ...app, status } : app)
    );
    setSelectedApp(null);
  }

  setUpdating(false);
};


  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center text-blue-700">
        Admin Panel — Applications
      </h1>

      {loading ? (
        <p className="text-center text-gray-600">Loading applications...</p>
      ) : applications.length === 0 ? (
        <p className="text-center text-gray-600">No applications submitted yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {applications.map((app) => (
            <div
              key={app.id}
              onClick={() => setSelectedApp(app)}
              className="cursor-pointer bg-white border rounded-xl shadow-md p-6 hover:shadow-lg transition"
            >
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-semibold text-gray-800">{app.name}</h2>
                <span className={`text-sm px-2 py-1 rounded-full ${
                  app.status === 'accepted'
                    ? 'bg-green-100 text-green-700'
                    : app.status === 'declined'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {app.status || 'pending'}
                </span>
              </div>
              <p className="text-sm text-gray-600"><strong>Email:</strong> {app.email}</p>
              <p className="text-sm text-gray-600"><strong>Job:</strong> {app.job_title}</p>
              <p className="text-sm text-gray-600 mt-2 line-clamp-3">
                <strong>Cover Letter:</strong> {app.cover_letter}
              </p>
            </div>
          ))}
        </div>
      )}

      {selectedApp && (
        <div className="fixed inset-0 bg-transparent bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg relative">
            <button
              className="absolute top-3 right-4 text-gray-600 hover:text-gray-800"
              onClick={() => setSelectedApp(null)}
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{selectedApp.name}</h2>
            <p><strong>Email:</strong> {selectedApp.email}</p>
            <p><strong>Job Title:</strong> {selectedApp.job_title}</p>
            <p className="mt-3"><strong>Cover Letter:</strong></p>
            <p className="text-gray-700 whitespace-pre-line">{selectedApp.cover_letter}</p>

            {selectedApp.resume_url && (
              <p className="mt-4">
                <a href={selectedApp.resume_url} target="_blank" rel="noopener noreferrer"
                  className="text-blue-600 underline">📄 View Resume</a>
              </p>
            )}

            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => updateStatus(selectedApp.id, 'declined')}
                disabled={updating}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Decline
              </button>
              <button
                onClick={() => updateStatus(selectedApp.id, 'accepted')}
                disabled={updating}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
