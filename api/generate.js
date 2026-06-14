export default async function handler(req, res) {
    // Enable CORS for testing/deployment flexibility
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { promptText, systemPrompt } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ 
            error: 'API Key not configured on the server. Please set the GEMINI_API_KEY environment variable in your Vercel project settings.' 
        });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const payload = {
        contents: [
            { parts: [{ text: promptText }] }
        ],
        systemInstruction: {
            parts: [{ text: systemPrompt }]
        }
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errDetail = await response.text();
            console.error(`Gemini API Error details: ${errDetail}`);
            return res.status(response.status).json({ error: `Gemini API Error: ${response.statusText}` });
        }

        const data = await response.json();
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (textResponse) {
            return res.status(200).json({ textResponse });
        } else {
            return res.status(500).json({ error: 'Empty response returned from Gemini API.' });
        }
    } catch (err) {
        console.error(`Backend execution error: ${err.message}`);
        return res.status(500).json({ error: err.message });
    }
}
