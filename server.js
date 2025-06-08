const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files (HTML, CSS, JS) from the root directory
app.use(express.static(path.join(__dirname, '')));

// API endpoint for summarization
app.post('/api/summarize', async (req, res) => {
    const { text } = req.body;
    const cohereApiKey = process.env.COHERE_API_KEY;

    if (!cohereApiKey) {
        console.error('Cohere API key is missing.');
        return res.status(500).json({ error: 'Server configuration error: Cohere API key not found.' });
    }

    if (!text || text.trim() === '') {
        return res.status(400).json({ error: 'Text to summarize cannot be empty.' });
    }

    const cohereUrl = 'https://api.cohere.ai/v1/summarize';

    // Cohere API payload structure
    // You can adjust 'length', 'format', 'model', 'temperature', etc. as needed.
    // See Cohere documentation: https://docs.cohere.com/reference/summarize-2
    const payload = {
        text: text,
        model: 'command', // Or other suitable Cohere summarization models like 'summarize-xlarge'
        length: 'medium', // Options: 'short', 'medium', 'long'
        format: 'bullets', // Options: 'paragraph', 'bullets'
        // temperature: 0.3, // Adjust for creativity vs. factuality
        // additional_command: "Provide a professional summary with headings and bullet points where appropriate." // Optional instruction
    };

    try {
        const response = await axios.post(cohereUrl, payload, {
            headers: {
                'Authorization': `Bearer ${cohereApiKey}`,
                'Content-Type': 'application/json',
                'Cohere-Version': '2022-12-06' // Recommended Cohere API version
            }
        });

        if (response.data && response.data.summary) {
            const summary = response.data.summary.trim();
            res.json({ summary });
        } else {
            console.error('Unexpected response structure from Cohere:', response.data);
            res.status(500).json({ error: 'Failed to get a valid summary from Cohere.' });
        }
    } catch (error) {
        console.error('Error calling Cohere API:', error.response ? error.response.data : error.message);
        if (error.response) {
            const statusCode = error.response.status;
            const errorMessage = (error.response.data && error.response.data.message) ? error.response.data.message : 'An error occurred with Cohere API.';
            if (statusCode === 401) {
                 res.status(401).json({ error: `Cohere API request unauthorized. Check your API key. Details: ${errorMessage}` });
            } else if (statusCode === 429) {
                res.status(429).json({ error: `Cohere API rate limit exceeded. Please try again later. Details: ${errorMessage}` });
            } else if (statusCode === 400) {
                res.status(400).json({ error: `Bad request to Cohere API. Details: ${errorMessage}` });
            }
            else {
                res.status(statusCode).json({ error: `An error occurred while communicating with Cohere. Status: ${statusCode}. Details: ${errorMessage}` });
            }
        } else {
             res.status(500).json({ error: 'An error occurred while communicating with Cohere.' });
        }
    }
});

// Serve the index.html for the root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`ProSummarize server running at http://localhost:${port}`);
});