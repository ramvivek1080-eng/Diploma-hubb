const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const pdfParse = require('pdf-parse');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(fileUpload());

app.get('/', (req, res) => {
    app.get('/', (req, res) => {
        res.send('DPG Polytechnic Backend Server is Running Securely with Google Gemma!');
    });
});

app.post('/api/ai-chat', async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: "Message is required" });
    }

    const API_KEY = process.env.AI_API_KEY;

    if (!API_KEY) {
        return res.status(500).json({ error: "Server API Key missing" });
    }

    try {
        const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemma-2-27b-it:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: "You are an expert AI Assistant for DPG Polytechnic (HSBTE Board). Provide concise exam predictions, PYQ solutions, and academic notes assistance to diploma students." },
                            { text: message }
                        ]
                    }
                ]
            })
        });

        const data = await apiResponse.json();

        if (data.candidates && data.candidates[0].content) {
            const replyText = data.candidates[0].content.parts[0].text;
            res.json({ reply: replyText });
        } else {
            res.status(500).json({ error: "Failed to fetch AI response from Google Gemma" });
        }

    } catch (error) {
        console.error("Backend Error:", error);
        res.status(500).json({ error: "Server error occurred" });
    }
});

app.post('/api/solve-pdf', async (req, res) => {
    try {
        if (!req.files || !req.files.pdfFile) {
            return res.status(400).json({ error: "Koi PDF file upload nahi ki gayi!" });
        }

        const pdfBuffer = req.files.pdfFile.data;
        const pdfData = await pdfParse(pdfBuffer);
        const extractedQuestions = pdfData.text;

        const API_KEY = process.env.AI_API_KEY;
        if (!API_KEY) {
            return res.status(500).json({ error: "Server API Key missing" });
        }

        const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemma-2-27b-it:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: "You are an expert AI Exam Solver for DPG Polytechnic (HSBTE Board). Solve all questions step-by-step with clear headings, formulas, and explanations based on the extracted PDF text below:" },
                            { text: extractedQuestions }
                        ]
                    }
                ]
            })
        });

        const data = await apiResponse.json();

        if (data.candidates && data.candidates[0].content) {
            const solutionText = data.candidates[0].content.parts[0].text;
            res.json({ solution: solutionText });
        } else {
            res.status(500).json({ error: "Failed to process PDF with Google Gemma" });
        }

    } catch (error) {
        console.error("PDF Processing Error:", error);
        res.status(500).json({ error: "Server error during PDF parsing" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});