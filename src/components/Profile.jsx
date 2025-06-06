import { useNavigate, Link } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState, useCallback } from 'react';
import './Profile.css';

function Profile() {
  const navigate = useNavigate();
  const user = auth.currentUser;
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  // Update usage_freq when user visits profile
  const updateUsageFrequency = useCallback(async () => {
    if (!user) return;
    
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        usage_freq: (userData?.usage_freq || 0) + 1,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating usage frequency:', error);
    }
  }, [user, userData?.usage_freq]);

  // Call this when component mounts
  useEffect(() => {
    updateUsageFrequency();
  }, [updateUsageFrequency]);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="profile">
      <div className="container">
        <div className="profile-card card">
          <div className="profile-header">
            <h2>Profile</h2>
            <button onClick={handleLogout} className="btn btn-outline">Logout</button>
          </div>
          
          <div className="profile-info">
            <div className="info-item">
              <label>Name</label>
              <p>{userData?.name || user?.displayName || 'Not set'}</p>
            </div>
            <div className="info-item">
              <label>Email</label>
              <p>{userData?.email || user?.email || 'Not set'}</p>
            </div>
          </div>

          <div className="profile-actions">
            <Link to="/notes" className="btn">
              <svg viewBox="0 0 24 24" className="action-icon">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
              My Notes
            </Link>
            <Link to="/settings" className="btn">
              <svg viewBox="0 0 24 24" className="action-icon">
                <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.63-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
              </svg>
              Settings
            </Link>

            <div className="usage-stats">
              <p>App Usage: {userData?.usage_freq || 0} times</p>
              <p>Member since: {userData?.created_at?.toDate?.().toLocaleDateString() || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;