'use client';

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
  return (
    <div className="min-h-screen bg-neutral-50 overflow-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-neutral-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="font-sans font-medium tracking-tighter text-lg text-neutral-900">
            SMARTSTOCK
          </div>
          <div className="hidden md:flex space-x-8">
            <a href="#features" className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">Features</a>
            <a href="#ai" className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">AI Forecasting</a>
            <a href="#audience" className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">For Who</a>
          </div>
          <div>
            <button className="bg-neutral-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors shadow-xl">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 text-center">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-3xl mx-auto space-y-8"
          >
            <motion.div variants={slideUpVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-xs font-medium text-neutral-600">
              <iconify-icon icon="solar:stars-linear" width="16" height="16"></iconify-icon>
              Powered by Advanced AI
            </motion.div>
            
            <motion.h1 variants={slideUpVariants} className="text-5xl md:text-7xl font-medium tracking-tight text-neutral-900 leading-tight">
              Smarter Inventory. <br className="hidden md:block" />
              <span className="text-neutral-500">Accurate Forecasts.</span>
            </motion.h1>
            
            <motion.p variants={slideUpVariants} className="text-lg text-neutral-600 max-w-2xl mx-auto">
              The all-in-one platform for bakeries, cafés, and small retailers. Track stock in real-time, connect recipes to sales, and let AI predict your demand so you never run out of what matters.
            </motion.p>
            
            <motion.div variants={slideUpVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button className="w-full sm:w-auto bg-neutral-900 text-white px-8 py-3 rounded-xl text-base font-medium hover:bg-neutral-800 transition-colors shadow-xl flex items-center justify-center gap-2">
                Start Free Trial
                <iconify-icon icon="solar:arrow-right-linear" width="20" height="20"></iconify-icon>
              </button>
              <button className="w-full sm:w-auto bg-white text-neutral-900 border border-neutral-200 px-8 py-3 rounded-xl text-base font-medium hover:bg-neutral-50 transition-colors flex items-center justify-center gap-2">
                <iconify-icon icon="solar:play-circle-linear" width="20" height="20"></iconify-icon>
                Watch Demo
              </button>
            </motion.div>
          </motion.div>

          {/* Dashboard Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8, ease: 'easeInOut' }}
            className="mt-16 relative mx-auto max-w-5xl"
          >
            <div className="aspect-[16/9] bg-white rounded-2xl border border-neutral-200 shadow-xl overflow-hidden relative flex flex-col">
              {/* Mockup Header */}
              <div className="h-12 border-b border-neutral-100 flex items-center px-4 gap-2 bg-neutral-50/50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-neutral-200"></div>
                  <div className="w-3 h-3 rounded-full bg-neutral-200"></div>
                  <div className="w-3 h-3 rounded-full bg-neutral-200"></div>
                </div>
                <div className="mx-auto bg-white border border-neutral-200 rounded-md px-16 sm:px-32 py-1 text-xs text-neutral-400">
                  smartstock.app/dashboard
                </div>
              </div>
              {/* Mockup Body */}
              <div className="flex-1 p-4 sm:p-6 grid grid-cols-12 gap-4 sm:gap-6 bg-neutral-50/30">
                {/* Sidebar */}
                <div className="hidden sm:block col-span-2 space-y-4">
                  <div className="h-8 bg-neutral-200/50 rounded-md w-3/4"></div>
                  <div className="space-y-2 pt-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-6 bg-neutral-100 rounded-md w-full"></div>
                    ))}
                  </div>
                </div>
                {/* Main Content */}
                <div className="col-span-12 sm:col-span-10 space-y-6">
                  <div className="flex justify-between items-center">
                    <div className="h-8 bg-neutral-200/50 rounded-md w-32 sm:w-48"></div>
                    <div className="h-8 bg-neutral-200/50 rounded-md w-24 sm:w-32"></div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-20 sm:h-24 bg-white border border-neutral-100 rounded-xl shadow-sm p-4 flex flex-col justify-between">
                         <div className="h-3 sm:h-4 bg-neutral-100 rounded w-1/2"></div>
                         <div className="h-6 sm:h-8 bg-neutral-200/50 rounded w-3/4"></div>
                      </div>
                    ))}
                  </div>
                  <div className="h-48 sm:h-64 bg-white border border-neutral-100 rounded-xl shadow-sm p-4">
                     <div className="h-4 bg-neutral-100 rounded w-1/4 mb-4"></div>
                     <div className="w-full h-32 sm:h-48 bg-gradient-to-t from-neutral-100 to-transparent rounded-lg border-b border-neutral-200 relative">
                        {/* Fake chart line */}
                        <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                          <path d="M0,80 Q10,70 20,85 T40,60 T60,40 T80,50 T100,20" fill="none" stroke="#a3a3a3" strokeWidth="2" />
                        </svg>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-white border-y border-neutral-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-medium tracking-tight text-neutral-900 mb-4">Everything you need to manage stock</h2>
              <p className="text-neutral-600">Stop guessing and start knowing. Our platform connects your sales to your inventory in real-time.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div 
                  key={index}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  variants={slideUpVariants}
                  className="p-6 rounded-2xl bg-neutral-50 border border-neutral-200 shadow-xl hover:shadow-2xl transition-shadow"
                >
                  <div className="w-12 h-12 rounded-xl bg-white border border-neutral-200 flex items-center justify-center mb-6 shadow-sm">
                    <iconify-icon icon={feature.icon} width="24" height="24" className="text-neutral-700"></iconify-icon>
                  </div>
                  <h3 className="text-lg font-medium tracking-tight text-neutral-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* AI Section */}
        <section id="ai" className="py-24 bg-neutral-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={containerVariants}
                className="space-y-8"
              >
                <motion.div variants={slideUpVariants}>
                  <h2 className="text-3xl md:text-4xl font-medium tracking-tight mb-4">Demand Forecasting powered by AI</h2>
                  <p className="text-neutral-400 text-lg">
                    We use advanced machine learning models to analyze your historical sales, detect seasonality, and predict future demand with high accuracy.
                  </p>
                </motion.div>

                <div className="space-y-6">
                  {aiFeatures.map((feature, index) => (
                    <motion.div variants={slideUpVariants} key={index} className="flex gap-4">
                      <div className="mt-1 w-10 h-10 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center shrink-0">
                        <iconify-icon icon={feature.icon} width="20" height="20" className="text-neutral-300"></iconify-icon>
                      </div>
                      <div>
                        <h4 className="text-base font-medium mb-1">{feature.title}</h4>
                        <p className="text-sm text-neutral-400">{feature.description}</p>
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
                        <path d="M60,40 L80,30 L100,45" fill="none" stroke="#ffffff" strokeWidth="3" strokeDasharray="4 4" strokeLinecap="round" strokeLinejoin="round" />
                        
                        {/* Points */}
                        <circle cx="60" cy="40" r="4" fill="#ffffff" />
                        <circle cx="80" cy="30" r="4" fill="#ffffff" />
                        <circle cx="100" cy="45" r="4" fill="#ffffff" />
                      </svg>
                    </div>
                    
                    <div className="mt-8 bg-neutral-800/80 backdrop-blur border border-neutral-700 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <iconify-icon icon="solar:info-circle-linear" width="20" height="20" className="text-neutral-400 mt-0.5"></iconify-icon>
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
        <section id="audience" className="py-24 bg-neutral-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-medium tracking-tight text-neutral-900 mb-4">Built for your business</h2>
              <p className="text-neutral-600">Designed specifically for the needs of small to medium food and retail operations.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {audiences.map((audience, index) => (
                <motion.div 
                  key={index}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={slideUpVariants}
                  className="bg-white rounded-2xl p-8 border border-neutral-200 shadow-xl"
                >
                  <h3 className="text-xl font-medium tracking-tight text-neutral-900 mb-4">{audience.title}</h3>
                  <p className="text-sm text-neutral-600 mb-6">{audience.description}</p>
                  <ul className="space-y-3">
                    {audience.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                        <iconify-icon icon="solar:check-circle-linear" width="18" height="18" className="text-neutral-400 shrink-0 mt-0.5"></iconify-icon>
                        {benefit}
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
      <footer className="bg-white border-t border-neutral-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="font-sans font-medium tracking-tighter text-lg text-neutral-900">
            SMARTSTOCK
          </div>
          <div className="text-sm text-neutral-500">
            &copy; {new Date().getFullYear()} SmartStock Platform. All rights reserved.
          </div>
          <div className="flex gap-4">
            <a href="#" className="text-neutral-400 hover:text-neutral-900 transition-colors">
              <iconify-icon icon="solar:twitter-linear" width="24" height="24"></iconify-icon>
            </a>
            <a href="#" className="text-neutral-400 hover:text-neutral-900 transition-colors">
              <iconify-icon icon="solar:github-linear" width="24" height="24"></iconify-icon>
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
