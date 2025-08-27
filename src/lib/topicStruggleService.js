import { supabase } from './supabase';

/**
 * Topic Struggle Service for tracking user difficulties
 */

/**
 * Record a topic struggle for a user
 * @param {string} topicName - Name of the topic the user struggled with
 * @param {boolean} wasCorrect - Whether the user got it right this time
 * @returns {Promise<Object>} Result of the operation
 */
export const recordTopicStruggle = async (topicName, wasCorrect = false) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Check if topic struggle already exists
    const { data: existing, error: selectError } = await supabase
      .from('topic_struggles')
      .select('*')
      .eq('user_id', user.id)
      .eq('topic_name', topicName)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected for new topics
      throw selectError;
    }

    if (existing) {
      // Update existing record
      const updateData = {
        total_attempts: existing.total_attempts + 1,
        last_struggled_at: new Date().toISOString()
      };

      // Only increment struggle count if user got it wrong
      if (!wasCorrect) {
        updateData.struggle_count = existing.struggle_count + 1;
      }

      const { data, error } = await supabase
        .from('topic_struggles')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, struggle: data };
    } else {
      // Create new record
      const newStruggle = {
        user_id: user.id,
        topic_name: topicName,
        struggle_count: wasCorrect ? 0 : 1,
        total_attempts: 1,
        last_struggled_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('topic_struggles')
        .insert([newStruggle])
        .select()
        .single();

      if (error) throw error;
      return { success: true, struggle: data };
    }
  } catch (error) {
    console.error('Error recording topic struggle:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user's most struggled topics
 * @param {number} limit - Number of topics to return (default: 10)
 * @returns {Promise<Object>} List of most struggled topics
 */
export const getMostStruggledTopics = async (limit = 10) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('topic_struggles')
      .select('*')
      .eq('user_id', user.id)
      .order('struggle_count', { ascending: false })
      .order('last_struggled_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Calculate struggle percentage for each topic
    const topicsWithPercentage = data.map(topic => ({
      ...topic,
      struggle_percentage: Math.round((topic.struggle_count / topic.total_attempts) * 100)
    }));

    return { success: true, topics: topicsWithPercentage };
  } catch (error) {
    console.error('Error getting most struggled topics:', error);
    return { success: false, error: error.message, topics: [] };
  }
};

/**
 * Get struggle statistics for a specific topic
 * @param {string} topicName - Name of the topic
 * @returns {Promise<Object>} Topic struggle statistics
 */
export const getTopicStruggleStats = async (topicName) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('topic_struggles')
      .select('*')
      .eq('user_id', user.id)
      .eq('topic_name', topicName)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) {
      return { 
        success: true, 
        stats: {
          topic_name: topicName,
          struggle_count: 0,
          total_attempts: 0,
          struggle_percentage: 0,
          last_struggled_at: null
        }
      };
    }

    const stats = {
      ...data,
      struggle_percentage: Math.round((data.struggle_count / data.total_attempts) * 100)
    };

    return { success: true, stats };
  } catch (error) {
    console.error('Error getting topic struggle stats:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Record multiple topic struggles from evaluation results
 * @param {Array} evaluationResults - Array of evaluation results with topics and correctness
 * @returns {Promise<Object>} Result of the operation
 */
export const recordMultipleTopicStruggles = async (evaluationResults) => {
  try {
    const results = [];
    
    for (const result of evaluationResults) {
      const { topicCategory, isCorrect } = result;
      if (topicCategory) {
        const recordResult = await recordTopicStruggle(topicCategory, isCorrect);
        results.push({
          topic: topicCategory,
          success: recordResult.success,
          error: recordResult.error
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return {
      success: failureCount === 0,
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount
      }
    };
  } catch (error) {
    console.error('Error recording multiple topic struggles:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get overall struggle statistics for the user
 * @returns {Promise<Object>} Overall struggle statistics
 */
export const getOverallStruggleStats = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('topic_struggles')
      .select('*')
      .eq('user_id', user.id);

    if (error) throw error;

    const totalTopics = data.length;
    const totalAttempts = data.reduce((sum, topic) => sum + topic.total_attempts, 0);
    const totalStruggles = data.reduce((sum, topic) => sum + topic.struggle_count, 0);
    const overallAccuracy = totalAttempts > 0 ? Math.round(((totalAttempts - totalStruggles) / totalAttempts) * 100) : 0;

    // Find most and least struggled topics
    const sortedByStruggle = [...data].sort((a, b) => {
      const aPercentage = a.struggle_count / a.total_attempts;
      const bPercentage = b.struggle_count / b.total_attempts;
      return bPercentage - aPercentage;
    });

    return {
      success: true,
      stats: {
        totalTopics,
        totalAttempts,
        totalStruggles,
        overallAccuracy,
        mostStruggledTopic: sortedByStruggle[0] || null,
        leastStruggledTopic: sortedByStruggle[sortedByStruggle.length - 1] || null,
        recentStruggles: data
          .sort((a, b) => new Date(b.last_struggled_at) - new Date(a.last_struggled_at))
          .slice(0, 5)
      }
    };
  } catch (error) {
    console.error('Error getting overall struggle stats:', error);
    return { success: false, error: error.message };
  }
};
