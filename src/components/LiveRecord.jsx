import { Link } from 'react-router-dom'
import './LiveRecord.css'
import { useState, useEffect, useRef } from 'react'
import { initVosk, transcribeAudio } from '../config/vosk'

function LiveRecord() {
  const [isRecording, setIsRecording] = useState(false)
  const [transcription, setTranscription] = useState('')
  const [error, setError] = useState('')
  const [isTranscribing, setIsTranscribing] = useState(false)
  const audioContextRef = useRef(null)
  const mediaStreamRef = useRef(null)
  const voskModelRef = useRef(null)

  useEffect(() => {
    // Initialize Vosk model
    const init = async () => {
      try {
        const model = await initVosk();
        voskModelRef.current = model;
      } catch (error) {
        setError('Failed to initialize speech recognition');
        console.error('Vosk initialization error:', error);
      }
    };

    init();

    return () => {
      const stream = mediaStreamRef.current;
      const audioCtx = audioContextRef.current;
      
      if (stream) {
        if (stream.stopTranscription) {
          stream.stopTranscription();
        }
        stream.getTracks().forEach(track => track.stop());
      }
      if (audioCtx) {
        audioCtx.close();
      }
    };
  }, []);

  const handleRecording = async () => {
    try {
      if (isRecording) {
        // Stop recording and transcription
        setIsRecording(false);
        setIsTranscribing(false);
      } else {
        // Start recording
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        // Create audio context
        const audioCtx = new AudioContext();
        audioContextRef.current = audioCtx;

        // Start transcription
        const stopTranscription = await transcribeAudio(voskModelRef.current, audioContextRef.current, mediaStreamRef.current, setTranscription);
        setIsRecording(true);
        setIsTranscribing(true);

        // Store the stop function
        mediaStreamRef.current.stopTranscription = stopTranscription;
      }
    } catch (err) {
      setError(err.message);
      console.error('Error:', err);
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
              disabled={isTranscribing}
            >
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>
          </div>
        </div>
        
        <div className="record-content">
          <div className="transcription-area card">
            <h3>Live Transcription</h3>
            <div className="transcription-text">
              {isTranscribing ? 'Transcribing...' : transcription}
              {error && <div className="error">{error}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LiveRecord
