/**
 * Embedding Service
 * Handles text embeddings and similarity search using Transformers.js
 */

const { pipeline } = require('@xenova/transformers');

class EmbeddingService {
  constructor() {
    this.embedder = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the embedding model
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log('Initializing embedding model...');
      
      // Use a lightweight sentence transformer model
      this.embedder = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2',
        { 
          quantized: true,
          progress_callback: (progress) => {
            if (progress.status === 'downloading') {
              console.log(`Downloading model: ${Math.round(progress.progress)}%`);
            }
          }
        }
      );
      
      this.isInitialized = true;
      console.log('Embedding model initialized successfully');
      
    } catch (error) {
      console.error('Error initializing embedding model:', error);
      throw new Error('Failed to initialize embedding model');
    }
  }

  /**
   * Generate embeddings for text
   * @param {string} text - Text to embed
   * @returns {Array} Embedding vector
   */
  async embed(text) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const result = await this.embedder(text, { pooling: 'mean', normalize: true });
      return Array.from(result.data);
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error('Failed to generate embedding');
    }
  }

  /**
   * Generate embeddings for multiple texts
   * @param {Array<string>} texts - Array of texts to embed
   * @returns {Array<Array>} Array of embedding vectors
   */
  async embedBatch(texts) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const embeddings = [];
      for (const text of texts) {
        const embedding = await this.embed(text);
        embeddings.push(embedding);
      }
      return embeddings;
    } catch (error) {
      console.error('Error generating batch embeddings:', error);
      throw new Error('Failed to generate batch embeddings');
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   * @param {Array} vecA - First vector
   * @param {Array} vecB - Second vector
   * @returns {number} Cosine similarity score
   */
  cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * Find most similar documents to a query
   * @param {string} query - Query text
   * @param {Array<Object>} documents - Array of document objects with text and metadata
   * @param {number} k - Number of top results to return
   * @returns {Array<Object>} Top k similar documents with scores
   */
  async findSimilar(query, documents, k = 4) {
    try {
      console.log(`Finding top ${k} similar documents for query...`);
      
      // Generate query embedding
      const queryEmbedding = await this.embed(query);
      
      // Generate embeddings for all documents if not already cached
      const documentEmbeddings = [];
      for (const doc of documents) {
        if (doc.embedding) {
          documentEmbeddings.push(doc.embedding);
        } else {
          const embedding = await this.embed(doc.text);
          documentEmbeddings.push(embedding);
          doc.embedding = embedding; // Cache for future use
        }
      }

      // Calculate similarities
      const similarities = documentEmbeddings.map((docEmbedding, index) => ({
        index,
        score: this.cosineSimilarity(queryEmbedding, docEmbedding),
        document: documents[index]
      }));

      // Sort by similarity score (descending)
      similarities.sort((a, b) => b.score - a.score);

      // Return top k results
      const topResults = similarities.slice(0, k);
      
      console.log(`Found ${topResults.length} similar documents with scores:`, 
        topResults.map(r => ({ score: r.score.toFixed(3), preview: r.document.text.substring(0, 50) + '...' }))
      );

      return topResults;

    } catch (error) {
      console.error('Error finding similar documents:', error);
      throw new Error('Failed to find similar documents');
    }
  }

  /**
   * Split text into chunks for processing
   * @param {string} text - Text to split
   * @param {number} chunkSize - Maximum chunk size
   * @param {number} overlap - Overlap between chunks
   * @returns {Array<Object>} Array of text chunks with metadata
   */
  splitText(text, chunkSize = 1000, overlap = 200) {
    const chunks = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    let currentChunk = '';
    let chunkIndex = 0;

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      
      if (currentChunk.length + trimmedSentence.length + 1 <= chunkSize) {
        currentChunk += (currentChunk ? '. ' : '') + trimmedSentence;
      } else {
        if (currentChunk) {
          chunks.push({
            text: currentChunk + '.',
            index: chunkIndex++,
            metadata: {
              startChar: text.indexOf(currentChunk),
              length: currentChunk.length
            }
          });
        }
        
        // Handle overlap
        if (overlap > 0 && currentChunk.length > overlap) {
          const overlapText = currentChunk.substring(currentChunk.length - overlap);
          currentChunk = overlapText + '. ' + trimmedSentence;
        } else {
          currentChunk = trimmedSentence;
        }
      }
    }

    // Add the last chunk
    if (currentChunk) {
      chunks.push({
        text: currentChunk + '.',
        index: chunkIndex,
        metadata: {
          startChar: text.lastIndexOf(currentChunk),
          length: currentChunk.length
        }
      });
    }

    console.log(`Split text into ${chunks.length} chunks`);
    return chunks;
  }

  /**
   * Process context and find most relevant sections
   * @param {string} context - Full context text
   * @param {string} query - Query to find relevant sections for
   * @param {number} k - Number of top sections to return
   * @returns {string} Most relevant context sections
   */
  async getRelevantContext(context, query, k = 4) {
    try {
      // Split context into chunks
      const chunks = this.splitText(context, 1000, 200);
      
      if (chunks.length <= k) {
        return context; // Return all if we have fewer chunks than requested
      }

      // Find most similar chunks
      const similarChunks = await this.findSimilar(query, chunks, k);
      
      // Combine the most relevant chunks
      const relevantText = similarChunks
        .map(result => result.document.text)
        .join('\n\n');

      console.log(`Selected ${similarChunks.length} most relevant context sections`);
      return relevantText;

    } catch (error) {
      console.error('Error getting relevant context:', error);
      return context; // Fallback to full context
    }
  }
}

// Create singleton instance
const embeddingService = new EmbeddingService();

module.exports = embeddingService;
