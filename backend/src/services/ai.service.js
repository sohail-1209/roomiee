const AppError = require('../utils/AppError');

// Cache to store parsed AI queries in memory to reduce third-party API calls.
const queryCache = new Map();

/**
 * Parse natural language query into structured filters
 * Uses OpenRouter with a free LLM model
 * @param {string} query - Natural language search query
 * @returns {object} Structured filter object
 */
const parseAIQuery = async (query) => {
  const normalizedQuery = query.trim().toLowerCase();
  if (queryCache.has(normalizedQuery)) {
    return queryCache.get(normalizedQuery);
  }

  const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
  if (!OPENROUTER_KEY) {
    return simpleParse(query);
  }

  const systemPrompt = `You are a search query parser for a rental platform in India.
Extract structured search filters from natural language queries.
Respond ONLY with a valid JSON object. Do not include any explanation.

JSON fields (all optional):
- city: string (city name in India)
- maxRent: number (max monthly rent in INR)
- minRent: number (min monthly rent in INR)
- type: "HOUSE_RENTAL" | "ROOM_SHARING"
- gender: "MALE" | "FEMALE" | "ANY"
- furnished: boolean
- bedrooms: number
- parking: boolean
- wifi: boolean
- ac: boolean
- petFriendly: boolean

Examples:
Query: "2bhk flat in Hyderabad under 15000"
Output: {"city":"Hyderabad","maxRent":15000,"bedrooms":2,"type":"HOUSE_RENTAL"}

Query: "female only room near Mehdipatnam under 6000"
Output: {"city":"Mehdipatnam","maxRent":6000,"gender":"FEMALE","type":"ROOM_SHARING"}`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://roomy.in',
        'X-Title': 'Roomiee AI Search',
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'mistralai/mistral-7b-instruct:free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query },
        ],
        temperature: 0,
        max_tokens: 200,
      }),
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error('Empty response from AI');

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');

    const result = JSON.parse(jsonMatch[0]);
    queryCache.set(normalizedQuery, result);
    return result;
  } catch (err) {
    console.error('AI search error, falling back to simple parse:', err.message);
    return simpleParse(query);
  }
};

// ─── Simple fallback parser (no LLM needed) ───────────
const simpleParse = (query) => {
  const lower = query.toLowerCase();
  const filters = {};

  // City detection (common Indian cities)
  const cities = [
    'hyderabad', 'mumbai', 'delhi', 'bangalore', 'bengaluru',
    'pune', 'chennai', 'kolkata', 'ahmedabad', 'jaipur',
    'mehdipatnam', 'hitech city', 'banjara hills', 'madhapur',
  ];
  for (const city of cities) {
    if (lower.includes(city)) {
      filters.city = city.charAt(0).toUpperCase() + city.slice(1);
      break;
    }
  }

  // Budget extraction
  const budgetMatch = lower.match(/(?:under|below|less than|upto|up to|₹|rs\.?)\s*(\d+(?:,\d+)*(?:k)?)/i);
  if (budgetMatch) {
    let amount = budgetMatch[1].replace(',', '');
    if (amount.endsWith('k')) amount = parseInt(amount) * 1000;
    filters.maxRent = parseInt(amount);
  }

  // Gender
  if (lower.includes('female') || lower.includes('ladies') || lower.includes('girl')) filters.gender = 'FEMALE';
  if (lower.includes('male') || lower.includes('gents') || lower.includes('bachelor')) filters.gender = 'MALE';

  // Type
  if (lower.includes('room') || lower.includes('pg') || lower.includes('sharing')) filters.type = 'ROOM_SHARING';
  if (lower.includes('flat') || lower.includes('house') || lower.includes('apartment') || lower.includes('bhk')) filters.type = 'HOUSE_RENTAL';

  // BHK
  const bhkMatch = lower.match(/(\d)\s*bhk/);
  if (bhkMatch) filters.bedrooms = parseInt(bhkMatch[1]);

  // Amenities
  if (lower.includes('furnished')) filters.furnished = true;
  if (lower.includes('parking')) filters.parking = true;
  if (lower.includes('wifi') || lower.includes('wi-fi')) filters.wifi = true;
  if (lower.includes('ac') || lower.includes('air condition')) filters.ac = true;
  if (lower.includes('pet')) filters.petFriendly = true;

  return filters;
};

module.exports = { parseAIQuery };
