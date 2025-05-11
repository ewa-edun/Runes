// Enhanced Vosk speech recognition with better error handling
// and more robust initialization

// Track Vosk initialization state
let isVoskInitializing = false;
let isVoskReady = false;
let model = null;
let recognizer = null;

/**
 * Loads the Vosk script dynamically with better error tracking
 * @returns {Promise} Promise that resolves when script is loaded
 */
const loadVoskScript = () => {
  return new Promise((resolve, reject) => {
    // Don't load if already loaded
    if (window.Vosk) {
      return resolve(window.Vosk);
    }
    
    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="vosk-browser"]');
    if (existingScript) {
      // Poll for Vosk to become available
      const checkInterval = setInterval(() => {
        if (window.Vosk) {
          clearInterval(checkInterval);
          resolve(window.Vosk);
        }
      }, 100);
      
      // Also set a timeout in case polling doesn't detect it
      setTimeout(() => {
        if (!window.Vosk) {
          clearInterval(checkInterval);
          // Remove the possibly broken script
          existingScript.remove();
          reject(new Error('Vosk script loading timed out during polling'));
        }
      }, 10000);
      return;
    }
    
    // Load the script with better error tracking
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/vosk-browser@0.3.4/dist/vosk.js';
    script.crossOrigin = 'anonymous'; // Add cross-origin attribute
    
    // Add load event listener
    script.addEventListener('load', () => {
      console.log('Vosk script loaded successfully');
      // Double check Vosk is actually available
      if (window.Vosk) {
        resolve(window.Vosk);
      } else {
        reject(new Error('Vosk script loaded but Vosk object not available'));
      }
    });
    
    // Add error event listener with more detailed error info
    script.addEventListener('error', (event) => {
      const errorMsg = event.message || 'Unknown error loading Vosk script';
      console.error('Failed to load Vosk script:', event);
      reject(new Error(`Failed to load Vosk script: ${errorMsg}`));
    });
    
    // Set timeout for script loading
    const LOAD_TIMEOUT = setTimeout(() => {
      if (!window.Vosk) {
        reject(new Error('Vosk script loading timed out'));
      }
    }, 15000);
    
    // Append to document
    document.body.appendChild(script);
    
    console.log('Vosk script tag added to document');
  });
};

/**
 * Try loading model with configurable path
 * @param {string} modelPath - Path to the Vosk model
 * @returns {Promise} Promise that resolves with the loaded model
 */
const loadVoskModel = (modelPath = '/vosk-model-small-en-us-0.15') => {
  return new Promise((resolve, reject) => {
    try {
      console.log(`Loading Vosk model from: ${modelPath}`);
      const newModel = new window.Vosk.Model(modelPath);
      console.log('Vosk model loaded successfully');
      resolve(newModel);
    } catch (error) {
      console.error('Error loading Vosk model:', error);
      reject(error);
    }
  });
};

/**
 * Initialize Vosk with improved error handling and loading states
 * @param {Object} options - Configuration options
 * @param {string} options.modelPath - Path to the Vosk model
 * @param {number} options.scriptTimeout - Timeout for script loading in ms
 * @param {number} options.modelTimeout - Timeout for model loading in ms
 * @returns {Promise<boolean>} Promise that resolves to true when Vosk is ready
 */
export const initVosk = async (options = {}) => {
  const {
    modelPath = '/vosk-model-small-en-us-0.15',
    scriptTimeout = 20000,
    modelTimeout = 30000
  } = options;
  
  // Return immediately if already ready
  if (isVoskReady) return true;
  
  // Prevent multiple simultaneous initialization attempts
  if (isVoskInitializing) {
    console.log('Vosk is already initializing, waiting for completion');
    // Wait for the existing initialization to complete
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (isVoskReady) {
          clearInterval(checkInterval);
          resolve(true);
        } else if (!isVoskInitializing) {
          clearInterval(checkInterval);
          reject(new Error('Vosk initialization failed'));
        }
      }, 100);
      
      // Set a timeout for this waiting period too
      setTimeout(() => {
        if (!isVoskReady && isVoskInitializing) {
          clearInterval(checkInterval);
          reject(new Error('Timed out waiting for existing Vosk initialization'));
        }
      }, 15000);
    });
  }
  
  try {
    isVoskInitializing = true;
    console.log('Starting Vosk initialization');
    
    // Load Vosk script with timeout
    const Vosk = await Promise.race([
      loadVoskScript(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Vosk script loading timed out')), scriptTimeout)
      )
    ]);
    
    console.log('Vosk script loaded, now loading model');
    
    // Initialize model with timeout
    model = await Promise.race([
      loadVoskModel(modelPath),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Vosk model loading timed out')), modelTimeout)
      )
    ]);
    
    console.log('Vosk initialized successfully');
    isVoskReady = true;
    return true;
  } catch (error) {
    console.error('Vosk initialization failed:', error);
    isVoskReady = false;
    throw error;
  } finally {
    isVoskInitializing = false;
  }
};

/**
 * Cleanup function to properly dispose of Vosk resources
 */
export const cleanupVosk = () => {
  if (recognizer) {
    try {
      recognizer.free();
    } catch (e) {
      console.error('Error freeing recognizer:', e);
    }
    recognizer = null;
  }
  
  if (model) {
    try {
      model.free();
    } catch (e) {
      console.error('Error freeing model:', e);
    }
    model = null;
  }
  
  isVoskReady = false;
  console.log('Vosk resources cleaned up');
};

/**
 * Check if Vosk is ready for use
 * @returns {boolean} True if Vosk is initialized and ready
 */
export const isVoskInitialized = () => {
  return isVoskReady && model !== null;
};

/**
 * Transcribe audio using Vosk with improved error handling
 * @param {AudioContext} audioContext - Web Audio context
 * @param {MediaStream} stream - Audio stream
 * @param {Function} onResult - Callback for final results
 * @param {Function} onPartial - Optional callback for partial results
 * @param {Function} onError - Optional callback for errors during transcription
 * @returns {Function} Function to stop transcription
 */
export const transcribeAudio = async (audioContext, stream, onResult, onPartial = null, onError = null) => {
  if (!isVoskReady || !model) {
    throw new Error('Vosk not initialized');
  }

  let source = null;
  let processor = null;
  
  try {
    console.log('Creating Vosk recognizer with sample rate:', audioContext.sampleRate);
    // Create recognizer
    recognizer = new window.Vosk.KaldiRecognizer(model, audioContext.sampleRate);
    
    // Set up audio processing
    source = audioContext.createMediaStreamSource(stream);
    processor = audioContext.createScriptProcessor(4096, 1, 1);
    
    source.connect(processor);
    processor.connect(audioContext.destination);
    
    console.log('Audio processing chain set up for Vosk');
    
    // Process audio chunks
    processor.onaudioprocess = (e) => {
      if (!recognizer) return;
      
      try {
        const data = e.inputBuffer.getChannelData(0);
        const result = recognizer.acceptWaveform(data);
        
        if (result) {
          const finalResult = recognizer.result();
          if (finalResult && finalResult.text) {
            onResult(finalResult.text);
          }
        } else if (onPartial) {
          // Handle partial results
          const partialResult = recognizer.partialResult();
          if (partialResult && partialResult.partial && partialResult.partial.trim()) {
            onPartial(partialResult.partial);
          }
        }
      } catch (processingError) {
        console.error('Error processing audio chunk:', processingError);
        if (onError) {
          onError(processingError);
        }
      }
    };
    
    console.log('Vosk transcription started');
    
    // Return cleanup function
    return () => {
      console.log('Stopping Vosk transcription');
      
      try {
        if (recognizer) {
          // Get final result before cleaning up
          const finalResult = recognizer.finalResult();
          if (finalResult && finalResult.text) {
            onResult(finalResult.text);
          }
        }
      } catch (finalError) {
        console.error('Error getting final result:', finalError);
      }
      
      // Clean up audio resources
      try {
        if (processor) {
          processor.disconnect();
        }
        if (source) {
          source.disconnect();
        }
      } catch (disconnectError) {
        console.error('Error disconnecting audio nodes:', disconnectError);
      }
      
      // Don't destroy the recognizer here - it may be reused
      console.log('Vosk transcription stopped');
    };
  } catch (error) {
    // Clean up any partially initialized resources
    try {
      if (processor) processor.disconnect();
      if (source) source.disconnect();
    } catch (cleanupError) {
      console.error('Error during cleanup after transcription error:', cleanupError);
    }
    
    console.error('Error during transcription setup:', error);
    throw error;
  }
};