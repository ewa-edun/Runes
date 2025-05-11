import { Link } from 'react-router-dom';
import './LiveRecord.css';
import { useState, useEffect, useRef } from 'react';
import { initVosk, transcribeAudio, cleanupVosk } from '../config/vosk';
import { 
  initBrowserSpeechRecognition, 
  startBrowserTranscription, 
  isSpeechRecognitionSupported 
} from '../config/browser-speech';

function LiveRecord() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [useBrowserAPI, setUseBrowserAPI] = useState(false);
  const stopTranscriptionRef = useRef(null);
  const voskInitializedRef = useRef(false);

  // Initialize Vosk when component mounts
  useEffect(() => {
    let isMounted = true;
    let initializationAttempts = 0;
    const MAX_ATTEMPTS = 3;
    
    const initialize = async () => {
      if (initializationAttempts >= MAX_ATTEMPTS) {
        if (isMounted) {
          setError(`Failed to initialize speech recognition after ${MAX_ATTEMPTS} attempts. Please try the browser's native speech recognition instead.`);
          setIsLoading(false);
        }
        return;
      }
      
      initializationAttempts++;
      
      try {
        setIsLoading(true);
        setError('');
        
        // Let the user know what's happening
        if (initializationAttempts > 1) {
          setError(`Retry attempt ${initializationAttempts}/${MAX_ATTEMPTS}...`);
        }
        
        console.log(`Vosk initialization attempt ${initializationAttempts}/${MAX_ATTEMPTS}`);
        
        // Initialize Vosk with timeout
        await initVosk();
        
        if (isMounted) {
          voskInitializedRef.current = true;
          setIsLoading(false);
          setError(''); // Clear any error messages on success
        }
      } catch (err) {
        console.error('Initialization error:', err);
        
        if (isMounted) {
          // Try to use browser's built-in SpeechRecognition as fallback
          if (isSpeechRecognitionSupported()) {
            console.log('Attempting to use browser speech recognition as fallback');
            try {
              await initBrowserSpeechRecognition();
              setUseBrowserAPI(true);
              setError('Vosk failed to load. Using browser\'s native speech recognition as fallback.');
              voskInitializedRef.current = true; // Mark as initialized anyway
              setIsLoading(false);
            } catch (browserErr) {
              console.error('Browser speech recognition failed too:', browserErr);
              // Continue with retries or failure
              if (initializationAttempts < MAX_ATTEMPTS) {
                // Continue to retry logic below
              } else {
                setError(`Speech recognition initialization failed. Both Vosk and browser API failed: ${err.message}`);
                setIsLoading(false);
              }
            }
          } else if (initializationAttempts < MAX_ATTEMPTS) {
            // Try again after a delay
            setError(`Initialization failed (${initializationAttempts}/${MAX_ATTEMPTS}). Retrying in 3 seconds...`);
            setTimeout(initialize, 3000);
          } else {
            setError(`Speech recognition initialization failed: ${err.message}. Please try again later.`);
            setIsLoading(false);
          }
        }
      }
    };

    initialize();

    // Cleanup function
    return () => {
      isMounted = false;
      if (stopTranscriptionRef.current) {
        stopTranscriptionRef.current();
      }
      cleanupVosk();
    };
  }, []);

  const handleRecording = async () => {
    // If currently recording, stop recording
    if (isRecording) {
      if (stopTranscriptionRef.current) {
        stopTranscriptionRef.current();
        stopTranscriptionRef.current = null;
      }
      setIsRecording(false);
      return;
    }

    // Don't start if speech recognition isn't ready
    if (!voskInitializedRef.current) {
      setError('Speech recognition is not initialized yet. Please try again later.');
      return;
    }

    // Start recording
    try {
      setError('');
      
      // Get user media with optimized audio settings
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: useBrowserAPI ? 44100 : 16000 // Browser API works better with default sample rate
        }
      });
      
      if (useBrowserAPI) {
        // Use browser's native SpeechRecognition API
        console.log('Starting browser speech recognition');
        stopTranscriptionRef.current = startBrowserTranscription(
          (text) => {
            setTranscript(prev => {
              // Add new text with proper spacing
              return prev ? `${prev} ${text}`.trim() : text.trim();
            });
          }
        );
      } else {
        // Use Vosk
        console.log('Starting Vosk transcription');
        // Create audio context with appropriate sample rate
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)({
          sampleRate: 16000
        });

        // Start transcription
        stopTranscriptionRef.current = await transcribeAudio(
          audioCtx,
          stream,
          (text) => {
            setTranscript(prev => {
              // Add new text with proper spacing
              return prev ? `${prev} ${text}`.trim() : text.trim();
            });
          }
        );
      }

      setIsRecording(true);
    } catch (err) {
      // Handle errors nicely
      if (err.name === 'NotAllowedError') {
        setError('Microphone access denied. Please allow microphone access to use this feature.');
      } else if (err.name === 'NotFoundError') {
        setError('No microphone detected. Please connect a microphone and try again.');
      } else {
        setError(`Recording error: ${err.message}`);
      }
      
      console.error('Recording error:', err);
      setIsRecording(false);
    }
  };

  // Button class based on recording state
  const buttonClass = `btn record-btn ${isRecording ? 'recording' : ''}`;

  return (
    <div className="live-record">
      <div className="container">
        <div className="record-header">
          <h2>Live Recording</h2>
          <div className="record-actions">
            <Link to="/notes" className="btn btn-outline">View Notes</Link>
            <Link to="/quiz" className="btn btn-outline">Take Quiz</Link>
            <button 
              className={buttonClass}
              onClick={handleRecording}
              disabled={isLoading}
            >
              {isLoading ? 'Loading Speech Recognition...' : 
               isRecording ? 'Stop Recording' : 'Start Recording'} 
            </button>
          </div>
        </div>
        
        <div className="record-content">
          {error && (
            <div className="error-container">
              <div className={error.includes('Using browser') ? "notice" : "error"}>
                {error}
              </div>
              
              {/* Show different button options based on the error */}
              {error.includes('initialization failed') && !error.includes('Using browser') && (
                <div className="button-group">
                  <button 
                    className="btn btn-outline retry-btn"
                    onClick={() => window.location.reload()}
                  >
                    Retry Loading
                  </button>
                  
                  {isSpeechRecognitionSupported() && !useBrowserAPI && (
                    <button 
                      className="btn btn-primary"
                      onClick={async () => {
                        try {
                          setIsLoading(true);
                          await initBrowserSpeechRecognition();
                          setUseBrowserAPI(true);
                          setError('Using browser\'s native speech recognition instead.');
                          voskInitializedRef.current = true;
                          setIsLoading(false);
                        } catch (err) {
                          setError(`Browser speech recognition also failed: ${err.message}`);
                          setIsLoading(false);
                        }
                      }}
                    >
                      Use Browser Speech Recognition
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
          
          <div className="transcription-area card">
            <h3>Live Transcription</h3>
            <div className="transcription-text">
              {transcript ? transcript : (
                <span className="placeholder-text">
                  {isRecording ? 'Listening...' : 'Transcript will appear here when you start recording...'}
                </span>
              )}
            </div>
          </div>

          <div className="summary-area card">
            <h3>AI Summary</h3>
            <div className="summary-text">
              {transcript ? 'Generating summary...' : 'AI-generated summary will appear after recording...'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LiveRecord;