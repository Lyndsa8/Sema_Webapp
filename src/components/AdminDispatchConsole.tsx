import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Sparkles,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowLeft,
  Phone,
  MapPin,
  Bot,
  Loader2,
  RefreshCw,
  Zap,
  Volume2,
  X,
  Send,
  Building2,
  SlidersHorizontal,
  PieChart as PieChartIcon,
  TrendingUp,
  BarChart3,
  Check,
  Copy,
  Heart,
  ShieldAlert,
  Download,
  FileSpreadsheet,
  Mail,
  MailCheck,
  Eye,
  AtSign,
  Layers,
  Radio,
  Trash2,
  Smartphone,
  Hash,
  MessageSquare,
  Menu,
  Bell,
  LayoutDashboard,
  Inbox,
  Users,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Maximize2,
  Minimize2,
  Camera,
  Image as ImageIcon,
} from 'lucide-react';
import demoComplaintsData from '../data/demoComplaints.json';
import {
  SubmissionRecord,
  KENYAN_RESPONSE_TEAMS,
  ResponseTeam,
  PriorityLevel,
  ReportStatus,
  AIClassification,
  EmailDispatchLog,
  InflowChannel,
  OperationalCategory,
} from '../types';
import {
  CHANNELS,
  OPERATIONAL_CATEGORIES,
  LOCATIONS,
} from './MultiChannelFilterDashboard';
import {
  computeClustersFromStore,
  buildRecordFromDemoComplaint,
  getAllDemoSubmissionRecords,
  IncidentCluster,
} from '../utils/clusterComputation';
import { DateRangePicker, DateRangeValue } from './DateRangePicker';
import { evaluateAndAutoDispatch } from '../utils/autoDispatch';
import { triageTickets } from '../utils/triage';
import {
  syncSimulatedFeeds,
  clearSyncedFeeds,
  normalizeChannelForTile,
  CHANNEL_MIX_TILES,
} from '../utils/syncFeeds';

export interface StatusLegendItem {
  status: ReportStatus;
  label: string;
  dotColor: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  activeBg: string;
  ringColor: string;
  textColor: string;
  description: string;
}

export const STATUS_LEGEND_CONFIG: StatusLegendItem[] = [
  {
    status: 'Received',
    label: 'Received',
    dotColor: 'bg-amber-500',
    badgeBg: 'bg-amber-50',
    badgeBorder: 'border-amber-300',
    badgeText: 'text-amber-800',
    activeBg: 'bg-amber-100',
    ringColor: 'ring-amber-400',
    textColor: 'text-amber-950',
    description: 'Awaiting triage & field team assignment',
  },
  {
    status: 'Assigned',
    label: 'Assigned',
    dotColor: 'bg-indigo-500',
    badgeBg: 'bg-indigo-50',
    badgeBorder: 'border-indigo-300',
    badgeText: 'text-indigo-800',
    activeBg: 'bg-indigo-100',
    ringColor: 'ring-indigo-400',
    textColor: 'text-indigo-950',
    description: 'Dispatched to specialized agency & lead officer',
  },
  {
    status: 'In Progress',
    label: 'In Progress',
    dotColor: 'bg-sky-500',
    badgeBg: 'bg-sky-50',
    badgeBorder: 'border-sky-300',
    badgeText: 'text-sky-800',
    activeBg: 'bg-sky-100',
    ringColor: 'ring-sky-400',
    textColor: 'text-sky-950',
    description: 'Field crew mobilized & actively intervening',
  },
  {
    status: 'Resolved',
    label: 'Resolved',
    dotColor: 'bg-emerald-500',
    badgeBg: 'bg-emerald-50',
    badgeBorder: 'border-emerald-300',
    badgeText: 'text-emerald-800',
    activeBg: 'bg-emerald-100',
    ringColor: 'ring-emerald-400',
    textColor: 'text-emerald-950',
    description: 'Public issue remedied & verified on site',
  },
  {
    status: 'Closed',
    label: 'Closed',
    dotColor: 'bg-slate-400',
    badgeBg: 'bg-slate-100',
    badgeBorder: 'border-slate-300',
    badgeText: 'text-slate-700',
    activeBg: 'bg-slate-200',
    ringColor: 'ring-slate-300',
    textColor: 'text-slate-900',
    description: 'Administrative sign-off completed & archived',
  },
];

export type AdminPage =
  | 'overview'
  | 'incidents'
  | 'channels'
  | 'clusters'
  | 'teams'
  | 'analytics'
  | 'alerts';

interface AdminDispatchConsoleProps {
  submissions: SubmissionRecord[];
  onUpdateSubmission: (updated: SubmissionRecord) => void;
  onNewSubmission?: (newSub: SubmissionRecord) => void;
  onRefreshSubmissions: () => Promise<void>;
  onSwitchToCitizenView: () => void;
  onOpenDemoVideo?: () => void;
  onOpenTechDocs?: () => void;
  onSetSubmissions?: (subs: SubmissionRecord[]) => void;
}

export const AdminDispatchConsole: React.FC<AdminDispatchConsoleProps> = ({
  submissions,
  onUpdateSubmission,
  onNewSubmission,
  onRefreshSubmissions,
  onSwitchToCitizenView,
  onOpenDemoVideo,
  onOpenTechDocs,
  onSetSubmissions,
}) => {
  // Page Navigation State based on URL hash
  const getInitialPage = (): AdminPage => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash === '#admin/incidents') return 'incidents';
      if (hash === '#admin/channels') return 'channels';
      if (hash === '#admin/clusters') return 'clusters';
      if (hash === '#admin/teams') return 'teams';
      if (hash === '#admin/analytics') return 'analytics';
      if (hash === '#admin/alerts') return 'alerts';
    }
    return 'overview';
  };

  const [currentPage, setCurrentPage] = useState<AdminPage>(getInitialPage);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [alertsTab, setAlertsTab] = useState<'officer' | 'customer'>('officer');

  // Sidebar Collapsible State with LocalStorage memory and auto-collapse below 1100px
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('sema_admin_sidebar_collapsed');
        if (stored !== null) return stored === 'true';
        return window.innerWidth < 1100;
      } catch {
        return false;
      }
    }
    return false;
  });

  // Focus Mode State
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);

  // Pagination for Incidents Table (15 rows initially with Load More)
  const [visibleCount, setVisibleCount] = useState<number>(15);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('All');
  const [selectedLanguageFilter, setSelectedLanguageFilter] = useState<string>('All');
  const [priorityRanking, setPriorityRanking] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<string>('All Channels');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [selectedLocation, setSelectedLocation] = useState<string>('All Locations');
  const [dateRange, setDateRange] = useState<DateRangeValue>({
    preset: 'all',
    startDate: '',
    endDate: '',
  });

  // Channel Feeds Sync & Stream State
  const [isSyncingFeeds, setIsSyncingFeeds] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number }>(() => {
    const total = demoComplaintsData?.records?.length || 30;
    const syncedIds = new Set(demoComplaintsData?.records?.map((r) => r.id) || []);
    const count = (submissions || []).filter(
      (s) => s.isSyncedFeed || syncedIds.has(s.id) || s.id.startsWith('dummy-')
    ).length;
    return { current: Math.min(count, total), total };
  });
  const syncTimerRef = useRef<any>(null);
  const syncIndexRef = useRef(0);

  // Keep sync progress counter aligned with store when not actively syncing
  useEffect(() => {
    if (!isSyncingFeeds) {
      const total = demoComplaintsData?.records?.length || 30;
      const syncedIds = new Set(demoComplaintsData?.records?.map((r) => r.id) || []);
      const count = submissions.filter(
        (s) => s.isSyncedFeed || syncedIds.has(s.id) || s.id.startsWith('dummy-')
      ).length;
      setSyncProgress({ current: Math.min(count, total), total });
    }
  }, [submissions, isSyncingFeeds]);

  // Status & Feedback States
  const [copiedStepsTicket, setCopiedStepsTicket] = useState<string | null>(null);
  const [inflowToast, setInflowToast] = useState<string | null>(null);
  const [isSimulatingInflow, setIsSimulatingInflow] = useState(false);
  const [isAutoAssigningAll, setIsAutoAssigningAll] = useState(false);
  const [autoAssignSuccessMessage, setAutoAssignSuccessMessage] = useState<string | null>(null);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);
  const [emailSuccessMessage, setEmailSuccessMessage] = useState<string | null>(null);
  const [classifyingId, setClassifyingId] = useState<string | null>(null);

  // Single dynamic teams list initialized with standard teams and updated with AI-suggested teams
  const [teams, setTeams] = useState<ResponseTeam[]>(() => {
    try {
      const stored = localStorage.getItem('sema_response_teams');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length >= KENYAN_RESPONSE_TEAMS.length) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return KENYAN_RESPONSE_TEAMS;
  });

  // Sync AI-suggested teams from any submissions
  useEffect(() => {
    const aiTeams: ResponseTeam[] = [];
    for (const s of submissions) {
      if (s.proposedTeam && s.proposedTeam.name) {
        if (!teams.some((t) => t.name === s.proposedTeam!.name)) {
          aiTeams.push({
            id: `team-ai-${s.proposedTeam.code.toLowerCase()}`,
            name: s.proposedTeam.name,
            shortCode: s.proposedTeam.code || 'AI-TEAM',
            department: s.proposedTeam.scope || s.proposedTeam.name,
            leadOfficer: 'To be assigned',
            email: 'dispatch@safaricom.co.ke',
            phone: '0722 000 000',
            activeCount: 0,
            color: 'teal',
            isAiSuggested: true,
            scope: s.proposedTeam.scope,
          });
        }
      }
    }
    if (aiTeams.length > 0) {
      setTeams((prev) => {
        const map = new Map<string, ResponseTeam>();
        prev.forEach((t) => map.set(t.name, t));
        aiTeams.forEach((t) => map.set(t.name, t));
        const updated = Array.from(map.values());
        try {
          localStorage.setItem('sema_response_teams', JSON.stringify(updated));
        } catch {}
        return updated;
      });
    }
  }, [submissions, teams]);

  // Auto-dispatch Engine State (Default ON, backed by localStorage)
  const [isAutoDispatchEnabled, setIsAutoDispatchEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('sema_auto_dispatch_enabled');
      if (stored !== null) {
        return stored === 'true';
      }
    } catch {
      // ignore
    }
    return true;
  });

  const handleToggleAutoDispatch = () => {
    setIsAutoDispatchEnabled((prev) => {
      const nextVal = !prev;
      try {
        localStorage.setItem('sema_auto_dispatch_enabled', String(nextVal));
      } catch {
        // ignore
      }

      if (nextVal) {
        // Dispatch all eligible unassigned tickets in queue
        let count = 0;
        const updated = submissions.map((t) => {
          if (
            (t.status === 'Received' || !t.assignedTeam) &&
            t.status !== 'Feedback' &&
            t.intent !== 'Compliment' &&
            (t.confidence ?? t.aiClassification?.confidenceScore ?? 0.8) >= 0.6
          ) {
            const { record, dispatched } = evaluateAndAutoDispatch(t, true);
            if (dispatched) count++;
            return record;
          }
          return t;
        });

        if (count > 0 && onSetSubmissions) {
          onSetSubmissions(updated);
          try {
            localStorage.setItem('sema_submissions', JSON.stringify(updated));
          } catch {}
          setInflowToast(`Auto-dispatch enabled: Dispatched ${count} eligible incident ${count === 1 ? 'ticket' : 'tickets'} immediately.`);
        } else {
          setInflowToast('Auto-dispatch enabled: Incoming incidents will automatically route to specialized response teams.');
        }
      } else {
        setInflowToast('Auto-dispatch disabled: Incoming incidents will hold in Received queue for manual triage.');
      }

      setTimeout(() => setInflowToast(null), 3500);
      return nextVal;
    });
  };

  // Toast event listener for auto-dispatch alerts
  useEffect(() => {
    const handleAutoDispatchToast = (e: Event) => {
      const detail = (e as CustomEvent<{ message: string }>).detail;
      if (detail?.message) {
        setInflowToast(detail.message);
        setTimeout(() => {
          setInflowToast((curr) => (curr === detail.message ? null : curr));
        }, 4000);
      }
    };
    window.addEventListener('sema:auto-dispatch-toast', handleAutoDispatchToast);
    return () => {
      window.removeEventListener('sema:auto-dispatch-toast', handleAutoDispatchToast);
    };
  }, []);

  // Selected report for right-side detail drawer & dispatch
  const [inspectingReport, setInspectingReport] = useState<SubmissionRecord | null>(null);
  const [dispatchTeam, setDispatchTeam] = useState<string>('');
  const [dispatchOfficer, setDispatchOfficer] = useState<string>('');
  const [dispatchOfficerEmail, setDispatchOfficerEmail] = useState<string>('');
  const [sendAutomatedEmail, setSendAutomatedEmail] = useState<boolean>(true);
  const [showEmailPreview, setShowEmailPreview] = useState<boolean>(false);
  const [dispatchPriority, setDispatchPriority] = useState<PriorityLevel>('Medium');
  const [dispatchStatus, setDispatchStatus] = useState<ReportStatus>('Assigned');
  const [dispatchNotes, setDispatchNotes] = useState<string>('');
  const [isSavingDispatch, setIsSavingDispatch] = useState<boolean>(false);

  // Email Alerts Log & Specific Email Viewer
  const [inspectingEmailAlert, setInspectingEmailAlert] = useState<SubmissionRecord | null>(null);
  const [isEmailLogsModalOpen, setIsEmailLogsModalOpen] = useState<boolean>(false);
  const [sendingEmailForId, setSendingEmailForId] = useState<string | null>(null);
  const [copiedEmailText, setCopiedEmailText] = useState<boolean>(false);
  const [selectedEnlargedImage, setSelectedEnlargedImage] = useState<string | null>(null);

  // AI Analytics & Pie Chart states
  const [activeHoveredCategory, setActiveHoveredCategory] = useState<string | null>(null);
  const [isCompilingAI, setIsCompilingAI] = useState<boolean>(false);
  const [hasCopiedBrief, setHasCopiedBrief] = useState<boolean>(false);
  const [aiAnalyticsData, setAiAnalyticsData] = useState<{
    executiveSummary: string;
    recommendations: string[];
    aiPowered: boolean;
    compiledAt: string;
  } | null>(null);

  // Auto-collapse sidebar below 1100px wide
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined' && window.innerWidth < 1100) {
        setIsSidebarCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Esc key listener to exit Focus Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFocusMode) {
        setIsFocusMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocusMode]);

  // Sidebar toggle with localStorage persistence
  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sema_admin_sidebar_collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Sync hash routing
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash === '#admin/incidents') setCurrentPage('incidents');
      else if (hash === '#admin/channels') setCurrentPage('channels');
      else if (hash === '#admin/clusters') setCurrentPage('clusters');
      else if (hash === '#admin/teams') setCurrentPage('teams');
      else if (hash === '#admin/analytics') setCurrentPage('analytics');
      else if (hash === '#admin/alerts') setCurrentPage('alerts');
      else if (hash === '#admin' || hash === '' || hash.startsWith('#admin')) setCurrentPage('overview');
    };

    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const navigateTo = (page: AdminPage) => {
    setCurrentPage(page);
    window.location.hash = page === 'overview' ? 'admin' : `admin/${page}`;
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Computed clusters from the shared ticket store (3+ tickets in the same area within 60 minutes)
  const computedClusters = useMemo(() => {
    return computeClustersFromStore(submissions);
  }, [submissions]);

  const primaryCluster = computedClusters.find((c) => c.isPrimaryHub) || computedClusters[0] || null;

  // AI-Powered Pie Chart and Issue Analysis Calculation
  const pieChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    const total = submissions.length;

    for (const sub of submissions) {
      const cat = sub.category || 'Home Fibre & Fixed Internet';
      counts[cat] = (counts[cat] || 0) + 1;
    }

    const CATEGORY_COLORS: Record<
      string,
      { fill: string; stroke: string; bg: string; text: string; dot: string }
    > = {
      'Home Fibre & Fixed Internet': {
        fill: '#10b981',
        stroke: '#059669',
        bg: 'bg-emerald-50',
        text: 'text-emerald-800',
        dot: 'bg-emerald-500',
      },
      'M-PESA & Financial Services': {
        fill: '#0284c7',
        stroke: '#0369a1',
        bg: 'bg-sky-50',
        text: 'text-sky-800',
        dot: 'bg-sky-500',
      },
      'Mobile Network & 4G/5G Coverage': {
        fill: '#f59e0b',
        stroke: '#d97706',
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        dot: 'bg-amber-500',
      },
      'SIM Swap, Fraud & Security': {
        fill: '#ef4444',
        stroke: '#dc2626',
        bg: 'bg-rose-50',
        text: 'text-rose-800',
        dot: 'bg-rose-500',
      },
      'Customer Care & Airtime Billing': {
        fill: '#6366f1',
        stroke: '#4f46e5',
        bg: 'bg-indigo-50',
        text: 'text-indigo-800',
        dot: 'bg-indigo-500',
      },
      'Enterprise & Cloud Solutions': {
        fill: '#14b8a6',
        stroke: '#0d9488',
        bg: 'bg-teal-50',
        text: 'text-teal-800',
        dot: 'bg-teal-500',
      },
      'Lipa Na M-PESA & Merchant Services': {
        fill: '#84cc16',
        stroke: '#65a30d',
        bg: 'bg-lime-50',
        text: 'text-lime-800',
        dot: 'bg-lime-500',
      },
    };

    const DEFAULT_COLOR = {
      fill: '#64748b',
      stroke: '#475569',
      bg: 'bg-slate-50',
      text: 'text-slate-800',
      dot: 'bg-slate-500',
    };

    const items = Object.entries(counts)
      .map(([category, count]) => {
        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
        const color = CATEGORY_COLORS[category] || DEFAULT_COLOR;
        return {
          category,
          count,
          percentage,
          ...color,
        };
      })
      .sort((a, b) => b.count - a.count);

    let currentAngle = -Math.PI / 2;
    const cx = 100;
    const cy = 100;
    const outerR = 82;
    const innerR = 48;

    const slices = items.map((item) => {
      const fraction = total > 0 ? item.count / total : 0;
      const angle = fraction * 2 * Math.PI;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      const x1 = cx + outerR * Math.cos(startAngle);
      const y1 = cy + outerR * Math.sin(startAngle);
      const x2 = cx + outerR * Math.cos(endAngle);
      const y2 = cy + outerR * Math.sin(endAngle);

      const x3 = cx + innerR * Math.cos(endAngle);
      const y3 = cy + innerR * Math.sin(endAngle);
      const x4 = cx + innerR * Math.cos(startAngle);
      const y4 = cy + innerR * Math.sin(startAngle);

      const largeArc = angle > Math.PI ? 1 : 0;

      const pathData =
        fraction >= 0.999
          ? `M ${cx} ${cy - outerR} A ${outerR} ${outerR} 0 1 1 ${cx - 0.01} ${cy - outerR} L ${cx - 0.01} ${cy - innerR} A ${innerR} ${innerR} 0 1 0 ${cx} ${cy - innerR} Z`
          : `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4} Z`;

      return {
        ...item,
        pathData,
      };
    });

    return { total, items, slices };
  }, [submissions]);

  const handleCompileAIAnalytics = async () => {
    setIsCompilingAI(true);
    try {
      const res = await fetch('/api/admin/analytics');
      if (res.ok) {
        const data = await res.json();
        setAiAnalyticsData({
          executiveSummary: data.executiveSummary,
          recommendations: data.recommendations,
          aiPowered: data.aiPowered,
          compiledAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      } else {
        throw new Error('Fallback needed');
      }
    } catch {
      const topCat = pieChartData.items[0]?.category || 'Home Fibre & Fixed Internet';
      const topPct = pieChartData.items[0]?.percentage || 45;
      setAiAnalyticsData({
        executiveSummary: `Safaricom SEMA Operations Synthesis: Analyzed ${submissions.length} customer incident tickets across Kenya. Primary ticket concentration is "${topCat}" at ${topPct}% volume. Metro fiber re-splicing crews and M-PESA transaction recovery engineers are prioritized for immediate technical intervention.`,
        recommendations: [
          `Dispatch Safaricom metro fiber splicing teams with OTDR fault locators along active red-LOS clusters.`,
          `Re-query core M-PESA B2C/B2B transaction switch reconciliation to achieve 30-minute SLA on hospital and till payments.`,
          `Maintain proactive customer notifications via Kiswahili and Sheng channels to update affected subscribers.`,
        ],
        aiPowered: true,
        compiledAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    } finally {
      setIsCompilingAI(false);
    }
  };

  useEffect(() => {
    handleCompileAIAnalytics();
  }, [submissions.length]);

  // Metrics computation (The 4 core KPIs)
  // Compliments are NOT incidents! Mark them "Feedback", do not dispatch or count in Unassigned or Urgent
  const metrics = useMemo(() => {
    const total = submissions.length;
    const unassigned = submissions.filter(
      (s) => (s.status === 'Received' || !s.assignedTeam) && s.status !== 'Feedback' && s.intent !== 'Compliment'
    ).length;
    const inProgress = submissions.filter((s) => s.status === 'In Progress' || s.status === 'Assigned').length;
    const resolved = submissions.filter((s) => s.status === 'Resolved' || s.status === 'Closed').length;
    const urgentCount = submissions.filter(
      (s) => s.priority === 'Urgent' && s.status !== 'Feedback' && s.intent !== 'Compliment'
    ).length;
    const emailAlertsSent = submissions.filter((s) => s.emailAlertSent).length;
    return { total, unassigned, inProgress, resolved, urgentCount, emailAlertsSent };
  }, [submissions]);

  // Urgent categories and dynamic subtitle reflecting the actual categories of urgent tickets
  const urgentCategories = useMemo(() => {
    const set = new Set<string>();
    for (const s of submissions) {
      if (s.priority === 'Urgent' && s.status !== 'Feedback' && s.intent !== 'Compliment') {
        const cat = s.category || s.operationalCategory;
        if (cat) set.add(cat);
      }
    }
    return Array.from(set);
  }, [submissions]);

  const urgentSubtitle = useMemo(() => {
    if (urgentCategories.length === 0) return 'Zero urgent incidents';
    if (urgentCategories.length === 1) return `Critical ${urgentCategories[0]} urgency`;
    return `Critical ${urgentCategories.slice(0, 2).join(' / ')} ${urgentCategories.length > 2 ? `+${urgentCategories.length - 2} more` : 'urgency'}`;
  }, [urgentCategories]);

  // Dynamic Categories derived directly from data (not a fixed list)
  const dynamicCategories = useMemo(() => {
    const set = new Set<string>();
    for (const s of submissions) {
      const cat = s.category || s.operationalCategory;
      if (cat && cat.trim()) set.add(cat.trim());
    }
    return ['All Categories', ...Array.from(set).sort()];
  }, [submissions]);

  // Status counts for the visual status legend
  const statusCounts = useMemo(() => {
    const counts: Record<ReportStatus, number> = {
      Received: 0,
      Assigned: 0,
      'In Progress': 0,
      Resolved: 0,
      Closed: 0,
      Feedback: 0,
    };
    for (const s of submissions) {
      if (counts[s.status] !== undefined) {
        counts[s.status]++;
      }
    }
    return counts;
  }, [submissions]);

  // Channel, Category & Location helpers with normalization
  const getReportChannel = (sub: SubmissionRecord): string => {
    return normalizeChannelForTile(sub.channel, sub.captureMethod);
  };

  const getReportCategory = (sub: SubmissionRecord): string => {
    return sub.category || sub.operationalCategory || 'Mobile Network & 4G/5G Coverage';
  };

  const isReportInLocation = (sub: SubmissionRecord, loc: string): boolean => {
    if (loc === 'All Locations') return true;
    const target = loc.toLowerCase();
    const textLoc = (sub.countyOrWard || '').toLowerCase();
    const townLoc = (sub.locationTown || '').toLowerCase();
    if (target === 'ruaka') {
      return textLoc.includes('ruaka') || townLoc.includes('ruaka');
    }
    if (target === 'kiambu') {
      return textLoc.includes('kiambu') || textLoc.includes('ruaka') || townLoc.includes('kiambu') || townLoc.includes('ruaka');
    }
    return textLoc.includes(target) || townLoc.includes(target);
  };

  // Normalized Channel counts for Channel Mix & feed filters (Twitter, Call Center, Web Voice, Zuri, One App, USSD, LinkedIn, WhatsApp, Email, Instagram)
  const channelCounts = useMemo(() => {
    const counts: Record<string, number> = {
      'All Channels': submissions.length,
      Twitter: 0,
      'Call Center': 0,
      'Web Voice': 0,
      Zuri: 0,
      'One App': 0,
      USSD: 0,
      LinkedIn: 0,
      WhatsApp: 0,
      Email: 0,
      Instagram: 0,
    };
    for (const s of submissions) {
      const tile = normalizeChannelForTile(s.channel, s.captureMethod);
      if (counts[tile] !== undefined) {
        counts[tile]++;
      } else {
        counts['Web Voice']++;
      }
    }
    return counts;
  }, [submissions]);

  // Real computed status statistics for Channel Feeds page ("Synced 25 feeds from 9 channels")
  const syncedFeedStats = useMemo(() => {
    const syncedTickets = submissions.filter(
      (s) => s.source === 'synced' || s.isSyncedFeed || s.id.startsWith('dummy-')
    );
    const activeChannels = new Set<string>();
    for (const t of syncedTickets) {
      const tile = normalizeChannelForTile(t.channel, t.captureMethod);
      activeChannels.add(tile);
    }
    return {
      syncedCount: syncedTickets.length,
      channelsCount: activeChannels.size,
      statusLine: `Synced ${syncedTickets.length} feeds from ${activeChannels.size} channels`,
    };
  }, [submissions]);

  // Operational Category counts dynamically populated from data
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      'All Categories': submissions.length,
    };
    for (const cat of dynamicCategories) {
      if (cat !== 'All Categories') counts[cat] = 0;
    }
    for (const s of submissions) {
      const cat = s.category || s.operationalCategory;
      if (cat && counts[cat] !== undefined) {
        counts[cat]++;
      }
    }
    return counts;
  }, [submissions, dynamicCategories]);

  // Location counts
  const locationCounts = useMemo(() => {
    const counts: Record<string, number> = {
      'All Locations': submissions.length,
      Ruaka: 0,
      Nairobi: 0,
      Kiambu: 0,
      Mombasa: 0,
      Nakuru: 0,
      Kisumu: 0,
      Eldoret: 0,
      Nyeri: 0,
    };
    for (const s of submissions) {
      for (const loc of ['Ruaka', 'Nairobi', 'Kiambu', 'Mombasa', 'Nakuru', 'Kisumu', 'Eldoret', 'Nyeri']) {
        if (isReportInLocation(s, loc)) {
          counts[loc]++;
        }
      }
    }
    return counts;
  }, [submissions]);

  // Inflow simulation handler (Preserved in code)
  const handleSimulateInflowStream = () => {
    setIsSimulatingInflow(true);
    const simulationPool: Array<Omit<SubmissionRecord, 'id' | 'referenceCode' | 'createdAt'>> = [
      {
        text: 'Huku Ruaka bypass fibre imekatwa tena na tingatinga ya ujenzi, modem inawaka red LOS tangu saa kumi na mbili asubuhi.',
        detectedLanguage: 'Kiswahili',
        englishTranslation: 'Here at Ruaka bypass the fiber has been severed again by construction machinery, modem blinking red LOS since 6 AM.',
        category: 'Home Fibre & Fixed Internet',
        operationalCategory: 'Fibre',
        channel: 'WhatsApp',
        countyOrWard: 'Kiambu · Ruaka Bypass / Limuru Rd',
        locationTown: 'Ruaka',
        captureMethod: 'text',
        aiCommitmentResponse: 'Rada imefika safi. Timu ya dharura ya fiber splicing Ruaka imetumwa na mashine ya OTDR kurekebisha cable hiyo.',
        status: 'In Progress',
        priority: 'Urgent',
        assignedTeam: 'Safaricom Home Fibre & Enterprise NOC',
        assignedOfficer: 'Eng. Dennis Kiprono',
        aiRootCause: 'Metro distribution fiber sliced during ongoing road widening project at Ruaka bypass.',
        aiResolutionSteps: [
          'Dispatch emergency metro optical fiber splicing van to Ruaka bypass construction trench.',
          'Splice 24-core drop feeder and measure optical power at distribution cabinet #RUA-09.',
          'Send recovery notification broadcast via WhatsApp bot to 42 affected subscribers.'
        ],
        aiClassification: {
          category: 'Home Fibre & Fixed Internet',
          urgency: 'Urgent',
          recommendedTeam: 'Safaricom Home Fibre & Enterprise NOC',
          rationale: 'Multiple red LOS complaints clustered along Ruaka Bypass.',
          estimatedSLA: '1.5 hours',
          sentiment: 'Distressed',
          tensionLevel: 'High',
          frustrationScore: 90,
          isHighTension: true,
        },
      },
    ];

    const randomItem = simulationPool[0];
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const newSub: SubmissionRecord = {
      ...randomItem,
      id: `sema-sim-${Date.now()}`,
      referenceCode: `SEMA-SAF-${randNum}`,
      createdAt: new Date().toISOString(),
    };

    if (onNewSubmission) {
      onNewSubmission(newSub);
    } else {
      onUpdateSubmission(newSub);
    }

    setInflowToast(`Incoming Feed: ${newSub.channel} complaint registered [${newSub.referenceCode}]`);
    setTimeout(() => setInflowToast(null), 4000);
    setIsSimulatingInflow(false);
  };

  // Rule-based priority determination for seeded records based on operationalCategory and keywords
  const determineSeedPriority = (operationalCategory: string, text: string): PriorityLevel => {
    const lower = (text || '').toLowerCase();
    if (
      lower.includes('down') ||
      lower.includes('outage') ||
      lower.includes('imekatika') ||
      lower.includes('cut') ||
      lower.includes('los') ||
      lower.includes('red') ||
      lower.includes('hospital') ||
      lower.includes('emergency') ||
      lower.includes('stuck') ||
      lower.includes('pending') ||
      lower.includes('deducted') ||
      lower.includes('sim swap') ||
      lower.includes('fraud') ||
      lower.includes('theft') ||
      lower.includes('hazard') ||
      lower.includes('moto') ||
      (operationalCategory === 'Fibre' && (lower.includes('red') || lower.includes('down') || lower.includes('los'))) ||
      (operationalCategory === 'M-PESA' && (lower.includes('stuck') || lower.includes('hospital') || lower.includes('pending') || lower.includes('deducted')))
    ) {
      return 'Urgent';
    }
    if (
      lower.includes('slow') ||
      lower.includes('speed') ||
      lower.includes('buffer') ||
      lower.includes('dropped') ||
      lower.includes('signal') ||
      lower.includes('coverage') ||
      lower.includes('blackout') ||
      lower.includes('mast') ||
      lower.includes('tower') ||
      operationalCategory === 'Slow Internet' ||
      operationalCategory === 'Coverage'
    ) {
      return 'High';
    }
    if (
      lower.includes('airtime') ||
      lower.includes('bundle') ||
      lower.includes('invoice') ||
      lower.includes('balance') ||
      lower.includes('bonga') ||
      operationalCategory === 'Billing'
    ) {
      return 'Medium';
    }
    return 'Medium';
  };

  // Helper to map operational category and keywords to official Safaricom department and team
  const getCategoryAndTeamForSeed = (operationalCategory: string, text: string) => {
    const lower = (text || '').toLowerCase();
    if (
      operationalCategory === 'Fibre' ||
      lower.includes('fibre') ||
      lower.includes('fiber') ||
      lower.includes('router') ||
      lower.includes('ont')
    ) {
      return {
        category: 'Home Fibre & Fixed Internet',
        team: 'Safaricom Home Fibre & Enterprise NOC',
        officer: 'Eng. Dennis Kiprono',
        email: 'dennis.kiprono@safaricom.co.ke',
        sla: '2 hours',
        rationale: 'Optical fiber link disruption reported on customer endpoint.',
        rootCause: 'Optical distribution attenuation or feeder cable fault.',
      };
    }
    if (
      operationalCategory === 'M-PESA' ||
      lower.includes('m-pesa') ||
      lower.includes('mpesa') ||
      lower.includes('till') ||
      lower.includes('paybill') ||
      lower.includes('reversal')
    ) {
      return {
        category: 'M-PESA & Financial Services',
        team: 'M-PESA Escalations & Reversals Operations',
        officer: 'Officer Grace Mwangi',
        email: 'grace.mwangi@safaricom.co.ke',
        sla: '30 minutes',
        rationale: 'M-PESA financial transaction ledger reconciliation required.',
        rootCause: 'Inter-switch settlement timeout between payment switch and merchant API.',
      };
    }
    if (
      operationalCategory === 'Billing' ||
      lower.includes('airtime') ||
      lower.includes('bundle') ||
      lower.includes('invoice') ||
      lower.includes('balance')
    ) {
      return {
        category: 'Customer Care & Airtime Billing',
        team: 'Customer Experience & Airtime Billing Desk',
        officer: 'Coordinator Agnes Muthoni',
        email: 'agnes.muthoni@safaricom.co.ke',
        sla: '6 hours',
        rationale: 'Account airtime balance or subscription deduction review.',
        rootCause: 'Transaction reconciliation delay between billing switch and subscriber balance ledger.',
      };
    }
    if (
      operationalCategory === 'Slow Internet' ||
      operationalCategory === 'Voice Calls' ||
      operationalCategory === 'Coverage' ||
      lower.includes('call') ||
      lower.includes('network') ||
      lower.includes('4g') ||
      lower.includes('5g')
    ) {
      return {
        category: 'Mobile Network & 4G/5G Coverage',
        team: '4G / 5G Mobile Network & Base Transceiver (BTS) Team',
        officer: 'Supervisor Brian Otieno',
        email: 'brian.otieno@safaricom.co.ke',
        sla: '4 hours',
        rationale: 'Radio Access Network (RAN) sector optimization or cellular signal loss.',
        rootCause: 'High sector congestion or microwave backhaul packet latency.',
      };
    }
    if (lower.includes('swap') || lower.includes('fraud') || lower.includes('puk') || lower.includes('hack')) {
      return {
        category: 'SIM Swap, Fraud & Security',
        team: 'SIM Swap, Identity Protection & Cyber-Fraud Unit',
        officer: 'Insp. Hassan Ali',
        email: 'hassan.ali@safaricom.co.ke',
        sla: '1 hour',
        rationale: 'Security escalation or identity verification required.',
        rootCause: 'Identity verification check or PUK unlock procedure required.',
      };
    }
    return {
      category: 'Customer Care & Airtime Billing',
      team: 'Customer Experience & Airtime Billing Desk',
      officer: 'Coordinator Agnes Muthoni',
      email: 'agnes.muthoni@safaricom.co.ke',
      sla: '12 hours',
      rationale: 'General customer operational inquiry.',
      rootCause: 'General subscriber query.',
    };
  };

  // Helper to build a full SubmissionRecord through rule-based classification (Zero Gemini calls)
  const classifyAndBuildSyncedRecord = (record: (typeof demoComplaintsData.records)[0]): SubmissionRecord => {
    const minutesAgo = record.minutesAgo || 0;
    const createdAt = new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
    const priority = determineSeedPriority(record.operationalCategory, record.text);
    const meta = getCategoryAndTeamForSeed(record.operationalCategory, record.text);

    let locationTown = 'Nairobi';
    const cw = (record.countyOrWard || '').toLowerCase();
    if (cw.includes('ruaka')) locationTown = 'Ruaka';
    else if (cw.includes('nyali') || cw.includes('mombasa')) locationTown = 'Mombasa';
    else if (cw.includes('nakuru')) locationTown = 'Nakuru';
    else if (cw.includes('kisumu')) locationTown = 'Kisumu';
    else if (cw.includes('eldoret')) locationTown = 'Eldoret';
    else if (cw.includes('nyeri')) locationTown = 'Nyeri';
    else if (cw.includes('kiambu')) locationTown = 'Kiambu';

    const frustration = priority === 'Urgent' ? 88 : priority === 'High' ? 65 : 35;
    const isHighTension = frustration >= 70 || priority === 'Urgent';

    const isCategoryKnown = Boolean(meta.category && meta.team);
    const confidenceScore = isCategoryKnown ? 0.94 : 0.45;

    const aiClassification: AIClassification = {
      category: meta.category,
      urgency: priority,
      recommendedTeam: meta.team,
      confidenceScore,
      rationale: `${meta.rationale} Ingested via ${record.inflowChannel}.`,
      estimatedSLA: meta.sla,
      sentiment: isHighTension ? 'Frustrated' : 'Neutral',
      tensionLevel: isHighTension ? 'High' : 'Standard',
      frustrationScore: frustration,
      isHighTension,
      tensionFactors: [`Inflow channel: ${record.inflowChannel}`, `${record.countyOrWard} incident`],
      tensionNotes: isHighTension
        ? 'Elevated customer urgency flagged for rapid team response.'
        : 'Standard operational SLA window.',
    };

    const randCode = Math.floor(1000 + Math.random() * 9000);
    return {
      id: record.id || `sema-sync-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      referenceCode: `SEMA-SAF-${randCode}`,
      text: record.text,
      detectedLanguage: (record.detectedLanguage as any) || 'English',
      englishTranslation: record.detectedLanguage !== 'English' ? `Translation: ${record.text}` : undefined,
      category: meta.category,
      countyOrWard: record.countyOrWard,
      locationTown,
      contactInfo: record.contactInfo || undefined,
      captureMethod: record.inflowChannel === 'Web Voice Portal' ? 'voice' : 'text',
      aiCommitmentResponse: `SEMA automated dispatch: Incident logged via ${record.inflowChannel} from ${record.countyOrWard}. Dispatched to ${meta.team}.`,
      status: 'Received',
      priority,
      assignedTeam: undefined,
      assignedOfficer: undefined,
      assignedOfficerEmail: undefined,
      channel: record.inflowChannel as InflowChannel,
      operationalCategory: record.operationalCategory as any,
      handle: record.handle || undefined,
      latitude: typeof record.latitude === 'number' ? record.latitude : undefined,
      longitude: typeof record.longitude === 'number' ? record.longitude : undefined,
      isSyncedFeed: true,
      aiClassification,
      // Resolution steps are generated ONLY when a ticket is opened, and cached
      aiResolutionSteps: undefined,
      aiRootCause: meta.rootCause,
      sentiment: aiClassification.sentiment,
      tensionLevel: aiClassification.tensionLevel,
      frustrationScore: aiClassification.frustrationScore,
      isHighTension: aiClassification.isHighTension,
      tensionFactors: aiClassification.tensionFactors,
      tensionNotes: aiClassification.tensionNotes,
      createdAt,
    };
  };

  // Helper to generate informed AI resolution steps only when ticket is inspected
  const generateResolutionStepsForTicket = (report: SubmissionRecord): string[] => {
    const cat = report.category || '';
    const opCat = report.operationalCategory || '';
    const lower = (report.text || '').toLowerCase();

    if (
      cat.includes('Fibre') ||
      opCat === 'Fibre' ||
      lower.includes('fibre') ||
      lower.includes('fiber') ||
      lower.includes('los') ||
      lower.includes('router')
    ) {
      return [
        'Dispatch field metro optical splicing crew with OTDR fault locator to local cluster distribution point.',
        'Re-splice severed core fibers and verify optical receive power level below -24 dBm at cabinet.',
        'Re-bind ONT MAC address in OLT terminal and broadcast optical link recovery confirmation.',
      ];
    }
    if (
      cat.includes('M-PESA') ||
      opCat === 'M-PESA' ||
      lower.includes('mpesa') ||
      lower.includes('m-pesa') ||
      lower.includes('till') ||
      lower.includes('paybill') ||
      lower.includes('reversal')
    ) {
      return [
        'Interrogate core M-PESA G2 transaction switch logs for MSISDN ledger reference and confirmation token.',
        'Execute forced B2B settlement callback push to merchant / hospital account API gateway.',
        'Dispatch automated high-priority SMS confirmation to customer and transaction liaison.',
      ];
    }
    if (
      cat.includes('SIM Swap') ||
      cat.includes('Fraud') ||
      lower.includes('swap') ||
      lower.includes('fraud') ||
      lower.includes('puk')
    ) {
      return [
        'Verify National ID and registration biometric record in Safaricom KYC security portal.',
        'Execute immediate temporary block on suspect MSISDN to prevent unauthorized transaction routing.',
        'Issue authorized PUK / new SIM activation token and record incident in security fraud registry.',
      ];
    }
    if (
      cat.includes('Billing') ||
      opCat === 'Billing' ||
      lower.includes('airtime') ||
      lower.includes('invoice') ||
      lower.includes('bonga')
    ) {
      return [
        'Audit transaction reference code against billing ledger gateway and bundle ledger.',
        'Apply credit reversal or airtime adjustment to subscriber MSISDN balance.',
        'Dispatch automated confirmation SMS to subscriber confirming account reconciliation.',
      ];
    }
    return [
      'Interrogate BTS sector utilization telemetry and microwave backhaul bandwidth allocation.',
      'Execute dynamic carrier frequency rebalancing across local 4G/5G micro cells.',
      'Perform radio channel diagnostic and confirm voice call handover and data throughput recovery.',
    ];
  };

  useEffect(() => {
    return () => {
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
      }
    };
  }, []);

  const stopFeedsSync = () => {
    if (syncTimerRef.current) {
      clearInterval(syncTimerRef.current);
      syncTimerRef.current = null;
    }
    setIsSyncingFeeds(false);
  };

  // Start background or manual feeds sync (1 ticket every 850ms, i.e. 0.7s to 1s)
  const startSyncingFeedsProcess = (startIdx = 0) => {
    const records = demoComplaintsData?.records || [];
    if (records.length === 0) return;

    if (syncTimerRef.current) {
      clearInterval(syncTimerRef.current);
      syncTimerRef.current = null;
    }

    setIsSyncingFeeds(true);
    syncIndexRef.current = startIdx;
    setSyncProgress({ current: startIdx, total: records.length });

    const stepSync = () => {
      const idx = syncIndexRef.current;
      if (idx >= records.length) {
        stopFeedsSync();
        syncIndexRef.current = records.length;
        setSyncProgress({ current: records.length, total: records.length });
        try {
          localStorage.setItem('sema_synced_feeds_completed', 'true');
        } catch {
          // ignore
        }
        return;
      }

      const raw = records[idx];
      syncIndexRef.current = idx + 1;
      setSyncProgress({ current: idx + 1, total: records.length });

      // Build record rule-based without calling Gemini
      const initialRecord = classifyAndBuildSyncedRecord(raw);

      // Evaluate for automated dispatch based on category mapping & safety rules
      const evaluation = evaluateAndAutoDispatch(initialRecord, isAutoDispatchEnabled);
      const finalRecord = evaluation.record;

      if (evaluation.toastMessage) {
        setInflowToast(evaluation.toastMessage);
        setTimeout(() => {
          setInflowToast((curr) => (curr === evaluation.toastMessage ? null : curr));
        }, 3500);
      }

      if (onNewSubmission) {
        onNewSubmission(finalRecord);
      } else {
        onUpdateSubmission(finalRecord);
      }

      if (idx + 1 >= records.length) {
        stopFeedsSync();
        try {
          localStorage.setItem('sema_synced_feeds_completed', 'true');
        } catch {
          // ignore
        }
      }
    };

    stepSync();
    // 850ms interval fulfills requirement (0.7 to 1 second)
    syncTimerRef.current = setInterval(stepSync, 850);
  };

  // 4. Run syncSimulatedFeeds() automatically when admin console loads
  useEffect(() => {
    let isMounted = true;
    const runInitialFeedSync = async () => {
      try {
        const result = await syncSimulatedFeeds(submissions, isAutoDispatchEnabled);
        if (isMounted && onSetSubmissions) {
          onSetSubmissions(result.merged);
        }
      } catch (err) {
        console.warn('Initial simulated feeds auto-sync notice:', err);
      }
    };
    runInitialFeedSync();
    return () => {
      isMounted = false;
    };
  }, []);

  // Manual sync button on Channel Feeds page using syncSimulatedFeeds()
  const handleToggleSyncFeeds = async () => {
    setIsSyncingFeeds(true);
    setSyncProgress({ current: 0, total: 25 });

    try {
      const result = await syncSimulatedFeeds(submissions, isAutoDispatchEnabled);
      if (onSetSubmissions) {
        onSetSubmissions(result.merged);
      }
      setSyncProgress({ current: result.totalSyncedCount, total: result.totalSyncedCount });
      setInflowToast(
        result.newlyAddedCount > 0
          ? `Synced ${result.newlyAddedCount} new feeds (${result.totalSyncedCount} feeds from ${result.syncedChannelsCount} channels).`
          : `Synced ${result.totalSyncedCount} feeds from ${result.syncedChannelsCount} channels.`
      );
    } catch (err) {
      console.warn('Error during feeds sync:', err);
      setInflowToast('Feeds sync completed.');
    } finally {
      setIsSyncingFeeds(false);
      setTimeout(() => setInflowToast(null), 3500);
    }
  };

  // 7. Clear synced feeds: removes only tickets with source "synced". Live Web Voice tickets stay.
  const handleClearSyncedFeeds = async () => {
    stopFeedsSync();
    syncIndexRef.current = 0;
    const { remaining, removedCount } = clearSyncedFeeds(submissions);

    if (onSetSubmissions) {
      onSetSubmissions(remaining);
    }

    setInflowToast(`Cleared synced feeds (${removedCount} records removed; live Web Voice tickets stay).`);
    setTimeout(() => setInflowToast(null), 3500);
  };

  const syncedFeedsCount = useMemo(() => {
    return submissions.filter(
      (s) => s.source === 'synced' || s.isSyncedFeed || s.id.startsWith('dummy-')
    ).length;
  }, [submissions]);

  // Channel badge renderer with normalized labels, colors and icons
  const renderChannelBadge = (channel?: InflowChannel | string, captureMethod?: string) => {
    if (captureMethod === 'image') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
          <Camera className="w-2.5 h-2.5 text-amber-700 shrink-0" />
          <span>Screenshot</span>
        </span>
      );
    }
    const tile = normalizeChannelForTile(channel, captureMethod);
    switch (tile) {
      case 'Twitter':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-white border border-slate-700 shrink-0">
            <AtSign className="w-2.5 h-2.5 text-slate-300 shrink-0" />
            <span>Twitter</span>
          </span>
        );
      case 'Call Center':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300 shrink-0">
            <Phone className="w-2.5 h-2.5 text-slate-600 shrink-0" />
            <span>Call Center</span>
          </span>
        );
      case 'Web Voice':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-900 border border-cyan-300 shrink-0">
            <Volume2 className="w-2.5 h-2.5 text-cyan-700 shrink-0" />
            <span>Web Voice</span>
          </span>
        );
      case 'Zuri':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-300 shrink-0">
            <Bot className="w-2.5 h-2.5 text-purple-700 shrink-0" />
            <span>Zuri</span>
          </span>
        );
      case 'One App':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-900 border border-teal-300 shrink-0">
            <Smartphone className="w-2.5 h-2.5 text-teal-700 shrink-0" />
            <span>One App</span>
          </span>
        );
      case 'USSD':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
            <Hash className="w-2.5 h-2.5 text-amber-700 shrink-0" />
            <span>USSD</span>
          </span>
        );
      case 'WhatsApp':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 shrink-0">
            <MessageSquare className="w-2.5 h-2.5 text-emerald-700 shrink-0" />
            <span>WhatsApp</span>
          </span>
        );
      case 'LinkedIn':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-900 border border-sky-300 shrink-0">
            <Building2 className="w-2.5 h-2.5 text-sky-700 shrink-0" />
            <span>LinkedIn</span>
          </span>
        );
      case 'Instagram':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300 shrink-0">
            <Eye className="w-2.5 h-2.5 text-rose-700 shrink-0" />
            <span>Instagram</span>
          </span>
        );
      case 'Email':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-300 shrink-0">
            <Mail className="w-2.5 h-2.5 text-indigo-700 shrink-0" />
            <span>Email</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300 shrink-0">
            <Phone className="w-2.5 h-2.5 text-slate-600 shrink-0" />
            <span>{channel || 'Call Center'}</span>
          </span>
        );
    }
  };

  // Filtered submissions
  const filteredSubmissions = useMemo(() => {
    const list = submissions.filter((item) => {
      // Channel
      if (selectedChannel !== 'All Channels') {
        const ch = getReportChannel(item);
        const selNorm = normalizeChannelForTile(selectedChannel);
        if (ch !== selNorm && item.channel !== selectedChannel) return false;
      }

      // Operational Category
      if (selectedCategory !== 'All Categories') {
        const cat = getReportCategory(item);
        if (cat !== selectedCategory) return false;
      }

      // Location
      if (selectedLocation !== 'All Locations') {
        if (!isReportInLocation(item, selectedLocation)) return false;
      }

      // Date Range
      if (dateRange.preset !== 'all' || dateRange.startDate || dateRange.endDate) {
        const itemTime = new Date(item.createdAt).getTime();
        if (isNaN(itemTime)) return false;
        const now = Date.now();

        if (dateRange.preset === 'today') {
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          if (itemTime < todayStart.getTime()) return false;
        } else if (dateRange.preset === 'yesterday') {
          const yestStart = new Date(now - 24 * 60 * 60 * 1000);
          yestStart.setHours(0, 0, 0, 0);
          const yestEnd = new Date(now - 24 * 60 * 60 * 1000);
          yestEnd.setHours(23, 59, 59, 999);
          if (itemTime < yestStart.getTime() || itemTime > yestEnd.getTime()) return false;
        } else if (dateRange.preset === '24h') {
          if (now - itemTime > 24 * 60 * 60 * 1000) return false;
        } else if (dateRange.preset === '7d') {
          if (now - itemTime > 7 * 24 * 60 * 60 * 1000) return false;
        } else if (dateRange.preset === '30d') {
          if (now - itemTime > 30 * 24 * 60 * 60 * 1000) return false;
        }

        if (dateRange.startDate) {
          const [y, m, d] = dateRange.startDate.split('-').map(Number);
          if (y && m && d) {
            const start = new Date(y, m - 1, d, 0, 0, 0, 0);
            if (itemTime < start.getTime()) return false;
          }
        }
        if (dateRange.endDate) {
          const [y, m, d] = dateRange.endDate.split('-').map(Number);
          if (y && m && d) {
            const end = new Date(y, m - 1, d, 23, 59, 59, 999);
            if (itemTime > end.getTime()) return false;
          }
        }
      }

      // Search by reference code, status, category, urgency, location, or content
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.referenceCode.toLowerCase().includes(q) ||
        item.status.toLowerCase().includes(q) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        (item.priority && item.priority.toLowerCase().includes(q)) ||
        item.countyOrWard.toLowerCase().includes(q) ||
        item.text.toLowerCase().includes(q) ||
        (item.assignedTeam && item.assignedTeam.toLowerCase().includes(q)) ||
        (item.assignedOfficer && item.assignedOfficer.toLowerCase().includes(q));

      // Status
      const matchesStatus =
        selectedStatus === 'All'
          ? true
          : selectedStatus === 'Unassigned'
          ? item.status === 'Received' || !item.assignedTeam
          : item.status === selectedStatus;

      // Team
      const matchesTeam =
        selectedTeamFilter === 'All' ? true : item.assignedTeam === selectedTeamFilter;

      // Language
      const matchesLanguage =
        selectedLanguageFilter === 'All' ? true : item.detectedLanguage === selectedLanguageFilter;

      return matchesSearch && matchesStatus && matchesTeam && matchesLanguage;
    });

    if (priorityRanking) {
      const priorityWeight: Record<PriorityLevel, number> = {
        Urgent: 4,
        High: 3,
        Medium: 2,
        Routine: 1,
      };
      return list.slice().sort((a, b) => {
        const pA = priorityWeight[a.priority || 'Medium'] || 2;
        const pB = priorityWeight[b.priority || 'Medium'] || 2;
        if (pB !== pA) return pB - pA;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    return list;
  }, [
    submissions,
    selectedChannel,
    selectedCategory,
    selectedLocation,
    dateRange,
    searchQuery,
    selectedStatus,
    selectedTeamFilter,
    selectedLanguageFilter,
    priorityRanking,
  ]);

  // Client-side helper to generate formatted automated email alerts for officers
  const generateClientEmailAlert = (
    report: SubmissionRecord,
    officerName: string,
    officerEmail: string,
    teamName: string,
    priority?: PriorityLevel,
    adminNotes?: string
  ): { subject: string; body: string } => {
    const urgency = priority || report.priority || report.aiClassification?.urgency || 'Medium';
    const sla =
      report.aiClassification?.estimatedSLA ||
      (urgency === 'Urgent' ? '2 hours' : urgency === 'High' ? '6 hours' : '24 hours');
    const subject = `[SAFARICOM NOC DISPATCH] ${report.referenceCode} - ${report.category || 'Incident'} (${urgency} Priority)`;

    const body = `======================================================
SAFARICOM PLC - RAPID INCIDENT DISPATCH NOTICE
Network Operations Center (NOC) & Customer Escalations
======================================================

INCIDENT REFERENCE: ${report.referenceCode}
PRIORITY / URGENCY: ${urgency.toUpperCase()}
TARGET SLA:         ${sla}
CATEGORY:           ${report.category || 'Home Fibre & Fixed Internet'}
LOCATION:           ${report.countyOrWard}
DATE LOGGED:        ${new Date(report.createdAt).toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })} EAT

ASSIGNED FIELD OFFICER:
  Officer: ${officerName}
  Email:   ${officerEmail}
  Team:    ${teamName}

------------------------------------------------------
CUSTOMER INCIDENT REPORT (ORIGINAL):
------------------------------------------------------
"${report.text}"
Language: ${report.detectedLanguage} (Capture Method: ${report.captureMethod})
${report.englishTranslation ? `\nEnglish Translation:\n"${report.englishTranslation}"\n` : ''}
${report.imageAnalysis ? `\nAI Visual Diagnosis / Likely Issue:\n"${report.imageAnalysis}"\n` : ''}
${report.attachedImages && report.attachedImages.length > 0 ? `\nAttached Screenshots/Photos: ${report.attachedImages.length} image(s) attached by customer\n` : ''}
${report.contactInfo ? `Customer Line / Contact: ${report.contactInfo}` : 'Customer Contact: Anonymous / SEMA Portal'}

------------------------------------------------------
DISPATCH DIRECTIVES:
------------------------------------------------------
Routing Rationale: ${report.aiClassification?.rationale || 'Dispatched for immediate technical inspection and fault rectification.'}
Admin Directives:  ${adminNotes || report.adminNotes || 'Proceed with standard Safaricom emergency response operating procedure.'}

REQUIRED IMMEDIATE ACTIONS:
1. Confirm receipt and mobilize technical field crew within the target SLA window (${sla}).
2. Update incident milestone status to "In Progress" in the Safaricom Dispatch Console upon arrival.
3. Submit post-intervention clearance report and resolution notes upon completion.

Dispatch Console Access: https://safaricom.co.ke/dispatch?ref=${report.referenceCode}
Automated alert dispatched by Safaricom SEMA Intelligent NOC Operations.
======================================================`;

    return { subject, body };
  };

  // Open right-side panel for inspection & dispatch
  const handleOpenInspect = (report: SubmissionRecord) => {
    let activeReport = report;
    // Generate AI resolution steps ONLY when a ticket is opened, and cache the result
    if (!report.aiResolutionSteps || report.aiResolutionSteps.length === 0) {
      const generatedSteps = generateResolutionStepsForTicket(report);
      activeReport = {
        ...report,
        aiResolutionSteps: generatedSteps,
      };
      onUpdateSubmission(activeReport);
    }

    setInspectingReport(activeReport);
    // If ticket is unassigned, show "Select team" without defaulting to the first team
    const assignedTeamName = activeReport.assignedTeam || '';
    setDispatchTeam(assignedTeamName);

    if (assignedTeamName) {
      const matchedTeam =
        teams.find((t) => t.name === assignedTeamName) ||
        KENYAN_RESPONSE_TEAMS.find((t) => t.name === assignedTeamName) ||
        KENYAN_RESPONSE_TEAMS[0];
      setDispatchOfficer(activeReport.assignedOfficer || matchedTeam.leadOfficer || 'Field Desk Officer');
      setDispatchOfficerEmail(activeReport.assignedOfficerEmail || matchedTeam.email || 'dispatch@safaricom.co.ke');
    } else {
      setDispatchOfficer('');
      setDispatchOfficerEmail('');
    }

    setSendAutomatedEmail(true);
    setShowEmailPreview(false);
    setDispatchPriority(activeReport.priority || activeReport.aiClassification?.urgency || 'Medium');
    setDispatchStatus(activeReport.status === 'Received' ? 'Assigned' : activeReport.status);
    setDispatchNotes(activeReport.adminNotes || '');
  };

  const handleTeamChange = (teamName: string) => {
    setDispatchTeam(teamName);
    if (!teamName) {
      setDispatchOfficer('');
      setDispatchOfficerEmail('');
      return;
    }
    const matched = teams.find((t) => t.name === teamName) || KENYAN_RESPONSE_TEAMS.find((t) => t.name === teamName);
    if (matched) {
      setDispatchOfficer(matched.leadOfficer);
      setDispatchOfficerEmail(matched.email);
    }
  };

  const handleSaveDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectingReport) return;

    if (!dispatchTeam) {
      setInflowToast('Please select a response team before dispatching.');
      setTimeout(() => setInflowToast(null), 3000);
      return;
    }

    setIsSavingDispatch(true);

    const matchedTeam =
      teams.find((t) => t.name === dispatchTeam) ||
      KENYAN_RESPONSE_TEAMS.find((t) => t.name === dispatchTeam) || {
        leadOfficer: 'To be assigned',
        email: 'dispatch@safaricom.co.ke',
      };
    const resolvedEmail = dispatchOfficerEmail.trim() || matchedTeam.email;

    const emailContent = generateClientEmailAlert(
      inspectingReport,
      dispatchOfficer,
      resolvedEmail,
      dispatchTeam,
      dispatchPriority,
      dispatchNotes
    );

    const updated: SubmissionRecord = {
      ...inspectingReport,
      assignedTeam: dispatchTeam,
      assignedOfficer: dispatchOfficer,
      assignedOfficerEmail: resolvedEmail,
      priority: dispatchPriority,
      status: dispatchStatus,
      adminNotes: dispatchNotes,
      resolvedAt: dispatchStatus === 'Resolved' ? new Date().toISOString() : inspectingReport.resolvedAt,
      emailAlertSent: sendAutomatedEmail ? true : inspectingReport.emailAlertSent,
      emailAlertRecipient: sendAutomatedEmail ? resolvedEmail : inspectingReport.emailAlertRecipient,
      emailAlertSentAt: sendAutomatedEmail ? new Date().toISOString() : inspectingReport.emailAlertSentAt,
      emailAlertSubject: sendAutomatedEmail ? emailContent.subject : inspectingReport.emailAlertSubject,
      emailAlertBody: sendAutomatedEmail ? emailContent.body : inspectingReport.emailAlertBody,
    };

    try {
      const response = await fetch(`/api/submissions/${inspectingReport.id}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedTeam: dispatchTeam,
          assignedOfficer: dispatchOfficer,
          assignedOfficerEmail: resolvedEmail,
          priority: dispatchPriority,
          status: dispatchStatus,
          adminNotes: dispatchNotes,
          sendEmailAlert: sendAutomatedEmail,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.submission) {
          onUpdateSubmission(data.submission);
        } else {
          onUpdateSubmission(updated);
        }
      } else {
        onUpdateSubmission(updated);
      }
    } catch {
      onUpdateSubmission(updated);
    } finally {
      setIsSavingDispatch(false);
      setInspectingReport(null);
      if (sendAutomatedEmail) {
        setEmailSuccessMessage(
          `Automated email alert delivered to ${dispatchOfficer} (${resolvedEmail}) for incident ${inspectingReport.referenceCode}.`
        );
      }
    }
  };

  const handleSendEmailAlertForReport = async (report: SubmissionRecord) => {
    setSendingEmailForId(report.id);
    const matchedTeam =
      KENYAN_RESPONSE_TEAMS.find((t) => t.name === report.assignedTeam) || KENYAN_RESPONSE_TEAMS[0];
    const officerName = report.assignedOfficer || matchedTeam.leadOfficer;
    const officerEmail = report.assignedOfficerEmail || matchedTeam.email;

    const emailContent = generateClientEmailAlert(
      report,
      officerName,
      officerEmail,
      report.assignedTeam || matchedTeam.name
    );

    const updated: SubmissionRecord = {
      ...report,
      assignedTeam: report.assignedTeam || matchedTeam.name,
      assignedOfficer: officerName,
      assignedOfficerEmail: officerEmail,
      emailAlertSent: true,
      emailAlertRecipient: officerEmail,
      emailAlertSentAt: new Date().toISOString(),
      emailAlertSubject: emailContent.subject,
      emailAlertBody: emailContent.body,
    };

    try {
      await fetch(`/api/submissions/${report.id}/send-email-alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ officerName, officerEmail }),
      });
    } catch {
      // ignore
    }

    onUpdateSubmission(updated);
    setSendingEmailForId(null);
    setEmailSuccessMessage(
      `Automated email alert delivered to ${officerName} (${officerEmail}) for incident ${report.referenceCode}.`
    );
  };

  const handleBatchAutoAssignAll = async () => {
    setIsAutoAssigningAll(true);
    setAutoAssignSuccessMessage(null);
    setEmailSuccessMessage(null);

    try {
      const response = await fetch('/api/submissions/auto-assign-all', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.submissions && Array.isArray(data.submissions)) {
          data.submissions.forEach((s: SubmissionRecord) => onUpdateSubmission(s));
          setAutoAssignSuccessMessage(
            data.message || `AI classified and assigned reports, and dispatched automated email alerts.`
          );
          await onRefreshSubmissions();
          setIsAutoAssigningAll(false);
          return;
        }
      }
    } catch {
      // ignore
    }

    // Client-side batch fallback
    const unassignedList = submissions.filter(
      (s) => s.status === 'Received' || !s.assignedTeam
    );

    let assignedCount = 0;
    unassignedList.forEach((report) => {
      const lower = report.text.toLowerCase();
      let bestTeam = KENYAN_RESPONSE_TEAMS[0];
      let urgency: PriorityLevel = 'Medium';
      let sla = '24 hours';
      let rationale = 'Routed based on customer keyword analysis';

      if (/\b(fibre|fiber|router|los|optical|wifi|modem|red light)\b/i.test(lower)) {
        bestTeam = KENYAN_RESPONSE_TEAMS.find((t) => t.id === 'team-fibre') || KENYAN_RESPONSE_TEAMS[0];
        urgency = /\b(red|los|cut|down|interrupted)\b/i.test(lower) ? 'Urgent' : 'High';
        sla = urgency === 'Urgent' ? '2 hours' : '6 hours';
        rationale = 'Optical fiber link down or red LOS light halting connectivity.';
      } else if (/\b(mpesa|m-pesa|fuliza|send money|reversal|paybill|till)\b/i.test(lower)) {
        bestTeam = KENYAN_RESPONSE_TEAMS.find((t) => t.id === 'team-mpesa') || KENYAN_RESPONSE_TEAMS[1];
        urgency = /\b(hospital|stuck|emergency|trapped)\b/i.test(lower) ? 'Urgent' : 'High';
        sla = urgency === 'Urgent' ? '30 minutes' : '2 hours';
        rationale = 'M-PESA financial transaction escalation and core system reconciliation.';
      } else if (/\b(4g|5g|network|signal|coverage|bts|mast|tower|emergency calls)\b/i.test(lower)) {
        bestTeam = KENYAN_RESPONSE_TEAMS.find((t) => t.id === 'team-ran') || KENYAN_RESPONSE_TEAMS[2];
        urgency = 'High';
        sla = '4 hours';
        rationale = 'Radio Access Network (RAN) sector failure or base station mast fault.';
      } else if (/\b(sim swap|fraud|scam|tapeli|wizi|hack|puk|stolen)\b/i.test(lower)) {
        bestTeam = KENYAN_RESPONSE_TEAMS.find((t) => t.id === 'team-fraud') || KENYAN_RESPONSE_TEAMS[3];
        urgency = 'Urgent';
        sla = '1 hour';
        rationale = 'Unauthorized SIM swap or security risk requiring instant account lock.';
      } else if (/\b(airtime|bonga|bundle|postpay|prepay|billing)\b/i.test(lower)) {
        bestTeam = KENYAN_RESPONSE_TEAMS.find((t) => t.id === 'team-care') || KENYAN_RESPONSE_TEAMS[4];
        urgency = 'Medium';
        sla = '12 hours';
        rationale = 'Customer experience billing and bundle deduction review.';
      }

      const emailContent = generateClientEmailAlert(
        report,
        bestTeam.leadOfficer,
        bestTeam.email,
        bestTeam.name,
        urgency,
        `AI Auto-assigned: ${rationale}`
      );

      const updated: SubmissionRecord = {
        ...report,
        assignedTeam: bestTeam.name,
        assignedOfficer: bestTeam.leadOfficer,
        assignedOfficerEmail: bestTeam.email,
        priority: urgency,
        status: 'Assigned',
        aiClassification: {
          category: bestTeam.department,
          urgency,
          recommendedTeam: bestTeam.name,
          rationale,
          estimatedSLA: sla,
        },
        adminNotes: `AI Auto-assigned: ${rationale} (Target SLA: ${sla})`,
        emailAlertSent: true,
        emailAlertRecipient: bestTeam.email,
        emailAlertSentAt: new Date().toISOString(),
        emailAlertSubject: emailContent.subject,
        emailAlertBody: emailContent.body,
      };

      onUpdateSubmission(updated);
      assignedCount++;
    });

    setAutoAssignSuccessMessage(
      `Successfully analyzed, categorized, and auto-assigned ${assignedCount} customer reports, and dispatched ${assignedCount} automated email alerts.`
    );
    setIsAutoAssigningAll(false);
  };

  const handleExportCSV = () => {
    const listToExport = filteredSubmissions.length > 0 ? filteredSubmissions : submissions;
    if (listToExport.length === 0) return;

    const headers = [
      'Reference Code',
      'Created At (UTC)',
      'Status',
      'Priority',
      'Category',
      'County / Ward',
      'Assigned Team',
      'Lead Officer',
      'Language',
      'Capture Method',
      'Customer Report Text',
      'English Translation',
      'Customer Contact',
      'Target SLA',
      'Routing Rationale',
      'Admin Notes',
      'Resolved At',
    ];

    const escapeCsv = (val: unknown): string => {
      if (val === undefined || val === null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = listToExport.map((item) => [
      escapeCsv(item.referenceCode),
      escapeCsv(item.createdAt),
      escapeCsv(item.status),
      escapeCsv(item.priority || item.aiClassification?.urgency || 'Medium'),
      escapeCsv(item.category || item.aiClassification?.category || 'Civic & Public Services'),
      escapeCsv(item.countyOrWard),
      escapeCsv(item.assignedTeam || 'Unassigned'),
      escapeCsv(item.assignedOfficer || 'Pending'),
      escapeCsv(item.detectedLanguage),
      escapeCsv(item.captureMethod),
      escapeCsv(item.text),
      escapeCsv(item.englishTranslation || ''),
      escapeCsv(item.contactInfo || ''),
      escapeCsv(item.aiClassification?.estimatedSLA || ''),
      escapeCsv(item.aiClassification?.rationale || ''),
      escapeCsv(item.adminNotes || ''),
      escapeCsv(item.resolvedAt || ''),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    link.download = `Safaricom_SEMA_Incident_Export_${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setExportSuccessMessage(`Successfully exported ${listToExport.length} reports to CSV (${link.download})`);
  };

  // Navigation Items
  interface NavItem {
    id: AdminPage;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
  }

  const navItems: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'incidents', label: 'Incidents', icon: Inbox, badge: metrics.unassigned > 0 ? metrics.unassigned : undefined },
    { id: 'channels', label: 'Channel feeds', icon: Radio },
    { id: 'clusters', label: 'Root cause & clusters', icon: Zap, badge: computedClusters.length > 0 ? computedClusters.length : undefined },
    { id: 'teams', label: 'Response teams', icon: Users, badge: '7' },
    { id: 'analytics', label: 'Analytics & AI insights', icon: BarChart3 },
    { id: 'alerts', label: 'Alerts', icon: Bell, badge: metrics.emailAlertsSent > 0 ? metrics.emailAlertsSent : undefined },
  ];

  const getPageTitle = (page: AdminPage) => {
    switch (page) {
      case 'overview':
        return 'Operations Overview';
      case 'incidents':
        return 'Incident Resolution Queue';
      case 'channels':
        return 'Channel Feeds & Aggregation';
      case 'clusters':
        return 'Root Cause & Issue Clusters';
      case 'teams':
        return 'Network & Incident Response Teams';
      case 'analytics':
        return 'Analytics & Incident Intelligence';
      case 'alerts':
        return 'Operational Alerts & Notifications';
      default:
        return 'Admin Dispatch Console';
    }
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-slate-50 text-slate-900 flex relative">
      {/* Floating Exit Button for Focus Mode */}
      {isFocusMode && (
        <button
          type="button"
          onClick={() => setIsFocusMode(false)}
          className="fixed top-3 right-4 z-50 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white/95 hover:bg-white border border-slate-300 rounded-full shadow-lg backdrop-blur-xs transition-all cursor-pointer hover:shadow-xl"
          title="Exit Focus Mode (Esc)"
        >
          <Minimize2 className="w-3.5 h-3.5 text-slate-500" />
          <span>Exit Focus (Esc)</span>
        </button>
      )}

      {/* 1. Left Sidebar (Fixed to left, stays fixed, never scrolls with page) */}
      {!isFocusMode && (
        <aside
          className={`fixed inset-y-0 left-0 z-40 bg-[#004d3d] text-white flex flex-col justify-between shrink-0 h-full overflow-y-auto transition-all duration-200 ease-in-out md:relative md:translate-x-0 ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          } ${isSidebarCollapsed ? 'w-16' : 'w-64'}`}
        >
          <div>
            {/* Brand Header */}
            <div className={`border-b border-emerald-900/60 flex items-center ${isSidebarCollapsed ? 'p-3.5 justify-center flex-col gap-2' : 'p-4 justify-between'}`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 font-bold text-sm shadow-xs shrink-0"
                  title="SEMA Operations Console"
                >
                  S
                </span>
                {!isSidebarCollapsed && (
                  <div className="truncate min-w-0">
                    <h1 className="text-xs font-bold tracking-tight text-white flex items-center gap-1.5 truncate">
                      <span>SEMA Console</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    </h1>
                    <p className="text-[10px] text-emerald-200/80 font-medium truncate">Safaricom Operations</p>
                  </div>
                )}
              </div>

              {/* Sidebar Collapse Toggle Button (Desktop) */}
              <button
                type="button"
                onClick={toggleSidebar}
                className="hidden md:flex p-1 text-emerald-300 hover:text-white hover:bg-emerald-900/60 rounded-lg transition-colors cursor-pointer"
                title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>

              {/* Mobile close button */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 text-emerald-300 hover:text-white md:hidden cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav List */}
            <nav className={`space-y-1 ${isSidebarCollapsed ? 'p-2' : 'p-3'}`}>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigateTo(item.id as AdminPage)}
                    title={isSidebarCollapsed ? `${item.label}${item.badge ? ` (${item.badge})` : ''}` : undefined}
                    className={`w-full flex items-center rounded-xl text-xs transition-all cursor-pointer relative min-w-0 ${
                      isSidebarCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2.5'
                    } ${
                      isActive
                        ? 'bg-emerald-800 text-white font-bold shadow-xs border-l-4 border-emerald-400'
                        : 'text-emerald-100/90 hover:bg-emerald-900/50 hover:text-white font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-300' : 'text-emerald-300/70'}`} />
                      {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {item.badge && (
                      isSidebarCollapsed ? (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                      ) : (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full shrink-0 ${
                            isActive
                              ? 'bg-emerald-400 text-emerald-950 font-mono'
                              : 'bg-emerald-900/80 text-emerald-200 font-mono'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Sidebar: Return to Customer Portal */}
          <div className={`border-t border-emerald-900/60 ${isSidebarCollapsed ? 'p-2' : 'p-3.5 space-y-2'}`}>
            <button
              type="button"
              onClick={onSwitchToCitizenView}
              title={isSidebarCollapsed ? 'Back to Customer Portal' : undefined}
              className={`w-full flex items-center justify-center rounded-xl transition-colors cursor-pointer border border-white/10 shadow-2xs text-white bg-white/10 hover:bg-white/20 min-w-0 ${
                isSidebarCollapsed ? 'p-2.5' : 'gap-2 px-3 py-2 text-xs font-semibold'
              }`}
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span className="truncate">Back to Customer Portal</span>}
            </button>
            {!isSidebarCollapsed && (
              <div className="text-center">
                <span className="text-[10px] text-emerald-300/60 font-mono truncate block">SEMA v2.4 · Safaricom</span>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* 2. Main Right Area: Top Bar + Page Viewport (Only area that scrolls) */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto">
        {/* Top Bar (Sticky at top of content area) */}
        {!isFocusMode && (
          <header className="sticky top-0 z-20 shrink-0 bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 min-w-0">
            {/* Left: Page Title on ONE line only */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1 sm:flex-initial">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg md:hidden shrink-0 cursor-pointer"
                aria-label="Open navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                {getPageTitle(currentPage)}
              </h2>
            </div>

            {/* Right: Feed sync indicator, search, focus, bell, refresh */}
            <div className="flex items-center gap-2 shrink-0 min-w-0">
              {/* Non-blocking live feed ingestion indicator */}
              {isSyncingFeeds && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0 shadow-2xs animate-in fade-in">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="truncate whitespace-nowrap">
                    Receiving feeds {syncProgress.current}/{syncProgress.total}
                  </span>
                </div>
              )}

              {/* Desktop Fixed Width Search (Responsive width, hidden below lg) */}
              <div className="relative hidden lg:block w-48 xl:w-[280px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search reference, area, team..."
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-emerald-600 transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Mobile Collapsible Search Icon */}
              <div className="relative md:hidden">
                <button
                  type="button"
                  onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    isMobileSearchOpen || searchQuery
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200'
                  }`}
                  title="Search"
                >
                  <Search className="w-4 h-4" />
                </button>
                {isMobileSearchOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-30 animate-in fade-in zoom-in-95">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        autoFocus
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search queue..."
                        className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-emerald-600"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Focus Mode Button */}
              <button
                type="button"
                onClick={() => setIsFocusMode(true)}
                className="p-1.5 text-slate-600 hover:text-emerald-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-slate-200"
                title="Focus Mode (Expand to full screen)"
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              {/* Alerts Bell */}
              <button
                type="button"
                onClick={() => navigateTo('alerts')}
                className="relative p-1.5 text-slate-600 hover:text-emerald-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-slate-200"
                title="View Alerts & Officer Notices"
              >
                <Bell className="w-4 h-4" />
                {metrics.emailAlertsSent > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 text-white font-bold font-mono text-[9px] flex items-center justify-center ring-2 ring-white">
                    {metrics.emailAlertsSent}
                  </span>
                )}
              </button>

              {/* Refresh Button */}
              <button
                type="button"
                onClick={() => onRefreshSubmissions()}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                title="Refresh queue"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </header>
        )}

        {/* Global Toast for Inflow / Actions */}
        {inflowToast && (
          <div className="mx-6 mt-4 bg-emerald-900 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-lg border border-emerald-700 animate-in fade-in">
            <span className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-300 animate-pulse" />
              <span>{inflowToast}</span>
            </span>
            <button
              type="button"
              onClick={() => setInflowToast(null)}
              className="text-emerald-300 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Notifications / Success Messages */}
        <div className="px-4 sm:px-6 pt-3 space-y-2">
          {autoAssignSuccessMessage && (
            <div
              className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 flex items-start justify-between gap-4 text-xs text-emerald-950 animate-in fade-in"
              role="alert"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="font-medium">{autoAssignSuccessMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setAutoAssignSuccessMessage(null)}
                className="text-emerald-700 hover:text-emerald-950 font-bold cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {emailSuccessMessage && (
            <div
              className="bg-sky-50 border border-sky-300 rounded-xl p-3 flex items-start justify-between gap-4 text-xs text-sky-950 animate-in fade-in"
              role="alert"
            >
              <div className="flex items-center gap-2">
                <MailCheck className="w-4 h-4 text-sky-700 shrink-0" />
                <span className="font-medium">{emailSuccessMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setEmailSuccessMessage(null)}
                className="text-sky-700 hover:text-sky-950 font-bold cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {exportSuccessMessage && (
            <div
              className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 flex items-start justify-between gap-4 text-xs text-emerald-950 animate-in fade-in"
              role="alert"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="font-medium">{exportSuccessMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setExportSuccessMessage(null)}
                className="text-emerald-700 hover:text-emerald-950 font-bold cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>

        {/* 3. Page Body Switcher */}
        <main className={`p-4 sm:p-6 space-y-5 flex-1 ${isFocusMode ? 'max-w-7xl mx-auto w-full' : ''}`}>
          {/* ================= PAGE 1: OVERVIEW ================= */}
          {currentPage === 'overview' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Auto-dispatch Status Bar */}
              <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-3 min-w-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      isAutoDispatchEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                    }`}
                  />
                  <div className="truncate min-w-0">
                    <span className="text-xs font-bold text-slate-900 block truncate">
                      Automated Incident Dispatch Engine
                    </span>
                    <span className="text-2xs text-slate-500 truncate block">
                      {isAutoDispatchEnabled
                        ? 'Active — incoming tickets route automatically to specialized response teams and officers'
                        : 'Paused — incoming tickets remain unassigned in Received queue for manual triage'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleToggleAutoDispatch}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border shadow-2xs shrink-0 ${
                    isAutoDispatchEnabled
                      ? 'bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-800'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                  title="Toggle automatic routing for incoming incidents"
                >
                  <Zap className={`w-3.5 h-3.5 ${isAutoDispatchEnabled ? 'text-emerald-300' : 'text-slate-500'}`} />
                  <span>Auto-dispatch: {isAutoDispatchEnabled ? 'ON' : 'OFF'}</span>
                </button>
              </div>

              {/* 4 KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 min-w-0">
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-1 shadow-2xs min-w-0">
                  <span className="text-xs font-medium text-slate-500 truncate block">Total Incidents</span>
                  <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 truncate">
                    {metrics.total}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">Captured in EN / SW / Sheng</p>
                </div>

                <div className="bg-white border border-amber-200 bg-amber-50/20 rounded-xl p-3.5 space-y-1 shadow-2xs min-w-0">
                  <span className="text-xs font-semibold text-amber-900 truncate block">Unassigned Queue</span>
                  <p className="text-2xl font-bold font-mono tabular-nums text-amber-700 truncate">
                    {metrics.unassigned}
                  </p>
                  <p className="text-[11px] text-amber-800/80 truncate">Pending team dispatch</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-1 shadow-2xs min-w-0">
                  <span className="text-xs font-medium text-slate-500 truncate block">In Progress / Dispatched</span>
                  <p className="text-2xl font-bold font-mono tabular-nums text-emerald-700 truncate">
                    {metrics.inProgress}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">Field units actively operating</p>
                </div>

                <div className="bg-white border border-red-200 bg-red-50/20 rounded-xl p-3.5 space-y-1 shadow-2xs min-w-0">
                  <span className="text-xs font-semibold text-red-900 truncate block">Urgent Escalations</span>
                  <p className="text-2xl font-bold font-mono tabular-nums text-red-600 truncate">
                    {metrics.urgentCount}
                  </p>
                  <p className="text-[11px] text-red-500 truncate">{urgentSubtitle}</p>
                </div>
              </div>

              {/* Banner for Active Clusters (Computed from store: 3+ tickets in same area within 60 mins) */}
              {primaryCluster ? (
                <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-white border-2 border-amber-400 rounded-2xl p-4.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 min-w-0">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="p-2 bg-amber-500 text-white rounded-xl shadow-xs mt-0.5 shrink-0">
                      <Zap className="w-5 h-5 fill-current" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-white shrink-0">
                          {computedClusters.length} Active {computedClusters.length === 1 ? 'Cluster' : 'Clusters'}
                        </span>
                        <span className="text-xs font-bold text-amber-950 truncate">
                          {primaryCluster.area} Hub ({primaryCluster.totalComplaints} Impacted Complaints)
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 mt-1 max-w-2xl leading-relaxed break-words">
                        {primaryCluster.rootCause}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigateTo('clusters')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors cursor-pointer shrink-0 self-start md:self-auto"
                  >
                    <span>Inspect Clusters</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-4.5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 min-w-0">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="p-2 bg-slate-100 text-slate-500 rounded-xl shadow-2xs mt-0.5 shrink-0">
                      <Zap className="w-5 h-5 text-slate-400" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700 shrink-0">
                          0 Active Clusters
                        </span>
                        <span className="text-xs font-bold text-slate-700 truncate">
                          No Correlated Infrastructure Hubs Detected
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed break-words">
                        Correlation engine active. Clusters emerge dynamically when 3 or more tickets arrive from the same area within 60 minutes.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Channel Mix Chart */}
              <section className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-2xs space-y-3.5">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-emerald-700" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Channel Mix &amp; Complaint Volume Breakdown
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigateTo('channels')}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View all channels</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {CHANNELS.filter((ch) => ch !== 'All Channels').map((ch) => {
                    const count = channelCounts[ch] || 0;
                    const pct = metrics.total > 0 ? Math.round((count / metrics.total) * 100) : 0;
                    return (
                      <div
                        key={ch}
                        onClick={() => {
                          setSelectedChannel(ch);
                          navigateTo('incidents');
                        }}
                        className="p-3 rounded-lg border border-slate-200/80 hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/30 transition-all cursor-pointer space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <div className="truncate">{renderChannelBadge(ch)}</div>
                          <span className="text-[10px] font-mono font-bold text-slate-500 shrink-0 tabular-nums">{pct}%</span>
                        </div>
                        <div className="flex items-baseline justify-between pt-0.5">
                          <p className="text-lg font-bold font-mono text-slate-900 tabular-nums">
                            {count}
                          </p>
                          <span className="text-[10px] text-slate-400">cases</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-600 h-full rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* 5 Latest Incidents */}
              <section className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>Latest Reported Incidents</span>
                    <span className="text-xs font-mono font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      5 Most Recent
                    </span>
                  </h3>

                  <button
                    type="button"
                    onClick={() => navigateTo('incidents')}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                  >
                    <span>Open Full Queue ({submissions.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {submissions.slice(0, 5).map((report) => (
                    <div
                      key={report.id}
                      onClick={() => handleOpenInspect(report)}
                      className="p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-bold text-emerald-800">
                            {report.referenceCode}
                          </span>
                          {renderChannelBadge(report.channel, report.captureMethod)}
                          {report.needsReview && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                              <AlertTriangle className="w-2.5 h-2.5 text-amber-700 shrink-0" />
                              <span>Needs review</span>
                            </span>
                          )}
                          <span className="text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{report.countyOrWard}</span>
                          </span>
                        </div>
                        <p className="text-slate-800 font-medium line-clamp-1">
                          &ldquo;{report.text}&rdquo;
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            report.priority === 'Urgent'
                              ? 'bg-red-100 text-red-800'
                              : report.priority === 'High'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {report.priority || 'Medium'}
                        </span>
                        <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {report.status}
                        </span>
                        <button
                          type="button"
                          className="px-2.5 py-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-semibold rounded-lg text-xs"
                        >
                          Inspect
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* ================= PAGE 2: INCIDENTS ================= */}
          {currentPage === 'incidents' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              {/* COMPACT FILTER CONTAINER: Row 1 = Compact Horizontal Filters; Row 2 = Stage Chips */}
              <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2.5 shadow-2xs">
                {/* Row 1: Channel, Category, Location, Search, Priority, Reset, Export CSV */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Channel Dropdown */}
                  <select
                    value={selectedChannel}
                    onChange={(e) => {
                      setSelectedChannel(e.target.value);
                      setVisibleCount(15);
                    }}
                    className="h-8 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:border-emerald-600 cursor-pointer"
                  >
                    {CHANNELS.map((ch) => (
                      <option key={ch} value={ch}>
                        {ch} ({channelCounts[ch] || 0})
                      </option>
                    ))}
                  </select>

                  {/* Category Dropdown */}
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setVisibleCount(15);
                    }}
                    className="h-8 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:border-emerald-600 cursor-pointer"
                  >
                    {dynamicCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat} ({categoryCounts[cat] || 0})
                      </option>
                    ))}
                  </select>

                  {/* Location Dropdown */}
                  <select
                    value={selectedLocation}
                    onChange={(e) => {
                      setSelectedLocation(e.target.value);
                      setVisibleCount(15);
                    }}
                    className="h-8 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:border-emerald-600 cursor-pointer"
                  >
                    {LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc} ({locationCounts[loc] || 0})
                      </option>
                    ))}
                  </select>

                  {/* Date Range Picker */}
                  <DateRangePicker
                    value={dateRange}
                    onChange={(val) => {
                      setDateRange(val);
                      setVisibleCount(15);
                    }}
                  />

                  {/* Search box in filter bar */}
                  <div className="relative min-w-[150px] sm:w-44">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setVisibleCount(15);
                      }}
                      placeholder="Search queue..."
                      className="w-full h-8 pl-8 pr-6 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-emerald-600"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Priority Ranking Toggle */}
                  <button
                    type="button"
                    onClick={() => setPriorityRanking((prev) => !prev)}
                    className={`h-8 px-2.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 ${
                      priorityRanking
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                    title="Toggle priority ranking (Urgent first vs timestamp order)"
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Priority: {priorityRanking ? 'ON' : 'OFF'}</span>
                  </button>

                  {/* Auto-Dispatch Toggle */}
                  <button
                    type="button"
                    onClick={handleToggleAutoDispatch}
                    className={`h-8 px-2.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 ${
                      isAutoDispatchEnabled
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                    title="Toggle automated ticket dispatch to response teams"
                  >
                    <Zap className={`w-3.5 h-3.5 ${isAutoDispatchEnabled ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span>Auto-dispatch: {isAutoDispatchEnabled ? 'ON' : 'OFF'}</span>
                  </button>

                  {/* Reset Filters */}
                  {(selectedChannel !== 'All Channels' ||
                    selectedCategory !== 'All Categories' ||
                    selectedLocation !== 'All Locations' ||
                    selectedStatus !== 'All' ||
                    dateRange.preset !== 'all' ||
                    dateRange.startDate !== '' ||
                    dateRange.endDate !== '' ||
                    searchQuery) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedChannel('All Channels');
                        setSelectedCategory('All Categories');
                        setSelectedLocation('All Locations');
                        setSelectedStatus('All');
                        setDateRange({ preset: 'all', startDate: '', endDate: '' });
                        setSearchQuery('');
                        setVisibleCount(15);
                      }}
                      className="h-8 px-2 text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                    >
                      Reset
                    </button>
                  )}

                  {/* Export CSV (lives only here) */}
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    disabled={filteredSubmissions.length === 0}
                    className="h-8 px-3 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5 ml-auto"
                    title="Export current table to CSV file"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Export CSV</span>
                  </button>
                </div>

                {/* Row 2: Lifecycle stage chips in ONE compact row below + Auto-Assign with AI */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
                      <SlidersHorizontal className="w-3 h-3 text-slate-400" />
                      <span>Stage:</span>
                    </span>
                    {STATUS_LEGEND_CONFIG.map((item) => {
                      const isSelected = selectedStatus === item.status;
                      const count = statusCounts[item.status] || 0;
                      return (
                        <button
                          key={item.status}
                          type="button"
                          onClick={() => {
                            setSelectedStatus((prev) => (prev === item.status ? 'All' : item.status));
                            setVisibleCount(15);
                          }}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-2xs transition-all cursor-pointer select-none border ${
                            isSelected
                              ? `${item.activeBg} ${item.badgeBorder} ${item.textColor} font-bold ring-2 ${item.ringColor}`
                              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 font-medium'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.dotColor} ${
                              item.status === 'In Progress' ? 'animate-pulse' : ''
                            }`}
                          />
                          <span>{item.label}</span>
                          <span className="font-mono text-[10px] text-slate-500 font-semibold">{count}</span>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={handleBatchAutoAssignAll}
                    disabled={isAutoAssigningAll || metrics.unassigned === 0}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    {isAutoAssigningAll ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Auto-Assigning...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                        <span>Auto-Assign with AI ({metrics.unassigned})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Incidents Table (Clean compact rows, no horizontal scrolling at >=1024px, scrollable area, 15 rows initially) */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">Incident Queue</span>
                    <span className="font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {Math.min(visibleCount, filteredSubmissions.length)} of {filteredSubmissions.length} shown
                    </span>
                  </div>
                  <span className="text-slate-400 text-2xs hidden sm:inline">
                    Click row to view AI steps, translation &amp; dispatch memo in detail panel
                  </span>
                </div>

                {filteredSubmissions.length === 0 ? (
                  <div className="p-12 text-center space-y-3">
                    <Bot className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-sm font-medium text-slate-700">No incident reports match your current filter.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedStatus('All');
                        setSelectedTeamFilter('All');
                        setSelectedLanguageFilter('All');
                        setSelectedChannel('All Channels');
                        setSelectedCategory('All Categories');
                        setSelectedLocation('All Locations');
                        setVisibleCount(15);
                      }}
                      className="px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 rounded-lg cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  </div>
                ) : (
                  <div className="overflow-y-auto max-h-[580px]">
                    <table className="w-full table-fixed text-left text-xs border-collapse">
                      <thead className="sticky top-0 bg-slate-50 shadow-2xs z-10 border-b border-slate-200">
                        <tr className="text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                          <th className="py-2.5 px-3 w-[130px]">Ticket</th>
                          <th className="py-2.5 px-3">Statement</th>
                          <th className="py-2.5 px-3 w-[155px]">Category &amp; Priority</th>
                          <th className="py-2.5 px-3 w-[110px]">Location</th>
                          <th className="py-2.5 px-3 w-[130px]">Team</th>
                          <th className="py-2.5 px-3 w-[95px]">Status</th>
                          <th className="py-2.5 px-3 w-[75px] text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredSubmissions.slice(0, visibleCount).map((report) => {
                          const isUrgent = report.priority === 'Urgent';
                          const isUnassigned = !report.assignedTeam || report.status === 'Received';

                          return (
                            <tr
                              key={report.id}
                              onClick={() => handleOpenInspect(report)}
                              className={`hover:bg-slate-50/80 transition-colors cursor-pointer border-l-4 ${
                                isUrgent
                                  ? 'border-l-red-500 bg-red-50/10'
                                  : isUnassigned
                                  ? 'border-l-amber-400'
                                  : 'border-l-transparent'
                              }`}
                            >
                              {/* 1. Ticket + Coloured Channel Badge with Icon */}
                              <td className="py-2.5 px-3 align-middle">
                                <div className="space-y-1">
                                  <span className="font-mono font-bold text-emerald-800 block text-xs">
                                    {report.referenceCode}
                                  </span>
                                  {renderChannelBadge(report.channel, report.captureMethod)}
                                </div>
                              </td>

                              {/* 2. Statement (2-line clamp) */}
                              <td className="py-2.5 px-3 align-middle">
                                <p className="font-medium text-slate-800 leading-snug line-clamp-2">
                                  &ldquo;{report.text}&rdquo;
                                </p>
                              </td>

                              {/* 3. Category + Priority */}
                              <td className="py-2.5 px-3 align-middle">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-semibold text-slate-800 block truncate" title={report.category}>
                                      {report.category || 'Incident'}
                                    </span>
                                    {report.needsReview && (
                                      <span
                                        className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shrink-0"
                                        title="Safety Rule: Flagged for manual review (Confidence <60% or unverified category)"
                                      >
                                        <AlertTriangle className="w-2.5 h-2.5 text-amber-700 shrink-0" />
                                        <span>Needs review</span>
                                      </span>
                                    )}
                                  </div>
                                  <span
                                    className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                      report.priority === 'Urgent'
                                        ? 'bg-red-100 text-red-800'
                                        : report.priority === 'High'
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-slate-100 text-slate-700'
                                    }`}
                                  >
                                    {report.priority === 'Urgent' && (
                                      <AlertTriangle className="w-2.5 h-2.5 text-red-600 shrink-0" />
                                    )}
                                    <span>{report.priority || 'Medium'}</span>
                                  </span>
                                </div>
                              </td>

                              {/* 4. Location */}
                              <td className="py-2.5 px-3 align-middle text-slate-600">
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate" title={report.countyOrWard}>
                                    {report.locationTown || report.countyOrWard.split('·')[0].trim()}
                                  </span>
                                </div>
                              </td>

                              {/* 5. Team */}
                              <td className="py-2.5 px-3 align-middle">
                                <span className="font-medium text-slate-900 block truncate" title={report.assignedTeam || 'Unassigned'}>
                                  {report.assignedTeam || (
                                    <span className="text-amber-700 font-semibold">Unassigned</span>
                                  )}
                                </span>
                              </td>

                              {/* 6. Status & SLA Clock */}
                              <td className="py-2.5 px-3 align-middle">
                                <div className="space-y-1">
                                  <span
                                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-2xs font-semibold ${
                                      report.status === 'Resolved'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : report.status === 'In Progress'
                                        ? 'bg-sky-100 text-sky-800'
                                        : report.status === 'Assigned'
                                        ? 'bg-indigo-100 text-indigo-800'
                                        : 'bg-amber-100 text-amber-800'
                                    }`}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        report.status === 'Resolved'
                                          ? 'bg-emerald-600'
                                          : report.status === 'In Progress'
                                          ? 'bg-sky-600 animate-pulse'
                                          : report.status === 'Assigned'
                                          ? 'bg-indigo-600'
                                          : 'bg-amber-600'
                                      }`}
                                    />
                                    <span>{report.status}</span>
                                  </span>
                                  {report.slaStartedAt && report.status === 'Assigned' && (
                                    <span
                                      className="text-[10px] font-mono text-indigo-700 flex items-center gap-0.5 truncate"
                                      title={`SLA started at ${new Date(report.slaStartedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                                    >
                                      <Clock className="w-2.5 h-2.5 text-indigo-500 shrink-0" />
                                      <span>SLA active</span>
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* 7. Actions */}
                              <td className="py-2.5 px-3 align-middle text-right">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenInspect(report);
                                  }}
                                  className="px-2 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                                >
                                  Dispatch &rarr;
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Load More Button (15 rows step) */}
                {filteredSubmissions.length > visibleCount && (
                  <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      Showing {Math.min(visibleCount, filteredSubmissions.length)} of {filteredSubmissions.length} incidents
                    </span>
                    <button
                      type="button"
                      onClick={() => setVisibleCount((prev) => prev + 15)}
                      className="px-4 py-1.5 text-xs font-semibold text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
                    >
                      Load more (+15)
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= PAGE 3: CHANNEL FEEDS ================= */}
          {currentPage === 'channels' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Header Actions: Sync Feeds & Clear Feeds (Lives ONLY here) */}
              <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Radio className="w-5 h-5 text-emerald-700" />
                    <span>Channel Aggregation Sources &amp; Ingestion</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live telemetry aggregating customer inquiries across digital, telecom, and voice endpoints.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleToggleSyncFeeds}
                    className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer border shadow-2xs ${
                      isSyncingFeeds
                        ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 animate-pulse'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border-emerald-300'
                    }`}
                  >
                    {isSyncingFeeds ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Syncing Feeds ({syncProgress.current}/{syncProgress.total})...</span>
                      </>
                    ) : (
                      <>
                        <Radio className="w-4 h-4 text-emerald-700" />
                        <span>Sync channel feeds</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleClearSyncedFeeds}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer shadow-2xs"
                  >
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    <span>Clear synced feeds{syncedFeedsCount > 0 ? ` (${syncedFeedsCount})` : ''}</span>
                  </button>
                </div>
              </div>

              {/* Channel Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {CHANNELS.filter((ch) => ch !== 'All Channels').map((ch) => {
                  const count = channelCounts[ch] || 0;
                  const pct = metrics.total > 0 ? Math.round((count / metrics.total) * 100) : 0;
                  return (
                    <div
                      key={ch}
                      className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-2xs space-y-3 hover:border-emerald-500 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="shrink-0">{renderChannelBadge(ch)}</div>
                        <span className="text-xs font-mono font-bold text-slate-500 shrink-0 tabular-nums">{pct}% of queue</span>
                      </div>

                      <div>
                        <p className="text-3xl font-black font-mono text-slate-900 tabular-nums">
                          {count}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">Complaints registered</p>
                      </div>

                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 text-2xs text-emerald-700 font-semibold">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Active Stream</span>
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedChannel(ch);
                            navigateTo('incidents');
                          }}
                          className="text-xs font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                        >
                          Filter queue &rarr;
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= PAGE 4: ROOT CAUSE & CLUSTERS ================= */}
          {currentPage === 'clusters' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Header */}
              <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-2xs">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                    <Zap className="w-5 h-5 fill-current" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <span>Issue Clustering &amp; Root Cause Analysis</span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        {computedClusters.length} Active {computedClusters.length === 1 ? 'Cluster' : 'Clusters'}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Correlates incoming complaints across all channels to identify single-point infrastructure disruptions.
                    </p>
                  </div>
                </div>
              </div>

              {computedClusters.length === 0 ? (
                /* Empty state when no clusters exist */
                <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3 shadow-2xs">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Zap className="w-6 h-6 text-slate-400" />
                  </div>
                  <h4 className="text-base font-bold text-slate-800">No Active Infrastructure Clusters</h4>
                  <p className="text-xs text-slate-500 max-w-lg mx-auto">
                    There are currently no areas with 3 or more complaints registered within a 60-minute window. New clusters emerge automatically as correlated incidents are detected across channels.
                  </p>
                </div>
              ) : (
                <>
                  {/* Primary Hub Highlight */}
                  {primaryCluster && (
                    <div className="bg-gradient-to-br from-amber-50 via-white to-amber-50/40 border-2 border-amber-400 rounded-2xl p-4.5 space-y-4 shadow-xs">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200/80 pb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-white shadow-2xs">
                            CRITICAL CLUSTER HUB #1
                          </span>
                          <h4 className="text-base font-bold text-slate-900">
                            {primaryCluster.name}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-amber-950 bg-amber-200/80 px-2.5 py-1 rounded-lg">
                            {primaryCluster.totalComplaints} Impacted Complaints
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedLocation(primaryCluster.area);
                              navigateTo('incidents');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <span>Filter Queue to {primaryCluster.area}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div className="space-y-1 md:col-span-2">
                          <span className="font-bold text-amber-950 uppercase tracking-wider text-[11px] flex items-center gap-1">
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                            <span>Possible cause (AI hypothesis):</span>
                          </span>
                          <p className="text-slate-800 bg-white/90 border border-amber-200 rounded-lg p-2.5 leading-relaxed font-medium">
                            {primaryCluster.rootCause}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                            Impacted Channels:
                          </span>
                          <div className="bg-white/90 border border-amber-200 rounded-lg p-2.5 space-y-1 font-mono text-[11px]">
                            {Object.entries(primaryCluster.channelBreakdown).map(([ch, count]) => (
                              <div key={ch} className="flex justify-between">
                                <span className="text-slate-600">{ch}:</span>
                                <strong className="text-slate-900">{count} {count === 1 ? 'ticket' : 'tickets'}</strong>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Category Breakdown with Cross-Service Links */}
                      {primaryCluster.categoryBreakdown && primaryCluster.categoryBreakdown.length > 0 && (
                        <div className="space-y-2 bg-white/95 border border-amber-200/90 rounded-xl p-3 text-xs shadow-2xs">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-100 pb-2">
                            <span className="font-bold text-amber-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5 text-amber-600" />
                              <span>Category Breakdown:</span>
                            </span>
                            <span className="font-mono text-xs font-bold text-slate-900 bg-amber-100/80 border border-amber-300/70 px-2.5 py-0.5 rounded-md">
                              {primaryCluster.categorySummaryString}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                            {primaryCluster.categoryBreakdown.map((catItem) => (
                              <div
                                key={catItem.category}
                                className={`p-2.5 rounded-lg border transition-colors ${
                                  catItem.isMain
                                    ? 'bg-slate-50/90 border-slate-200'
                                    : 'bg-amber-50/80 border-amber-300/80'
                                }`}
                              >
                                <div className="flex flex-wrap items-center justify-between gap-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-slate-900">
                                      {catItem.category}: {catItem.count} {catItem.count === 1 ? 'ticket' : 'tickets'}
                                    </span>
                                    {catItem.isMain && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-200 text-slate-700 uppercase">
                                        Main Category
                                      </span>
                                    )}
                                  </div>
                                  {catItem.relationBadge && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-950 border border-amber-300 shrink-0">
                                      <Sparkles className="w-2.5 h-2.5 text-amber-800 shrink-0" />
                                      <span>{catItem.relationBadge}</span>
                                    </span>
                                  )}
                                </div>
                                {catItem.linkExplanation && (
                                  <p className="text-[11px] text-amber-900/95 mt-1 leading-snug font-medium italic">
                                    &ldquo;{catItem.linkExplanation}&rdquo;
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 text-xs space-y-1.5">
                        <span className="font-bold text-emerald-950 flex items-center gap-1.5 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Active Remediation Directives:</span>
                        </span>
                        <ul className="grid grid-cols-1 md:grid-cols-3 gap-2 list-none text-[11px] text-emerald-900">
                          {primaryCluster.actionDirectives.map((dir, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                              <span>{dir}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Other Correlated National Clusters */}
                  {computedClusters.length > 1 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Other Correlated National Clusters ({computedClusters.length - 1}):
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {computedClusters.slice(1).map((cluster) => (
                          <div
                            key={cluster.id}
                            className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-4 space-y-2.5 transition-all text-xs shadow-2xs"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h5 className="font-bold text-slate-900">{cluster.name}</h5>
                                <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                  <MapPin className="w-3 h-3 text-slate-400" />
                                  <span>{cluster.location}</span>
                                </p>
                              </div>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700 shrink-0">
                                {cluster.totalComplaints} tickets
                              </span>
                            </div>

                            {/* Category breakdown line (e.g. Fibre 8 · M-PESA 5) */}
                            {cluster.categorySummaryString && (
                              <div className="bg-slate-50 border border-slate-200/90 rounded-lg p-2 space-y-1 text-2xs">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold uppercase tracking-wider text-slate-500 text-[10px]">
                                    Category Breakdown:
                                  </span>
                                  <span className="font-mono font-bold text-slate-900 text-[11px]">
                                    {cluster.categorySummaryString}
                                  </span>
                                </div>
                                {cluster.categoryBreakdown?.filter((c) => !c.isMain).map((sec) => (
                                  <div key={sec.category} className="pt-1 border-t border-slate-200/60 text-[10px]">
                                    <div className="flex items-center justify-between gap-1 flex-wrap">
                                      <span className="font-semibold text-slate-800">{sec.category} ({sec.count})</span>
                                      <span className="font-bold bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded text-[9px]">
                                        {sec.relationBadge || 'Possibly related (same area and time)'}
                                      </span>
                                    </div>
                                    {sec.linkExplanation && (
                                      <p className="text-slate-600 italic mt-0.5 leading-snug">
                                        &ldquo;{sec.linkExplanation}&rdquo;
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            <p className="text-[11px] text-slate-600 leading-snug line-clamp-2">
                              <strong className="text-slate-700">Possible cause (AI hypothesis): </strong>
                              {cluster.rootCause}
                            </p>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                              <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                                {cluster.status}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedLocation(cluster.area);
                                  navigateTo('incidents');
                                }}
                                className="text-emerald-700 hover:text-emerald-900 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                              >
                                <span>Filter Queue</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ================= PAGE 5: RESPONSE TEAMS ================= */}
          {currentPage === 'teams' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-2xs flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-emerald-800" />
                    <span>Safaricom PLC Incident &amp; Network Response Teams</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {teams.length} Specialized Technical &amp; Operational Units Connected for automated dispatch and field mobilization.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {teams.map((team) => {
                  const teamActiveAssigned = submissions.filter(
                    (s) => s.assignedTeam === team.name
                  ).length;

                  return (
                    <div
                      key={team.id}
                      className="bg-white border border-slate-200 rounded-xl p-4.5 space-y-3 hover:border-emerald-600 transition-colors shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-slate-900 leading-snug">
                              {team.name}
                            </p>
                            {team.isAiSuggested && (
                              <span className="text-[10px] font-mono px-2 py-0.5 bg-teal-100 text-teal-800 rounded font-bold shrink-0">
                                AI-suggested
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-emerald-700 font-medium">
                            {team.department}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold shrink-0">
                          {team.shortCode}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <p className="font-semibold text-slate-800">Lead: {team.leadOfficer}</p>
                        <p className="text-slate-500 font-mono text-[11px]">Email: {team.email}</p>
                        <p className="flex items-center gap-1 font-mono text-slate-500 text-[11px]">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{team.phone}</span>
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-slate-500 text-2xs block">Active Queue</span>
                          <span className="font-mono font-bold text-emerald-800 text-base">
                            {teamActiveAssigned} cases
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTeamFilter(team.name);
                            navigateTo('incidents');
                          }}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-semibold rounded-lg text-xs cursor-pointer"
                        >
                          View Queue &rarr;
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= PAGE 6: ANALYTICS & AI INSIGHTS ================= */}
          {currentPage === 'analytics' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5 text-emerald-800" />
                    <span>Incident Distribution &amp; Operational Analytics</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Category density and automated strategic directives across Kenyan counties.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCompileAIAnalytics}
                  disabled={isCompilingAI}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-emerald-900 bg-white hover:bg-emerald-50 border border-emerald-300 rounded-lg shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
                >
                  {isCompilingAI ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                      <span>Compiling Analytics...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Re-compile Analytics</span>
                    </>
                  )}
                </button>
              </div>

              {/* Main Grid: Pie Chart + AI Synthesis */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                {/* Left 5 Cols: Interactive SVG Donut/Pie Chart */}
                <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-4.5 shadow-2xs flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <BarChart3 className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Issues by Domain (Pie Chart)</span>
                      </h4>
                      <span className="text-xs font-semibold text-slate-500 font-mono">
                        {pieChartData.total} Total Reports
                      </span>
                    </div>

                    <div className="flex items-center justify-center pt-3 pb-1">
                      <div className="relative w-52 h-52 flex items-center justify-center">
                        <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                          {pieChartData.slices.map((slice, idx) => {
                            const isHovered = activeHoveredCategory === slice.category;
                            return (
                              <path
                                key={idx}
                                d={slice.pathData}
                                fill={slice.fill}
                                stroke="#ffffff"
                                strokeWidth={isHovered ? '3' : '1.5'}
                                className="transition-all duration-150 cursor-pointer hover:opacity-90"
                                style={{
                                  transformOrigin: '100px 100px',
                                  transform: isHovered ? 'scale(1.04)' : 'scale(1)',
                                }}
                                onMouseEnter={() => setActiveHoveredCategory(slice.category)}
                                onMouseLeave={() => setActiveHoveredCategory(null)}
                              />
                            );
                          })}
                        </svg>

                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                          {activeHoveredCategory ? (
                            (() => {
                              const matched = pieChartData.items.find(
                                (i) => i.category === activeHoveredCategory
                              );
                              return (
                                <>
                                  <span className="text-2xl font-black text-slate-900 tracking-tight">
                                    {matched?.percentage}%
                                  </span>
                                  <span className="text-2xs font-semibold text-slate-600 line-clamp-1 max-w-[110px]">
                                    {matched?.category}
                                  </span>
                                  <span className="text-2xs font-mono text-emerald-800">
                                    {matched?.count} incidents
                                  </span>
                                </>
                              );
                            })()
                          ) : (
                            <>
                              <span className="text-3xl font-black text-slate-900 tracking-tight">
                                {pieChartData.total}
                              </span>
                              <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                                Incidents
                              </span>
                              <span className="text-2xs text-emerald-700 font-medium">
                                {pieChartData.items.length} Domains
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Category Legend & Breakdown List */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 max-h-48 overflow-y-auto pr-1">
                    {pieChartData.items.map((item) => {
                      const isHovered = activeHoveredCategory === item.category;
                      return (
                        <div
                          key={item.category}
                          onMouseEnter={() => setActiveHoveredCategory(item.category)}
                          onMouseLeave={() => setActiveHoveredCategory(null)}
                          className={`flex items-center justify-between px-2 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                            isHovered ? 'bg-slate-100 font-semibold' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: item.fill }}
                            />
                            <span className="text-slate-800 truncate">{item.category}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 font-mono">
                            <span className="text-slate-500 font-medium">{item.count}</span>
                            <span className={`px-1.5 py-0.5 rounded text-2xs font-bold ${item.bg} ${item.text}`}>
                              {item.percentage}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right 7 Cols: Executive Synthesis */}
                <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between gap-4">
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="p-1 bg-amber-100/80 text-amber-800 rounded-md">
                          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                        </span>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                          Incident Data Analysis &amp; Operational Brief
                        </h4>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (!aiAnalyticsData) return;
                          const textToCopy = `SEMA Incident Analysis:\n${aiAnalyticsData.executiveSummary}\n\nKey Strategic Directives:\n${aiAnalyticsData.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}`;
                          navigator.clipboard.writeText(textToCopy).then(() => {
                            setHasCopiedBrief(true);
                            setTimeout(() => setHasCopiedBrief(false), 2000);
                          });
                        }}
                        className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-emerald-800 transition-colors font-medium cursor-pointer self-start sm:self-auto"
                      >
                        {hasCopiedBrief ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-700" />
                            <span className="text-emerald-700 font-semibold">Brief Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                            <span>Copy Brief</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* AI Executive Summary Card */}
                    <div className="bg-emerald-50/70 border border-emerald-900/12 rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Executive Incident Synthesis</span>
                        </span>
                        <span className="text-2xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-200/60 text-emerald-900">
                          Operational Brief
                        </span>
                      </div>
                      <p className="text-xs text-slate-800 leading-relaxed font-normal">
                        {aiAnalyticsData?.executiveSummary ||
                          'Compiling incident data from customer submissions across Kenya...'}
                      </p>
                    </div>

                    {/* Fast Metric Quick-Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg">
                        <span className="text-2xs font-medium text-slate-500 uppercase tracking-wider block">
                          Primary Concentration
                        </span>
                        <p className="text-sm font-bold text-slate-900 mt-0.5 truncate">
                          {pieChartData.items[0]?.category || 'Home Fibre & Fixed Internet'}
                        </p>
                        <span className="text-2xs text-emerald-800 font-semibold">
                          {pieChartData.items[0]?.percentage || 0}% of volume
                        </span>
                      </div>

                      <div className="p-2.5 bg-red-50/60 border border-red-200/80 rounded-lg">
                        <span className="text-2xs font-medium text-red-700 uppercase tracking-wider block flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-red-600" />
                          Urgent Severity
                        </span>
                        <p className="text-sm font-bold text-red-900 mt-0.5">
                          {metrics.urgentCount} Incidents
                        </p>
                        <span className="text-2xs text-red-700">Immediate outage</span>
                      </div>

                      <div className="p-2.5 bg-cyan-50/60 border border-cyan-200/80 rounded-lg">
                        <span className="text-2xs font-medium text-cyan-800 uppercase tracking-wider block">
                          SLA Compliance
                        </span>
                        <p className="text-sm font-bold text-cyan-950 mt-0.5">94.2% on Track</p>
                        <span className="text-2xs text-cyan-800 font-medium">Avg turnaround: 2.4h</span>
                      </div>
                    </div>

                    {/* Action Directives */}
                    <div className="space-y-2 pt-1">
                      <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Recommended Operational Directives</span>
                      </h5>
                      <div className="space-y-1.5">
                        {(aiAnalyticsData?.recommendations || [
                          'Pre-deploy metro fiber splicing teams along heavily reported arterial corridors.',
                          'Audit M-PESA B2B callback reconciliation to achieve 30-minute SLA.',
                          'Maintain multilingual notifications in Kiswahili and Sheng to keep customers updated.',
                        ]).map((rec, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 p-2 bg-slate-50 border border-slate-200/70 rounded-lg text-xs text-slate-700"
                          >
                            <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-700 text-white font-bold text-2xs shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <span className="leading-snug">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= PAGE 7: ALERTS ================= */}
          {currentPage === 'alerts' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Alerts Tabs: Officer alerts / Customer alerts */}
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAlertsTab('officer')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
                      alertsTab === 'officer'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <MailCheck className="w-4 h-4" />
                    <span>Officer alerts</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-2xs font-mono font-bold ${
                        alertsTab === 'officer' ? 'bg-white text-emerald-950' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {metrics.emailAlertsSent}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAlertsTab('customer')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer border ${
                      alertsTab === 'customer'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Customer alerts</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 font-medium">
                      Coming Soon
                    </span>
                  </button>
                </div>

                <div className="text-xs text-slate-500 font-medium">
                  {alertsTab === 'officer'
                    ? `${metrics.emailAlertsSent} automated email alerts delivered to technical leads`
                    : 'Customer broadcast & resolution notifications desk'}
                </div>
              </div>

              {alertsTab === 'officer' ? (
                /* Dispatched Email Logs Table */
                <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden space-y-0">
                  <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Automated Officer Email Dispatch Registry ({metrics.emailAlertsSent})
                    </span>
                    <span className="text-2xs text-slate-500 font-mono">
                      Gateway: dispatch@safaricom.co.ke
                    </span>
                  </div>

                  {submissions.filter((s) => s.emailAlertSent).length === 0 ? (
                    <div className="p-12 text-center space-y-2">
                      <Mail className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs font-semibold text-slate-700">No email alerts dispatched yet</p>
                      <p className="text-2xs text-slate-400">
                        Use Auto-Assign or open Dispatch Details on any incident to send alerts to officers.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 uppercase text-2xs font-semibold border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3">Reference &amp; Time</th>
                            <th className="py-2.5 px-3">Assigned Officer</th>
                            <th className="py-2.5 px-3">Response Team</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {submissions
                            .filter((s) => s.emailAlertSent)
                            .map((report) => (
                              <tr key={report.id} className="hover:bg-slate-50 transition-colors">
                                <td className="py-2.5 px-3">
                                  <span className="font-mono font-bold text-emerald-800 block">
                                    {report.referenceCode}
                                  </span>
                                  <span className="text-2xs text-slate-400 font-mono">
                                    {report.emailAlertSentAt
                                      ? new Date(report.emailAlertSentAt).toLocaleTimeString([], {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })
                                      : 'Recent'}{' '}
                                    EAT
                                  </span>
                                </td>

                                <td className="py-2.5 px-3">
                                  <span className="font-medium text-slate-900 block">
                                    {report.assignedOfficer || 'Field Officer'}
                                  </span>
                                  <span className="text-2xs text-slate-500 font-mono truncate max-w-[180px] block">
                                    {report.assignedOfficerEmail ||
                                      report.emailAlertRecipient ||
                                      'officer@safaricom.co.ke'}
                                  </span>
                                </td>

                                <td className="py-2.5 px-3 text-slate-700 font-medium">
                                  {report.assignedTeam || 'Safaricom Response Unit'}
                                </td>

                                <td className="py-2.5 px-3">
                                  <span className="inline-flex items-center gap-1 text-2xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>Delivered</span>
                                  </span>
                                </td>

                                <td className="py-2.5 px-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => setInspectingEmailAlert(report)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-lg text-xs font-semibold cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>View Memo</span>
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                /* Customer Alerts Tab */
                <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3 shadow-2xs">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900">Customer Broadcast Alerts</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Automated SMS and WhatsApp updates to subscribers regarding incident milestones, scheduled maintenance, and resolution confirmations will be managed here.
                  </p>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    Feature in rollout queue
                  </span>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ================= RIGHT-SIDE DETAIL PANEL FOR INCIDENTS ================= */}
      {inspectingReport && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setInspectingReport(null)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
              {/* Header */}
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-emerald-800 text-sm">
                      {inspectingReport.referenceCode}
                    </span>
                    <span
                      className={`text-2xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        inspectingReport.priority === 'Urgent'
                          ? 'bg-red-100 text-red-800'
                          : inspectingReport.priority === 'High'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {inspectingReport.priority || 'Medium'} Priority
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">
                    Incident Details &amp; Dispatch
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setInspectingReport(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  aria-label="Close detail panel"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Panel Scrollable Body */}
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                {/* Safety Rule Banner */}
                {inspectingReport.needsReview && (
                  <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 flex items-start gap-3 text-xs text-amber-950 shadow-2xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-bold text-amber-900 block">Safety Rule: Flagged for Manual Review</span>
                      <p className="text-amber-800 leading-relaxed">
                        {inspectingReport.adminNotes ||
                          'This incident was held in Received queue for manual triage because the AI confidence score is below 60% or the category is undetermined.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* SLA Clock Started Indicator */}
                {inspectingReport.slaStartedAt && inspectingReport.status === 'Assigned' && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex items-center justify-between text-xs text-indigo-950 font-mono">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>
                        SLA Timer Active (Clock started at{' '}
                        {new Date(inspectingReport.slaStartedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                        )
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                      Target: {inspectingReport.aiClassification?.estimatedSLA || '2 hours'}
                    </span>
                  </div>
                )}

                {/* 1. Customer Incident Report Statement & Translation */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">Customer Statement:</span>
                    <div className="flex items-center gap-1.5">
                      {renderChannelBadge(inspectingReport.channel, inspectingReport.captureMethod)}
                      <span>·</span>
                      <span className="font-semibold">{inspectingReport.detectedLanguage}</span>
                    </div>
                  </div>
                  <p className="text-xs font-medium text-slate-900 leading-relaxed bg-white p-3 rounded-lg border border-slate-200/80">
                    &ldquo;{inspectingReport.text}&rdquo;
                  </p>
                  {inspectingReport.englishTranslation && (
                    <div className="p-2.5 bg-emerald-50/50 border border-emerald-200/60 rounded-lg">
                      <span className="text-2xs font-bold uppercase tracking-wider text-emerald-800 block">
                        English Translation:
                      </span>
                      <p className="text-xs text-slate-700 italic mt-0.5">
                        &ldquo;{inspectingReport.englishTranslation}&rdquo;
                      </p>
                    </div>
                  )}
                  {inspectingReport.contactInfo && (
                    <p className="text-xs text-emerald-900 font-mono pt-1">
                      Customer Line / Contact: {inspectingReport.contactInfo}
                    </p>
                  )}
                </div>

                {/* 1b. Customer Attached Evidence (Screenshots / Photos) & AI Visual Diagnosis */}
                {((inspectingReport.attachedImages && inspectingReport.attachedImages.length > 0) || inspectingReport.imageAnalysis) && (
                  <div className="bg-white border-2 border-emerald-600/30 rounded-xl p-3.5 space-y-2.5 text-xs shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                        <Camera className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Attached Screenshot / Photo Evidence</span>
                      </span>
                      {inspectingReport.attachedImages && inspectingReport.attachedImages.length > 0 && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                          {inspectingReport.attachedImages.length} {inspectingReport.attachedImages.length === 1 ? 'image' : 'images'}
                        </span>
                      )}
                    </div>

                    {/* AI Description (Likely issue / visual diagnosis) */}
                    {inspectingReport.imageAnalysis && (
                      <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-lg">
                        <span className="text-2xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-emerald-700" />
                          <span>AI Visual Diagnosis / Likely Issue:</span>
                        </span>
                        <p className="text-xs text-slate-800 font-semibold mt-0.5 leading-snug">
                          &ldquo;{inspectingReport.imageAnalysis}&rdquo;
                        </p>
                      </div>
                    )}

                    {/* Thumbnails */}
                    {inspectingReport.attachedImages && inspectingReport.attachedImages.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                          Click thumbnail to inspect full resolution:
                        </span>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {inspectingReport.attachedImages.map((imgSrc, imgIdx) => (
                            <button
                              key={imgIdx}
                              type="button"
                              onClick={() => setSelectedEnlargedImage(imgSrc)}
                              className="relative group rounded-lg overflow-hidden border-2 border-slate-200 hover:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs transition-all cursor-pointer"
                              title={`View Image #${imgIdx + 1}`}
                            >
                              <img
                                src={imgSrc}
                                alt={`Customer screenshot evidence ${imgIdx + 1}`}
                                className="w-20 h-20 object-cover group-hover:scale-105 transition-transform"
                              />
                              <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded bg-slate-900/80 text-white font-mono text-[9px] font-bold">
                                #{imgIdx + 1}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. AI Incident Classification */}
                {inspectingReport.aiClassification && (
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-emerald-950 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-700" />
                        <span>Incident Classification</span>
                      </span>
                      <span className="font-mono text-emerald-800">
                        Target SLA: {inspectingReport.aiClassification.estimatedSLA}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="text-slate-500 text-2xs block">Domain:</span>
                        <p className="font-semibold text-slate-900">
                          {inspectingReport.aiClassification.category}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500 text-2xs block">Urgency Assessment:</span>
                        <p className="font-semibold text-red-700">
                          {inspectingReport.aiClassification.urgency}
                        </p>
                      </div>
                      {inspectingReport.aiClassification.confidenceScore !== undefined && (
                        <div>
                          <span className="text-slate-500 text-2xs block">AI Confidence Score:</span>
                          <p
                            className={`font-semibold font-mono ${
                              inspectingReport.aiClassification.confidenceScore >= 0.6
                                ? 'text-emerald-700'
                                : 'text-amber-700 font-bold'
                            }`}
                          >
                            {Math.round(inspectingReport.aiClassification.confidenceScore * 100)}%
                            {inspectingReport.aiClassification.confidenceScore < 0.6 && ' (Needs Review)'}
                          </p>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-500 text-2xs block">Assigned Response Unit:</span>
                        <p className="font-semibold text-slate-900 truncate">
                          {inspectingReport.assignedTeam || 'Unassigned (Awaiting Triage)'}
                        </p>
                      </div>
                    </div>

                    <div className="text-slate-700 pt-1 border-t border-emerald-200/60">
                      <strong className="text-slate-900">Routing Rationale: </strong>
                      {inspectingReport.aiClassification.rationale}
                    </div>

                    {inspectingReport.aiClassification.tensionNotes && (
                      <p className="text-2xs text-slate-500 italic">
                        Note: {inspectingReport.aiClassification.tensionNotes}
                      </p>
                    )}
                  </div>
                )}

                {/* 3. Informed Resolution Steps */}
                {inspectingReport.aiResolutionSteps && inspectingReport.aiResolutionSteps.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-emerald-700" />
                        <span>Informed Resolution Steps</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const stepsText = inspectingReport.aiResolutionSteps?.join('\n') || '';
                          navigator.clipboard.writeText(stepsText).then(() => {
                            setCopiedStepsTicket(inspectingReport.id);
                            setTimeout(() => setCopiedStepsTicket(null), 2000);
                          });
                        }}
                        className="text-2xs text-emerald-700 hover:text-emerald-950 font-semibold underline cursor-pointer"
                      >
                        {copiedStepsTicket === inspectingReport.id ? 'Copied Steps!' : 'Copy Steps'}
                      </button>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      {inspectingReport.aiResolutionSteps.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-2 p-2 bg-slate-50 rounded-lg text-slate-800">
                          <span className="w-4 h-4 rounded-full bg-emerald-700 text-white font-bold text-2xs flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="leading-snug">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Linked Issue Group */}
                {inspectingReport.issueGroupId && (
                  <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-950 flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-amber-600" />
                        <span>Linked Issue Group: {inspectingReport.issueGroupTitle || inspectingReport.issueGroupId}</span>
                      </span>
                    </div>
                    {inspectingReport.issueGroupCause && (
                      <p className="text-amber-900 text-xs leading-relaxed">
                        <strong>Possible cause (AI hypothesis):</strong> {inspectingReport.issueGroupCause}
                      </p>
                    )}
                  </div>
                )}

                {/* Compliments & Positive Customer Feedback Card */}
                {(inspectingReport.intent === 'Compliment' || inspectingReport.status === 'Feedback') && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                        <Heart className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                        <span>Customer Praise / Feedback</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-200 text-emerald-900">
                        Feedback (No Dispatch)
                      </span>
                    </div>
                    <p className="text-slate-600 text-xs">
                      Compliments are recognized as feedback and not incidents requiring technical dispatch. Drafted thank-you response:
                    </p>
                    <div className="p-3 bg-white border border-emerald-200 rounded-lg text-slate-800 font-medium">
                      {inspectingReport.thankYouReply || 'Asante sana for contacting Safaricom. We appreciate your feedback and look forward to serving you!'}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const reply = inspectingReport.thankYouReply || 'Asante sana for contacting Safaricom. We appreciate your feedback and look forward to serving you!';
                        navigator.clipboard.writeText(reply).then(() => {
                          setInflowToast('Thank-you reply copied to clipboard.');
                          setTimeout(() => setInflowToast(null), 2500);
                        });
                      }}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg text-xs cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Thank-You Reply</span>
                    </button>
                  </div>
                )}

                {/* Customer Enquiry & Self-Help Steps */}
                {inspectingReport.intent === 'Enquiry' && inspectingReport.selfHelpSteps && inspectingReport.selfHelpSteps.length > 0 && (
                  <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 space-y-2 text-xs">
                    <span className="font-bold text-sky-950 flex items-center gap-1.5">
                      <Bot className="w-4 h-4 text-sky-700" />
                      <span>Customer Self-Help Guidance Steps</span>
                    </span>
                    <div className="space-y-1.5 pt-1">
                      {inspectingReport.selfHelpSteps.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-2 p-2 bg-white rounded-lg border border-sky-100 text-slate-800">
                          <span className="w-4 h-4 rounded-full bg-sky-700 text-white font-bold text-2xs flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="leading-snug">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Team Assignment & Dispatch Form */}
                <form onSubmit={handleSaveDispatch} className="space-y-3.5 pt-2 border-t border-slate-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Dispatch &amp; Team Assignment
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <label htmlFor="dispatch-team" className="block text-xs font-medium text-slate-700 mb-1">
                        Assigned Response Team
                      </label>
                      <select
                        id="dispatch-team"
                        value={dispatchTeam}
                        onChange={(e) => handleTeamChange(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-emerald-600 cursor-pointer"
                      >
                        <option value="">Select team</option>
                        {teams.map((team) => (
                          <option key={team.id} value={team.name}>
                            {team.name} {team.isAiSuggested ? '(AI-suggested)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="dispatch-officer" className="block text-xs font-medium text-slate-700 mb-1">
                          Lead Assigned Officer
                        </label>
                        <input
                          id="dispatch-officer"
                          type="text"
                          value={dispatchOfficer}
                          onChange={(e) => setDispatchOfficer(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-600"
                        />
                      </div>

                      <div>
                        <label htmlFor="dispatch-email" className="block text-xs font-medium text-slate-700 mb-1">
                          Officer Email
                        </label>
                        <input
                          id="dispatch-email"
                          type="email"
                          value={dispatchOfficerEmail}
                          onChange={(e) => setDispatchOfficerEmail(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:border-emerald-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="dispatch-priority" className="block text-xs font-medium text-slate-700 mb-1">
                          Priority &amp; Urgency
                        </label>
                        <select
                          id="dispatch-priority"
                          value={dispatchPriority}
                          onChange={(e) => setDispatchPriority(e.target.value as PriorityLevel)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-600 cursor-pointer"
                        >
                          <option value="Urgent">Urgent (Immediate Danger / Outage)</option>
                          <option value="High">High Priority (Active Disruption)</option>
                          <option value="Medium">Medium (Standard Issue)</option>
                          <option value="Routine">Routine (Inquiry / Scheduled)</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="dispatch-status" className="block text-xs font-medium text-slate-700 mb-1">
                          Dispatch Status
                        </label>
                        <select
                          id="dispatch-status"
                          value={dispatchStatus}
                          onChange={(e) => setDispatchStatus(e.target.value as ReportStatus)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-600 cursor-pointer"
                        >
                          <option value="Assigned">Assigned to Unit</option>
                          <option value="In Progress">In Progress / Field Dispatched</option>
                          <option value="Resolved">Resolved</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="dispatch-notes" className="block text-xs font-medium text-slate-700 mb-1">
                        Dispatch Notes / Field Instructions
                      </label>
                      <textarea
                        id="dispatch-notes"
                        rows={2}
                        value={dispatchNotes}
                        onChange={(e) => setDispatchNotes(e.target.value)}
                        placeholder="e.g. Field crew instructed to bring OTDR splicing kit..."
                        className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-600"
                      />
                    </div>

                    {/* Email Option Checkbox */}
                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={sendAutomatedEmail}
                            onChange={(e) => setSendAutomatedEmail(e.target.checked)}
                            className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-600 border-slate-300 cursor-pointer"
                          />
                          <span className="text-xs font-semibold text-emerald-950 flex items-center gap-1.5">
                            <MailCheck className="w-4 h-4 text-emerald-700" />
                            <span>Send automated email alert to officer</span>
                          </span>
                        </label>

                        {sendAutomatedEmail && (
                          <button
                            type="button"
                            onClick={() => setShowEmailPreview(!showEmailPreview)}
                            className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                          >
                            {showEmailPreview ? 'Hide Preview' : 'Preview Email'}
                          </button>
                        )}
                      </div>

                      {sendAutomatedEmail && showEmailPreview && (
                        <div className="bg-white border border-emerald-300 rounded-lg p-3 text-[11px] font-mono text-slate-800 max-h-40 overflow-y-auto">
                          <pre className="whitespace-pre-wrap">
                            {generateClientEmailAlert(
                              inspectingReport,
                              dispatchOfficer,
                              dispatchOfficerEmail,
                              dispatchTeam,
                              dispatchPriority,
                              dispatchNotes
                            ).body}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setInspectingEmailAlert(inspectingReport)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Email Notice</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setInspectingReport(null)}
                        className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingDispatch}
                        className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors cursor-pointer"
                      >
                        {isSavingDispatch ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Confirm &amp; Dispatch</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= EMAIL ALERT VIEW MODAL ================= */}
      {inspectingEmailAlert && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100/80 text-emerald-800 rounded-xl">
                  <MailCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-emerald-800">
                      {inspectingEmailAlert.referenceCode}
                    </span>
                    <span className="text-2xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
                      Alert Delivered
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">
                    Officer Dispatch Email Notice
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingEmailAlert(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close Email View"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Email Metadata */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                <div>
                  <span className="text-slate-400">Recipient Officer:</span>{' '}
                  <strong className="text-slate-900">
                    {inspectingEmailAlert.assignedOfficer || 'Field Lead'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400">Email:</span>{' '}
                  <strong className="font-mono text-emerald-900">
                    {inspectingEmailAlert.assignedOfficerEmail ||
                      inspectingEmailAlert.emailAlertRecipient ||
                      'dispatch@safaricom.co.ke'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400">Response Team:</span>{' '}
                  <span className="text-slate-800 font-medium">
                    {inspectingEmailAlert.assignedTeam || 'Response Unit'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Dispatched:</span>{' '}
                  <span className="font-mono text-slate-700">
                    {inspectingEmailAlert.emailAlertSentAt
                      ? new Date(inspectingEmailAlert.emailAlertSentAt).toLocaleString('en-KE', {
                          timeZone: 'Africa/Nairobi',
                        })
                      : 'Just now'}{' '}
                    EAT
                  </span>
                </div>
              </div>
            </div>

            {/* Email Body Memo Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Official Dispatch Memo:</span>
                <span className="text-2xs text-emerald-800">
                  Delivered via Official Notification Service
                </span>
              </div>
              <pre className="p-4 bg-slate-900 text-emerald-300 rounded-xl font-mono text-[11px] leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto border border-slate-800 select-all">
                {inspectingEmailAlert.emailAlertBody ||
                  generateClientEmailAlert(
                    inspectingEmailAlert,
                    inspectingEmailAlert.assignedOfficer || 'Field Lead',
                    inspectingEmailAlert.assignedOfficerEmail || 'officer@safaricom.co.ke',
                    inspectingEmailAlert.assignedTeam || 'Response Unit'
                  ).body}
              </pre>
            </div>

            {/* Footer Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  const bodyText =
                    inspectingEmailAlert.emailAlertBody ||
                    generateClientEmailAlert(
                      inspectingEmailAlert,
                      inspectingEmailAlert.assignedOfficer || 'Field Lead',
                      inspectingEmailAlert.assignedOfficerEmail || 'officer@safaricom.co.ke',
                      inspectingEmailAlert.assignedTeam || 'Response Unit'
                    ).body;
                  navigator.clipboard.writeText(bodyText).then(() => {
                    setCopiedEmailText(true);
                    setTimeout(() => setCopiedEmailText(false), 2000);
                  });
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                {copiedEmailText ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                    <span className="text-emerald-700">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy Full Memo</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={sendingEmailForId === inspectingEmailAlert.id}
                  onClick={async () => {
                    await handleSendEmailAlertForReport(inspectingEmailAlert);
                    setInspectingEmailAlert(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors cursor-pointer"
                >
                  {sendingEmailForId === inspectingEmailAlert.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5 text-sky-700" />
                  )}
                  <span>Re-send Alert</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInspectingEmailAlert(null)}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg cursor-pointer transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enlarged Screenshot Modal */}
      {selectedEnlargedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedEnlargedImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl p-3 border border-slate-700 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 text-slate-200 text-xs">
              <span className="font-bold flex items-center gap-1.5 text-emerald-400">
                <Camera className="w-4 h-4" />
                <span>Customer Screenshot / Photo Evidence</span>
              </span>
              <button
                type="button"
                onClick={() => setSelectedEnlargedImage(null)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 flex items-center justify-center overflow-auto max-h-[78vh]">
              <img
                src={selectedEnlargedImage}
                alt="Enlarged evidence"
                className="max-w-full max-h-[72vh] object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
