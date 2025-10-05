import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, FileText, Link2, MessageSquare, Zap, Shield, Menu, X, ArrowRight, Check, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    document.querySelectorAll('.fade-in-section').forEach(el => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20" />
        <div className="floating-particles">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="particle" style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${15 + Math.random() * 10}s`
            }} />
          ))}
        </div>
      </div>

      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-black/80 backdrop-blur-xl border-b border-white/10' : 'bg-transparent'
      }`}>
        <nav className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-purple-500 to-blue-500 p-2 rounded-xl animate-glow">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                AgentsForYou
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button onClick={() => scrollToSection('home')} className="nav-link">Home</button>
              <button onClick={() => scrollToSection('services')} className="nav-link">Services</button>
              <button onClick={() => scrollToSection('pricing')} className="nav-link">Pricing</button>
              <button onClick={() => scrollToSection('about')} className="nav-link">About</button>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="btn-primary"
                >
                  Dashboard
                </button>
              ) : (
                <>
                  <Link to="/login" className="nav-link">Sign In</Link>
                  <Link to="/register" className="btn-primary">
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 space-y-3 animate-slide-down">
              <button onClick={() => scrollToSection('home')} className="block w-full text-left py-2 nav-link">Home</button>
              <button onClick={() => scrollToSection('services')} className="block w-full text-left py-2 nav-link">Services</button>
              <button onClick={() => scrollToSection('pricing')} className="block w-full text-left py-2 nav-link">Pricing</button>
              <button onClick={() => scrollToSection('about')} className="block w-full text-left py-2 nav-link">About</button>
              <div className="pt-3 space-y-2">
                {user ? (
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="block w-full text-center btn-primary"
                  >
                    Dashboard
                  </button>
                ) : (
                  <>
                    <Link to="/login" className="block w-full text-center py-2 nav-link">Sign In</Link>
                    <Link to="/register" className="block w-full text-center btn-primary">Get Started</Link>
                  </>
                )}
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <section id="home" className="relative min-h-screen flex items-center justify-center pt-20 px-6">
        <div className="max-w-6xl mx-auto text-center z-10">
          <div className="fade-in-section">
            <div className="inline-flex items-center space-x-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-2 mb-8 animate-fade-in">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-300">Powered by Advanced AI</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-slide-up">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                AI Agents
              </span>
              <br />
              That Understand Your Content
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-400 mb-8 max-w-3xl mx-auto animate-slide-up" style={{ animationDelay: '0.2s' }}>
              Transform your documents and websites into intelligent chatbots. 
              Extract insights, automate responses, and empower your business with AI.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <Link to="/register" className="btn-primary-lg group">
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button onClick={() => scrollToSection('services')} className="btn-secondary-lg">
                Learn More
              </button>
            </div>
          </div>

          {/* Animated 3D Element */}
          <div className="mt-16 animate-float">
            <div className="relative w-full max-w-2xl mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-3xl blur-3xl opacity-30 animate-pulse-slow" />
              <div className="relative bg-gradient-to-br from-purple-900/40 to-blue-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Bot className="w-8 h-8 text-purple-400" />
                    <div>
                      <div className="h-2 w-24 bg-white/20 rounded" />
                      <div className="h-2 w-16 bg-white/10 rounded mt-2" />
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full animate-pulse" />
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-white/10 rounded w-full" />
                  <div className="h-4 bg-white/10 rounded w-5/6" />
                  <div className="h-4 bg-white/10 rounded w-4/6" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="relative py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 fade-in-section">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              What Can <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">AgentsForYou</span> Do?
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Unlock the power of AI to transform your content into intelligent conversational agents
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* PDF Extraction */}
            <div className="fade-in-section card-hover">
              <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-8 h-full">
                <div className="bg-purple-500/20 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                  <FileText className="w-7 h-7 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold mb-4">PDF Intelligence</h3>
                <p className="text-gray-400 mb-6">
                  Upload PDFs and automatically extract, analyze, and understand their content. 
                  Our AI processes documents with precision, maintaining context and meaning.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-purple-400 mt-0.5" />
                    <span className="text-gray-300">Advanced text extraction</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-purple-400 mt-0.5" />
                    <span className="text-gray-300">OCR for scanned documents</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-purple-400 mt-0.5" />
                    <span className="text-gray-300">Smart chunking & indexing</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* URL Scraping */}
            <div className="fade-in-section card-hover" style={{ animationDelay: '0.1s' }}>
              <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-8 h-full">
                <div className="bg-blue-500/20 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                  <Link2 className="w-7 h-7 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Web Extraction</h3>
                <p className="text-gray-400 mb-6">
                  Turn any website into a knowledge base. Extract and process web content 
                  automatically, keeping your agents always up-to-date.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-blue-400 mt-0.5" />
                    <span className="text-gray-300">Real-time web scraping</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-blue-400 mt-0.5" />
                    <span className="text-gray-300">Clean content parsing</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-blue-400 mt-0.5" />
                    <span className="text-gray-300">Multi-page support</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Intelligent Chat */}
            <div className="fade-in-section card-hover" style={{ animationDelay: '0.2s' }}>
              <div className="bg-gradient-to-br from-pink-900/40 to-pink-800/20 backdrop-blur-xl border border-pink-500/20 rounded-2xl p-8 h-full">
                <div className="bg-pink-500/20 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                  <MessageSquare className="w-7 h-7 text-pink-400" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Smart Conversations</h3>
                <p className="text-gray-400 mb-6">
                  Create intelligent chatbots that understand your content deeply. 
                  Provide accurate, contextual answers to any question.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-pink-400 mt-0.5" />
                    <span className="text-gray-300">Context-aware responses</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-pink-400 mt-0.5" />
                    <span className="text-gray-300">Natural conversations</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-pink-400 mt-0.5" />
                    <span className="text-gray-300">Instant responses</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-4 gap-6 mt-16">
            {[
              { icon: Zap, title: 'Lightning Fast', desc: 'Instant responses powered by advanced AI' },
              { icon: Shield, title: 'Secure & Private', desc: 'Your data is encrypted and protected' },
              { icon: Bot, title: 'Multi-Agent', desc: 'Create unlimited specialized agents' },
              { icon: Sparkles, title: 'Always Learning', desc: 'Continuously improving accuracy' },
            ].map((feature, i) => (
              <div key={i} className="fade-in-section" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300">
                  <feature.icon className="w-8 h-8 text-purple-400 mb-3" />
                  <h4 className="font-semibold mb-2">{feature.title}</h4>
                  <p className="text-sm text-gray-400">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 fade-in-section">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Simple, <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Transparent</span> Pricing
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Start free, scale as you grow. No hidden fees, no surprises.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="fade-in-section">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 h-full">
                <h3 className="text-2xl font-bold mb-2">Starter</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-gray-400">/month</span>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-purple-400" />
                    <span>1 AI Agent</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-purple-400" />
                    <span>5 Documents</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-purple-400" />
                    <span>100 Messages/month</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-purple-400" />
                    <span>Basic Support</span>
                  </li>
                </ul>
                <Link to="/register" className="block w-full text-center py-3 px-6 border border-white/20 rounded-lg hover:bg-white/10 transition">
                  Get Started
                </Link>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="fade-in-section" style={{ animationDelay: '0.1s' }}>
              <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-xl border-2 border-purple-500/50 rounded-2xl p-8 h-full relative overflow-hidden">
                <div className="absolute top-4 right-4 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  POPULAR
                </div>
                <h3 className="text-2xl font-bold mb-2">Professional</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold">$29</span>
                  <span className="text-gray-400">/month</span>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-purple-400" />
                    <span>10 AI Agents</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-purple-400" />
                    <span>Unlimited Documents</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-purple-400" />
                    <span>10,000 Messages/month</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-purple-400" />
                    <span>Priority Support</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-purple-400" />
                    <span>Advanced Analytics</span>
                  </li>
                </ul>
                <Link to="/register" className="block w-full text-center py-3 px-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg hover:opacity-90 transition font-semibold">
                  Start Free Trial
                </Link>
              </div>
            </div>

            {/* Enterprise Plan */}
            <div className="fade-in-section" style={{ animationDelay: '0.2s' }}>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 h-full">
                <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold">Custom</span>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-purple-400" />
                    <span>Unlimited Agents</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-purple-400" />
                    <span>Unlimited Documents</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-purple-400" />
                    <span>Unlimited Messages</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-purple-400" />
                    <span>24/7 Dedicated Support</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-purple-400" />
                    <span>Custom Integration</span>
                  </li>
                </ul>
                <button className="block w-full text-center py-3 px-6 border border-white/20 rounded-lg hover:bg-white/10 transition">
                  Contact Sales
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="relative py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="fade-in-section text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              About <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">AgentsForYou</span>
            </h2>
            <p className="text-xl text-gray-400 mb-8 max-w-3xl mx-auto">
              We're on a mission to make AI accessible to everyone. AgentsForYou empowers individuals 
              and businesses to create intelligent agents that understand their unique content and 
              provide instant, accurate responses.
            </p>
            <div className="grid md:grid-cols-2 gap-8 mt-16 text-left">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
                <p className="text-gray-400">
                  To democratize AI technology and enable anyone to harness the power of intelligent 
                  automation. We believe every document, every piece of knowledge, deserves to be 
                  accessible and interactive.
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                <h3 className="text-2xl font-bold mb-4">Our Technology</h3>
                <p className="text-gray-400">
                  Built on cutting-edge AI models and retrieval-augmented generation (RAG) technology, 
                  AgentsForYou delivers fast, accurate, and contextually relevant responses from your 
                  content.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-6">
        <div className="max-w-4xl mx-auto text-center fade-in-section">
          <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 animate-pulse-slow" />
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to Get Started?
              </h2>
              <p className="text-xl text-gray-400 mb-8">
                Create your first AI agent in minutes. No credit card required.
              </p>
              <Link to="/register" className="btn-primary-lg inline-flex items-center group">
                Start Building Now
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/10 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="bg-gradient-to-br from-purple-500 to-blue-500 p-2 rounded-xl">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg">AgentsForYou</span>
            </div>
            <div className="text-gray-400 text-sm">
              © 2025 AgentsForYou. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
