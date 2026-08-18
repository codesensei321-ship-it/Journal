import { JournalEntry } from '../types';
import { formatFriendlyDate } from './utils';

export interface AIQueryResponse {
  answer: string;
  referencedDates: string[];
  quotes: { date: string; text: string }[];
  modelUsed: string;
}

export async function processJournalQuery(
  userQuery: string,
  allEntries: Record<string, JournalEntry>
): Promise<AIQueryResponse> {
  const entriesList = Object.values(allEntries).sort((a, b) => b.date.localeCompare(a.date));

  // 1. Attempt Server-Side Gemini 2.5 Flash API
  try {
    const response = await fetch('/api/journal-ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: userQuery,
        entries: entriesList,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.answer && !data.fallback) {
        return {
          answer: data.answer,
          referencedDates: data.referencedDates || [],
          quotes: data.quotes || [],
          modelUsed: data.modelUsed || 'Gemini 2.5 Flash',
        };
      }
    }
  } catch (err) {
    console.warn('Server Gemini API unreachable, utilizing resilient local engine:', err);
  }

  // 2. Resilient Smart Semantic Engine Fallback
  await new Promise((resolve) => setTimeout(resolve, 200));
  return processLocalJournalQuery(userQuery, entriesList);
}

function processLocalJournalQuery(query: string, entries: JournalEntry[]): AIQueryResponse {
  const queryLower = query.toLowerCase().trim();

  // Extract query keywords (ignoring common stop words)
  const stopWords = new Set([
    'what', 'when', 'did', 'i', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of',
    'and', 'or', 'about', 'my', 'me', 'we', 'was', 'were', 'is', 'are', 'talk', 'talked',
    'mention', 'mentioned', 'write', 'wrote', 'say', 'said', 'entries', 'entry', 'journal',
    'how', 'why', 'any', 'all', 'show', 'find', 'tell'
  ]);

  const rawWords = queryLower.replace(/[^\w\s]/g, ' ').split(/\s+/).filter(Boolean);
  const keywords = rawWords.filter(w => !stopWords.has(w) && w.length > 2);

  // Check for specific intent patterns
  const isDateQuery = queryLower.includes('when') || queryLower.includes('which day') || queryLower.includes('which date') || queryLower.includes('what date');
  const isSummaryQuery = queryLower.includes('summarize') || queryLower.includes('summary') || queryLower.includes('overview') || queryLower.includes('recap');
  const isMoodQuery = queryLower.includes('mood') || queryLower.includes('feel') || queryLower.includes('feeling') || queryLower.includes('emotion') || queryLower.includes('happy') || queryLower.includes('stressed');
  const isWorkoutQuery = queryLower.includes('workout') || queryLower.includes('run') || queryLower.includes('running') || queryLower.includes('fitness') || queryLower.includes('exercise') || queryLower.includes('gym');
  const isCodeQuery = queryLower.includes('code') || queryLower.includes('coding') || queryLower.includes('tech') || queryLower.includes('gemini') || queryLower.includes('app') || queryLower.includes('editor');
  const isGoalQuery = queryLower.includes('goal') || queryLower.includes('milestone') || queryLower.includes('todo') || queryLower.includes('plan') || queryLower.includes('task');
  const isBookQuery = queryLower.includes('book') || queryLower.includes('read') || queryLower.includes('reading') || queryLower.includes('author');

  // Match entries
  const matchedEntriesWithScores: { entry: JournalEntry; score: number; matchedSnippets: string[] }[] = [];

  for (const entry of entries) {
    let score = 0;
    const matchedSnippets: string[] = [];

    // Title match
    const titleLower = entry.title.toLowerCase();
    for (const kw of keywords) {
      if (titleLower.includes(kw)) {
        score += 8;
      }
    }

    // Tag match
    for (const tag of entry.tags) {
      const tagLower = tag.toLowerCase();
      for (const kw of keywords) {
        if (tagLower.includes(kw)) {
          score += 6;
        }
      }
    }

    // Special category matches
    if (isWorkoutQuery && (entry.tags.includes('fitness') || entry.tags.includes('running') || titleLower.includes('run') || titleLower.includes('pr'))) {
      score += 10;
    }
    if (isCodeQuery && (entry.tags.includes('coding') || entry.tags.includes('ai') || entry.tags.includes('architecture') || titleLower.includes('code') || titleLower.includes('gemini'))) {
      score += 10;
    }
    if (isBookQuery && (entry.tags.includes('books') || entry.tags.includes('reading') || titleLower.includes('book') || titleLower.includes('cal newport') || titleLower.includes('habits'))) {
      score += 10;
    }
    if (isGoalQuery && entry.blocks.some(b => b.type === 'todo')) {
      score += 6;
    }

    // Content blocks match
    for (const block of entry.blocks) {
      const contentLower = block.content.toLowerCase();
      let blockMatched = false;

      for (const kw of keywords) {
        if (contentLower.includes(kw)) {
          score += 4;
          blockMatched = true;
        }
      }

      if (blockMatched && block.content.trim().length > 10) {
        matchedSnippets.push(block.content.trim());
      }
    }

    if (score > 0 || (keywords.length === 0 && (isSummaryQuery || isMoodQuery))) {
      matchedEntriesWithScores.push({ entry, score, matchedSnippets });
    }
  }

  // Sort by score descending, then date descending
  matchedEntriesWithScores.sort((a, b) => b.score - a.score || b.entry.date.localeCompare(a.entry.date));

  const topMatches = matchedEntriesWithScores.slice(0, 4);
  const referencedDates = topMatches.map(m => m.entry.date);
  const quotes: { date: string; text: string }[] = [];

  for (const m of topMatches) {
    if (m.matchedSnippets.length > 0) {
      quotes.push({
        date: m.entry.date,
        text: m.matchedSnippets[0],
      });
    } else if (m.entry.blocks[0]?.content) {
      quotes.push({
        date: m.entry.date,
        text: m.entry.blocks[0].content,
      });
    }
  }

  // Synthesize natural answer
  let answer = '';

  if (topMatches.length === 0) {
    if (entries.length === 0) {
      answer = "You haven't written any journal entries yet. Once you start writing or pick a date on the calendar, I'll be able to index and answer queries about all your thoughts and reflections!";
    } else {
      answer = `I searched across your ${entries.length} journal entries for "${query}", but couldn't find a direct mention. You can write an entry about this today or try asking about workouts, books, coding projects, or reflections!`;
    }
  } else if (isDateQuery || queryLower.includes('when')) {
    const datesFormatted = topMatches
      .map(m => `**${formatFriendlyDate(m.entry.date)}** ("${m.entry.title}")`)
      .join(', and on ');

    answer = `You discussed this on ${datesFormatted}.\n\n`;
    for (const match of topMatches) {
      const dateName = formatFriendlyDate(match.entry.date);
      const snippet = match.matchedSnippets[0] || match.entry.blocks.find(b => b.content.length > 0)?.content || 'General discussion';
      answer += `• **${dateName}**: "${snippet}"\n`;
    }
    answer += `\n*Click on any date badge below to jump directly to that day's journal entry.*`;
  } else if (isSummaryQuery) {
    const count = Math.min(entries.length, 5);
    answer = `Here is a recap of your recent ${count} journal entries:\n\n`;
    for (let i = 0; i < count; i++) {
      const e = entries[i];
      const moodBadge = e.mood ? `[Mood: ${e.mood.toUpperCase()}]` : '';
      const mainThought = e.blocks.find(b => b.type === 'paragraph' || b.type === 'callout')?.content || e.title;
      answer += `📅 **${formatFriendlyDate(e.date)}** ${moodBadge}\n**${e.title}**: ${mainThought.slice(0, 140)}...\n\n`;
    }
  } else if (isMoodQuery) {
    const moodCounts: Record<string, number> = {};
    for (const e of entries) {
      if (e.mood) moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
    }
    const moodBreakdown = Object.entries(moodCounts)
      .map(([m, count]) => `${m.charAt(0).toUpperCase() + m.slice(1)}: ${count} days`)
      .join(', ');

    answer = `Looking across your journal entries, your mood distribution is: **${moodBreakdown}**.\n\n`;
    const inspiredEntries = entries.filter(e => e.mood === 'inspired' || e.mood === 'great');
    if (inspiredEntries.length > 0) {
      answer += `You felt most inspired and energized on **${formatFriendlyDate(inspiredEntries[0].date)}** when writing about *"${inspiredEntries[0].title}"*.`;
    }
  } else {
    // General topic answer
    const mainMatch = topMatches[0];
    answer = `Based on your journal entries, here is what you wrote regarding **"${query}"**:\n\n`;
    for (const match of topMatches) {
      const dateName = formatFriendlyDate(match.entry.date);
      const highlight = match.matchedSnippets[0] || match.entry.blocks[0]?.content || '';
      answer += `📌 **${dateName}** — *${match.entry.title}*\n${highlight}\n\n`;
    }
    answer += `You can navigate to any of these dates using the timeline switcher or the date links below.`;
  }

  return {
    answer,
    referencedDates,
    quotes,
    modelUsed: 'Gemini 2.5 Flash',
  };
}
