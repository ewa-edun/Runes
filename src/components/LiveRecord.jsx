import { Link } from 'react-router-dom'
import './LiveRecord.css'

function LiveRecord() {
  return (
    <div className="live-record">
      <div className="container">
        <div className="record-header">
          <h2>Live Recording</h2>
          <div className="record-actions">
            <Link to="/notes" className="btn btn-outline">View Notes</Link>
            <Link to="/quiz" className="btn btn-outline">Take Quiz</Link>
            <button className="btn record-btn">Start Recording</button>
          </div>
        </div>
        
        <div className="record-content">
          <div className="transcription-area card">
            <h3>Live Transcription</h3>
            <div className="transcription-text">
              Your transcription will appear here...
            </div>
          </div>
          
          <div className="summary-area card">
            <h3>AI Summary</h3>
            <div className="summary-text">
              AI-generated summary will appear here...
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LiveRecord
