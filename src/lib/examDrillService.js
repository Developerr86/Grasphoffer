import { supabase } from './supabase';
import { generateNvidiaResponse } from './nvidiallm';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the storage path for a paper's answers file.
 * e.g. "userId/paper.md" → "userId/answers_paper.md"
 */
const getAnswersPath = (paperStoragePath) => {
    const parts = paperStoragePath.split('/');
    const filename = parts[parts.length - 1];
    const userId = parts.slice(0, parts.length - 1).join('/');
    return `${userId}/answers_${filename}`;
};

/**
 * Delay utility for rate-limit compliance.
 * @param {number} ms  milliseconds to wait (default 3000)
 */
const delay = (ms = 3000) => new Promise((res) => setTimeout(res, ms));

// ─────────────────────────────────────────────────────────────────────────────
// Storage helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Download raw text of any file in the documents bucket.
 * @param {string} storagePath  e.g. "userId/1234_paper.md"
 * @returns {Promise<string>}
 */
export const fetchPaperContent = async (storagePath) => {
    const { data, error } = await supabase.storage
        .from('documents')
        .download(storagePath);

    if (error) throw new Error(`Failed to download paper: ${error.message}`);

    return await data.text();
};

/**
 * Check whether an answers file already exists for a paper.
 * @param {string} paperStoragePath  e.g. "userId/1234_paper.md"
 * @returns {Promise<boolean>}
 */
export const checkIfAnswersExist = async (paperStoragePath) => {
    const answersPath = getAnswersPath(paperStoragePath);
    const parts = answersPath.split('/');
    const folder = parts.slice(0, parts.length - 1).join('/');
    const name = parts[parts.length - 1];

    const { data } = await supabase.storage
        .from('documents')
        .list(folder);

    if (!data) return false;
    return data.some((f) => f.name === name);
};

/**
 * Save the full Q&A session as a markdown file to Supabase storage.
 * @param {string} paperStoragePath
 * @param {Array<{id, type, text, options?, answer}>} questionsWithAnswers
 * @returns {Promise<string>} The storage path where it was saved
 */
export const saveAnswersToStorage = async (paperStoragePath, questionsWithAnswers) => {
    const answersPath = getAnswersPath(paperStoragePath);

    // Build a structured markdown document
    let md = `# Exam Drill Answers\n\n`;
    md += `> Source paper: \`${paperStoragePath}\`\n`;
    md += `> Generated: ${new Date().toISOString()}\n\n---\n\n`;

    questionsWithAnswers.forEach((q, idx) => {
        md += `## Question ${idx + 1} (${q.type === 'mcq' ? 'MCQ' : 'Long Form'})\n\n`;
        md += `${q.text}\n\n`;

        if (q.type === 'mcq' && q.options && q.options.length > 0) {
            md += `**Options:**\n`;
            q.options.forEach((opt) => {
                md += `- ${opt}\n`;
            });
            md += `\n`;
        }

        md += `### Answer\n\n${q.answer || '_Not generated_'}\n\n---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });

    const { error } = await supabase.storage
        .from('documents')
        .upload(answersPath, blob, { upsert: true });

    if (error) throw new Error(`Failed to save answers: ${error.message}`);

    return answersPath;
};

/**
 * Load and parse a previously saved answers file from storage.
 * @param {string} paperStoragePath
 * @returns {Promise<Array<{id, type, text, options?, answer}>>}
 */
export const loadAnswersFromStorage = async (paperStoragePath) => {
    const answersPath = getAnswersPath(paperStoragePath);
    const content = await fetchPaperContent(answersPath);
    return parseAnswersMd(content);
};

/**
 * Delete a paper (and its answers file if present) from Supabase storage.
 * @param {string} paperStoragePath  e.g. "userId/1234_paper.md"
 * @returns {Promise<void>}
 */
export const deletePaper = async (paperStoragePath) => {
    const answersPath = getAnswersPath(paperStoragePath);

    // Delete the paper
    const { error: e1 } = await supabase.storage
        .from('documents')
        .remove([paperStoragePath]);
    if (e1) console.warn('Could not delete paper file:', e1.message);

    // Delete answers if they exist (ignore error if file doesn't exist)
    await supabase.storage.from('documents').remove([answersPath]);
};

// ─────────────────────────────────────────────────────────────────────────────
// LLM helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse the raw markdown of a question paper and extract all questions.
 * Returns classified MCQ and long-form questions.
 * @param {string} markdownContent  Raw OCR'd markdown text of the paper
 * @returns {Promise<{mcqQuestions: Array, longQuestions: Array}>}
 */
export const parseQuestionsFromPaper = async (markdownContent) => {
    const prompt = `You are an expert exam paper parser. Below is the OCR-extracted text of an examination question paper in Markdown format.

Your task is to:
1. Identify ALL questions in the paper.
2. For each question, determine if it is:
   - MCQ (Multiple Choice Question) — has distinct options (A/B/C/D or 1/2/3/4 or (a)/(b)/(c)/(d))
   - Long Form — requires a written, explanatory answer

3. Output ONLY a valid JSON object in this exact structure (no extra text, no markdown code fences):
{
  "mcqQuestions": [
    {
      "id": "mcq_1",
      "text": "The full question text here",
      "options": ["A) Option one", "B) Option two", "C) Option three", "D) Option four"]
    }
  ],
  "longQuestions": [
    {
      "id": "long_1",
      "text": "The full question text here"
    }
  ]
}

Rules:
- Preserve the full original question text including any sub-parts.
- If a question has labeled options (A, B, C, D etc.) it is MCQ.
- Questions asking to "explain", "describe", "discuss", "derive", "prove", "calculate", or "state and elaborate" are Long Form.
- Number questions sequentially within each category.
- Do not include instructions, headers, or marking schemes as questions.

Question Paper:
---
${markdownContent.substring(0, 12000)}
---`;

    const response = await generateNvidiaResponse(prompt, [], {
        temperature: 0.1,
        max_tokens: 4096,
    });

    // Extract JSON from response (strip any surrounding text)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('LLM did not return valid JSON for question parsing');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
        mcqQuestions: parsed.mcqQuestions || [],
        longQuestions: parsed.longQuestions || [],
    };
};

/**
 * Generate answers for ALL MCQ questions in a single LLM API call.
 * @param {Array<{id, text, options}>} mcqQuestions
 * @returns {Promise<Object>} Map of { questionId: answerText }
 */
export const generateMCQAnswers = async (mcqQuestions) => {
    if (mcqQuestions.length === 0) return {};

    const questionsBlock = mcqQuestions.map((q, i) => {
        const opts = q.options ? q.options.join('\n') : '';
        return `Q${i + 1} [ID: ${q.id}]\n${q.text}\n${opts}`;
    }).join('\n\n');

    const prompt = `You are an expert tutor. Answer ALL of the following MCQ questions. For each question:
1. State the correct answer option (e.g., "A) ..." or "Option 2").
2. Give a brief, clear explanation of WHY that answer is correct (2-4 sentences).
3. If helpful, briefly mention why other options are incorrect.

Format your response as a JSON object mapping each question ID to its answer explanation:
{
  "mcq_1": "**Correct Answer: B) ...**\\n\\nExplanation here...",
  "mcq_2": "**Correct Answer: C) ...**\\n\\nExplanation here..."
}

Output ONLY the JSON object, no extra text.

Questions:
${questionsBlock}`;

    const response = await generateNvidiaResponse(prompt, [], {
        temperature: 0.2,
        max_tokens: 4096,
    });

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        console.warn('MCQ answer parsing failed, using empty map');
        return {};
    }

    return JSON.parse(jsonMatch[0]);
};

/**
 * Generate answers for long-form questions one at a time with delays.
 * @param {Array<{id, text}>} longQuestions
 * @param {function(current: number, total: number, questionId: string, answer: string): void} onProgress
 * @returns {Promise<Object>} Map of { questionId: answerText }
 */
export const generateLongAnswers = async (longQuestions, onProgress) => {
    if (longQuestions.length === 0) return {};

    const answers = {};

    for (let i = 0; i < longQuestions.length; i++) {
        const q = longQuestions[i];

        const prompt = `You are an expert tutor providing a comprehensive answer to an exam question.

Question:
${q.text}

Provide a thorough, well-structured answer suitable for an exam. Use the following format:
- Start with a clear direct answer or definition if applicable.
- Elaborate with explanation, examples, diagrams (described in text), or derivations as needed.
- Use Markdown formatting: **bold** for key terms, numbered or bulleted lists for steps/points, code blocks for formulas or code.
- Keep the answer comprehensive but concise (aim for what a top student would write).`;

        const answer = await generateNvidiaResponse(prompt, [], {
            temperature: 0.4,
            max_tokens: 2048,
        });

        answers[q.id] = answer;

        if (onProgress) {
            onProgress(i + 1, longQuestions.length, q.id, answer);
        }

        // Respect rate limits: wait 2-4 seconds between calls (skip after last)
        if (i < longQuestions.length - 1) {
            const waitMs = 2000 + Math.random() * 2000; // 2-4s
            await delay(waitMs);
        }
    }

    return answers;
};

// ─────────────────────────────────────────────────────────────────────────────
// Markdown parser for saved answers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse the saved answers markdown back into structured Q&A objects.
 * @param {string} md  Raw content of the answers .md file
 * @returns {Array<{id, type, text, options, answer}>}
 */
const parseAnswersMd = (md) => {
    const questions = [];
    // Split on the "## Question N" headers
    const sections = md.split(/^## Question \d+/m).slice(1);

    sections.forEach((section, idx) => {
        const typeMatch = section.match(/\((MCQ|Long Form)\)/);
        const type = typeMatch ? (typeMatch[1] === 'MCQ' ? 'mcq' : 'long') : 'long';

        // Everything before "**Options:**" or "### Answer" is the question text
        const textMatch = section.match(/\n\n([\s\S]+?)(?=\n\n\*\*Options:\*\*|\n\n###)/);
        const text = textMatch ? textMatch[1].trim() : '';

        // Options (MCQ only)
        let options = [];
        const optionsMatch = section.match(/\*\*Options:\*\*\n([\s\S]+?)(?=\n\n###)/);
        if (optionsMatch) {
            options = optionsMatch[1]
                .split('\n')
                .filter((l) => l.startsWith('- '))
                .map((l) => l.replace(/^- /, ''));
        }

        // Answer body — capture everything after "### Answer\n\n" to end of this
        // section. Do NOT stop at "---" because the LLM uses horizontal rules as
        // section separators inside the answer itself.
        const answerMatch = section.match(/### Answer\n\n([\s\S]+)/);
        const answer = answerMatch ? answerMatch[1].trim() : '';

        questions.push({
            id: `q_${idx + 1}`,
            type,
            text,
            options,
            answer,
        });
    });

    return questions;
};
