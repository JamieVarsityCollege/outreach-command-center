import React, { useState, useMemo } from 'react';
import initialData from './data/campaignData.json';
import {
  Send,
  CheckCircle2,
  Clock,
  Layers,
  Search,
  Filter,
  Download,
  ExternalLink,
  ShieldCheck,
  Server,
  Calendar,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  MailCheck,
  AlertCircle,
  Database,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

export default function App() {
  const [selectedBrand, setSelectedBrand] = useState('all'); // 'all' | 'finyang' | 'slipscan'
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const { metrics, accounts, prospects, lastUpdated } = initialData;

  // Filter accounts by brand
  const filteredAccounts = useMemo(() => {
    if (selectedBrand === 'all') return accounts;
    return accounts.filter((a) => a.brandKey === selectedBrand);
  }, [accounts, selectedBrand]);

  // Filter prospects
  const filteredProspects = useMemo(() => {
    return prospects.filter((p) => {
      if (selectedBrand !== 'all' && p.brandKey !== selectedBrand) return false;
      if (stageFilter !== 'all' && p.stage !== stageFilter) return false;
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchesComp = p.company?.toLowerCase().includes(query);
        const matchesEmail = p.email?.toLowerCase().includes(query);
        const matchesName = p.name?.toLowerCase().includes(query);
        const matchesDomain = p.domain?.toLowerCase().includes(query);
        if (!matchesComp && !matchesEmail && !matchesName && !matchesDomain) return false;
      }
      return true;
    });
  }, [prospects, selectedBrand, stageFilter, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredProspects.length / pageSize) || 1;
  const paginatedProspects = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProspects.slice(start, start + pageSize);
  }, [filteredProspects, currentPage]);

  // Brand-specific metrics
  const activeMetrics = useMemo(() => {
    if (selectedBrand === 'finyang') {
      return {
        brandName: 'FinYang AI',
        domain: 'finyang.net',
        totalSentToday: 267,
        totalTracked: metrics.finyang.totalTracked,
        safeCap: 345,
        accountsCount: 4,
        reservoir: metrics.finyang.reservoirCount,
        followup1Due: metrics.finyang.followup1DueTomorrow,
      };
    }
    if (selectedBrand === 'slipscan') {
      return {
        brandName: 'Slip-Scan',
        domain: 'slip-scan.com',
        totalSentToday: 345,
        totalTracked: metrics.slipscan.totalTracked,
        safeCap: 345,
        accountsCount: 4,
        reservoir: metrics.slipscan.reservoirCount,
        followup1Due: metrics.slipscan.followup1DueTomorrow,
      };
    }
    return {
      brandName: 'Combined Outreach',
      domain: 'finyang.net & slip-scan.com',
      totalSentToday: 612,
      totalTracked: metrics.totalTracked,
      safeCap: 690,
      accountsCount: 8,
      reservoir: metrics.finyang.reservoirCount + metrics.slipscan.reservoirCount,
      followup1Due: metrics.finyang.followup1DueTomorrow + metrics.slipscan.followup1DueTomorrow,
    };
  }, [selectedBrand, metrics]);

  // Export to CSV function
  const handleExportCSV = () => {
    const headers = ['Brand', 'Company', 'Name', 'Email', 'Domain', 'Category', 'Stage', 'InitialSentAt', 'ResendId'];
    const rows = filteredProspects.map((p) => [
      `"${p.brand}"`,
      `"${p.company}"`,
      `"${p.name}"`,
      `"${p.email}"`,
      `"${p.domain}"`,
      `"${p.category}"`,
      `"${p.stage}"`,
      `"${p.initial ? p.initial.sent_at : ''}"`,
      `"${p.initial ? p.initial.resend_id : ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `outreach_${selectedBrand}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Banner / Cloud Automation Pill */}
      <div className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-bold text-white tracking-tight">OUTREACH COMMAND CENTER</h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
                  Cloud Live
                </span>
              </div>
              <p className="text-xs text-slate-400">Autonomous Multi-Account Resend Pooling & Drip Sequences</p>
            </div>
          </div>

          {/* Cloud Schedule Badge */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center px-3 py-1.5 rounded-lg bg-slate-800/70 border border-slate-700/60 text-xs text-slate-300 space-x-2">
              <Server className="h-3.5 w-3.5 text-indigo-400" />
              <span>GitHub Actions Cron:</span>
              <span className="font-semibold text-emerald-400">Mon–Fri 08:30 SAST</span>
            </div>

            <div className="flex items-center space-x-2">
              <a
                href="https://github.com/Jamie123234/finyang/actions"
                target="_blank"
                rel="noreferrer"
                className="text-xs px-2.5 py-1.5 rounded-md bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-medium transition flex items-center space-x-1"
              >
                <span>FinYang Actions</span>
                <ArrowUpRight className="h-3 w-3" />
              </a>
              <a
                href="https://github.com/Jamie123234/slip-scan-web/actions"
                target="_blank"
                rel="noreferrer"
                className="text-xs px-2.5 py-1.5 rounded-md bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-medium transition flex items-center space-x-1"
              >
                <span>Slip-Scan Actions</span>
                <ArrowUpRight className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Brand Selector Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/60 pb-6">
          <div className="flex items-center space-x-2 p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              onClick={() => { setSelectedBrand('all'); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                selectedBrand === 'all'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Combined View (All)
            </button>
            <button
              onClick={() => { setSelectedBrand('finyang'); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center space-x-2 ${
                selectedBrand === 'finyang'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span>FinYang AI</span>
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-white/10">345/day</span>
            </button>
            <button
              onClick={() => { setSelectedBrand('slipscan'); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center space-x-2 ${
                selectedBrand === 'slipscan'
                  ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-md shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span>Slip-Scan</span>
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-white/10">345/day</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 flex items-center space-x-2">
            <RefreshCw className="h-3.5 w-3.5 text-slate-500 animate-spin-slow" />
            <span>Synced: {new Date(lastUpdated).toLocaleTimeString()} SAST</span>
          </div>
        </div>

        {/* Global KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Sent Today */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-900/60 border border-slate-800 hover:border-indigo-500/40 transition shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Emails Sent Today</span>
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Send className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-white">{activeMetrics.totalSentToday}</span>
              <span className="text-xs font-medium text-emerald-400">+100% delivered</span>
            </div>
            <p className="mt-2 text-xs text-slate-400 flex items-center justify-between">
              <span>Pool Safe Capacity:</span>
              <span className="font-semibold text-slate-200">{activeMetrics.safeCap} / day</span>
            </p>
          </div>

          {/* Card 2: Total Prospects Tracked */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Master Registry</span>
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Database className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-white">{activeMetrics.totalTracked}</span>
              <span className="text-xs font-medium text-cyan-400">Unique Targets</span>
            </div>
            <p className="mt-2 text-xs text-slate-400 flex items-center justify-between">
              <span>Zero duplicates:</span>
              <span className="font-semibold text-emerald-400">100% Verified MX</span>
            </p>
          </div>

          {/* Card 3: Next Follow-Up Waves */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-900/60 border border-slate-800 hover:border-violet-500/40 transition shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Follow-Up #1 Ready</span>
              <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                <MailCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-white">{activeMetrics.followup1Due}</span>
              <span className="text-xs font-medium text-violet-400">In 24h Window</span>
            </div>
            <p className="mt-2 text-xs text-slate-400 flex items-center justify-between">
              <span>Next Morning Run:</span>
              <span className="font-semibold text-indigo-400">Tomorrow 08:30</span>
            </p>
          </div>

          {/* Card 4: Sourcing Reservoir */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lead Reservoir</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Layers className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-white">{activeMetrics.reservoir}</span>
              <span className="text-xs font-medium text-emerald-400">Uncontacted</span>
            </div>
            <p className="mt-2 text-xs text-slate-400 flex items-center justify-between">
              <span>Auto-refill threshold:</span>
              <span className="font-semibold text-slate-200">&lt; 100 leads</span>
            </p>
          </div>
        </div>

        {/* Multi-Account Sender Pool Status */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <ShieldCheck className="h-5 w-5 text-indigo-400" />
                <span>Multi-Account Resend Sender Pool</span>
              </h2>
              <p className="text-xs text-slate-400">Active sending nodes across isolated domains to stay within free safe daily limits</p>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-300 font-medium">
              {filteredAccounts.length} Verified Accounts Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {filteredAccounts.map((acc) => {
              const percent = Math.min(100, Math.round((acc.sentToday / acc.dailySafeLimit) * 100));
              const isMaxed = acc.sentToday >= acc.dailySafeLimit;
              const remaining = Math.max(0, acc.dailySafeLimit - acc.sentToday);

              return (
                <div
                  key={acc.id}
                  className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">{acc.name}</span>
                      <span className="text-[11px] font-mono text-indigo-400">{acc.domain}</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isMaxed
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {isMaxed ? 'Quota Full' : `${remaining} Left`}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-400 font-medium">
                      <span>Sends Today</span>
                      <span className="text-slate-200">
                        {acc.sentToday} / {acc.dailySafeLimit}
                      </span>
                    </div>
                    <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isMaxed ? 'bg-amber-400' : 'bg-gradient-to-r from-indigo-500 to-cyan-400'
                        }`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 flex justify-between items-center pt-1 border-t border-slate-900">
                    <span>Sender:</span>
                    <span className="truncate max-w-[150px] text-slate-400">{acc.from.split('<')[0]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3-Stage Drip Funnel & Rules */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900/70 border border-slate-800 space-y-6">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Clock className="h-5 w-5 text-cyan-400" />
                <span>Automated 3-Stage Outreach Sequence</span>
              </h2>
              <p className="text-xs text-slate-400">Contextual threading, friction-free CTAs, and automated suppression</p>
            </div>
            <span className="text-xs text-indigo-400 font-medium">No Store Links &bull; Single Direct CTA</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step 1 */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">STAGE 1</span>
                <span className="text-xs text-slate-400">Day 0 (Initial)</span>
              </div>
              <h3 className="text-sm font-semibold text-white">Value Proposition & Product Hook</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Personalized hook focused on eliminating manual statement typing / receipt chaos. Single CTA button directly into product.
              </p>
              <div className="pt-2 text-[11px] text-indigo-400 font-mono">
                Subject: {selectedBrand === 'slipscan' ? 'client receipt pre-accounting / ...' : 'borrower bank statements / ...'}
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">STAGE 2</span>
                <span className="text-xs text-slate-400">Day 1 (+24h Nudge)</span>
              </div>
              <h3 className="text-sm font-semibold text-white">Contextual Follow-Up Nudge</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Appears in the exact same inbox thread using <code className="text-cyan-400">In-Reply-To</code> headers. Emphasizes time saved on manual reconciliations.
              </p>
              <div className="pt-2 text-[11px] text-cyan-400 font-mono">
                Subject: Re: {selectedBrand === 'slipscan' ? 'client receipt...' : 'borrower bank statements...'}
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">STAGE 3</span>
                <span className="text-xs text-slate-400">Day 7 (Break-Up)</span>
              </div>
              <h3 className="text-sm font-semibold text-white">Final Parting Check-In</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Polite closing email informing the prospect their file will be closed so they aren't bothered again. Leaves open door.
              </p>
              <div className="pt-2 text-[11px] text-amber-400 font-mono">
                Status: Sequence Complete
              </div>
            </div>
          </div>
        </div>

        {/* Searchable Prospect Registry Data Table */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Search className="h-5 w-5 text-indigo-400" />
                <span>Live Prospect Explorer</span>
              </h2>
              <p className="text-xs text-slate-400">Search and audit all tracked companies, send stages, and Resend IDs</p>
            </div>

            {/* Filters & Export */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search company, domain, email..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-56 sm:w-64"
                />
              </div>

              <select
                value={stageFilter}
                onChange={(e) => { setStageFilter(e.target.value); setCurrentPage(1); }}
                className="py-1.5 px-3 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Stages</option>
                <option value="INITIAL_SENT">Initial Sent</option>
                <option value="FOLLOWUP_1_SENT">Follow-Up 1 Sent</option>
                <option value="UNCONTACTED">Reservoir (Uncontacted)</option>
                <option value="REPLIED">Replied</option>
                <option value="BOUNCED">Bounced</option>
              </select>

              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition flex items-center space-x-1"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Brand</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4">Initial Sent</th>
                  <th className="py-3 px-4">Follow-Up #1</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                {paginatedProspects.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-500 font-sans">
                      No prospects match your current search and filters.
                    </td>
                  </tr>
                ) : (
                  paginatedProspects.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition font-sans">
                      <td className="py-3 px-4 font-semibold text-white whitespace-nowrap">
                        <span
                          className={`inline-block w-2 h-2 rounded-full mr-2 ${
                            p.brandKey === 'finyang' ? 'bg-indigo-400' : 'bg-cyan-400'
                          }`}
                        ></span>
                        {p.brand}
                      </td>
                      <td className="py-3 px-4 font-medium text-white max-w-[200px] truncate">
                        {p.company}
                      </td>
                      <td className="py-3 px-4 text-slate-400">{p.name || 'there'}</td>
                      <td className="py-3 px-4 text-slate-300 font-mono text-xs">{p.email}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            p.stage === 'FOLLOWUP_1_SENT'
                              ? 'bg-violet-500/10 text-violet-300 border border-violet-500/20'
                              : p.stage === 'INITIAL_SENT'
                              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {p.stage.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap text-xs">
                        {p.initial?.sent_at ? new Date(p.initial.sent_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap text-xs">
                        {p.followup_1?.sent_at ? (
                          <span className="text-violet-300 font-medium">
                            {new Date(p.followup_1.sent_at).toLocaleDateString()}
                          </span>
                        ) : p.stage === 'INITIAL_SENT' ? (
                          <span className="text-slate-500">Tomorrow</span>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-400">
            <span>
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, filteredProspects.length)} of {filteredProspects.length} prospects
            </span>

            <div className="flex items-center space-x-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center space-x-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Prev</span>
              </button>
              <span className="font-semibold text-slate-300">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center space-x-1"
              >
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>Outreach Command Center &bull; FinYang AI &amp; Slip-Scan Autonomous Growth Engine</p>
      </footer>
    </div>
  );
}
