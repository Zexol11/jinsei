'use client';

import Link from 'next/link';
import { PenLine, Shield, Sparkles, Zap } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--surface)] text-[var(--on-surface)] selection:bg-[var(--primary-container)] selection:text-[var(--primary)]">
      {/* ── Navigation ────────────────────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 px-6 py-6 md:px-12 flex items-center justify-between backdrop-blur-md bg-[var(--surface)]/70 border-b border-[var(--outline-variant)]/20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center text-white">
            <PenLine size={18} strokeWidth={2.5} />
          </div>
          <span className="font-serif text-2xl font-semibold tracking-tight">jinsei</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/login" className="font-inter text-sm font-medium hover:opacity-70 transition">
            Sign In
          </Link>
          <Link href="/register" className="btn-primary">
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── Hero Section ─────────────────────────────────────────────── */}
      <section className="pt-40 pb-20 px-6 md:px-12 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--primary-container)] text-[var(--primary)] text-[10px] font-bold tracking-[0.12em] uppercase mb-8 animate-in">
          <Sparkles size={12} />
          Your Private Digital Sanctuary
        </div>
        
        <h1 className="font-serif text-5xl md:text-7xl font-medium tracking-tight leading-[1.1] mb-8 text-balance max-w-4xl">
          Write one entry per day. <br />
          Reflect on your <span className="italic text-[var(--primary)]">inner world.</span>
        </h1>
        
        <p className="font-inter text-lg md:text-xl text-[var(--on-surface-variant)] max-w-2xl leading-relaxed mb-12 text-balance">
          Jinsei is a calm, minimal journaling app designed for reflection, mindfulness, and tracking your emotional journey through life.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href="/register" className="btn-primary h-14 px-10 text-lg">
            Start Journaling Free
          </Link>
          <p className="text-[var(--on-surface-dim)] text-sm font-medium">
            No credit card required.
          </p>
        </div>

        {/* Hero Image Mockup Area */}
        <div className="mt-20 w-full max-w-5xl aspect-[16/9] bg-[var(--surface-container-high)] rounded-3xl border border-[var(--outline-variant)] shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-tr from-[var(--primary-container)]/20 to-transparent pointer-events-none" />
          <div className="absolute top-4 left-6 flex items-center gap-2 opacity-40">
              <div className="w-2.5 h-2.5 rounded-full bg-[var(--on-surface)]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[var(--on-surface)]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[var(--on-surface)]" />
          </div>
          <div className="flex items-center justify-center h-full">
             <PenLine size={80} className="text-[var(--primary)] opacity-10 group-hover:scale-110 transition duration-1000" />
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section className="py-32 px-6 md:px-12 bg-[var(--surface-container-low)]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          
          <div className="flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--surface-container-high)] flex items-center justify-center text-[var(--primary)] border border-[var(--outline-variant)]/30 shadow-sm">
              <Shield size={24} />
            </div>
            <h3 className="font-serif text-2xl font-medium">End-to-End Privacy</h3>
            <p className="text-[var(--on-surface-variant)] leading-relaxed">
              Your thoughts are yours alone. We prioritize security and privacy above all, ensuring your journal entries remain confidential.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--surface-container-high)] flex items-center justify-center text-[var(--primary)] border border-[var(--outline-variant)]/30 shadow-sm">
              <Sparkles size={24} />
            </div>
            <h3 className="font-serif text-2xl font-medium">Mindful Tracking</h3>
            <p className="text-[var(--on-surface-variant)] leading-relaxed">
              Track your daily mood and activity through beautiful, minimalist visualizations that help you identify patterns in your well-being.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--surface-container-high)] flex items-center justify-center text-[var(--primary)] border border-[var(--outline-variant)]/30 shadow-sm">
              <Zap size={24} />
            </div>
            <h3 className="font-serif text-2xl font-medium">Calm Interface</h3>
            <p className="text-[var(--on-surface-variant)] leading-relaxed">
              Experience a clutter-free environment designed to help you focus on what matters: your internal dialogue and self-reflection.
            </p>
          </div>

        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="py-20 px-6 md:px-12 border-t border-[var(--outline-variant)]/20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[var(--primary)] flex items-center justify-center text-white">
              <PenLine size={14} />
            </div>
            <span className="font-serif text-xl font-semibold tracking-tight">jinsei</span>
          </div>
          
          <div className="flex items-center gap-8 text-sm text-[var(--on-surface-dim)] font-medium">
            <Link href="/login" className="hover:text-[var(--on-surface)] transition">Login</Link>
            <Link href="/register" className="hover:text-[var(--on-surface)] transition">Register</Link>
            <span>© 2026 Jinsei</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
