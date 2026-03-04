/**
 * Vercel Serverless Function — /api/llm-chat
 * Accepts { messages, options } and proxies to Nvidia's OpenAI-compatible API.
 * Runs server-side so the API key is never exposed to the browser.
 */

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const { messages, options = {} } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ success: false, error: 'messages array is required' });
        }

        const apiKey = process.env.REACT_APP_NVIDIA_API_KEY;
        const model = process.env.REACT_APP_NVIDIA_MODEL;

        if (!apiKey || !model) {
            return res.status(500).json({
                success: false,
                error: 'REACT_APP_NVIDIA_API_KEY or REACT_APP_NVIDIA_MODEL not configured',
            });
        }

        const nvidiaRes = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model,
                messages,
                temperature: options.temperature ?? 0.7,
                max_tokens: options.max_tokens ?? 1024,
                top_p: options.top_p ?? 0.9,
            }),
        });

        if (!nvidiaRes.ok) {
            const errBody = await nvidiaRes.text().catch(() => nvidiaRes.statusText);
            return res.status(nvidiaRes.status).json({ success: false, error: errBody });
        }

        const data = await nvidiaRes.json();
        const content = data.choices?.[0]?.message?.content ?? '';
        return res.json({ success: true, content });

    } catch (err) {
        console.error('[llm-chat] error:', err.message);
        return res.status(500).json({ success: false, error: err.message });
    }
}
