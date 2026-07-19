const router = require('express').Router();
const prisma = require('../utils/prisma');
const asyncHandler = require('../utils/asyncHandler');

const BASE_URL = 'https://quikden.vercel.app';

const typePathMap = {
  HOUSE_RENTAL: 'listing',
  ROOM_SHARING: 'room',
  HOSTEL: 'hostel',
  LAND_SALE: 'land',
};

router.get('/', asyncHandler(async (req, res) => {
  const listings = await prisma.listing.findMany({
    where: { status: 'ACTIVE' },
    select: {
      id: true,
      type: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: 'desc' },
  });

  const today = new Date().toISOString().split('T')[0];

  const listingUrls = listings.map((l) => {
    const path = typePathMap[l.type] || 'listing';
    const lastmod = l.updatedAt ? new Date(l.updatedAt).toISOString().split('T')[0] : today;
    return `  <url>
    <loc>${BASE_URL}/${path}/${l.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${BASE_URL}/search</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${BASE_URL}/search?type=HOUSE_RENTAL</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${BASE_URL}/search?type=ROOM_SHARING</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${BASE_URL}/search?type=HOSTEL</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${BASE_URL}/search?type=LAND_SALE</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${BASE_URL}/about</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${BASE_URL}/login</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${BASE_URL}/register</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
${listingUrls}
</urlset>`;

  res.set('Cache-Control', 'public, max-age=3600');
  res.set('Content-Type', 'application/xml');
  res.send(xml);
}));

module.exports = router;
