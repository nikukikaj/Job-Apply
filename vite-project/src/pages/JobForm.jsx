import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function JobForm() {
  // State declarations
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    jobTitle: '',
    coverLetter: '',
    resumeFile: null
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [resumePreview, setResumePreview] = useState(null);
  const [jobListings, setJobListings] = useState([]);
  const [applications, setApplications] = useState([]);
  const [editingApplication, setEditingApplication] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const jobPositions = [
    'Front End Developer',
    'Back End Developer', 
    'Full Stack Developer',
    'UI/UX Designer',
    'DevOps Engineer',
    'Product Manager',
    'Technical Writer',
    'QA Engineer'
  ];

  // Handle Google login
  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.href
      }
    });
    
    if (error) {
      setError('Login failed: ' + error.message);
      addNotification('Login failed. Please try again.', 'error');
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === 'resumeFile' && files?.[0]) {
      const file = files[0];
      setResumePreview({
        name: file.name,
        size: (file.size / 1024).toFixed(2) + ' KB',
        type: file.type
      });
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  };

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error fetching user:', error);
        return;
      }
      setUser(user);
      
      if (user?.email) {
        setFormData(prev => ({
          ...prev,
          email: user.email,
          name: user.user_metadata?.full_name || ''
        }));

        // Fetch job listings and applications
        const [listingsResult, appsResult] = await Promise.all([
          supabase.from('job_listings').select('*').order('created_at', { ascending: false }),
          supabase.from('job_application').select('*').eq('user_id', user.id).order('submitted_at', { ascending: false })
        ]);

        if (!listingsResult.error) setJobListings(listingsResult.data || []);
        if (!appsResult.error) setApplications(appsResult.data || []);
      }
    };
    
    fetchData();
  }, []);

  // Notification system
  const addNotification = (message, type = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      if (userError || !currentUser) throw new Error('Session expired. Please log in again.');

      // Validate required fields
      const { name, email, jobTitle, coverLetter } = formData;
      if (!name || !email || !jobTitle || !coverLetter) {
        throw new Error('All fields except resume are required');
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      // Handle resume upload
      let resumeUrl = editingApplication?.resume_url || '';
      if (formData.resumeFile) {
        const file = formData.resumeFile;
        const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        
        if (!validTypes.includes(file.type)) {
          throw new Error('Please upload a PDF, DOC, or DOCX file');
        }

        if (file.size > 5 * 1024 * 1024) {
          throw new Error('File size must be less than 5MB');
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('applications')
          .upload(`resumes/${fileName}`, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('applications')
          .getPublicUrl(`resumes/${fileName}`);

        resumeUrl = publicUrl;
      }

      // Save application
      const { data, error: dbError } = editingApplication 
        ? await supabase
            .from('Job_Application')
            .update({
              name: formData.name,
              email: formData.email,
              job_title: formData.jobTitle,
              cover_letter: formData.coverLetter,
              resume_url: resumeUrl,
              updated_at: new Date().toISOString()
            })
            .eq('id', editingApplication.id)
            .select()
        : await supabase
            .from('Job_Application')
            .insert([{
              name: formData.name,
              email: formData.email,
              job_title: formData.jobTitle,
              cover_letter: formData.coverLetter,
              resume_url: resumeUrl,
              submitted_at: new Date().toISOString(),
              user_id: currentUser.id
            }])
            .select();

      if (dbError) throw dbError;

      // Update state
      setApplications(prev => 
        editingApplication 
          ? prev.map(app => app.id === editingApplication.id ? data[0] : app)
          : [data[0], ...prev]
      );

      // Reset form
      setFormData({
        name: '',
        email: currentUser.email || '',
        jobTitle: '',
        coverLetter: '',
        resumeFile: null
      });
      setResumePreview(null);
      setEditingApplication(null);
      addNotification(editingApplication ? 'Application updated!' : 'Application submitted!');

    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
      addNotification(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit application
  const handleEdit = (application) => {
    setEditingApplication(application);
    setFormData({
      name: application.name,
      email: application.email,
      jobTitle: application.job_title,
      coverLetter: application.cover_letter,
      resumeFile: null
    });
    
    if (application.resume_url) {
      setResumePreview({
        name: 'Current Resume',
        size: 'Already uploaded',
        type: 'application/pdf'
      });
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle delete application
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this application?')) return;
    
    try {
      const { error } = await supabase
        .from('Job_Application')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setApplications(prev => prev.filter(app => app.id !== id));
      addNotification('Application deleted successfully!');
    } catch (err) {
      console.error('Error:', err);
      addNotification('Failed to delete application', 'error');
    }
  };

  // Render login screen if not authenticated
  if (!user) {
    return (
      <div className="max-w-xl mx-auto p-8 bg-white rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Job Application</h2>
        <p className="mb-6 text-gray-600">Please sign in to access the application form</p>
        <button
          onClick={handleLogin}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12.545 10.239v3.821h5.445c-0.712 2.315-2.647 3.972-5.445 3.972-3.332 0-6.033-2.701-6.033-6.032s2.701-6.032 6.033-6.032c1.498 0 2.866 0.549 3.921 1.453l2.814-2.814c-1.784-1.664-4.177-2.698-6.735-2.698-5.522 0-10 4.477-10 10s4.478 10 10 10c8.396 0 10-7.496 10-10 0-0.671-0.068-1.325-0.182-1.977h-9.818z"/>
          </svg>
          Sign In with Google
        </button>
      </div>
    );
  }

  // Main component render
  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Notifications */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {notifications.map(notification => (
          <div 
            key={notification.id}
            className={`p-4 rounded-md shadow-lg ${
              notification.type === 'error' 
                ? 'bg-red-100 text-red-700' 
                : 'bg-green-100 text-green-700'
            }`}
          >
            {notification.message}
          </div>
        ))}
      </div>

      {/* Application Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {editingApplication ? 'Edit Application' : 'New Application'}
          </h2>
          {editingApplication && (
            <button
              onClick={() => {
                setEditingApplication(null);
                setFormData({
                  name: '',
                  email: user.email || '',
                  jobTitle: '',
                  coverLetter: '',
                  resumeFile: null
                });
                setResumePreview(null);
              }}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel Edit
            </button>
          )}
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-1">
              Job Position *
            </label>
            <select
              id="jobTitle"
              name="jobTitle"
              value={formData.jobTitle}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a position</option>
              {jobPositions.map((position, index) => (
                <option key={index} value={position}>{position}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="coverLetter" className="block text-sm font-medium text-gray-700 mb-1">
              Cover Letter *
            </label>
            <textarea
              id="coverLetter"
              name="coverLetter"
              value={formData.coverLetter}
              onChange={handleChange}
              rows="8"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tell us why you're a great fit for this position..."
              required
            />
          </div>

          <div>
            <label htmlFor="resumeFile" className="block text-sm font-medium text-gray-700 mb-1">
              Resume (PDF, DOC, DOCX - Max 5MB)
            </label>
            {resumePreview ? (
              <div className="flex items-center justify-between p-3 border border-gray-300 rounded-md bg-gray-50">
                <div>
                  <p className="font-medium">{resumePreview.name}</p>
                  <p className="text-sm text-gray-500">{resumePreview.size} • {resumePreview.type}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, resumeFile: null }));
                    setResumePreview(null);
                  }}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center w-full">
                <label htmlFor="resumeFile" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-8 h-8 mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                    </svg>
                    <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-gray-500">PDF, DOC, or DOCX (MAX. 5MB)</p>
                  </div>
                  <input 
                    id="resumeFile" 
                    name="resumeFile" 
                    type="file" 
                    onChange={handleChange} 
                    accept=".pdf,.doc,.docx" 
                    className="hidden" 
                  />
                </label>
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 px-4 rounded-md text-white font-medium flex items-center justify-center gap-2 ${
                isSubmitting 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } transition-colors`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                editingApplication ? 'Update Application' : 'Submit Application'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Job Listings */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Available Positions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobListings.map(job => (
            <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <h3 className="font-bold text-lg text-gray-800 mb-2">{job.title}</h3>
              <p className="text-gray-600 text-sm mb-3 line-clamp-3">{job.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">{job.location}</span>
                <button 
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      jobTitle: job.title
                    }));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Apply
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Your Applications */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Your Applications</h2>
        {applications.length === 0 ? (
          <p className="text-gray-500">You haven't submitted any applications yet.</p>
        ) : (
          <div className="space-y-4">
            {applications.map(application => (
              <div key={application.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-gray-800">{application.job_title}</h3>
                    <p className="text-sm text-gray-500">
                      Submitted on {new Date(application.submitted_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEdit(application)}
                      className="text-sm text-blue-600 hover:text-blue-800 px-2 py-1 border border-blue-200 rounded hover:bg-blue-50"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(application.id)}
                      className="text-sm text-red-600 hover:text-red-800 px-2 py-1 border border-red-200 rounded hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="mb-2">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Cover Letter</h4>
                  <p className="text-sm text-gray-600 line-clamp-2">{application.cover_letter}</p>
                </div>
                {application.resume_url && (
                  <a 
                    href={application.resume_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                    </svg>
                    View Resume
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default JobForm;