import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import '../App.css';

function DashboardPage() {
  const [attempts, setAttempts] = useState([]);
  const [allStudentAttempts, setAllStudentAttempts] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Auto-clear errors after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    checkAdminAndLoadData();
  }, [user]);

  const checkAdminAndLoadData = async () => {
    try {
      setLoading(true);
      
      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      const adminStatus = profile?.role === 'admin';
      setIsAdmin(adminStatus);
      
      if (adminStatus) {
        // Load all students' attempts for admin
        await loadAllStudentAttempts();
      } else {
        // Load only own attempts for students
        await loadAttempts();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAttempts = async () => {
    try {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAttempts(data || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadAllStudentAttempts = async () => {
    try {
      // Get all quiz attempts
      const { data: attemptsData, error: attemptsError } = await supabase
        .from('quiz_attempts')
        .select('*')
        .order('created_at', { ascending: false });

      if (attemptsError) throw attemptsError;

      console.log('Attempts data:', attemptsData); // DEBUG

      // Get all unique user IDs
      const userIds = [...new Set(attemptsData.map(a => a.user_id))];
      
      console.log('User IDs:', userIds); // DEBUG
      
      // Get profiles for these users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      console.log('Profiles data:', profilesData); // DEBUG

      // Add email to each attempt
      const attemptsWithEmails = attemptsData.map(attempt => ({
        ...attempt,
        userEmail: profilesData?.find(p => p.id === attempt.user_id)?.email || 'Unknown'
      }));

      console.log('Final attempts with emails:', attemptsWithEmails); // DEBUG

      setAllStudentAttempts(attemptsWithEmails);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (attemptId) => {
    if (!window.confirm('Are you sure you want to delete this draft?')) return;

    try {
      const { error } = await supabase
        .from('quiz_attempts')
        .delete()
        .eq('id', attemptId);

      if (error) throw error;
      
      if (isAdmin) {
        await loadAllStudentAttempts();
      } else {
        await loadAttempts();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatLessons = (lessonsArray) => {
    if (!lessonsArray || lessonsArray.length === 0) return '';
    // Convert "lesson1" -> "Lesson 1"
    return lessonsArray
      .map(l => l.replace('lesson', 'Lesson '))
      .join(', ');
  };

  const getStatusBadge = (status) => {
    const styles = {
      completed: { backgroundColor: '#4caf50', color: 'white' },
      draft: { backgroundColor: '#ff9800', color: 'white' },
      in_progress: { backgroundColor: '#2196f3', color: 'white' }
    };

    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 'bold',
        ...styles[status]
      }}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  // Filter logic for admin view
  const filteredAttempts = allStudentAttempts.filter(attempt => {
    const matchesSearch = (attempt.userEmail || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || attempt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="container">
        <p style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</p>
      </div>
    );
  }

  // ADMIN VIEW
  if (isAdmin) {
    return (
      <div className="container">
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
          
          {/* Header */}
          <div className="dashboard-header">
            <div className="dashboard-title-group">
              <h1 className="title" style={{ margin: 0, textAlign: 'left' }}>Admin Dashboard</h1>
              <p className="dashboard-subtitle">Monitoring student progress</p>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>

          {error && (
            <div style={{
              padding: '12px',
              marginBottom: '20px',
              backgroundColor: '#fee',
              color: '#c33',
              borderRadius: '8px'
            }}>
              {error}
            </div>
          )}

          {/* --- NEW FILTER BAR --- */}
          <div className="filter-bar">
            <input
              type="text"
              placeholder="Search by student email..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select 
              className="status-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="draft">Drafts</option>
              <option value="in_progress">In Progress</option>
            </select>
          </div>

          <h2 style={{ marginBottom: '20px', fontSize: '24px' }}>
            Student Attempts ({filteredAttempts.length})
          </h2>

          {filteredAttempts.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#666', padding: '40px', background: '#f8fafc', borderRadius: '12px' }}>
              <p>No attempts found matching your filters.</p>
              <button 
                className="button button-secondary" 
                style={{ width: 'auto', marginTop: '10px' }}
                onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {filteredAttempts.map((attempt) => (
                <div
                  key={attempt.id}
                  style={{
                    border: '2px solid #ddd',
                    borderRadius: '12px',
                    padding: '20px',
                    backgroundColor: 'white'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                     <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                       {getStatusBadge(attempt.status)}
                       <span style={{ fontWeight: 'bold', color: '#2196f3' }}>
                         {attempt.userEmail || 'Unknown Student'}
                       </span>
                     </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      {formatDate(attempt.created_at)}
                    </div>
                  </div>

                  <div style={{ marginBottom: '8px', fontSize: '15px', color: '#334155', fontWeight: '500' }}>
                    {attempt.selected_lessons && attempt.selected_lessons.length > 0 ? (
                      <span>📚 {formatLessons(attempt.selected_lessons)}</span>
                    ) : (
                      <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                        {attempt.parent_id ? 'Practice Set (Retry)' : 'General Practice'}
                      </span>
                    )}
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <strong>Questions:</strong> {attempt.questions?.length || 0}
                    {attempt.status === 'completed' && (
                      <span style={{ marginLeft: '20px' }}>
                        <strong>Score:</strong> {attempt.score} / {attempt.questions?.length || 0}
                        {' '}({Math.round((attempt.score / Math.max(attempt.questions?.length, 1)) * 100)}%)
                      </span>
                    )}
                  </div>

                  {attempt.parent_id && (
                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                      <em>Retry attempt</em>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // STUDENT VIEW
  return (
    <div className="container">
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
        
        {/* --- NEW HEADER SECTION --- */}
        <div className="dashboard-header">
          <div className="dashboard-title-group">
            <h1 className="title" style={{ margin: 0, textAlign: 'left' }}>Quiz Dashboard</h1>
            <p className="dashboard-subtitle">Welcome back, {user?.email?.split('@')[0]}</p>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>

        {error && (
          <div style={{
            padding: '12px',
            marginBottom: '20px',
            backgroundColor: '#fee',
            color: '#c33',
            borderRadius: '8px'
          }}>
            {error}
          </div>
        )}

        {/* --- NEW START QUIZ CARD --- */}
        <div className="start-quiz-card">
          <h2>Ready to practice?</h2>
          <p>Test your vocabulary knowledge with a new set of questions.</p>
          <button
            className="start-btn-primary"
            onClick={() => navigate('/quiz')}
          >
            Start New Quiz
          </button>
        </div>

        <h2 style={{ marginBottom: '20px', fontSize: '24px' }}>Quiz History</h2>

        {attempts.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
            No quiz attempts yet. Start your first quiz!
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {attempts.map((attempt) => (
              <div
                key={attempt.id}
                style={{
                  border: '2px solid #ddd',
                  borderRadius: '12px',
                  padding: '20px',
                  backgroundColor: 'white'
                }}
              >
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                   <div>
                     {getStatusBadge(attempt.status)}
                   </div>
                   <div style={{ fontSize: '14px', color: '#666' }}>
                     {formatDate(attempt.created_at)}
                   </div>
                 </div>

                 <div style={{ marginBottom: '8px', fontSize: '15px', color: '#334155', fontWeight: '500' }}>
                   {attempt.selected_lessons && attempt.selected_lessons.length > 0 ? (
                     <span>📚 {formatLessons(attempt.selected_lessons)}</span>
                   ) : (
                     <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                       {attempt.parent_id ? 'Practice Set (Retry)' : 'General Practice'}
                     </span>
                   )}
                 </div>

                 <div style={{ marginBottom: '10px' }}>
                   <strong>Questions:</strong> {attempt.questions?.length || 0}
                  {attempt.status === 'completed' && (
                    <span style={{ marginLeft: '20px' }}>
                      <strong>Score:</strong> {attempt.score} / {attempt.questions?.length || 0}
                      {' '}({Math.round((attempt.score / (attempt.questions?.length || 1)) * 100)}%)
                    </span>
                  )}
                </div>

                {attempt.parent_id && (
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                    <em>Retry attempt</em>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                  {attempt.status === 'draft' && (
                    <>
                      <button
                        className="button"
                        onClick={() => navigate(`/quiz/${attempt.id}`)}
                      >
                        Resume
                      </button>
                      <button
                        className="button button-secondary"
                        onClick={() => handleDelete(attempt.id)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;