import { Link } from 'react-router-dom'
import './Settings.css'

function Settings() {
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
            <select className="setting-select">
              <option value="5">Every 5 notes</option>
              <option value="10">Every 10 notes</option>
              <option value="15">Every 15 notes</option>
            </select>
          </div>
          <div className="setting-item">
            <label>Default Difficulty</label>
            <select className="setting-select">
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
              <input type="checkbox" />
              <span className="slider"></span>
            </label>
          </div>
          <div className="setting-item">
            <label>Study Reminders</label>
            <label className="switch">
              <input type="checkbox" />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        <div className="settings-section card">
          <h3>Export Options</h3>
          <div className="export-buttons">
            <button className="btn">Export as PDF</button>
            <button className="btn">Export as Markdown</button>
            <button className="btn">Export to Google Docs</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
