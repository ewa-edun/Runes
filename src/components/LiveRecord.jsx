import { Link } from 'react-router-dom'
import './LiveRecord.css'
import { useState, useEffect, useRef } from 'react';
import { initVosk, transcribeAudio } from '../config/vosk';

function LiveRecord() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const stopTranscriptionRef = useRef(null);

  // Initialize Vosk
  useEffect(() => {
    const initialize = async () => {
      try {
        await initVosk();
        setIsLoading(false);
      } catch (err) {
        setError('Failed to load speech recognition');
        console.error('Initialization error:', err);
        setIsLoading(false);
      }
    };

    initialize();

    return () => {
      stopTranscriptionRef.current?.();
    };
  }, [setError]);

  const handleRecording = async () => {
    if (isRecording) {
      stopTranscriptionRef.current?.();
      setIsRecording(false);
      return;
    }

    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        }
      });
      
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000
      });

      stopTranscriptionRef.current = await transcribeAudio(
        audioCtx,
        stream,
        (text) => setTranscript(prev => `${prev} ${text}`.trim())
      );

      setIsRecording(true);
    } catch (err) {
      setError(err.message);
      console.error('Recording error:', err);
      setIsRecording(false);
    }
  };

  return (
    <div className="live-record">
      <div className="container">
        <div className="record-header">
          <h2>Live Recording</h2>
          <div className="record-actions">
            <Link to="/notes" className="btn btn-outline">View Notes</Link>
            <Link to="/quiz" className="btn btn-outline">Take Quiz</Link>
            <button 
              className="btn record-btn"
              onClick={handleRecording}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : isRecording ? 'Stop Recording' : 'Start Recording'} 
            </button>
          </div>
        </div>
        
        <div className="record-content">
          {error && <div className="error">{error}</div>}
          <div className="transcription-area card">
            <h3>Live Transcription</h3>
            <div className="transcription-text">
              Transcript: {transcript}
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
