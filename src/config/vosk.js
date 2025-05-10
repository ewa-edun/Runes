//import { createModel, createKaldiRecognizer } from 'vosk-browser';

// Simple Vosk implementation
// Track Vosk initialization state
let isVoskReady = false;
let model = null;
let recognizer = null;

export const initVosk = async () => {
  if (isVoskReady) return true;
  
  // Load Vosk script if not already loaded
  if (!document.querySelector('script[src*="vosk-browser"]')) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/vosk-browser@0.3.4/dist/vosk.js';
    document.body.appendChild(script);
  }

  // Wait for Vosk to be available with timeout
  try {
    await new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (window.Vosk) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('Vosk loading timed out'));
      }, 10000);
    });

    // Initialize model
    model = new window.Vosk.Model('/vosk-model-small-en-us-0.15');
    isVoskReady = true;
    return true;
  } catch (error) {
    console.error('Vosk initialization failed:', error);
    isVoskReady = false;
    throw error;
  }
};

// Cleanup function
export const cleanupVosk = () => {
  if (recognizer) {
    recognizer.removeAllListeners();
    recognizer = null;
  }
  if (model) {
    model = null;
  }
  isVoskReady = false;
};

export const transcribeAudio = async (audioContext, stream, onResult, onTranscriptionUpdate) => {
  if (!isVoskReady || !model) {
    throw new Error('Vosk not initialized');
  }

  try {
    recognizer = new window.Vosk.KaldiRecognizer(model, 16000);
    
    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);

    source.connect(processor);
    processor.connect(audioContext.destination);

    recognizer.on('result', (message) => {
      //if (message && message.result) {
        if (message?.result?.text) {
        onResult(message.result.text);
      }
    });

    processor.onaudioprocess = (e) => {
      const data = e.inputBuffer.getChannelData(0);
      recognizer.acceptWaveform(data);
    };

    source.connect(processor);
    processor.connect(audioContext.destination);

    return new Promise((resolve) => {
      let transcript = '';

      processor.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        
        // Process audio chunk
        recognizer.acceptWaveform(input);
        
        // Get partial result
        const partialResult = recognizer.result();
        if (partialResult && partialResult.text) {
          transcript = partialResult.text;
          onTranscriptionUpdate(transcript);
        }
      };

      // Add a way to stop the transcription
      const stopTranscription = () => {
        // Get final result
        const finalResult = recognizer.finalResult();
        if (finalResult && finalResult.text) {
          transcript = finalResult.text;
          onTranscriptionUpdate(transcript);
        }
        
        stream.getTracks().forEach(track => track.stop());
        processor.disconnect();
        source.disconnect();
        resolve(transcript.trim());
      };

      // Return cleanup function
      return stopTranscription;
    });
  } catch (error) {
    console.error('Error during transcription:', error);
    throw error;
  }
};