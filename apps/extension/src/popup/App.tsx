import React, { useState, useEffect } from "react";
import { ShieldCheck, Zap, Settings, CreditCard, ChevronRight, Lock } from "lucide-react";

const App = () => {
  const [token, setToken] = useState("");
  const [runsRemaining, setRunsRemaining] = useState(0);
  const [activationCode, setActivationCode] = useState("");
  const [isActivating, setIsActivating] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(["token", "runsRemaining"], (data: Record<string, any>) => {
      setToken(typeof data.token === "string" ? data.token : "");
      setRunsRemaining(typeof data.runsRemaining === "number" ? data.runsRemaining : 0);
    });
  }, []);

  const handleActivation = async () => {
    setIsActivating(true);
    // Mimic backend validation
    setTimeout(() => {
      const newRuns = runsRemaining + 50;
      chrome.storage.local.set({ runsRemaining: newRuns });
      setRunsRemaining(newRuns);
      setIsActivating(false);
      setActivationCode("");
    }, 1500);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full border border-[#f5a623] flex items-center justify-center">
            <ShieldCheck className="text-[#f5a623]" size={16} />
          </div>
          <span className="font-bold text-sm tracking-tight">ScamSniff</span>
        </div>
        <button className="text-white/30 hover:text-white transition-colors">
          <Settings size={18} />
        </button>
      </div>

      {/* Hero / Status */}
      <div className="bg-[#13151a] border border-white/5 p-5 rounded-[12px] space-y-4">
        {!token ? (
          <div className="space-y-4 py-2">
             <div className="flex items-center space-x-3 text-white/50">
               <Lock size={20} />
               <p className="text-xs font-medium">Please login to the AgentBazaar web app to sync your account.</p>
             </div>
             <button className="w-full bg-[#f5a623] text-black font-bold py-2.5 rounded-[8px] text-xs">
                Login with Wallet
             </button>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center">
               <div className="space-y-1">
                 <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Runs Remaining</p>
                 <p className="text-3xl font-black text-white">{runsRemaining}</p>
               </div>
               <div className="w-12 h-12 rounded-xl bg-[#f5a623]/10 flex items-center justify-center">
                 <Zap className="text-[#f5a623]" size={24} fill="currentColor" />
               </div>
            </div>
            
            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
               <div className="bg-[#f5a623] h-full w-[40%] rounded-full shadow-[0_0_10px_rgba(245,166,35,0.4)]"></div>
            </div>
          </>
        )}
      </div>

      {/* Activation Section */}
      <div className="space-y-3">
        <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest px-1">Activation Code</p>
        <div className="flex space-x-2">
          <input 
            type="text" 
            placeholder="XXXX-XXXX-XXXX"
            value={activationCode}
            onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
            className="flex-1 bg-[#13151a] border border-white/10 rounded-[8px] px-3 py-2 text-xs focus:border-[#f5a623] outline-none transition-colors uppercase font-mono"
          />
          <button 
            onClick={handleActivation}
            disabled={!activationCode || isActivating}
            className="bg-white/5 hover:bg-white/10 text-white font-bold px-4 rounded-[8px] text-xs border border-white/10 transition-all disabled:opacity-50"
          >
            {isActivating ? "..." : "Apply"}
          </button>
        </div>
      </div>

      {/* Secondary Actions */}
      <div className="space-y-2">
        <button className="w-full bg-[#13151a] hover:bg-white/5 border border-white/5 p-3 rounded-[12px] flex items-center justify-between group transition-all">
          <div className="flex items-center space-x-3">
            <CreditCard size={18} className="text-[#f5a623]" />
            <span className="text-xs font-bold">Buy more runs</span>
          </div>
          <ChevronRight size={14} className="text-white/30 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <div className="pt-2 text-center text-[10px] text-white/20 font-medium">
        v1.0.0 • Connected
      </div>
    </div>
  );
};

export default App;
