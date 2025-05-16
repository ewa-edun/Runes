import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { auth, db } from '../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import './Settings.css';

function Settings() {
  const [settings, setSettings] = useState({
    quiz_frequency: 10,
    default_difficulty: 'easy',
    daily_recap_emails: false,
    study_reminders: false,
    export_method: 'pdf'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserSettings = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setSettings({
            quiz_frequency: userData.settings?.quiz_frequency || 10,
            default_difficulty: userData.settings?.default_difficulty || 'easy',
            daily_recap_emails: userData.daily_recap_emails || false,
            study_reminders: userData.study_reminders || false,
            export_method: userData.export_method || 'pdf'
          });
        }
      } catch (error) {
        console.error('Error fetching user settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserSettings();
  }, []);

  const handleSettingChange = async (field, value) => {
    const user = auth.currentUser;
    if (!user) return;

    const updatedSettings = { ...settings, [field]: value };
    setSettings(updatedSettings);

    try {
      const userRef = doc(db, 'users', user.uid);
      if (['quiz_frequency', 'default_difficulty'].includes(field)) {
        await updateDoc(userRef, {
          [`settings.${field}`]: value,
          updatedAt: new Date().toISOString()
        });
      } else {
        await updateDoc(userRef, {
          [field]: value,
          updatedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading settings...</div>;
  }

  return (
    <div className="settings">
      <div className="container">
        <div className="settings-header">
          <h2>Settings</h2>
          <Link to="/notes" className="btn btn-outline">Back to Notes</Link>
        </div>
        
        <div className="settings-section card">
          <h3>Quiz Preferences</h3>
          <div className="setting-item">
            <label>Quiz Frequency</label>
            <select 
              className="setting-select"
              value={settings.quiz_frequency}
              onChange={(e) => handleSettingChange('quiz_frequency', parseInt(e.target.value))}
            >
              <option value={2}>Every 2 notes</option>
              <option value={5}>Every 5 notes</option>
              <option value={10}>Every 10 notes</option>
              <option value={15}>Every 15 notes</option>
            </select>
          </div>
          <div className="setting-item">
            <label>Default Difficulty</label>
            <select 
              className="setting-select"
              value={settings.default_difficulty}
              onChange={(e) => handleSettingChange('default_difficulty', e.target.value)}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        <div className="settings-section card">
          <h3>Notifications</h3>
          <div className="setting-item">
            <label>Daily Recap Emails</label>
            <label className="switch">
              <input 
                type="checkbox" 
                checked={settings.daily_recap_emails}
                onChange={(e) => handleSettingChange('daily_recap_emails', e.target.checked)}
              />
              <span className="slider"></span>
            </label>
          </div>
          <div className="setting-item">
            <label>Study Reminders</label>
            <label className="switch">
              <input 
                type="checkbox" 
                checked={settings.study_reminders}
                onChange={(e) => handleSettingChange('study_reminders', e.target.checked)}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        <div className="settings-section card">
          <h3>Export Options</h3>
          <div className="export-buttons">
            <button 
              className={`btn ${settings.export_method === 'pdf' ? 'active' : ''}`}
              onClick={() => handleSettingChange('export_method', 'pdf')}
            >
              Export as PDF
            </button>
            <button 
              className={`btn ${settings.export_method === 'markdown' ? 'active' : ''}`}
              onClick={() => handleSettingChange('export_method', 'markdown')}
            >
              Export as Markdown
            </button>
            <button 
              className={`btn ${settings.export_method === 'google-docs' ? 'active' : ''}`}
              onClick={() => handleSettingChange('export_method', 'google-docs')}
            >
              Export to Google Docs
            </button>
          </div>
          <div className="usage-stats">
            <p>Current Export Method: {settings.export_method || 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
