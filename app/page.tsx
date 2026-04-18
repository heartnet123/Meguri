'use client';

import Link from 'next/link';
import { motion } from 'motion/react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      ease: 'easeInOut' as const,
    },
  },
};

const slideUpVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      ease: 'easeInOut' as const,
      duration: 0.6,
    },
  },
};

export default function LandingPage() {
  const dashboardHref = '/dashboard';

  return (
    <div className="min-h-screen bg-background overflow-hidden text-foreground">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-surface border-b border-border z-50" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="font-display font-medium tracking-tight text-xl flex items-center gap-2" aria-label="SmartStock home">
            <span className="inline-block w-3 h-3 bg-accent shrink-0" aria-hidden="true"></span>
            SMARTSTOCK
          </div>
          <div className="hidden md:flex space-x-2">
            <a href="#features" className="text-sm font-medium hover:text-accent transition-colors py-3 px-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg">Features</a>
            <a href="#ai" className="text-sm font-medium hover:text-accent transition-colors py-3 px-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg">AI Forecasting</a>
            <a href="#audience" className="text-sm font-medium hover:text-accent transition-colors py-3 px-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg">For Who</a>
          </div>
          <Link
            href={dashboardHref}
            className="bg-accent text-accent-fg px-5 py-2.5 text-sm font-medium hover:bg-accent/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent"
          >
            Open Dashboard
          </Link>
        </div>
      </nav>

      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 text-center">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-4xl mx-auto space-y-10"
          >
            <motion.div variants={slideUpVariants} className="inline-flex items-center gap-2 px-3 py-1 bg-subtle border border-border text-xs font-semibold text-accent tracking-wide uppercase">
              <iconify-icon icon="solar:stars-linear" width="16" height="16" aria-hidden="true"></iconify-icon>
              Powered by Actionable Intelligence
            </motion.div>
            
            <motion.h1 variants={slideUpVariants} className="font-display text-5xl md:text-8xl font-medium tracking-tighter leading-none">
              Smarter Inventory. <br className="hidden md:block" />
              <span className="text-muted">Accurate Forecasts.</span>
            </motion.h1>
            
            <motion.p variants={slideUpVariants} className="text-xl text-muted max-w-2xl mx-auto leading-relaxed">
              The all-in-one platform for bakeries, cafés, and small retailers. Track stock in real-time, connect recipes to sales, and let AI predict your demand so you never run out of what matters.
            </motion.p>
            
            <motion.div variants={slideUpVariants} className="flex flex-col items-center justify-center gap-4 pt-6">
              <div className="flex w-full flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href={dashboardHref}
                  className="w-full sm:w-auto bg-accent text-accent-fg px-8 py-4 text-sm font-semibold tracking-wide uppercase hover:bg-accent/90 transition-colors flex items-center justify-center gap-2"
                >
                  Go to Dashboard
                  <iconify-icon icon="solar:arrow-right-linear" width="20" height="20" aria-hidden="true"></iconify-icon>
                </Link>
                <a href="#features" className="w-full sm:w-auto bg-surface text-foreground border border-border px-8 py-4 text-sm font-semibold tracking-wide uppercase hover:bg-subtle transition-colors flex items-center justify-center gap-2">
                  <iconify-icon icon="solar:play-circle-linear" width="20" height="20" aria-hidden="true"></iconify-icon>
                  Explore Features
                </a>
              </div>
              <p className="text-sm text-muted">
                Already have an account?{' '}
                <Link href={dashboardHref} className="font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-accent">
                  Jump straight into the dashboard
                </Link>
                .
              </p>
            </motion.div>
          </motion.div>

          {/* Dashboard Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8, ease: 'easeInOut' }}
            className="mt-24 relative mx-auto max-w-5xl"
            aria-hidden="true"
          >
            <div className="aspect-[16/9] bg-surface border border-border overflow-hidden relative flex flex-col">
              {/* Mockup Header */}
              <div className="h-12 border-b border-border flex items-center px-6 gap-4 bg-subtle">
                <div className="flex gap-2">
                  <div className="w-2.5 h-2.5 bg-muted"></div>
                  <div className="w-2.5 h-2.5 bg-muted"></div>
                  <div className="w-2.5 h-2.5 bg-muted"></div>
                </div>
                <div className="mx-auto font-mono text-xs text-muted tracking-widest uppercase">
                  app.smartstock.io
                </div>
              </div>
              {/* Mockup Body */}
              <div className="flex-1 p-8 grid grid-cols-12 gap-8 bg-background">
                {/* Sidebar */}
                <div className="hidden sm:block col-span-3 space-y-6">
                  <div className="h-6 bg-border w-2/3"></div>
                  <div className="space-y-3 pt-6">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-4 bg-subtle w-full"></div>
                    ))}
                  </div>
                </div>
                {/* Main Content */}
                <div className="col-span-12 sm:col-span-9 space-y-8">
                  <div className="flex justify-between items-end border-b border-border pb-4">
                    <div className="h-10 bg-border w-48"></div>
                    <div className="h-6 bg-subtle w-32"></div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-28 border border-border p-5 flex flex-col justify-between">
                         <div className="h-3 bg-subtle w-1/2"></div>
                         <div className="h-10 bg-border w-3/4"></div>
                      </div>
                    ))}
                  </div>
                  <div className="h-64 border border-border p-6 flex flex-col">
                     <div className="h-3 bg-subtle w-1/4 mb-6"></div>
                     <div className="flex-1 bg-subtle relative border-b border-border">
                        {/* Fake chart line */}
                        <svg className="absolute inset-0 h-full w-full opacity-60" preserveAspectRatio="none" viewBox="0 0 100 100">
                          <path d="M0,80 L20,70 L40,85 L60,40 L80,50 L100,20" fill="none" stroke="currentColor" className="text-border" strokeWidth="2" strokeLinejoin="miter" />
                        </svg>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Features Section - Asymmetrical Layout */}
        <section id="features" className="py-24 border-y border-border bg-surface">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mb-16 lg:mb-24">
              <h2 className="font-display text-4xl md:text-5xl font-medium tracking-tight mb-6">Uncompromising Control.</h2>
              <p className="text-xl text-muted leading-relaxed">Stop guessing and start knowing. Our platform connects your sales directly to your raw material inventory through a stark, efficient interface.</p>
            </div>

            <div className="grid md:grid-cols-12 gap-x-12 gap-y-16">
              {features.map((feature, index) => (
                <motion.div 
                  key={index}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  variants={slideUpVariants}
                  className={`border-t border-border pt-6 ${
                    index === 0 || index === 3 ? "md:col-span-7" : "md:col-span-5"
                  }`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <iconify-icon icon={feature.icon} width="28" height="28" className="text-accent" aria-hidden="true"></iconify-icon>
                    <h3 className="font-display text-2xl font-medium">{feature.title}</h3>
                  </div>
                  <p className="text-muted leading-relaxed max-w-md">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* AI Section */}
        <section id="ai" className="py-24 bg-foreground text-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-20 items-center">
              <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={containerVariants}
                className="space-y-12"
              >
                <motion.div variants={slideUpVariants}>
                  <h2 className="font-display text-4xl md:text-5xl font-medium tracking-tight mb-6">Demand Forecasting powered by AI</h2>
                  <p className="text-background/70 text-xl leading-relaxed">
                    We use advanced machine learning models to analyze your historical sales, detect seasonality, and predict future demand with high accuracy.
                  </p>
                </motion.div>

                <div className="space-y-8">
                  {aiFeatures.map((feature, index) => (
                    <motion.div variants={slideUpVariants} key={index} className="flex gap-6 group">
                      <div className="mt-1 flex items-center justify-center shrink-0 border border-background/20 rounded-lg w-12 h-12">
                        <iconify-icon icon={feature.icon} width="24" height="24" className="text-accent" aria-hidden="true"></iconify-icon>
                      </div>
                      <div>
                        <h4 className="font-display text-xl font-medium mb-2">{feature.title}</h4>
                        <p className="text-background/70 leading-relaxed">{feature.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="relative"
                aria-hidden="true"
              >
                <div className="aspect-square rounded-3xl bg-neutral-800 border border-neutral-700 p-8 shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-900"></div>
                  
                  {/* Abstract AI Visualization */}
                  <div className="relative h-full flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                      <div className="text-sm font-medium text-neutral-300">Forecast: Croissants</div>
                      <div className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-xs font-medium border border-emerald-500/30">
                        High Confidence
                      </div>
                    </div>
                    
                    <div className="flex-1 relative">
                      {/* Grid lines */}
                      <div className="absolute inset-0 flex flex-col justify-between">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="w-full h-px bg-neutral-700/50"></div>
                        ))}
                      </div>
                      
                      {/* Chart line */}
                      <svg className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                        {/* Historical */}
                        <path d="M0,80 L20,60 L40,70 L60,40" fill="none" stroke="#737373" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        {/* Forecast */}
                        <path d="M60,40 L80,30 L100,45" fill="none" stroke="#5eead4" strokeWidth="3" strokeDasharray="4 4" strokeLinecap="round" strokeLinejoin="round" />

                        {/* Points */}
                        <circle cx="60" cy="40" r="4" fill="#5eead4" />
                        <circle cx="80" cy="30" r="4" fill="#5eead4" />
                        <circle cx="100" cy="45" r="4" fill="#5eead4" />
                      </svg>
                    </div>
                    
                    <div className="mt-8 bg-neutral-800/80 backdrop-blur border border-neutral-700 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <iconify-icon icon="solar:info-circle-linear" width="20" height="20" className="text-neutral-400 mt-0.5" aria-hidden="true"></iconify-icon>
                        <div>
                          <div className="text-sm font-medium text-white mb-1">Recommendation</div>
                          <div className="text-xs text-neutral-400">Order 15kg of Butter today to meet expected weekend demand. Lead time is 2 days.</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Target Audience */}
        <section id="audience" className="py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 lg:mb-24 gap-8">
              <div className="max-w-2xl">
                <h2 className="font-display text-4xl md:text-5xl font-medium tracking-tight mb-6">Built for your business.</h2>
                <p className="text-xl text-muted leading-relaxed">Designed specifically for the needs of small to medium food and retail operations.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-x-12 gap-y-16">
              {audiences.map((audience, index) => (
                <motion.div 
                  key={index}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={slideUpVariants}
                  className="pt-6 border-t font-mono border-border"
                >
                  <h3 className="font-display text-3xl font-medium mb-4">{audience.title}</h3>
                  <p className="text-muted leading-relaxed mb-8">{audience.description}</p>
                  <ul className="space-y-4">
                    {audience.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-3 text-foreground font-sans">
                        <iconify-icon icon="solar:check-circle-linear" width="20" height="20" className="text-accent shrink-0 mt-1" aria-hidden="true"></iconify-icon>
                        <span className="leading-snug">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface border-t border-border py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="font-display font-medium tracking-tight text-xl flex items-center gap-2">
            <span className="inline-block w-3 h-3 bg-accent shrink-0" aria-hidden="true"></span>
            SMARTSTOCK
          </div>
          <div className="text-sm text-muted font-mono tracking-widest uppercase">
            &copy; {new Date().getFullYear()} SmartStock Platform. All rights reserved.
          </div>
          <div className="flex gap-2">
            <a href="#" className="p-3 text-muted hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground rounded-lg" aria-label="Follow SmartStock on Twitter">
              <iconify-icon icon="solar:twitter-linear" width="24" height="24" aria-hidden="true"></iconify-icon>
            </a>
            <a href="#" className="p-3 text-muted hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground rounded-lg" aria-label="View SmartStock on GitHub">
              <iconify-icon icon="solar:github-linear" width="24" height="24" aria-hidden="true"></iconify-icon>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: "solar:box-linear",
    title: "Real-time Inventory",
    description: "Track stock in and out instantly. Support for multiple units (kg, g, pieces) and manual adjustments."
  },
  {
    icon: "solar:document-text-linear",
    title: "Recipe & BOM Support",
    description: "Link products to raw materials. Selling one item automatically deducts the exact ingredients used."
  },
  {
    icon: "solar:bell-bing-linear",
    title: "Low Stock Alerts",
    description: "Set custom reorder points and get notified before you run out of critical supplies."
  },
  {
    icon: "solar:chart-square-linear",
    title: "Sales Dashboard",
    description: "Visualize daily sales, top-selling items, and inventory turnover in one clean interface."
  },
  {
    icon: "solar:cart-large-linear",
    title: "Smart Recommendations",
    description: "Get purchase recommendations based on current stock, lead times, and forecasted demand."
  },
  {
    icon: "solar:danger-triangle-linear",
    title: "Anomaly Detection",
    description: "Automatically detect unusual stock usage or sudden sales drops to prevent waste and fraud."
  }
];

const aiFeatures = [
  {
    icon: "solar:bolt-linear",
    title: "Fast AI Responses",
    description: "Powered by Gemini Flash Lite for instant, low-latency insights and daily operational recommendations."
  },
  {
    icon: "solar:network-intelligence-linear",
    title: "Deep Thinking Mode",
    description: "Utilizes Gemini Pro with high thinking levels for complex demand forecasting and seasonality analysis."
  },
  {
    icon: "solar:graph-up-linear",
    title: "Adaptive Models",
    description: "Starts with statistical baselines and automatically upgrades to advanced ML models as your data grows."
  }
];

const audiences = [
  {
    title: "Cafés",
    description: "Keep your espresso flowing and pastries fresh without over-ordering.",
    benefits: [
      "Track milk and bean usage accurately",
      "Forecast weekend vs weekday demand",
      "Manage perishable inventory"
    ]
  },
  {
    title: "Bakeries",
    description: "Connect your daily production recipes directly to your raw material stock.",
    benefits: [
      "BOM-based flour and butter deduction",
      "Plan tomorrow's production",
      "Reduce ingredient waste"
    ]
  },
  {
    title: "Small Retail",
    description: "Know exactly what's selling and what's sitting on the shelf.",
    benefits: [
      "Identify dead stock quickly",
      "Automated reorder recommendations",
      "Track supplier lead times"
    ]
  }
];
