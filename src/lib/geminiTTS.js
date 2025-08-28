/**
 * Gemini 2.5 Flash TTS Service
 * Handles text-to-speech conversion using Google's Gemini 2.5 Flash TTS
 */

import { GoogleGenAI } from '@google/genai';
import mime from 'mime';

// Initialize Gemini AI
const genAI = new GoogleGenAI({
  apiKey: process.env.REACT_APP_GEMINI_API_KEYY
});

/**
 * Convert WAV data to audio blob for browser playback
 * @param {string} rawData - Base64 encoded audio data
 * @param {string} mimeType - MIME type of the audio
 * @returns {Blob} Audio blob for playback
 */
function convertToWav(rawData, mimeType) {
  const options = parseMimeType(mimeType);
  const wavHeader = createWavHeader(rawData.length, options);
  const buffer = Buffer.from(rawData, 'base64');
  
  return new Blob([wavHeader, buffer], { type: 'audio/wav' });
}

/**
 * Parse MIME type to extract audio parameters
 * @param {string} mimeType - MIME type string
 * @returns {Object} Audio parameters
 */
function parseMimeType(mimeType) {
  const [fileType, ...params] = mimeType.split(';').map(s => s.trim());
  const [_, format] = fileType.split('/');

  const options = {
    numChannels: 1,
    sampleRate: 24000,
    bitsPerSample: 16
  };

  if (format && format.startsWith('L')) {
    const bits = parseInt(format.slice(1), 10);
    if (!isNaN(bits)) {
      options.bitsPerSample = bits;
    }
  }

  for (const param of params) {
    const [key, value] = param.split('=').map(s => s.trim());
    if (key === 'rate') {
      options.sampleRate = parseInt(value, 10);
    }
  }

  return options;
}

/**
 * Create WAV header for audio data
 * @param {number} dataLength - Length of audio data
 * @param {Object} options - Audio parameters
 * @returns {ArrayBuffer} WAV header
 */
function createWavHeader(dataLength, options) {
  const {
    numChannels,
    sampleRate,
    bitsPerSample,
  } = options;

  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);

  // WAV header structure
  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');                       // ChunkID
  view.setUint32(4, 36 + dataLength, true);    // ChunkSize
  writeString(8, 'WAVE');                       // Format
  writeString(12, 'fmt ');                      // Subchunk1ID
  view.setUint32(16, 16, true);                 // Subchunk1Size (PCM)
  view.setUint16(20, 1, true);                  // AudioFormat (1 = PCM)
  view.setUint16(22, numChannels, true);        // NumChannels
  view.setUint32(24, sampleRate, true);         // SampleRate
  view.setUint32(28, byteRate, true);           // ByteRate
  view.setUint16(32, blockAlign, true);         // BlockAlign
  view.setUint16(34, bitsPerSample, true);      // BitsPerSample
  writeString(36, 'data');                      // Subchunk2ID
  view.setUint32(40, dataLength, true);         // Subchunk2Size

  return buffer;
}

/**
 * Generate podcast audio using Gemini 2.5 Flash TTS
 * @param {Object} podcastScript - Podcast script with speakers
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} Audio data and metadata
 */
/**
 * Generate podcast audio using Gemini 2.5 Flash TTS
 * @param {Object} podcastScript - Podcast script with speakers
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} Audio data and metadata
 */
export const generatePodcastAudioWithGemini = async (podcastScript, onProgress = null) => {
  try {
    console.log('Starting Gemini TTS podcast generation...');

    if (onProgress) {
      onProgress({
        progress: 10,
        status: 'Preparing TTS request...',
        currentSegment: 0,
        totalSegments: podcastScript.script.length
      });
    }

    // ========== COMPLETE PODCAST SCRIPT LOGGING ==========
    console.log('\n' + '='.repeat(80));
    console.log('📝 COMPLETE PODCAST SCRIPT BEFORE TTS GENERATION');
    console.log('='.repeat(80));
    console.log(`🎙️  Title: ${podcastScript.title}`);
    console.log(`⏱️  Duration: ${podcastScript.duration}`);
    console.log(`👥 Speakers: ${podcastScript.speakers.host} (Host) & ${podcastScript.speakers.expert} (Expert)`);
    console.log(`📊 Total Segments: ${podcastScript.script.length}`);
    console.log('\n🎯 KEY TAKEAWAYS:');
    podcastScript.keyTakeaways?.forEach((takeaway, index) => {
      console.log(`   ${index + 1}. ${takeaway}`);
    });
    console.log('\n' + '-'.repeat(80));
    console.log('📜 FULL SCRIPT WITH ALL SEGMENTS:');
    console.log('-'.repeat(80));

    podcastScript.script.forEach((segment, index) => {
      console.log(`\n[Segment ${index + 1}] ${segment.speaker}:`);
      console.log(`"${segment.text}"`);
      console.log(`   (Length: ${segment.text.length} characters)`);
    });

    console.log('\n' + '-'.repeat(80));
    console.log('📈 SCRIPT STATISTICS:');
    console.log('-'.repeat(80));
    const totalCharacters = podcastScript.script.reduce((sum, segment) => sum + segment.text.length, 0);
    const hostSegments = podcastScript.script.filter(s => s.speaker === podcastScript.speakers.host).length;
    const expertSegments = podcastScript.script.filter(s => s.speaker === podcastScript.speakers.expert).length;
    const avgSegmentLength = Math.round(totalCharacters / podcastScript.script.length);

    console.log(`📝 Total Characters: ${totalCharacters}`);
    console.log(`🎤 ${podcastScript.speakers.host} Segments: ${hostSegments}`);
    console.log(`👨‍🏫 ${podcastScript.speakers.expert} Segments: ${expertSegments}`);
    console.log(`📏 Average Segment Length: ${avgSegmentLength} characters`);
    console.log('='.repeat(80) + '\n');

    // Format the script for TTS
    const scriptText = podcastScript.script.map(segment =>
      `${segment.speaker}: ${segment.text}`
    ).join('\n');

    console.log('🔄 Script formatted for TTS (first 200 chars):', scriptText.substring(0, 200) + '...');
    console.log(`📊 Final TTS Input Length: ${scriptText.length} characters`);

    // Configure TTS with multi-speaker voices
    const config = {
      temperature: 0.8,
      responseModalities: ['audio'],
      speechConfig: {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: [
            {
              speaker: podcastScript.speakers.host,
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: 'Zephyr' // Female voice for host
                }
              }
            },
            {
              speaker: podcastScript.speakers.expert,
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: 'Puck' // Male voice for expert
                }
              }
            }
          ]
        }
      }
    };

    const model = 'gemini-2.5-pro-preview-tts';
    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: `Read this podcast script aloud with natural conversation flow and appropriate pauses between speakers:\n\n${scriptText}`
          }
        ]
      }
    ];

    if (onProgress) {
      onProgress({
        progress: 30,
        status: 'Generating audio with Gemini TTS...',
        currentSegment: 0,
        totalSegments: podcastScript.script.length
      });
    }

    // Generate audio stream
    const response = await genAI.models.generateContentStream({
      model,
      config,
      contents
    });

    const audioChunks = [];
    let chunkIndex = 0;

    if (onProgress) {
      onProgress({
        progress: 50,
        status: 'Processing audio stream...',
        currentSegment: 0,
        totalSegments: podcastScript.script.length
      });
    }

    // Process audio chunks with better format handling
    for await (const chunk of response) {
      if (!chunk.candidates || !chunk.candidates[0].content || !chunk.candidates[0].content.parts) {
        continue;
      }

      if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
        const inlineData = chunk.candidates[0].content.parts[0].inlineData;
        const audioData = inlineData.data;
        const originalMimeType = inlineData.mimeType;
        
        console.log(`Received audio chunk ${chunkIndex + 1}, MIME type: ${originalMimeType}`);
        
        try {
          // Convert base64 to binary data
          const binaryData = atob(audioData);
          const bytes = new Uint8Array(binaryData.length);
          for (let i = 0; i < binaryData.length; i++) {
            bytes[i] = binaryData.charCodeAt(i);
          }
          
          // Determine the best MIME type for browser compatibility
          let finalMimeType = 'audio/wav'; // Default fallback
          
          if (originalMimeType) {
            if (originalMimeType.includes('mp3') || originalMimeType.includes('mpeg')) {
              finalMimeType = 'audio/mpeg';
            } else if (originalMimeType.includes('wav') || originalMimeType.includes('wave')) {
              finalMimeType = 'audio/wav';
            } else if (originalMimeType.includes('ogg')) {
              finalMimeType = 'audio/ogg';
            } else if (originalMimeType.includes('webm')) {
              finalMimeType = 'audio/webm';
            } else if (originalMimeType.includes('m4a') || originalMimeType.includes('aac')) {
              finalMimeType = 'audio/mp4';
            }
          }
          
          // Create audio blob with proper MIME type
          const audioBlob = new Blob([bytes], { type: finalMimeType });
          
          // Validate the blob has content
          if (audioBlob.size > 0) {
            audioChunks.push(audioBlob);
            chunkIndex++;
            console.log(`✅ Audio chunk ${chunkIndex} processed successfully (${audioBlob.size} bytes, ${finalMimeType})`);
          } else {
            console.warn(`⚠️ Audio chunk ${chunkIndex + 1} is empty, skipping`);
          }

        } catch (error) {
          console.error(`❌ Error processing audio chunk ${chunkIndex + 1}:`, error);
          // Continue processing other chunks
        }

        if (onProgress) {
          onProgress({
            progress: 50 + (chunkIndex * 40 / Math.max(1, chunkIndex + 1)),
            status: `Processing audio chunk ${chunkIndex}...`,
            currentSegment: chunkIndex,
            totalSegments: podcastScript.script.length
          });
        }
      } else if (chunk.text) {
        console.log('TTS Response:', chunk.text);
      }
    }

    if (audioChunks.length === 0) {
      throw new Error('No valid audio data received from Gemini TTS');
    }

    console.log(`📊 Total audio chunks received: ${audioChunks.length}`);

    // Determine the best final MIME type based on the chunks
    const firstChunkType = audioChunks[0].type;
    let finalMimeType = 'audio/wav'; // Safe default
    
    // Use the MIME type from the first chunk if it's browser-compatible
    if (firstChunkType.includes('mpeg') || firstChunkType.includes('mp3')) {
      finalMimeType = 'audio/mpeg';
    } else if (firstChunkType.includes('wav')) {
      finalMimeType = 'audio/wav';
    } else if (firstChunkType.includes('ogg')) {
      finalMimeType = 'audio/ogg';
    } else if (firstChunkType.includes('webm')) {
      finalMimeType = 'audio/webm';
    }

    // Combine all audio chunks into a single blob
    const finalAudioBlob = new Blob(audioChunks, { type: finalMimeType });
    
    console.log(`🎵 Final audio blob created: ${finalAudioBlob.size} bytes, type: ${finalMimeType}`);
    
    // Create object URL for playback
    const audioUrl = URL.createObjectURL(finalAudioBlob);

    if (onProgress) {
      onProgress({
        progress: 100,
        status: 'Podcast audio ready!',
        currentSegment: podcastScript.script.length,
        totalSegments: podcastScript.script.length
      });
    }

    console.log('✅ Gemini TTS podcast generation completed successfully');
    
    return {
      success: true,
      audioUrl: audioUrl,
      audioBlob: finalAudioBlob,
      title: podcastScript.title,
      duration: podcastScript.duration,
      segments: podcastScript.script.length,
      keyTakeaways: podcastScript.keyTakeaways,
      audioChunks: audioChunks.length,
      mimeType: finalMimeType
    };

  } catch (error) {
    console.error('❌ Error generating podcast audio with Gemini TTS:', error);
    throw new Error(`Failed to generate podcast audio: ${error.message}`);
  }
};

/**
 * Test Gemini TTS with a simple message
 * @param {string} text - Text to convert to speech
 * @returns {Promise<string>} Audio URL
 */
export const testGeminiTTS = async (text) => {
  try {
    const config = {
      temperature: 0.8,
      responseModalities: ['audio'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: 'Zephyr'
          }
        }
      }
    };

    const model = 'gemini-2.5-pro-preview-tts';
    const contents = [
      {
        role: 'user',
        parts: [{ text }]
      }
    ];

    const response = await genAI.models.generateContentStream({
      model,
      config,
      contents
    });

    for await (const chunk of response) {
      if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
        const inlineData = chunk.candidates[0].content.parts[0].inlineData;
        const audioData = inlineData.data;
        const mimeType = inlineData.mimeType || 'audio/wav';
        
        const binaryData = atob(audioData);
        const bytes = new Uint8Array(binaryData.length);
        for (let i = 0; i < binaryData.length; i++) {
          bytes[i] = binaryData.charCodeAt(i);
        }
        
        const audioBlob = new Blob([bytes], { type: mimeType });
        return URL.createObjectURL(audioBlob);
      }
    }

    throw new Error('No audio data received');
  } catch (error) {
    console.error('Error testing Gemini TTS:', error);
    throw error;
  }
};
