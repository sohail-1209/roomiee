import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Sparkles, MessageSquare, CreditCard, Heart, ArrowRight } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import SEO from '../components/SEO';
import JsonLd from '../components/JsonLd';

export default function AboutPage() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  const aboutSchema = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'About Quikden',
    description: 'Quikden is India\'s premier zero-brokerage platform for finding rooms, hostels, PG accommodations, and flatmates.',
    url: 'https://quikden.in/about',
    mainEntity: {
      '@type': 'Organization',
      name: 'Quikden',
      url: 'https://quikden.in',
      logo: 'https://res.cloudinary.com/dldgj84bm/image/upload/v1784198779/ChatGPT_Image_Jul_16_2026_04_15_03_PM_wtomms.png',
    },
  };

  return (
    <div className="min-h-screen bg-surface-50 font-sans">
      <SEO
        title="About Quikden — Zero Brokerage Rental Platform"
        description="Quikden is India's premier platform to find rental houses, rooms, hostels, and flatmates without brokers. AI-powered search, real-time chat, verified listings."
        url="/about"
      />
      <JsonLd data={aboutSchema} />
      <Navbar />

      {/* Hero section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50/80 via-white to-surface-50 py-16 sm:py-24">
        {/* Decorative background blobs */}
        <div className="absolute top-0 left-[10%] w-72 sm:w-96 h-72 sm:h-96 bg-primary-100/30 rounded-full blur-3xl animate-liquid-float" />
        <div className="absolute bottom-0 right-[15%] w-64 sm:w-80 h-64 sm:h-80 bg-accent-100/20 rounded-full blur-3xl animate-liquid-float" style={{ animationDelay: '2.5s' }} />

        <div className={`relative z-10 max-w-4xl mx-auto px-4 text-center transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary-50 text-primary-600 text-xs font-semibold mb-6 border border-primary-100">
            <Heart size={12} className="fill-primary-500 text-primary-500 animate-pulse" />
            {t('aboutQuikden') || 'About Quikden'}
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-5xl tracking-tight text-surface-900 mb-4">
            {t('aboutTitle') || 'Connecting Hearts, Finding Homes'}
          </h1>
          <p className="text-surface-500 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            {t('aboutSubtitle') || 'We are redefining the property renting experience across India. No brokers, no hidden commission fees, just direct and transparent connections between roommates, tenants, and verified owners.'}
          </p>
        </div>
      </section>

      {/* Detail Mission Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-surface-900">
              {t('ourVision') || 'Our Vision & Core Mission'}
            </h2>
            <p className="text-surface-600 text-sm leading-relaxed">
              {t('ourVisionDesc1') || 'Finding a place to live is more than just looking at walls and paying deposits. It is about discovering a sanctuary, finding flatmates who share your lifestyle, and interacting with property owners who value transparency.'}
            </p>
            <p className="text-surface-600 text-sm leading-relaxed">
              {t('ourVisionDesc2') || 'Quikden was built from the ground up to solve the challenges of modern urban housing. By eliminating broker interfaces, we empower tenants and owners to communicate directly in real-time, pick customizable room-sharing filters, and manage listings with confidence.'}
            </p>
          </div>
          
          <div className="glass-card p-8 space-y-6 bg-gradient-to-tr from-primary-50/50 to-white border border-primary-100 rounded-3xl relative overflow-hidden">
            {/* Safe area absolute target tag */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary-200/10 rounded-full blur-xl" />
            <h3 className="font-display font-bold text-xs uppercase text-primary-600 tracking-wider">
              {t('ourGoalLabel') || 'Our Commitment'}
            </h3>
            <p className="font-display font-semibold text-lg text-surface-900 leading-snug">
              " {t('trustCardGoal') || 'Our goal is to make it easy for tenants to find verified properties without broker interventions, while helping verified owners list and manage properties effortlessly.'} "
            </p>
          </div>
        </div>
      </section>

      {/* Features Pillars Grid */}
      <section className="bg-white border-t border-b border-surface-100 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-surface-900">
              {t('whyChooseUs') || 'The Pillars of Quikden'}
            </h2>
            <p className="text-xs text-surface-450 leading-relaxed">
              {t('whyChooseUsDesc') || 'Explore the premium features designed to make property rental fast, safe, and completely transparent.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
            {/* Card 1: Zero Brokerage */}
            <div className="glass-card p-6 border border-surface-200/50 hover:border-primary-300 hover:shadow-md transition-all duration-300 rounded-2xl group text-center md:text-left">
              <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 mb-4 mx-auto md:mx-0 group-hover:scale-105 transition-transform duration-300">
                <CreditCard size={20} />
              </div>
              <h3 className="font-display font-semibold text-sm text-surface-900 mb-2">
                {t('pillarNoBrokerage') || 'Zero Brokerage'}
              </h3>
              <p className="text-xs text-surface-450 leading-relaxed">
                {t('pillarNoBrokerageDesc') || 'Interact directly with owners. Absolutely no commission fees or broker charges, saving you thousands on deposits.'}
              </p>
            </div>

            {/* Card 2: AI Search */}
            <div className="glass-card p-6 border border-surface-200/50 hover:border-accent-300 hover:shadow-md transition-all duration-300 rounded-2xl group text-center md:text-left">
              <div className="w-12 h-12 bg-accent-50 rounded-2xl flex items-center justify-center text-accent-600 mb-4 mx-auto md:mx-0 group-hover:scale-105 transition-transform duration-300">
                <Sparkles size={20} />
              </div>
              <h3 className="font-display font-semibold text-sm text-surface-900 mb-2">
                {t('pillarAiSearch') || 'AI Intelligent Search'}
              </h3>
              <p className="text-xs text-surface-450 leading-relaxed">
                {t('pillarAiSearchDesc') || 'Simply type what you are looking for in natural language and let our AI parser find the perfect matches instantly.'}
              </p>
            </div>

            {/* Card 3: Realtime Status */}
            <div className="glass-card p-6 border border-surface-200/50 hover:border-emerald-300 hover:shadow-md transition-all duration-300 rounded-2xl group text-center md:text-left">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-4 mx-auto md:mx-0 group-hover:scale-105 transition-transform duration-300">
                <MessageSquare size={20} />
              </div>
              <h3 className="font-display font-semibold text-sm text-surface-900 mb-2">
                {t('pillarChat') || 'Direct Chat & Presence'}
              </h3>
              <p className="text-xs text-surface-450 leading-relaxed">
                {t('pillarChatDesc') || 'Real-time chat with online, last seen, and typing status so you know exactly when owners or flatmates are online.'}
              </p>
            </div>

            {/* Card 4: Verified Listings */}
            <div className="glass-card p-6 border border-surface-200/50 hover:border-amber-300 hover:shadow-md transition-all duration-300 rounded-2xl group text-center md:text-left">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-4 mx-auto md:mx-0 group-hover:scale-105 transition-transform duration-300">
                <ShieldCheck size={20} />
              </div>
              <h3 className="font-display font-semibold text-sm text-surface-900 mb-2">
                {t('pillarVerification') || 'Verified Listings'}
              </h3>
              <p className="text-xs text-surface-450 leading-relaxed">
                {t('pillarVerificationDesc') || 'Our rigorous verification protocols ensure all host, roommate, and owner profiles are authentic and secure.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16 text-center space-y-6">
        <h2 className="font-display font-bold text-2xl sm:text-3xl text-surface-900">
          {t('readyToFind') || 'Ready to discover your next home?'}
        </h2>
        <p className="text-xs text-surface-450 max-w-md mx-auto">
          {t('readyToFindDesc') || 'Join thousands of students, professionals, and owners on Quikden today and find roommates, houses, or land easily.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a
            href="/search"
            className="w-full sm:w-auto btn bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white font-semibold px-6 py-3 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-md transition-all"
          >
            {t('exploreProperties') || 'Explore Listings'} <ArrowRight size={14} />
          </a>
          <a
            href="/register"
            className="w-full sm:w-auto btn bg-white hover:bg-surface-50 text-surface-800 border border-surface-200 font-semibold px-6 py-3 rounded-2xl text-sm flex items-center justify-center gap-2 transition-all"
          >
            {t('postFreeListingBtn') || 'Post Free Listing'}
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
