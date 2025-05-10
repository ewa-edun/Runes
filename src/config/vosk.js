import { Model, KaldiRecognizer } from 'vosk-browser';

export const initVosk = async () => {
  try {
    // Initialize the model with the correct path
    const model = new Model('/vosk-model-small-en-us-0.15');
    await model.init();
    return model;
  } catch (error) {
    console.error('Error initializing Vosk model:', error);
    throw error;
  }
};

/**
 * Transcribes audio from a media stream using the Vosk speech recognition model.
 * 
 * @param {Model} model The Vosk speech recognition model.
 * @param {AudioContext} audioContext The audio context to use for transcription.
 * @param {MediaStream} stream The media stream to transcribe.
 * @param {(transcript: string) => void} onTranscriptionUpdate A callback function to update the transcription in real-time.
 * @returns {Promise<string>} A promise that resolves with the final transcription.
 */
export const transcribeAudio = async (model, audioContext, stream, onTranscriptionUpdate) => {
  if (typeof onTranscriptionUpdate !== 'function') {
    throw new Error('onTranscriptionUpdate must be a function');
  }

  try {
    const recognizer = new KaldiRecognizer(model, 16000);
    await recognizer.init();
    
    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);

    source.connect(processor);
    processor.connect(audioContext.destination);

    const bufferQueue = [];

    return new Promise((resolve) => {
      let transcript = '';

      processor.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        bufferQueue.push(new Float32Array(input));

        recognizer.acceptWaveform(input).then((result) => {
          if (result.text) {
            transcript += ' ' + result.text;
            // Update the transcription in real-time
            onTranscriptionUpdate((prev) => prev + ' ' + result.text);
          }
        });
      };

      // Add a way to stop the transcription
      const stopTranscription = () => {
        stream.getTracks().forEach(track => track.stop());
        processor.disconnect();
        source.disconnect();
        resolve(transcript.trim());
      };

      return stopTranscription;
    });
  } catch (error) {
    console.error('Error during transcription:', error);
    throw error;
  }
};
