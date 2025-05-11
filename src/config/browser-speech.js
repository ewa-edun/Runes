const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let restartAttempts = 0;
const MAX_RESTART_ATTEMPTS = 3;
const RESTART_DELAYS = [1000, 3000, 5000]; // Progressive delays

export const initBrowserSpeechRecognition = () => {
  return new Promise((resolve, reject) => {
    if (!SpeechRecognition) {
      reject(new Error('Speech recognition not supported in this browser'));
      return;
    }
    resolve(true);
  });
};

export const startBrowserTranscription = (onResult, options = {}) => {
  const { onError = () => {}, onStateChange = () => {} } = options;

  // Clean up any existing recognition
  stopBrowserTranscription();

  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onresult = (event) => {
    let finalTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript + ' ';
      }
    }
    if (finalTranscript.trim()) {
      onResult(finalTranscript.trim());
    }
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    onError(event.error);
    
    // Special handling for network errors
    if (event.error === 'network') {
      if (restartAttempts < MAX_RESTART_ATTEMPTS) {
        const delay = RESTART_DELAYS[restartAttempts];
        console.log(`Network error - restarting in ${delay}ms`);
        setTimeout(() => {
          restartAttempts++;
          startBrowserTranscription(onResult, options);
        }, delay);
      } else {
        onStateChange('error', 'Network unavailable after multiple attempts');
      }
    }
  };

  recognition.onend = () => {
    if (recognition && recognition.isStarted) {
      console.log('Recognition ended unexpectedly - restarting');
      setTimeout(() => startBrowserTranscription(onResult, options), 1000);
    }
  };

  try {
    recognition.isStarted = true;
    recognition.start();
    onStateChange('started');
    return () => stopBrowserTranscription();
  } catch (error) {
    onError(error.message);
    throw error;
  }
};

export const stopBrowserTranscription = () => {
  if (recognition) {
    recognition.isStarted = false;
    try {
      recognition.stop();
    } catch {
      recognition.abort();
    }
    recognition = null;
  }
  restartAttempts = 0;
};

export const isSpeechRecognitionSupported = () => {
  return !!SpeechRecognition;
};