import { Zap, X, MapPin, Radio, AlertTriangle, CheckCircle2, ArrowRight, ShieldAlert, Layers, Sparkles } from 'lucide-react';

import { IncidentCluster, computeClustersFromStore } from '../utils/clusterComputation';
import { normaliseChannel } from '../utils/syncFeeds';

interface IssueClusteringModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFilterToCluster: (location: string) => void;
  clusters?: IncidentCluster[];
}

export const CLUSTERS = [
  {
    id: 'cluster-ruaka',
    name: 'Ruaka High-Density Outage Cluster',
    location: 'Ruaka · Kiambu / Nairobi Metro',
    totalComplaints: 73,
    status: 'High Impact / Active Emergency',
    isPrimaryHub: true,
    rootCause:
      'Distribution optical fiber feeder fault along Limuru Road near Two Rivers Mall affecting customer endpoints.',
    impactedServices: ['Home Fibre Broadband (Red LOS)', 'Local Commercial Internet'],
    channelBreakdown: {
      'Call Center CRM': 24,
      'Social Media (Twitter/X & WhatsApp)': 33,
      Email: 11,
      'Web Voice Portal': 5,
    },
    actionDirectives: [
      'Transmission rerouted to secondary 23GHz high-capacity microwave radio link.',
      'Emergency Safaricom metro splicing crew dispatched with OTDR fault locator to pole #14.',
      'Target Mean Time to Repair (MTTR): 2.0 hours.',
    ],
  },
  {
    id: 'cluster-nairobi-mpesa',
    name: 'Nairobi CBD M-PESA G2 Callback Congestion',
    location: 'Nairobi · CBD / Eastlands',
    totalComplaints: 42,
    status: 'In Progress · Core Gateway',
    isPrimaryHub: false,
    rootCause:
      'Intermittent SSL timeout on partner hospital & merchant B2B payment API callback queue.',
    impactedServices: ['Hospital Paybills', 'Merchant Till Receipts', 'Automated Reversals'],
    channelBreakdown: {
      WhatsApp: 18,
      'Call Center CRM': 16,
      'Web Voice Portal': 8,
    },
    actionDirectives: [
      'Cleared queued transaction backlog on core M-PESA payment switch.',
      'Forced automated callback re-try engine with 100% confirmation push.',
    ],
  },
  {
    id: 'cluster-mombasa-nyali',
    name: 'Mombasa Nyali Subsea Cable Feeder Splicing',
    location: 'Mombasa · Nyali / Digo Road',
    totalComplaints: 29,
    status: 'Maintenance Window',
    isPrimaryHub: false,
    rootCause:
      'Scheduled optical power rebalancing on coastal undersea landing terminal distribution rack.',
    impactedServices: ['International Enterprise Leased Lines', 'Cloud Hosting latency'],
    channelBreakdown: {
      LinkedIn: 12,
      Email: 14,
      'Call Center CRM': 3,
    },
    actionDirectives: [
      'Traffic dynamically re-routed via Nairobi-Mombasa inland terrestrial fiber loop.',
    ],
  },
  {
    id: 'cluster-nakuru-storm',
    name: 'Nakuru CBD Thunderstorm Lightning Surge',
    location: 'Nakuru · Biashara / Kenyatta Ave',
    totalComplaints: 19,
    status: 'Restoring Power',
    isPrimaryHub: false,
    rootCause:
      'Severe lightning storm tripped primary AC transformer breaker feeding Central Business District macro BTS.',
    impactedServices: ['4G/5G Carrier Sectors', 'VoLTE Calling'],
    channelBreakdown: {
      'Twitter (X)': 10,
      'Call Center CRM': 6,
      Email: 3,
    },
    actionDirectives: [
      'Standby diesel generator auto-engaged; field engineer replacing secondary surge arrestor.',
    ],
  },
  {
    id: 'cluster-kisumu-basin',
    name: 'Kisumu Lake Basin Microwave Realignment',
    location: 'Kisumu · Milimani / CBD',
    totalComplaints: 14,
    status: 'Under Optimization',
    isPrimaryHub: false,
    rootCause:
      'High wind shear gale shifted transmission antenna azimuth by 4 degrees, reducing microwave link margin.',
    impactedServices: ['4G Wireless Data throughput'],
    channelBreakdown: {
      'Call Center CRM': 8,
      'Web Voice Portal': 6,
    },
    actionDirectives: [
      'Tower climbing riggers scheduled for physical dish realignment & BER verification.',
    ],
  },
];

export const IssueClusteringModal: React.FC<IssueClusteringModalProps> = ({
  isOpen,
  onClose,
  onFilterToCluster,
  clusters: propClusters,
}) => {
  if (!isOpen) return null;

  const clusters = propClusters || (() => {
    try {
      const stored = localStorage.getItem('sema_submissions');
      if (stored) {
        return computeClustersFromStore(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
    return [];
  })();

  const primaryCluster = clusters.find((c) => c.isPrimaryHub) || clusters[0] || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-white border-b border-amber-200/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Zap className="w-5 h-5 fill-current" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>AI Issue Clustering &amp; Root Cause Analysis</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  {clusters.length} Active {clusters.length === 1 ? 'Cluster' : 'Clusters'}
                </span>
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                AI correlates incoming complaints across all channels to identify underlying single-point infrastructure failures
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {clusters.length === 0 ? (
            <div className="p-8 text-center space-y-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="w-12 h-12 rounded-xl bg-white text-slate-400 flex items-center justify-center mx-auto shadow-2xs border border-slate-200">
                <Zap className="w-6 h-6 text-slate-400" />
              </div>
              <h4 className="text-base font-bold text-slate-800">No Active Infrastructure Clusters</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No clusters found with 3 or more tickets in the same area within 60 minutes.
              </p>
            </div>
          ) : (
            <>
              {/* Primary Hub */}
              {primaryCluster && (
                <div className="bg-gradient-to-br from-amber-50 via-white to-amber-50/40 border-2 border-amber-400 rounded-2xl p-5 space-y-4 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200/80 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-white shadow-2xs">
                        CRITICAL CLUSTER HUB #1
                      </span>
                      <h3 className="text-base font-bold text-slate-900">
                        {primaryCluster.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-amber-950 bg-amber-200/80 px-2.5 py-1 rounded-lg">
                        {primaryCluster.totalComplaints} Impacted Complaints
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          onFilterToCluster(primaryCluster.area);
                          onClose();
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
                        {Object.entries(primaryCluster.channelBreakdown).map(([ch, count]) => {
                          const normCh = normaliseChannel(ch);
                          return (
                            <div key={normCh} className="flex justify-between">
                              <span className="text-slate-600">{normCh}:</span>
                              <strong className="text-slate-900">{count} {count === 1 ? 'call/report' : 'calls/reports'}</strong>
                            </div>
                          );
                        })}
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

                  {/* Directives in progress */}
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

              {/* Remaining Clusters */}
              {clusters.length > 1 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Other Correlated National Clusters ({clusters.length - 1}):
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {clusters.slice(1).map((cluster) => (
                      <div
                        key={cluster.id}
                        className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-4 space-y-2.5 transition-all text-xs"
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
                          {cluster.rootCause.replace(/^possible cause \(ai hypothesis\):\s*/i, '')}
                        </p>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                            {cluster.status}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              onFilterToCluster(cluster.area);
                              onClose();
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

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-mono text-2xs">
            Safaricom SEMA Cluster Engine · Auto-correlated via Gemini Flash
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
          >
            Close Intelligence View
          </button>
        </div>
      </div>
    </div>
  );
};
