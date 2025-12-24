
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MetricCard } from './components/MetricCard';
import { HealthMetrics, SyncStatus, AIInsight, SyncLog } from './types';
import { analyzeHealthMetrics } from './services/geminiService';
import { pushToAiServer } from './services/mockApiService';

const App: React.FC = () => {
  const [metrics, setMetrics] = useState<HealthMetrics>({
    heartRate: 72,
    bloodOxygen: 98,
    steps: 8432,
    calories: 420,
    sleepHours: 7.2,
    sleepScore: 88,
    sleepStages: {
      deep: 22,
      rem: 24,
      light: 49,
      awake: 5
    },
    stressLevel: 25,
    ecgStatus: 'Normal Sinus Rhythm',
    timestamp: new Date().toLocaleTimeString()
  });

  const [syncStatus, setSyncStatus] = useState<SyncStatus>(SyncStatus.IDLE);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null);
  const [isLive, setIsLive] = useState(true);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [rawInput, setRawInput] = useState(JSON.stringify(metrics, null, 2));
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  const metricsRef = useRef(metrics);
  useEffect(() => { metricsRef.current = metrics; }, [metrics]);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addLog = (status: SyncLog['status'], details: string) => {
    const newLog: SyncLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      status,
      details
    };
    setSyncLogs(prev => [newLog, ...prev].slice(0, 15));
  };

  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        heartRate: 65 + Math.floor(Math.random() * 15),
        stressLevel: Math.max(10, Math.min(90, prev.stressLevel + (Math.random() - 0.5) * 5)),
        timestamp: new Date().toLocaleTimeString()
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, [isLive]);

  const handleManualSyncAndPush = useCallback(async () => {
    if (!isOnline) {
      setSyncStatus(SyncStatus.OFFLINE);
      setTimeout(() => setSyncStatus(SyncStatus.IDLE), 2000);
      return;
    }
    setSyncStatus(SyncStatus.SYNCING);
    addLog('SKIPPED', 'Manual request: Syncing Watch State...');
    await new Promise(r => setTimeout(r, 1200));
    setSyncStatus(SyncStatus.PUSHING);
    try {
      await pushToAiServer(metrics);
      const insight = await analyzeHealthMetrics(metrics);
      setAiInsight(insight);
      setSyncStatus(SyncStatus.SUCCESS);
      addLog('SUCCESS', 'Cloud Analysis complete.');
      setTimeout(() => setSyncStatus(SyncStatus.IDLE), 3000);
    } catch (error) {
      setSyncStatus(SyncStatus.ERROR);
      addLog('ERROR', 'Process failed: ' + (error as Error).message);
      setTimeout(() => setSyncStatus(SyncStatus.IDLE), 3000);
    }
  }, [metrics, isOnline]);

  const applyActualData = () => {
    try {
      const parsed = JSON.parse(rawInput);
      setMetrics({ ...metrics, ...parsed });
      setIsDataModalOpen(false);
      addLog('SUCCESS', 'User data applied.');
    } catch (e) {
      alert("Invalid JSON format.");
    }
  };

  const installApp = async () => {
    if (!deferredPrompt) {
      alert("Installation is ready! If you don't see the popup, tap the Chrome menu (3 dots) and select 'Install' or 'Add to Home Screen'.");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#050505] text-white selection:bg-blue-500/30">
      <header className="p-4 md:p-6 border-b border-white/5 flex items-center justify-between bg-black/60 sticky top-0 z-40 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center metric-glow-blue relative overflow-hidden">
            <i className="fa-solid fa-bolt-lightning text-white"></i>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">HealthBridge</h1>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full relative ${isOnline ? 'bg-green-500 pulse-dot' : 'bg-red-500'}`}></div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                {isOnline ? 'Live Cloud Link' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        <button 
          onClick={() => setIsDataModalOpen(true)}
          className="p-2 text-gray-400 hover:text-white transition-colors"
        >
          <i className="fa-solid fa-sliders text-xl"></i>
        </button>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full p-4 space-y-4 mb-32">
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="Heart" value={metrics.heartRate} unit="BPM" icon="fa-heart-pulse" colorClass="border-red-500" />
          <MetricCard label="SpO2" value={metrics.bloodOxygen} unit="%" icon="fa-droplet" colorClass="border-blue-400" />
          <MetricCard label="Steps" value={metrics.steps.toLocaleString()} unit="" icon="fa-fire" colorClass="border-orange-500" />
          <MetricCard label="Stress" value={Math.round(metrics.stressLevel)} unit="/100" icon="fa-brain" colorClass="border-cyan-500" />
        </div>

        <MetricCard label="Sleep Data" value={metrics.sleepHours} unit="Hrs" icon="fa-moon" colorClass="border-purple-500">
          <div className="mt-4 space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Score</p>
                <p className="text-2xl font-bold text-white">{metrics.sleepScore}</p>
              </div>
              <div className="text-right">
                 <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Deep</p>
                 <p className="text-sm font-bold text-purple-400">{metrics.sleepStages.deep}%</p>
              </div>
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full flex overflow-hidden">
              <div className="h-full bg-purple-600" style={{ width: `${metrics.sleepStages.deep}%` }}></div>
              <div className="h-full bg-blue-500" style={{ width: `${metrics.sleepStages.rem}%` }}></div>
              <div className="h-full bg-blue-300" style={{ width: `${metrics.sleepStages.light}%` }}></div>
            </div>
          </div>
        </MetricCard>

        {aiInsight ? (
          <div className="glass-panel p-5 rounded-3xl border-t-2 border-t-blue-500/50 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <i className="fa-solid fa-sparkles text-blue-400"></i>
              <h3 className="font-bold">AI Analysis</h3>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed mb-4">"{aiInsight.summary}"</p>
            <div className="space-y-2">
              {aiInsight.recommendations.map((rec, i) => (
                <div key={i} className="bg-white/5 p-3 rounded-xl border border-white/5 text-xs flex gap-3">
                  <span className="text-blue-500 font-bold">{i+1}</span>
                  <span className="text-gray-400">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="glass-panel p-8 rounded-3xl text-center border-dashed border-white/10">
            <i className="fa-solid fa-microchip text-gray-700 text-4xl mb-4"></i>
            <h4 className="font-bold text-sm text-gray-400">Gemini AI Offline</h4>
            <p className="text-[10px] text-gray-500 mt-2">Push data to generate personalized insights.</p>
          </div>
        )}

        <div className="glass-panel p-4 rounded-3xl">
          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Sync Logs</h4>
          <div className="space-y-1.5 max-h-[100px] overflow-y-auto custom-scrollbar">
            {syncLogs.length === 0 && <p className="text-[10px] text-gray-700">Waiting for events...</p>}
            {syncLogs.map(log => (
              <div key={log.id} className="flex gap-2 text-[10px] font-mono leading-none py-1 border-b border-white/5">
                <span className="text-gray-600">{log.timestamp}</span>
                <span className={`${log.status === 'SUCCESS' ? 'text-green-500' : 'text-orange-500'} font-bold`}>{log.status}</span>
                <span className="text-gray-400 truncate">{log.details}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {showInstallBanner && (
        <div className="fixed bottom-24 left-4 right-4 z-[60] animate-bounce-in">
          <div className="bg-blue-600 rounded-2xl p-4 flex items-center justify-between shadow-2xl border border-blue-400/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600">
                <i className="fa-solid fa-download text-xl"></i>
              </div>
              <div>
                <h4 className="text-white font-bold text-sm">Install HealthBridge</h4>
                <p className="text-blue-100 text-[10px]">Access from your Home Screen</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowInstallBanner(false)} className="text-blue-200 text-xs px-2">Later</button>
              <button onClick={installApp} className="bg-white text-blue-600 px-4 py-2 rounded-xl text-xs font-black uppercase">Install</button>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-2xl border-t border-white/5 p-4 pb-8 z-50">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
          <button onClick={() => setIsLive(!isLive)} className={`flex flex-col items-center gap-1 ${isLive ? 'text-blue-500' : 'text-gray-600'}`}>
            <i className={`fa-solid ${isLive ? 'fa-bolt' : 'fa-pause'} text-xl`}></i>
            <span className="text-[8px] font-bold uppercase">{isLive ? 'Live' : 'Paused'}</span>
          </button>
          
          <button 
            disabled={syncStatus !== SyncStatus.IDLE}
            onClick={handleManualSyncAndPush}
            className={`flex-1 flex items-center justify-center gap-2 h-14 rounded-2xl font-black uppercase tracking-wider transition-all
              ${syncStatus === SyncStatus.IDLE ? 'bg-blue-600 text-white active:scale-95 shadow-xl shadow-blue-900/40' : 'bg-gray-800 text-gray-500'}
            `}
          >
            {syncStatus === SyncStatus.IDLE ? (
              <>
                <i className="fa-solid fa-cloud-arrow-up"></i>
                <span>Push Data</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-circle-notch animate-spin"></i>
                <span>{syncStatus}</span>
              </>
            )}
          </button>
        </div>
      </nav>

      {isDataModalOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#111] rounded-3xl border border-white/10 overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-xl">Health Configuration</h3>
                <button onClick={() => setIsDataModalOpen(false)} className="text-gray-500"><i className="fa-solid fa-xmark text-2xl"></i></button>
              </div>

              <div className="space-y-6">
                <div className="bg-blue-600/10 p-4 rounded-2xl border border-blue-600/20">
                  <h4 className="text-blue-400 font-bold text-xs uppercase mb-2">PWA Deployment Status</h4>
                  <p className="text-[10px] text-gray-400 leading-relaxed mb-4">
                    To connect to your Galaxy Watch 7, host these files on <b>Cloudflare Pages</b> or <b>GitHub Pages</b>. PWAs cannot install from within the AI Studio preview.
                  </p>
                  <button 
                    onClick={() => {
                       navigator.clipboard.writeText(window.location.href);
                       setCopySuccess(true);
                       setTimeout(() => setCopySuccess(false), 2000);
                    }}
                    className={`w-full h-12 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${copySuccess ? 'bg-green-600 text-white border-green-500' : 'bg-white/5 border-white/10 text-white'}`}
                  >
                    <i className={`fa-solid ${copySuccess ? 'fa-check' : 'fa-copy'}`}></i>
                    {copySuccess ? 'Link Copied' : 'Copy Public URL'}
                  </button>
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Manual Data Entry</h4>
                  <textarea 
                    value={rawInput}
                    onChange={(e) => setRawInput(e.target.value)}
                    className="w-full h-32 bg-black/50 border border-white/10 rounded-xl p-3 font-mono text-[10px] text-blue-400 focus:outline-none focus:border-blue-500/50"
                  ></textarea>
                </div>

                <button 
                  onClick={applyActualData}
                  className="w-full bg-white text-black font-black h-14 rounded-2xl active:scale-95 transition-all shadow-xl"
                >
                  Apply & Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
