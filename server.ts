import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      model: 'gemini-2.5-flash',
      hasApiKey: !!process.env.GEMINI_API_KEY,
    });
  });

  // Gemini 2.5 Flash Journal Intelligence Endpoint
  app.post('/api/journal-ai', async (req, res) => {
    try {
      const { prompt, entries, chatHistory } = req.body;

      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({
          error: 'GEMINI_API_KEY is not configured in environment.',
          fallback: true,
        });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      // Prepare context from entries for Gemini
      const contextList = Array.isArray(entries) ? entries.slice(0, 45).map((e: any) => ({
        date: e.date,
        title: e.title || 'Untitled',
        mood: e.mood || 'unspecified',
        tags: e.tags || [],
        wordCount: e.wordCount || 0,
        content: Array.isArray(e.blocks)
          ? e.blocks.map((b: any) => {
              if (b.type === 'todo') {
                return `[${b.checked ? 'X' : ' '}] ${b.content}`;
              }
              if (b.type === 'quote') {
                return `> "${b.content}"`;
              }
              if (b.type === 'callout') {
                return `[Key Insight]: ${b.content}`;
              }
              return b.content;
            }).filter(Boolean).join('\n')
          : '',
      })) : [];

      const systemInstruction = `You are the intelligent, empathetic personal Journal Memory & Insights Assistant for Zaid's Private Journal.
You have direct access to Zaid's structured daily journal entries.

Core Objectives:
1. Answer the user's questions about past thoughts, reflections, milestones, workouts, reading notes, mood trends, and specific dates with high precision.
2. ALWAYS cite the exact journal dates in standard YYYY-MM-DD format (e.g., 2026-08-17, 2026-08-15) when referencing past memories or events so the interface can create interactive jump links.
3. Be conversational, insightful, and concise. Connect patterns across different days when relevant (e.g. productivity streaks, habits, fitness logs, recurring reflections).
4. Format your answer with rich Markdown (use **bold** for key concepts and dates, bullet points for lists, and quote blocks where appropriate).
5. When discussing math, statistics, percentages, formulas, or quantitative metrics (like consistency rates, streaks, or growth formulas), use KaTeX / LaTeX math formatting (e.g., inline math like $P = \\frac{n}{N} \\times 100\\%$ or display formulas like $$\\text{Consistency} = \\frac{\\text{Logged Days}}{\\text{Total Days}}$$).
6. If the requested information isn't present in the provided entries, politely state what was found or that no direct mention was recorded yet.`;

      const userContent = `Here is the user's journal database history:\n${JSON.stringify(contextList, null, 2)}\n\nUser Question: ${prompt}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userContent,
        config: {
          systemInstruction,
          temperature: 0.4,
        },
      });

      const text = response.text || '';

      // Extract referenced dates in YYYY-MM-DD format
      const dateRegex = /\b\d{4}-\d{2}-\d{2}\b/g;
      const matchedDates = Array.from(new Set(text.match(dateRegex) || []));

      return res.json({
        answer: text,
        referencedDates: matchedDates,
        quotes: [],
        modelUsed: 'Gemini 2.5 Flash',
      });
    } catch (error: any) {
      console.error('Error invoking Gemini 2.5 Flash API:', error);
      return res.status(500).json({
        error: error?.message || 'Gemini API call failed',
        fallback: true,
      });
    }
  });

  // Vite middleware for development vs static build serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Zaid Journal Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
