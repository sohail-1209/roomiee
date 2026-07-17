import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'Quikden';
const DEFAULT_DESCRIPTION = "India's easiest platform to find rental houses, rooms, hostels, and roommates. AI-powered search, zero brokerage, verified listings.";
const DEFAULT_IMAGE = 'https://res.cloudinary.com/dldgj84bm/image/upload/v1784198779/ChatGPT_Image_Jul_16_2026_04_15_03_PM_wtomms.png';
const BASE_URL = 'https://quikden.vercel.app';

export default function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  noIndex = false,
  city,
}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Find Rooms & Roommates in India`;
  const canonicalUrl = url ? `${BASE_URL}${url}` : undefined;
  const ogImage = image || DEFAULT_IMAGE;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={noIndex ? 'noindex, nofollow' : 'index, follow'} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Hreflang for multi-language */}
      <link rel="alternate" hreflang="en" href={`${BASE_URL}/?lang=en`} />
      <link rel="alternate" hreflang="hi" href={`${BASE_URL}/?lang=hi`} />
      <link rel="alternate" hreflang="te" href={`${BASE_URL}/?lang=te`} />
      <link rel="alternate" hreflang="ur" href={`${BASE_URL}/?lang=ur`} />
      <link rel="alternate" hreflang="x-default" href={BASE_URL} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonicalUrl || BASE_URL} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_IN" />
      {city && <meta property="og:see_also" content={`${BASE_URL}/search?city=${encodeURIComponent(city)}`} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}
