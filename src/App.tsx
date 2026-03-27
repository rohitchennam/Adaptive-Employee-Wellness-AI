/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Activity, 
  Moon, 
  Footprints, 
  Heart, 
  Monitor, 
  Clock, 
  Mail, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight, 
  Send,
  User as UserIcon,
  Bot,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  LogOut,
  LogIn
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WellnessMetrics, ChatMessage, BurnoutRisk, OnboardingData, UserProfile } from './types';
import { getWellnessAdvice } from './services/gemini';
import { auth, db, signInWithGoogle, logout } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, serverTimestamp, getDoc, updateDoc } from 'firebase/firestore';

// --- Components ---

const Onboarding = ({ user, onComplete }: { user: User, onComplete: (data: OnboardingData) => void }) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    jobRole: '',
    typicalWorkHours: 8,
    stressLevel: 5,
    fitnessGoals: '',
    sleepTarget: 8
  });

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else onComplete(data);
  };

  return (
    <div className="pt-32 pb-24 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-10 md:p-16"
      >
        <div className="mb-12 text-center">
          <div className="w-16 h-16 bg-accent-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-accent-primary/30">
            <Sparkles className="text-accent-primary w-8 h-8" />
          </div>
          <h1 className="text-4xl font-serif italic text-white mb-2">Welcome, {user.displayName?.split(' ')[0]}</h1>
          <p className="text-slate-500 font-light">Let's set your wellness baseline to personalize your experience.</p>
        </div>

        <div className="space-y-12">
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
              <div className="space-y-4">
                <label className="text-xs text-slate-400 font-bold uppercase tracking-widest">What is your current job role?</label>
                <input 
                  type="text" 
                  value={data.jobRole}
                  onChange={(e) => setData({ ...data, jobRole: e.target.value })}
                  placeholder="e.g. Software Engineer, Product Manager"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-accent-primary transition-colors"
                />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-widest">Typical Daily Work Hours</label>
                  <span className="text-white font-mono">{data.typicalWorkHours}h</span>
                </div>
                <input 
                  type="range" min="4" max="16" step="0.5"
                  value={data.typicalWorkHours}
                  onChange={(e) => setData({ ...data, typicalWorkHours: Number(e.target.value) })}
                  className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-accent-primary"
                />
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-widest">Current Stress Level (1-10)</label>
                  <span className="text-white font-mono">{data.stressLevel}</span>
                </div>
                <input 
                  type="range" min="1" max="10"
                  value={data.stressLevel}
                  onChange={(e) => setData({ ...data, stressLevel: Number(e.target.value) })}
                  className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-accent-primary"
                />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-widest">Daily Sleep Target</label>
                  <span className="text-white font-mono">{data.sleepTarget}h</span>
                </div>
                <input 
                  type="range" min="4" max="12" step="0.5"
                  value={data.sleepTarget}
                  onChange={(e) => setData({ ...data, sleepTarget: Number(e.target.value) })}
                  className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-accent-primary"
                />
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
              <div className="space-y-4">
                <label className="text-xs text-slate-400 font-bold uppercase tracking-widest">What are your primary fitness goals?</label>
                <textarea 
                  value={data.fitnessGoals}
                  onChange={(e) => setData({ ...data, fitnessGoals: e.target.value })}
                  placeholder="e.g. Increase daily steps, improve sleep quality, reduce work-related stress"
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-accent-primary transition-colors resize-none"
                />
              </div>
            </motion.div>
          )}

          <div className="flex justify-between items-center pt-8">
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`w-2 h-2 rounded-full transition-colors ${step === i ? 'bg-accent-primary' : 'bg-white/10'}`} />
              ))}
            </div>
            <button 
              onClick={handleNext}
              disabled={step === 1 && !data.jobRole}
              className="glow-button px-10 py-4 text-sm tracking-widest uppercase flex items-center gap-2 disabled:opacity-50"
            >
              {step === 3 ? 'Complete Setup' : 'Next Step'} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const Navbar = ({ activeTab, setActiveTab, user, onLogin, isLoggingIn }: { activeTab: string, setActiveTab: (tab: string) => void, user: User | null, onLogin: () => void, isLoggingIn: boolean }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-bg-deep/40 backdrop-blur-xl border-b border-white/5 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveTab('landing')}>
            <div className="w-10 h-10 bg-accent-primary rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.3)] group-hover:scale-110 transition-transform">
              <Activity className="text-bg-deep w-6 h-6" />
            </div>
            <span className="font-serif italic text-2xl tracking-tight text-white">WellnessHub</span>
          </div>
          
          <div className="flex items-center gap-4">
            {activeTab !== 'landing' && (
              <div className="hidden md:flex items-center gap-2">
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                  { id: 'chat', label: 'AI Assistant', icon: MessageSquare },
                  { id: 'tracker', label: 'Health Tracker', icon: Activity },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                      activeTab === item.id 
                        ? 'bg-white/10 text-accent-primary border border-white/10' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </button>
                ))}
              </div>
            )}

            {user ? (
              <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                <div className="hidden sm:block text-right">
                  <p className="text-xs text-white font-bold">{user.displayName}</p>
                  <button onClick={() => logout()} className="text-[10px] text-slate-500 hover:text-accent-primary uppercase tracking-widest font-black transition-colors">Sign Out</button>
                </div>
                <img src={user.photoURL || ''} alt={user.displayName || ''} className="w-10 h-10 rounded-xl border border-white/10" referrerPolicy="no-referrer" />
              </div>
            ) : (
              <button 
                onClick={onLogin}
                disabled={isLoggingIn}
                className="flex items-center gap-2 px-6 py-2.5 bg-accent-primary text-bg-deep rounded-xl text-sm font-bold hover:scale-105 transition-all shadow-[0_0_20px_rgba(34,211,238,0.2)] disabled:opacity-50 disabled:scale-100"
              >
                {isLoggingIn ? (
                  <div className="w-4 h-4 border-2 border-bg-deep/30 border-t-bg-deep rounded-full animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                {isLoggingIn ? 'Signing In...' : 'Sign In'}
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

const LandingPage = ({ onStart, user, onLogin, isLoggingIn }: { onStart: () => void, user: User | null, onLogin: () => void, isLoggingIn: boolean }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleStart = async () => {
    if (!user) {
      onLogin();
    } else {
      onStart();
    }
  };

  return (
    <div className="pt-32 pb-24 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-accent-primary/5 blur-[120px] rounded-full -z-10" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-12 flex justify-center"
        >
          <div className="w-24 h-24 bg-bg-card backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(34,211,238,0.1)] flex items-center justify-center relative group">
            <div className="absolute inset-0 bg-accent-primary/20 blur-2xl rounded-full group-hover:bg-accent-primary/40 transition-colors" />
            <Activity className="text-accent-primary w-12 h-12 relative z-10" />
          </div>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-6xl md:text-8xl font-serif italic text-white mb-8 tracking-tighter leading-none"
        >
          The Future of <br />
          <span className="neon-text not-italic font-sans font-black uppercase text-5xl md:text-7xl">Employee Wellness</span>
        </motion.h1>
        
        <motion.div
          animate={{ height: isExpanded ? 'auto' : 'auto' }}
          className="max-w-2xl mx-auto mb-12 overflow-hidden"
        >
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg md:text-xl text-slate-400 leading-relaxed font-light"
          >
            A professional, AI-driven platform for corporate well-being. Monitor health metrics, prevent burnout, and optimize workplace performance.
            <AnimatePresence>
              {isExpanded && (
                <motion.span
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="block mt-4"
                >
                  Our advanced algorithms analyze behavioral patterns and productivity data to provide actionable insights. By integrating physical health metrics with digital work habits, we create a holistic view of employee wellness, enabling proactive support and a healthier work environment for everyone.
                </motion.span>
              )}
            </AnimatePresence>
          </motion.p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-6 justify-center mb-32"
        >
          {!isExpanded ? (
            <>
              <button 
                onClick={handleStart}
                disabled={isLoggingIn}
                className="glow-button px-10 py-5 text-lg tracking-wide uppercase flex items-center gap-3 disabled:opacity-50 disabled:scale-100"
              >
                {isLoggingIn && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {isLoggingIn ? 'Signing In...' : 'Get Started'}
              </button>
              <button 
                onClick={() => setIsExpanded(true)}
                className="px-10 py-5 bg-white/5 text-white border border-white/10 rounded-2xl font-bold text-lg hover:bg-white/10 transition-all backdrop-blur-md"
              >
                Learn More
              </button>
            </>
          ) : (
            <button 
              onClick={handleStart}
              disabled={isLoggingIn}
              className="glow-button w-full max-w-xl px-10 py-6 text-xl tracking-widest uppercase flex items-center justify-center gap-4 disabled:opacity-50 disabled:scale-100"
            >
              {isLoggingIn && <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {isLoggingIn ? 'Signing In...' : 'Get Started'} {!isLoggingIn && <ArrowRight className="w-6 h-6" />}
            </button>
          )}
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-32">
          {[
            { title: 'Data Insights', desc: 'Advanced analytics that identify trends in employee well-being and productivity.', icon: Zap, color: 'text-accent-primary' },
            { title: 'Health Metrics', desc: 'Comprehensive tracking of physical and digital activity for a balanced lifestyle.', icon: Heart, color: 'text-accent-secondary' },
            { title: 'AI Support', desc: 'A professional AI wellness assistant available 24/7 to provide personalized guidance.', icon: MessageSquare, color: 'text-white' },
          ].map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 + (i * 0.1) }}
              className="glass-card p-10 text-left group hover:border-white/20 transition-colors"
            >
              <div className={`w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform ${feature.color}`}>
                <feature.icon className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed font-light">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Dashboard = ({ metrics }: { metrics: WellnessMetrics }) => {
  const risk: BurnoutRisk = metrics.sleepHours < 5 || metrics.screenTime > 10 || metrics.focusTime < 2 ? 'High' : 
                          metrics.sleepHours < 7 || metrics.screenTime > 8 ? 'Medium' : 'Low';

  const riskColor = risk === 'High' ? 'text-red-400' : risk === 'Medium' ? 'text-orange-400' : 'text-accent-primary';
  const RiskIcon = risk === 'High' ? AlertCircle : risk === 'Medium' ? Activity : CheckCircle2;

  return (
    <div className="pt-32 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-12">
        <h1 className="text-4xl font-serif italic text-white mb-2">Wellness Dashboard</h1>
        <p className="text-slate-500 font-light">Your health and productivity metrics, visualized.</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 flex flex-col md:flex-row items-center justify-between mb-12 gap-8"
      >
        <div className="flex items-center gap-6">
          <div className={`p-5 rounded-2xl bg-white/5 border border-white/10 ${riskColor}`}>
            <RiskIcon className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Burnout Risk Index</h3>
            <p className="text-slate-500 text-sm font-light">Real-time workload and health assessment</p>
          </div>
        </div>
        <div className={`text-5xl font-black uppercase tracking-tighter ${riskColor}`}>
          {risk}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[
          { label: 'Sleep', value: `${metrics.sleepHours}h`, Icon: Moon, color: 'text-purple-400' },
          { label: 'Steps', value: metrics.dailySteps.toLocaleString(), Icon: Footprints, color: 'text-accent-primary' },
          { label: 'Heart', value: `${metrics.heartRate}bpm`, Icon: Heart, color: 'text-red-400' },
          { label: 'Screen', value: `${metrics.screenTime}h`, Icon: Monitor, color: 'text-orange-400' },
        ].map((card, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-8 group hover:bg-white/10 transition-colors"
          >
            <div className={`w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-6 ${card.color}`}>
              <card.Icon className="w-6 h-6" />
            </div>
            <p className="text-slate-500 text-xs uppercase tracking-widest font-bold mb-2">{card.label}</p>
            <p className="text-3xl font-bold text-white tracking-tight">{card.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div className="glass-card p-10">
          <div className="flex items-center gap-3 mb-8">
            <Activity className="text-accent-secondary w-6 h-6" />
            <h3 className="text-2xl font-bold text-white">Productivity Flow</h3>
          </div>
          <div className="space-y-8">
            {[
              { label: 'Meetings', value: `${metrics.meetings} sessions`, Icon: MessageSquare },
              { label: 'Focus Time', value: `${metrics.focusTime} hrs`, Icon: Clock },
              { label: 'Digital Output', value: `${metrics.emailsSent} units`, Icon: Mail },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center group-hover:bg-white/10 transition-colors">
                    <item.Icon className="text-slate-400 w-5 h-5" />
                  </div>
                  <span className="text-slate-300 font-light">{item.label}</span>
                </div>
                <span className="text-white font-bold tracking-tight">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-10">
          <div className="flex items-center gap-3 mb-8">
            <Sparkles className="text-accent-primary w-6 h-6" />
            <h3 className="text-2xl font-bold text-white">Wellness Insights</h3>
          </div>
          <div className="space-y-6">
            {[
              { text: 'Sleep duration supports cognitive performance', status: 'success' },
              { text: 'Physical activity meets recommended target', status: 'success' },
              { text: 'Screen time within healthy limits', status: 'warning' },
              { text: 'Good balance of focus time', status: 'success' },
            ].map((insight, i) => (
              <div key={i} className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className={`mt-1 ${insight.status === 'success' ? 'text-accent-primary' : 'text-orange-400'}`}>
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <p className="text-slate-400 text-sm leading-relaxed font-light">{insight.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden p-10 rounded-[2.5rem] bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20 border border-white/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-primary/10 blur-[80px] rounded-full" />
        <h3 className="text-2xl font-bold text-white mb-8 relative z-10">Personalized Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          {[
            { title: 'Mental Break', desc: 'Stand and stretch every hour to improve circulation and focus.' },
            { title: 'Deep Focus', desc: '10 minutes of box breathing to stabilize heart rate variability.' },
            { title: 'Hydration', desc: 'Stay hydrated: 8 glasses of water recommended daily.' },
          ].map((rec, i) => (
            <div key={i} className="bg-bg-deep/40 backdrop-blur-md p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-colors">
              <p className="font-bold text-accent-primary mb-3 text-lg">{rec.title}</p>
              <p className="text-sm text-slate-400 leading-relaxed font-light">{rec.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const WellnessTracker = ({ metrics, setMetrics, user }: { metrics: WellnessMetrics, setMetrics: (m: WellnessMetrics) => void, user: User | null }) => {
  const [localMetrics, setLocalMetrics] = useState<WellnessMetrics>(metrics);
  const [analyzing, setAnalyzing] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const handleSave = async () => {
    setAnalyzing(true);
    const updatedMetrics = { ...localMetrics, lastUpdated: new Date().toISOString() };
    
    // Save to Firestore if user is logged in
    if (user) {
      try {
        const metricsRef = doc(db, 'users', user.uid, 'metrics', 'current');
        await setDoc(metricsRef, updatedMetrics);
        
        // Also save to history
        const dateStr = new Date().toISOString().split('T')[0];
        const historyRef = doc(db, 'users', user.uid, 'history', dateStr);
        await setDoc(historyRef, updatedMetrics);
      } catch (error) {
        console.error("Failed to save metrics to Firestore", error);
      }
    }

    setTimeout(() => {
      setMetrics(updatedMetrics);
      setAnalyzing(false);
      setShowResult(true);
    }, 1500);
  };

  const risk: BurnoutRisk = localMetrics.sleepHours < 5 || localMetrics.screenTime > 10 || localMetrics.focusTime < 2 ? 'High' : 
                          localMetrics.sleepHours < 7 || localMetrics.screenTime > 8 ? 'Medium' : 'Low';

  return (
    <div className="pt-32 pb-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-serif italic text-white mb-2">Health Tracker</h1>
        <p className="text-slate-500 font-light">Update your health and activity metrics for personalized advice.</p>
      </div>

      <div className="glass-card p-10 md:p-16 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
          {[
            { id: 'sleepHours', label: 'Sleep Duration', Icon: Moon, min: 0, max: 12, unit: 'hours' },
            { id: 'dailySteps', label: 'Physical Activity', Icon: Footprints, min: 0, max: 20000, unit: 'steps' },
            { id: 'heartRate', label: 'Resting Heart Rate', Icon: Heart, min: 40, max: 120, unit: 'bpm' },
            { id: 'meetings', label: 'Workload (Meetings)', Icon: MessageSquare, min: 0, max: 10, unit: 'sessions' },
            { id: 'screenTime', label: 'Digital Exposure', Icon: Monitor, min: 0, max: 16, unit: 'hours' },
            { id: 'focusTime', label: 'Deep Focus', Icon: Clock, min: 0, max: 12, unit: 'hours' },
            { id: 'emailsSent', label: 'Digital Output', Icon: Mail, min: 0, max: 200, unit: 'units' },
          ].map((field) => (
            <div key={field.id} className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3 text-slate-400 font-bold uppercase tracking-widest text-xs">
                  <field.Icon className="w-4 h-4 text-accent-primary" />
                  <span>{field.label}</span>
                </div>
                <span className="text-white font-mono text-xl">{localMetrics[field.id as keyof WellnessMetrics]} <span className="text-slate-600 text-xs font-light lowercase">{field.unit}</span></span>
              </div>
              <input 
                type="range"
                min={field.min}
                max={field.max}
                value={localMetrics[field.id as keyof WellnessMetrics] as number}
                onChange={(e) => setLocalMetrics({ ...localMetrics, [field.id]: Number(e.target.value) })}
                className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-accent-primary"
              />
            </div>
          ))}
        </div>

        <button 
          onClick={handleSave}
          disabled={analyzing}
          className="glow-button w-full mt-16 py-5 text-lg tracking-widest uppercase flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {analyzing ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Analyzing Health Data...
            </>
          ) : (
            <>
              Update Metrics <Activity className="w-5 h-5" />
            </>
          )}
        </button>

        <AnimatePresence>
          {showResult && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-12 overflow-hidden"
            >
              <div className={`p-8 rounded-3xl border border-white/5 bg-white/5 backdrop-blur-md`}>
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-3 rounded-xl bg-white/5 border border-white/10 ${risk === 'High' ? 'text-red-400' : risk === 'Medium' ? 'text-orange-400' : 'text-accent-primary'}`}>
                    {risk === 'High' ? <AlertCircle className="w-6 h-6" /> : risk === 'Medium' ? <Activity className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                  </div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">
                    Burnout Risk: <span className={risk === 'High' ? 'text-red-400' : risk === 'Medium' ? 'text-orange-400' : 'text-accent-primary'}>{risk}</span>
                  </h3>
                </div>
                <p className="text-slate-400 leading-relaxed font-light">
                  {risk === 'High' ? 'Your burnout risk is high. We recommend taking immediate breaks and prioritizing rest. Consider discussing your workload with your manager.' : 
                   risk === 'Medium' ? 'Signs of fatigue detected. Consider a short break and increasing your physical activity to maintain balance.' :
                   'Your health metrics are in a healthy range. Continue your current routine to maintain optimal performance.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
                {[
                  { title: 'Restorative Sleep', desc: 'Aim for 7-9 hours of sleep for optimal cognitive performance.' },
                  { title: 'Physical Activity', desc: 'Target 8,000-10,000 steps to maintain physical health.' },
                  { title: 'Digital Balance', desc: 'Maintain focus time and limit excessive screen time.' },
                ].map((tip, i) => (
                  <div key={i} className="bg-white/5 p-6 rounded-2xl border border-white/5">
                    <p className="font-bold text-white text-sm mb-3 tracking-tight">{tip.title}</p>
                    <p className="text-xs text-slate-500 leading-relaxed font-light">{tip.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const AIChat = ({ metrics, user, profile }: { metrics: WellnessMetrics, user: User | null, profile: UserProfile | null }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: `Hello${user?.displayName ? ' ' + user.displayName : ''}! I'm your AI Wellness Assistant. I've analyzed your current metrics and your profile. How can I help you today?`, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { 
      role: 'user', 
      text: input, 
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await getWellnessAdvice(metrics, messages, input, user?.displayName, profile?.onboardingData);
      const modelMsg: ChatMessage = { 
        role: 'model', 
        text: response || "I'm sorry, I'm having trouble processing that right now. Please try again.", 
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      };
      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: "I'm having trouble connecting right now. Please try again later.", timestamp: new Date().toLocaleTimeString() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const risk: BurnoutRisk = metrics.sleepHours < 5 || metrics.screenTime > 10 || metrics.focusTime < 2 ? 'High' : 
                          metrics.sleepHours < 7 || metrics.screenTime > 8 ? 'Medium' : 'Low';

  return (
    <div className="pt-24 pb-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[calc(100vh-80px)] flex flex-col lg:flex-row gap-8">
      {/* Left Panel: Context/Insights */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="hidden lg:flex flex-col w-80 gap-6"
      >
        <div className="glass-card p-6">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent-primary" />
            Current Status
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-white/5 rounded-xl border border-white/5">
              <p className="text-xs text-slate-500 uppercase font-bold mb-1">Burnout Risk</p>
              <p className={`text-xl font-black uppercase tracking-tighter ${risk === 'High' ? 'text-red-400' : risk === 'Medium' ? 'text-orange-400' : 'text-accent-primary'}`}>
                {risk}
              </p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl border border-white/5">
              <p className="text-xs text-slate-500 uppercase font-bold mb-1">Focus Time</p>
              <p className="text-xl font-black text-white uppercase tracking-tighter">{metrics.focusTime}h</p>
            </div>
          </div>
        </div>
        
        <div className="glass-card p-6 flex-1">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent-secondary" />
            Wellness Tips
          </h3>
          <ul className="space-y-4 text-sm font-light text-slate-400">
            <li>• Take a 5-minute walk every hour to stay active.</li>
            <li>• Stay hydrated: drink 8 glasses of water daily.</li>
            <li>• Practice deep breathing for 2 minutes to reduce stress.</li>
            <li>• Limit screen time before bed for better sleep.</li>
          </ul>
        </div>
      </motion.div>

      {/* Right Panel: Chat */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex flex-col overflow-hidden relative"
      >
        {/* Chat Header */}
        <div className="mb-6 flex items-center justify-between px-2">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-accent-primary/20 rounded-2xl flex items-center justify-center border border-accent-primary/30">
              <Bot className="text-accent-primary w-6 h-6" />
            </div>
            <div>
              <h3 className="text-white text-xl font-bold tracking-tight">AI Wellness Assistant</h3>
              <p className="text-accent-primary text-[10px] uppercase tracking-widest font-black">Online & Secure</p>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto space-y-8 pr-4 scrollbar-custom mb-6"
        >
          {messages.map((msg, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-6 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-accent-primary shadow-[0_0_20px_rgba(34,211,238,0.3)]' : 'bg-white/10'}`}>
                {msg.role === 'user' ? <UserIcon className="text-bg-deep w-5 h-5" /> : <Bot className="text-white w-5 h-5" />}
              </div>
              <div className={`max-w-[75%] space-y-2 ${msg.role === 'user' ? 'items-end' : ''}`}>
                <div className={`p-6 rounded-3xl font-light leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-accent-primary text-bg-deep font-bold rounded-tr-none' 
                    : 'glass-card text-slate-300 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
                <p className="text-[10px] text-slate-600 font-mono uppercase tracking-widest px-2">{msg.timestamp}</p>
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <div className="flex gap-6">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <Bot className="text-white w-5 h-5" />
              </div>
              <div className="glass-card p-6 rounded-tl-none">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-accent-primary rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-accent-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 bg-accent-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-accent-primary/20 to-accent-secondary/20 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative flex items-center bg-bg-card/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-2">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask for wellness advice..."
              className="flex-1 bg-transparent border-none px-8 py-4 text-white focus:outline-none font-light"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-4 bg-accent-primary text-bg-deep rounded-2xl hover:scale-105 transition-transform disabled:opacity-50 shadow-[0_0_20px_rgba(34,211,238,0.3)]"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('landing');
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [metrics, setMetrics] = useState<WellnessMetrics>({
    sleepHours: 7,
    dailySteps: 8000,
    heartRate: 72,
    meetings: 3,
    screenTime: 6,
    focusTime: 4,
    emailsSent: 50,
    lastUpdated: new Date().toISOString()
  });

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Create user doc if it doesn't exist
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            hasCompletedOnboarding: false,
            lastLogin: serverTimestamp()
          });
        } else {
          await updateDoc(userRef, { lastLogin: serverTimestamp() });
        }

        // Listen to profile changes
        onSnapshot(userRef, (snap) => {
          if (snap.exists()) {
            setProfile(snap.data() as UserProfile);
          }
        });

        // If we were on landing page and just logged in, move to dashboard (or onboarding)
        if (activeTab === 'landing') {
          setActiveTab('dashboard');
        }
      } else {
        setProfile(null);
      }
    });
    return () => unsubscribe();
  }, [activeTab]);

  const handleOnboardingComplete = async (data: OnboardingData) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        onboardingData: data,
        hasCompletedOnboarding: true
      });
      setActiveTab('dashboard');
    } catch (error) {
      console.error("Failed to save onboarding data", error);
    }
  };

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      // Ignore benign cancellation errors
      if (error.code !== 'auth/cancelled-popup-request' && error.code !== 'auth/popup-closed-by-user') {
        console.error("Login failed", error);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Sync metrics with Firestore when user is logged in
  useEffect(() => {
    if (!user) return;

    const metricsRef = doc(db, 'users', user.uid, 'metrics', 'current');
    const unsubscribe = onSnapshot(metricsRef, (doc) => {
      if (doc.exists()) {
        setMetrics(doc.data() as WellnessMetrics);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Load metrics from local storage on mount (fallback)
  useEffect(() => {
    if (user) return; // Prefer Firestore if logged in
    const saved = localStorage.getItem('wellness_metrics');
    if (saved) {
      try {
        setMetrics(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved metrics", e);
      }
    }
  }, [user]);

  // Save metrics to local storage (fallback)
  useEffect(() => {
    if (!user) {
      localStorage.setItem('wellness_metrics', JSON.stringify(metrics));
    }
  }, [metrics, user]);

  return (
    <div className="min-h-screen bg-bg-deep text-slate-300 selection:bg-accent-primary selection:text-bg-deep">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} 
        onLogin={handleLogin}
        isLoggingIn={isLoggingIn}
      />
      
      <main className="relative">
        <AnimatePresence mode="wait">
          {user && profile && !profile.hasCompletedOnboarding && (
            <motion.div 
              key="onboarding"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Onboarding user={user} onComplete={handleOnboardingComplete} />
            </motion.div>
          )}

          {activeTab === 'landing' && (!user || (profile && profile.hasCompletedOnboarding)) && (
            <motion.div 
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LandingPage 
                onStart={() => setActiveTab('dashboard')} 
                user={user} 
                onLogin={handleLogin}
                isLoggingIn={isLoggingIn}
              />
            </motion.div>
          )}
          
          {activeTab === 'dashboard' && user && profile && profile.hasCompletedOnboarding && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <Dashboard metrics={metrics} />
            </motion.div>
          )}
          
          {activeTab === 'chat' && user && profile && profile.hasCompletedOnboarding && (
            <motion.div 
              key="chat"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <AIChat metrics={metrics} user={user} profile={profile} />
            </motion.div>
          )}
          
          {activeTab === 'tracker' && user && profile && profile.hasCompletedOnboarding && (
            <motion.div 
              key="tracker"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <WellnessTracker metrics={metrics} setMetrics={setMetrics} user={user} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="bg-bg-deep border-t border-white/5 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-8">
                <Activity className="text-accent-primary w-8 h-8" />
                <span className="text-2xl font-serif italic text-white tracking-tight">Employee Wellness AI</span>
              </div>
              <p className="text-slate-500 max-w-sm leading-relaxed font-light">
                A professional platform designed to support employee well-being and productivity through data-driven AI insights.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-8">Platform</h4>
              <ul className="space-y-4 text-sm font-light">
                <li><button onClick={() => setActiveTab('dashboard')} className="hover:text-accent-primary transition-colors">Wellness Dashboard</button></li>
                <li><button onClick={() => setActiveTab('tracker')} className="hover:text-accent-primary transition-colors">Health Tracker</button></li>
                <li><button onClick={() => setActiveTab('chat')} className="hover:text-accent-primary transition-colors">AI Assistant</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-8">Legal</h4>
              <ul className="space-y-4 text-sm font-light">
                <li><a href="#" className="hover:text-accent-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-accent-primary transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-accent-primary transition-colors">Data Ethics</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-24 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-slate-600 text-xs uppercase tracking-[0.3em] font-bold">© 2026 Employee Wellness AI. All rights reserved.</p>
            <div className="flex gap-8">
              <a href="#" className="text-slate-600 hover:text-white transition-colors"><ShieldCheck className="w-5 h-5" /></a>
              <a href="#" className="text-slate-600 hover:text-white transition-colors"><Zap className="w-5 h-5" /></a>
              <a href="#" className="text-slate-600 hover:text-white transition-colors"><Heart className="w-5 h-5" /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
