import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { ShieldCheck, Zap, Settings, CreditCard, ChevronRight, Lock } from "lucide-react";
const App = () => {
    const [token, setToken] = useState("");
    const [runsRemaining, setRunsRemaining] = useState(0);
    const [activationCode, setActivationCode] = useState("");
    const [isActivating, setIsActivating] = useState(false);
    useEffect(() => {
        chrome.storage.local.get(["token", "runsRemaining"], (data) => {
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
    return (_jsxs("div", { className: "p-6 space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: "w-8 h-8 rounded-full border border-[#f5a623] flex items-center justify-center", children: _jsx(ShieldCheck, { className: "text-[#f5a623]", size: 16 }) }), _jsx("span", { className: "font-bold text-sm tracking-tight", children: "ScamSniff" })] }), _jsx("button", { className: "text-white/30 hover:text-white transition-colors", children: _jsx(Settings, { size: 18 }) })] }), _jsx("div", { className: "bg-[#13151a] border border-white/5 p-5 rounded-[12px] space-y-4", children: !token ? (_jsxs("div", { className: "space-y-4 py-2", children: [_jsxs("div", { className: "flex items-center space-x-3 text-white/50", children: [_jsx(Lock, { size: 20 }), _jsx("p", { className: "text-xs font-medium", children: "Please login to the AgentBazaar web app to sync your account." })] }), _jsx("button", { className: "w-full bg-[#f5a623] text-black font-bold py-2.5 rounded-[8px] text-xs", children: "Login with Wallet" })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-[10px] font-bold text-white/50 uppercase tracking-widest", children: "Runs Remaining" }), _jsx("p", { className: "text-3xl font-black text-white", children: runsRemaining })] }), _jsx("div", { className: "w-12 h-12 rounded-xl bg-[#f5a623]/10 flex items-center justify-center", children: _jsx(Zap, { className: "text-[#f5a623]", size: 24, fill: "currentColor" }) })] }), _jsx("div", { className: "w-full bg-white/5 h-1.5 rounded-full overflow-hidden", children: _jsx("div", { className: "bg-[#f5a623] h-full w-[40%] rounded-full shadow-[0_0_10px_rgba(245,166,35,0.4)]" }) })] })) }), _jsxs("div", { className: "space-y-3", children: [_jsx("p", { className: "text-[10px] font-bold text-white/50 uppercase tracking-widest px-1", children: "Activation Code" }), _jsxs("div", { className: "flex space-x-2", children: [_jsx("input", { type: "text", placeholder: "XXXX-XXXX-XXXX", value: activationCode, onChange: (e) => setActivationCode(e.target.value.toUpperCase()), className: "flex-1 bg-[#13151a] border border-white/10 rounded-[8px] px-3 py-2 text-xs focus:border-[#f5a623] outline-none transition-colors uppercase font-mono" }), _jsx("button", { onClick: handleActivation, disabled: !activationCode || isActivating, className: "bg-white/5 hover:bg-white/10 text-white font-bold px-4 rounded-[8px] text-xs border border-white/10 transition-all disabled:opacity-50", children: isActivating ? "..." : "Apply" })] })] }), _jsx("div", { className: "space-y-2", children: _jsxs("button", { className: "w-full bg-[#13151a] hover:bg-white/5 border border-white/5 p-3 rounded-[12px] flex items-center justify-between group transition-all", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx(CreditCard, { size: 18, className: "text-[#f5a623]" }), _jsx("span", { className: "text-xs font-bold", children: "Buy more runs" })] }), _jsx(ChevronRight, { size: 14, className: "text-white/30 group-hover:translate-x-1 transition-transform" })] }) }), _jsx("div", { className: "pt-2 text-center text-[10px] text-white/20 font-medium", children: "v1.0.0 \u2022 Connected" })] }));
};
export default App;
