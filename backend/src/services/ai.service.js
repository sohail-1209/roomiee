const AppError = require('../utils/AppError');

// Cache to store parsed AI queries in memory to reduce third-party API calls.
const queryCache = new Map();

/**
 * Parse natural language query into structured filters + free-text keywords
 * Uses OpenRouter with a free LLM model
 * @param {string} query - Natural language search query
 * @returns {object} { filters: {...}, keywords: string[] }
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

  const systemPrompt = `You are a search query parser for a rental housing platform in India called Quikden.
The user may write in English, Hindi (हिन्दी), Telugu (తెలుగు), or Urdu (اردو). Understand queries in ANY of these languages and parse them into structured search filters.

Parse the user's natural language query into structured search filters AND extract keywords for text matching.

Respond ONLY with a valid JSON object. No explanation, no markdown.

JSON fields (all optional — only include what the user mentioned):
- city: string — city name (e.g. "Delhi", "Bangalore", "Hyderabad")
- state: string — state name if mentioned (e.g. "Karnataka", "Telangana")
- area: string — specific area/locality/neighborhood (e.g. "Model Town", "Lajpat Nagar", "Mehdipatnam", "Banjara Hills")
- maxRent: number — maximum monthly rent in INR
- minRent: number — minimum monthly rent in INR
- type: "HOUSE_RENTAL" | "ROOM_SHARING" | "HOSTEL"
- gender: "MALE" | "FEMALE" | "ANY"
- furnished: boolean
- bedrooms: number
- parking: boolean
- wifi: boolean
- ac: boolean
- security: boolean
- lift: boolean
- kitchen: boolean
- powerBackup: boolean
- waterSupply: boolean
- cctv: boolean
- balcony: boolean
- keywords: string[] — important nouns/phrases from the query for text matching (e.g. ["near university", "bus stop", "grocery", "quiet area"])

Language rules:
- Hindi: "कमरा" = room, "घर" = house, "छात्रावास" = hostel, "किराया" = rent, "महिला" = female, "पुरुष" = male
- Telugu: "గది" = room, "ఇల్లు" = house, "హాస్టల్" = hostel, "అద్దె" = rent, "మహిళ" = female, "పురుషుడు" = male
- Urdu: "کمرہ" = room, "گھر" = house, "ہاسٹل" = hostel, "کرایہ" = rent, "خاتون" = female, "مرد" = male

Rules:
- "pg", "hostel", "paying guest", "छात्रावास", "హాస్టల్", "ہاسٹل" → type: "HOSTEL"
- "room", "sharing", "flatmate", "roommate", "कमरा", "గది", "کمرہ" → type: "ROOM_SHARING"
- "flat", "house", "apartment", "bhk", "villa", "घर", "ఇల్లు", "گھر" → type: "HOUSE_RENTAL"
- "ladies", "female", "girls", "women", "महिला", "మహిళ", "خاتون" → gender: "FEMALE"
- "gents", "male", "boys", "bachelor", "पुरुष", "పురుషుడు", "مرد" → gender: "MALE"
- "unmarried", "couple" → type: "ROOM_SHARING"
- "under 6000", "6000 లోపు", "6000 سے کم" → maxRent: 6000
- "near", "పక్కన", "قریب" → extract the location name after these words as area/keyword

Rules:
- "pg", "hostel", "paying guest" → type: "HOSTEL"
- "room", "sharing", "flatmate", "roommate" → type: "ROOM_SHARING"
- "flat", "house", "apartment", "bhk", "villa" → type: "HOUSE_RENTAL"
- "ladies", "female", "girls", "women" → gender: "FEMALE"
- "gents", "male", "boys", "bachelor" → gender: "MALE"
- "unmarried", "couple" → type: "ROOM_SHARING"
- Extract area/locality names even if they are not famous cities (e.g. "Mehdipatnam", "Jubilee Hills", "Koramangala")
- Always extract keywords for anything that could appear in a listing's title, description, or address
- If user says "near X" or "close to X", put "X" in keywords
- "family" → gender: "ANY", keywords: ["family"]
- "student" → keywords: ["student", "university", "college"]
- "vegetarian" → keywords: ["vegetarian", "veg"]
- Include keywords for amenities mentioned even if the boolean field exists

Examples:
Query: "2bhk flat near Delhi University under 15000"
Output: {"city":"Delhi","maxRent":15000,"bedrooms":2,"type":"HOUSE_RENTAL","keywords":["Delhi University","near university"]}

Query: "ladies pg in mehdipatnam with wifi and food"
Output: {"city":"Hyderabad","area":"Mehdipatnam","type":"HOSTEL","gender":"FEMALE","wifi":true,"keywords":["food","mess","Mehdipatnam"]}

Query: "need a room sharing near bangalore university, budget 8k, vegetarian"
Output: {"city":"Bangalore","type":"ROOM_SHARING","maxRent":8000,"keywords":["Bangalore University","vegetarian","near university"]}

Query: "furnished 1rk near metro station with parking under 10000 in Hyderabad"
Output: {"city":"Hyderabad","maxRent":10000,"furnished":true,"parking":true,"keywords":["metro station","1rk","near metro"]}

Query: "hostel for female students near osmania university"
Output: {"city":"Hyderabad","type":"HOSTEL","gender":"FEMALE","keywords":["Osmania University","student","near university"]}

Query: "couple friendly flat in Koramangala with balcony"
Output: {"city":"Bangalore","area":"Koramangala","type":"HOUSE_RENTAL","balcony":true,"keywords":["couple friendly","Koramangala"]}

Query: "looking for a place near HITEC City, need AC and power backup"
Output: {"city":"Hyderabad","area":"HITEC City","ac":true,"powerBackup":true,"keywords":["HITEC City"]}

Query: "hostel near Bangalore University with food and wifi"
Output: {"city":"Bangalore","type":"HOSTEL","wifi":true,"keywords":["Bangalore University","food","mess","near university"]}`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://quikden.vercel.app',
        'X-Title': 'Quikden AI Search',
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'mistralai/mistral-7b-instruct:free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query },
        ],
        temperature: 0,
        max_tokens: 300,
      }),
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error('Empty response from AI');

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');

    const result = JSON.parse(jsonMatch[0]);
    // Ensure keywords is always an array
    if (!Array.isArray(result.keywords)) result.keywords = [];

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
  const filters = { keywords: [] };

  // ── City detection (common Indian cities + areas) ──
  const cityMap = {
    'hyderabad': 'Hyderabad', 'mumbai': 'Mumbai', 'delhi': 'Delhi',
    'bangalore': 'Bangalore', 'bengaluru': 'Bangalore',
    'pune': 'Pune', 'chennai': 'Chennai', 'kolkata': 'Kolkata',
    'ahmedabad': 'Ahmedabad', 'jaipur': 'Jaipur',
    'lucknow': 'Lucknow', 'noida': 'Noida', 'gurgaon': 'Gurgaon',
    'gurugram': 'Gurgaon', 'faridabad': 'Faridabad', 'ghaziabad': 'Ghaziabad',
    'secunderabad': 'Hyderabad', 'cyberabad': 'Hyderabad',
    'thane': 'Thane', 'navi mumbai': 'Navi Mumbai',
    'indore': 'Indore', 'bhopal': 'Bhopal', 'patna': 'Patna',
    'nagpur': 'Nagpur', 'surat': 'Surat', 'visakhapatnam': 'Visakhapatnam',
    'coimbatore': 'Coimbatore', 'kochi': 'Kochi', 'trivandrum': 'Trivandrum',
  };

  // Check multi-word cities first, then single word (use word boundary to avoid false matches)
  const sortedCities = Object.keys(cityMap).sort((a, b) => b.length - a.length);
  for (const city of sortedCities) {
    const regex = new RegExp(`\\b${city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(lower)) {
      filters.city = cityMap[city];
      break;
    }
  }

  // ── Area/locality detection ──
  const areas = [
    'mehdipatnam', 'banjara hills', 'jubilee hills', 'hitech city', 'HITEC city',
    'madhapur', 'kondapur', 'gachibowli', 'kukatpally', 'dilsukhnagar',
    'ameerpet', 'begumpet', 'secunderabad', 'lb nagar', 'kompally',
    'koramangala', 'indiranagar', 'hsr layout', 'electronic city', 'whitefield',
    'marathahalli', 'bellandur', 'sarjapur road', 'hebbal', 'jayanagar',
    'model town', 'lajpat nagar', 'rohini', 'dwarka', 'saket',
    'hauz khas', 'vasant kunj', 'greater kailash', 'defence colony',
    'andheri', 'bandra', 'worli', 'borivali', 'malad', 'thane',
    'viman nagar', 'kothrud', 'hinjewadi', 'wakad', 'baner',
    'adyar', 'adyar', 'velachery', 't. nagar', 'anna nagar',
    'salt lake', 'sector 5', 'new town', 'park street',
    'jubilee hills', 'film nagar', 'tolichowki', 'manikonda',
    'kondapur', 'narsingi', 'tellapur', 'financial district',
  ];
  for (const area of areas) {
    if (lower.includes(area)) {
      filters.area = area.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      filters.keywords.push(filters.area);
      break;
    }
  }

  // ── Budget extraction ──
  const budgetMatch = lower.match(/(?:under|below|less than|upto|up to|max|budget|around|approximately|₹|rs\.?|से कम|లోప�|سے کم)\s*(\d+(?:,\d+)*(?:k)?)/i);
  if (budgetMatch) {
    let amount = budgetMatch[1].replace(/,/g, '');
    if (amount.endsWith('k')) amount = parseInt(amount) * 1000;
    filters.maxRent = parseInt(amount);
  }

  // Min rent
  const minRentMatch = lower.match(/(?:above|over|more than|min|minimum|from|starting|से अधिक|నుండి|سے زیادہ)\s*(\d+(?:,\d+)*(?:k)?)/i);
  if (minRentMatch) {
    let amount = minRentMatch[1].replace(/,/g, '');
    if (amount.endsWith('k')) amount = parseInt(amount) * 1000;
    filters.minRent = parseInt(amount);
  }

  // ── Gender ──
  if (lower.includes('female') || lower.includes('ladies') || lower.includes('girl') || lower.includes('women') || lower.includes('महिला') || lower.includes('మహిళ') || lower.includes('خاتون')) {
    filters.gender = 'FEMALE';
  }
  if (lower.includes('male') || lower.includes('gents') || lower.includes('bachelor') || lower.includes('boy') || lower.includes('पुरुष') || lower.includes('పురుషుడు') || lower.includes('مرد')) {
    filters.gender = 'MALE';
  }

  // ── Type ──
  if (lower.includes('hostel') || lower.includes('pg') || lower.includes('paying guest') || lower.includes('छात्रावास') || lower.includes('హాస్టల్') || lower.includes('ہاسٹل')) {
    filters.type = 'HOSTEL';
  } else if (lower.includes('room') || lower.includes('sharing') || lower.includes('flatmate') || lower.includes('roommate') || lower.includes('कमरा') || lower.includes('గది') || lower.includes('کمرہ')) {
    filters.type = 'ROOM_SHARING';
  } else if (lower.includes('flat') || lower.includes('house') || lower.includes('apartment') || lower.includes('bhk') || lower.includes('villa') || lower.includes('घर') || lower.includes('ఇల్లు') || lower.includes('گھر')) {
    filters.type = 'HOUSE_RENTAL';
  }

  // ── BHK / bedrooms ──
  const bhkMatch = lower.match(/(\d)\s*bhk/);
  if (bhkMatch) filters.bedrooms = parseInt(bhkMatch[1]);
  const rkMatch = lower.match(/(\d)\s*rk/);
  if (rkMatch) filters.bedrooms = parseInt(rkMatch[1]);

  // ── Amenities ──
  if (lower.includes('furnished') || lower.includes('फ़र्निश्ड') || lower.includes('ఫర్నిష్డ్') || lower.includes('فرنیشڈ')) filters.furnished = true;
  if (lower.includes('parking') || lower.includes('पार्किंग') || lower.includes('పార్కింగ్') || lower.includes('پارکنگ')) filters.parking = true;
  if (lower.includes('wifi') || lower.includes('wi-fi') || lower.includes('internet') || lower.includes('वाईफाई') || lower.includes('వైఫై') || lower.includes('وائی فائی')) filters.wifi = true;
  if (lower.includes('ac') || lower.includes('air condition') || lower.includes('air conditioner') || lower.includes('एसी') || lower.includes('ఎసి') || lower.includes('ای سی')) filters.ac = true;
  if (lower.includes('pet') || lower.includes('पालतू') || lower.includes('పెంపుడు') || lower.includes('پالتو')) filters.petFriendly = true;
  if (lower.includes('lift') || lower.includes('elevator') || lower.includes('लिफ्ट') || lower.includes('లిఫ్ట్') || lower.includes('لفٹ')) filters.lift = true;
  if (lower.includes('security') || lower.includes('cctv') || lower.includes('guarded') || lower.includes('सुरक्षा') || lower.includes('భద్రత') || lower.includes('سیکیورٹی')) filters.security = true;
  if (lower.includes('power backup') || lower.includes('generator') || lower.includes('inverter') || lower.includes('पावर बैकअप') || lower.includes('పవర్ బ్యాకప్') || lower.includes('پاور بیک اپ')) filters.powerBackup = true;
  if (lower.includes('water supply') || lower.includes('24.*water') || lower.includes('bore') || lower.includes('पानी') || lower.includes('నీరు') || lower.includes('پانی')) filters.waterSupply = true;
  if (lower.includes('kitchen') || lower.includes('cooking') || lower.includes('रसोई') || lower.includes('వంటగది') || lower.includes('باورچی خانہ')) filters.kitchen = true;
  if (lower.includes('balcony') || lower.includes('terrace') || lower.includes('बालकनी') || lower.includes('బాల్కనీ') || lower.includes('بالکنی')) filters.balcony = true;

  // ── Extract keywords for text matching ──
  const keywordPatterns = [
    /near\s+([\w\s]+?)(?:\s+(?:with|under|below|and|,|\.|$))/i,
    /close\s+to\s+([\w\s]+?)(?:\s+(?:with|under|below|and|,|\.|$))/i,
    /beside\s+([\w\s]+?)(?:\s+(?:with|under|below|and|,|\.|$))/i,
    /opposite\s+([\w\s]+?)(?:\s+(?:with|under|below|and|,|\.|$))/i,
    /behind\s+([\w\s]+?)(?:\s+(?:with|under|below|and|,|\.|$))/i,
    /के पास\s+([\w\s]+?)(?:\s+(?:with|under|below|and|,|\.|$))/i,
    /दग्गर\s+([\w\s]+?)(?:\s+(?:with|under|below|and|,|\.|$))/i,
    /పక్కన\s+([\w\s]+?)(?:\s+(?:with|under|below|and|,|\.|$))/i,
    /قریب\s+([\w\s]+?)(?:\s+(?:with|under|below|and|,|\.|$))/i,
  ];
  for (const pattern of keywordPatterns) {
    const match = lower.match(pattern);
    if (match) {
      filters.keywords.push(match[1].trim());
    }
  }

  // Extract nouns that could match listing descriptions
  const descKeywords = [
    'university', 'college', 'school', 'hospital', 'metro', 'bus stop',
    'market', 'shopping', 'mall', 'park', 'temple', 'mosque', 'church',
    'grocery', 'supermarket', 'restaurant', 'food', 'mess',
    'quiet', 'peaceful', 'luxury', 'budget', 'affordable',
    'family', 'student', 'working professional', 'vegetarian', 'veg',
    'couple', 'bachelor', 'non-veg', 'spacious', 'ventilated',
    'sun facing', 'corner', 'ground floor', 'first floor',
  ];
  for (const kw of descKeywords) {
    if (lower.includes(kw)) {
      filters.keywords.push(kw);
    }
  }

  // Deduplicate keywords
  filters.keywords = [...new Set(filters.keywords)];

  return filters;
};

module.exports = { parseAIQuery };
