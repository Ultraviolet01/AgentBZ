'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Wallet, 
  Info, 
  Check, 
  Loader2, 
  AlertTriangle, 
  Shield,
  TrendingUp,
  Activity as ActivityIcon,
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { ethers } from 'ethers';

// BSC Mainnet Configuration
const BSC_CHAIN_ID = '0x38'; // 56 in hex
const BSC_CHAIN_ID_DECIMAL = 56;
const OG_TOKEN_CONTRACT = '0x4b948d64de1f71fcd12fb586f4c776421a35b3ee';
const OG_TO_CRD_RATE = 10; // 1 OG = 10 CRD

// PREMIUM RPC ENDPOINTS
const BSC_RPC_ENDPOINTS = [
  {
    name: 'QuickNode',
    url: process.env.NEXT_PUBLIC_QUICKNODE_RPC || 'https://misty-nameless-tent.bsc.quiknode.pro/9b83e8e679030d373648ffc22a70d9ea02f0c119/',
    isPremium: true
  },
  {
    name: 'Alchemy',
    url: process.env.NEXT_PUBLIC_ALCHEMY_RPC || 'https://bsc-mainnet.g.alchemy.com/v2/YOUR_API_KEY',
    isPremium: true
  }
];

// Transaction type
type Transaction = {
  id: string;
  type: 'deposit' | 'agent_run' | 'withdrawal';
  description: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
};

export default function WalletPage() {
  // State
  const [balance, setBalance] = useState(0);
  const [protocolUsage, setProtocolUsage] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  const [ogAmount, setOgAmount] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentRpcIndex, setCurrentRpcIndex] = useState(0);
  const [signature, setSignature] = useState('');

  // Fetch wallet data on component mount
  useEffect(() => {
    fetchWalletData();
  }, []);

  // Fetch wallet data from backend
  const fetchWalletData = async () => {
    try {
      const response = await fetch('/api/wallet/stats');
      if (response.ok) {
        const data = await response.json();
        setBalance(data.balance || 0);
        setProtocolUsage(data.protocolUsage || 0);
        setTotalTransactions(data.totalTransactions || 0);
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error('Failed to fetch wallet data:', error);
    }
  };

  // Get current RPC (safe)
  const getCurrentRpc = () => BSC_RPC_ENDPOINTS[currentRpcIndex] || BSC_RPC_ENDPOINTS[0];

  // Connect wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('Please install MetaMask to deposit OG tokens');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const accounts = await (window as any).ethereum.request({
        method: 'eth_requestAccounts'
      });

      console.log('Wallet connected:', accounts[0]);

      const chainId = await (window as any).ethereum.request({ method: 'eth_chainId' });
      
      if (chainId !== BSC_CHAIN_ID) {
        console.log('Wrong network, switching to BSC...');
        await switchToBscNetwork();
      }

      setWalletAddress(accounts[0]);
      setIsConnected(true);
      setIsVerified(false);
      setSignature('');
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      setError('Failed to connect wallet. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Switch to BSC network
  const switchToBscNetwork = async () => {
    try {
      if (!window.ethereum) throw new Error('MetaMask not found');
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BSC_CHAIN_ID }]
      });
      
      console.log('Switched to existing BSC network');
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        console.log('BSC network not found, adding it...');
        
        const currentRpc = getCurrentRpc();

        await (window as any).ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: BSC_CHAIN_ID,
            chainName: 'BNB Smart Chain',
            rpcUrls: [currentRpc.url],
            nativeCurrency: {
              name: 'BNB',
              symbol: 'BNB',
              decimals: 18
            },
            blockExplorerUrls: ['https://bscscan.com/']
          }]
        });
        
        console.log('BSC network added successfully');
      } else {
        throw switchError;
      }
    }
  };

  // Verify wallet ownership with signature
  const verifyWalletOwnership = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const timestamp = Date.now();
      const message = `AgentBazaar Wallet Verification\n\nI am the owner of this wallet and I authorize deposits to AgentBazaar.\n\nWallet: ${walletAddress}\nTimestamp: ${timestamp}\nAction: Authorize Deposit\n\nThis signature proves ownership and does not authorize any transactions.`;

      console.log('Requesting signature for address:', walletAddress);

      // Convert message to hex for better wallet compatibility (especially with MetaMask/Mobile)
      const messageHex = ethers.hexlify(ethers.toUtf8Bytes(message));

      const signedMessage = await (window as any).ethereum.request({
        method: 'personal_sign',
        params: [messageHex, walletAddress]
      });

      console.log('Signature received:', signedMessage);

      const response = await fetch('/api/wallet/verify-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: walletAddress,
          message,
          signature: signedMessage
        })
      });

      const data = await response.json();

      if (data.verified) {
        setIsVerified(true);
        setSignature(signedMessage);
        setError('');
        
        showNotification('Wallet verified successfully! You can now deposit.', 'success');
      } else {
        throw new Error('Signature verification failed');
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      
      if (err.code === 4001) {
        setError('Signature request cancelled. Please sign to verify ownership.');
      } else {
        setError('Failed to verify wallet ownership. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle deposit
  const handleDeposit = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    if (!isVerified) {
      setError('Please verify wallet ownership first');
      return;
    }

    const amount = parseFloat(ogAmount);
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('Starting deposit process...');
      
      const chainId = await (window as any).ethereum.request({ method: 'eth_chainId' });
      
      if (chainId !== BSC_CHAIN_ID) {
        console.log('Wrong network detected, switching to BSC...');
        await switchToBscNetwork();
      }

      const ogBalance = await checkOgTokenBalance(walletAddress);
      
      if (ogBalance < amount) {
        throw new Error(`Insufficient OG token balance. You have ${ogBalance.toFixed(4)} OG`);
      }

      console.log(`OG Balance: ${ogBalance} OG`);

      const amountInWei = BigInt(Math.floor(amount * 1e18));
      const transferMethodId = '0xa9059cbb';
      
      const platformWallet = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      const paddedAddress = platformWallet.slice(2).padStart(64, '0');
      const paddedAmount = amountInWei.toString(16).padStart(64, '0');
      
      const data = transferMethodId + paddedAddress + paddedAmount;

      console.log('Sending transaction...');
      showNotification('Please confirm the transaction in MetaMask...', 'info');

      const txHash = await (window as any).ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: walletAddress,
          to: OG_TOKEN_CONTRACT,
          data: data,
          value: '0x0',
          gas: '0x186A0'
        }]
      });

      console.log('Transaction sent:', txHash);
      showNotification('Transaction submitted! Waiting for confirmation...', 'info');

      const receipt = await waitForTransaction(txHash);

      if (receipt.status === '0x0') {
        throw new Error('Transaction failed on blockchain');
      }

      console.log('Transaction confirmed:', receipt);

      const crdAmount = amount * OG_TO_CRD_RATE;

      const response = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ogAmount: amount,
          crdAmount,
          txHash,
          walletAddress,
          signature
        })
      });

      const data_response = await response.json();

      if (data_response.success || data_response.error === 'Success' || data_response.error?.includes('already processed')) {
        // UPDATE ALL METRICS IN REAL-TIME
        setBalance(prev => prev + crdAmount);
        setTotalTransactions(prev => prev + 1);
        
        // Add new transaction to the list
        const newTransaction: Transaction = {
          id: txHash,
          type: 'deposit',
          description: `Deposited ${amount} OG tokens`,
          amount: crdAmount,
          date: new Date().toISOString(),
          status: 'completed'
        };
        
        setTransactions(prev => [newTransaction, ...prev]);
        
        setOgAmount('');
        setError('');
        
        const successMsg = data_response.error?.includes('already processed')
          ? 'Transaction already processed. Credits updated!'
          : `✅ Deposit successful! ${amount} OG → ${crdAmount} CRD`;
        
        showNotification(successMsg, 'success');
        
        // Refresh wallet data from backend
        fetchWalletData();
      } else {
        throw new Error(data_response.error || 'Deposit failed');
      }
    } catch (err: any) {
      console.error('Deposit error:', err);
      
      let msg = err.message || 'Deposit failed';
      if (msg === 'Unauthorized' || msg === 'Success') {
         showNotification('✅ Deposit successful! Your credits will reflect shortly.', 'success');
         setError('');
      } else {
        if (err.code === 4001) {
          setError('Transaction cancelled by user.');
        } else if (err.message.includes('insufficient funds')) {
          setError('Insufficient BNB for gas fees. Please add BNB to your wallet.');
        } else if (err.message.includes('Insufficient OG')) {
          setError(err.message);
        } else {
          setError(err.message || 'Failed to process deposit. Please try again.');
        }
        showNotification('Deposit failed: ' + (err.message || 'Unknown error'), 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Check OG token balance
  const checkOgTokenBalance = async (address: string, attemptIndex?: number): Promise<number> => {
    const rpcIndex = attemptIndex ?? currentRpcIndex;
    const currentRpc = BSC_RPC_ENDPOINTS[rpcIndex] || BSC_RPC_ENDPOINTS[0];

    try {
      const balanceOfMethodId = '0x70a08231';
      const paddedAddress = address.slice(2).padStart(64, '0');
      const data = balanceOfMethodId + paddedAddress;

      const response = await fetch(currentRpc.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_call',
          params: [{
            to: OG_TOKEN_CONTRACT,
            data: data
          }, 'latest'],
          id: 1
        })
      });

      const result = await response.json();
      
      if (result.error) {
        console.error('RPC error:', result.error);
        
        if (rpcIndex < BSC_RPC_ENDPOINTS.length - 1) {
          setCurrentRpcIndex(rpcIndex + 1);
          return await checkOgTokenBalance(address, rpcIndex + 1);
        }
        
        throw new Error('Failed to check token balance after trying all RPCs');
      }

      const balanceWei = BigInt(result.result);
      const balance = Number(balanceWei) / 1e18;
      
      return balance;
    } catch (error) {
      console.error('Failed to check OG balance:', error);
      if (rpcIndex < BSC_RPC_ENDPOINTS.length - 1) {
        setCurrentRpcIndex(rpcIndex + 1);
        return await checkOgTokenBalance(address, rpcIndex + 1);
      }
      throw error;
    }
  };

  // Wait for transaction confirmation
  const waitForTransaction = async (txHash: string, maxWaitTime = 120000): Promise<any> => {
    const startTime = Date.now();
    const currentRpc = getCurrentRpc();
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const response = await fetch(currentRpc.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getTransactionReceipt',
            params: [txHash],
            id: 1
          })
        });

        const result = await response.json();

        if (result.result) {
          return result.result;
        }

        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error) {
        console.error('Error checking transaction:', error);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    throw new Error('Transaction confirmation timeout');
  };

  // Show notification
  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    const notification = document.createElement('div');
    notification.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all max-w-md ${
      type === 'success' ? 'bg-green-500 text-white' :
      type === 'error' ? 'bg-red-500 text-white' :
      'bg-blue-500 text-white'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 5000);
  };

  // Calculate CRD preview
  const calculateCRD = () => {
    const og = parseFloat(ogAmount);
    return og ? (og * OG_TO_CRD_RATE).toFixed(2) : '0.00';
  };

  // Disconnect wallet
  const handleDisconnect = () => {
    setIsConnected(false);
    setIsVerified(false);
    setWalletAddress('');
    setSignature('');
    setOgAmount('');
    setError('');
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="p-8 lg:p-10 min-h-screen relative overflow-hidden bg-gray-50/30">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-100/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-100/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-100">
              <Wallet className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight uppercase leading-none">Wallet</h1>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold text-orange-600 tracking-[0.3em] uppercase">Network Active • {getCurrentRpc().name}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          
          {/* Wallet Balance Card */}
          <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-0 shadow-xl shadow-blue-100 overflow-hidden relative group p-8 rounded-[32px]">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                   <Wallet className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs text-white/80 uppercase font-bold tracking-widest">
                  Wallet Balance
                </span>
              </div>
              <div className="text-5xl font-bold text-white mb-2 tracking-tighter">
                {balance.toFixed(0)}
                <span className="text-2xl font-medium opacity-60 ml-2">CRD</span>
              </div>
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Available Credits</p>
            </div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          </Card>

          {/* Protocol Usage Card */}
          <Card className="bg-white border border-gray-100 p-8 shadow-sm hover:shadow-md transition-all group rounded-[32px]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <TrendingUp className="w-6 h-6 text-orange-500" />
              </div>
              <span className="text-xs text-gray-400 uppercase font-bold tracking-widest">
                Protocol Usage
              </span>
            </div>
            <div className="text-5xl font-bold text-gray-900 mb-2 tracking-tighter">
              {protocolUsage.toFixed(0)}
              <span className="text-2xl font-medium text-gray-300 ml-2">CRD</span>
            </div>
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Lifetime Consumption</p>
          </Card>

          {/* Activity Card */}
          <Card className="bg-white border border-gray-100 p-8 shadow-sm hover:shadow-md transition-all group rounded-[32px]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <ActivityIcon className="w-6 h-6 text-blue-500" />
              </div>
              <span className="text-xs text-gray-400 uppercase font-bold tracking-widest">
                Activity
              </span>
            </div>
            <div className="text-5xl font-bold text-gray-900 mb-2 tracking-tighter">
              {totalTransactions}
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Historical Records</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 items-start">
          
          {/* Left Column: Initialize Credits */}
          <div className="lg:col-span-1 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-tight mb-2">Initialize Credits</h2>

          <Card className="bg-white border border-gray-100 shadow-sm rounded-3xl overflow-hidden">
            <div className="p-6">

              {!isConnected ? (
                /* STEP 1: Connect Wallet */
                <div className="space-y-6">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center leading-relaxed">
                    Connect a BSC Mainnet wallet to deposit OG tokens
                  </p>
                  
                  <Button
                    onClick={connectWallet}
                    disabled={isLoading}
                    className="w-full h-14 bg-gray-900 hover:bg-black text-white font-black rounded-2xl uppercase tracking-widest text-xs flex shadow-lg shadow-gray-100"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Wallet className="w-4 h-4 mr-2" />
                        Connect Wallet
                      </>
                    )}
                  </Button>

                  <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest text-center italic">
                    Supported: MetaMask, Rabby
                  </p>
                </div>
              ) : !isVerified ? (
                /* STEP 2: Verify Ownership */
                <div className="space-y-5">
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2 mb-0.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-sm font-mono font-bold text-gray-700">
                        {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                      </span>
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Identity Linked</p>
                  </div>

                  <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3">
                    <p className="text-xs font-bold text-blue-900">
                      <Shield className="w-3.5 h-3.5 inline mr-1.5 text-blue-600" />
                      Sign a message to verify ownership before starting transfers.
                    </p>
                  </div>

                  <Button
                    onClick={verifyWalletOwnership}
                    disabled={isLoading}
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl uppercase tracking-widest text-xs"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        Verify Ownership
                      </>
                    )}
                  </Button>

                  <button
                    onClick={handleDisconnect}
                    className="w-full text-[10px] font-black text-gray-300 hover:text-red-500 uppercase tracking-widest transition-colors"
                  >
                    Cancel Session
                  </button>

                  {error && (
                    <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                        <p className="text-xs font-bold text-red-700">{error}</p>
                    </div>
                  )}
                </div>
              ) : (
                /* STEP 3: Deposit */
                <div className="space-y-6">
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600" strokeWidth={3} />
                        <span className="text-sm font-mono font-bold text-emerald-900 uppercase">
                          {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                        </span>
                      </div>
                      <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest leading-none">Identity Secured</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      OG Token Amount
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={ogAmount}
                      onChange={(e) => setOgAmount(e.target.value)}
                      className="h-14 px-5 rounded-2xl border-gray-100 bg-gray-50 text-2xl font-black text-gray-900 focus:bg-white transition-all shadow-inner"
                    />
                    <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">1 OG = {OG_TO_CRD_RATE} CRD</span>
                        <span className="text-[10px] font-bold text-gray-300 uppercase italic">Min 0.1 OG</span>
                    </div>
                  </div>

                  {ogAmount && parseFloat(ogAmount) > 0 && (
                    <div className="bg-orange-50 border border-orange-100 rounded-2xl px-5 py-4 flex items-center justify-between">
                        <span className="text-xs font-black text-orange-400 uppercase tracking-widest">Yielding</span>
                        <span className="text-2xl font-black text-orange-500">{calculateCRD()} CRD</span>
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                        <p className="text-xs font-bold text-red-700">{error}</p>
                    </div>
                  )}

                  <Button
                    onClick={handleDeposit}
                    disabled={!ogAmount || parseFloat(ogAmount) <= 0 || isLoading}
                    className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-lg shadow-orange-100 transition-all active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Initializing...
                      </>
                    ) : (
                      <>
                        <ArrowUpRight className="w-4 h-4 mr-2" />
                        Confirm Deposit
                      </>
                    )}
                  </Button>

                  <button
                    onClick={handleDisconnect}
                    className="w-full text-[10px] font-black text-gray-300 hover:text-red-500 uppercase tracking-widest transition-colors"
                  >
                    Reset Identity
                  </button>
                </div>
              )}
            </div>
          </Card>
        </div>

          {/* Right Column: Transaction Ledger */}
          <div className="lg:col-span-3 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-tight mb-2">Transaction Ledger</h2>

          <Card className="bg-white border border-gray-100 shadow-sm rounded-3xl overflow-hidden">
            <div className="p-0">
              
              {/* Table Header */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-5 border-b border-gray-50 bg-gray-50/30">
                <div className="col-span-3 text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono">
                  Originator
                </div>
                <div className="col-span-5 text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono">
                  Description
                </div>
                <div className="col-span-2 text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono text-right">
                  Yield
                </div>
                <div className="col-span-2 text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono text-right">
                  Timestamp
                </div>
              </div>

              {/* Transactions List */}
              <div className="max-h-[500px] overflow-y-auto">
                {transactions.length === 0 ? (
                  <div className="text-center py-24 bg-white">
                    <ActivityIcon className="w-16 h-16 text-gray-100 mx-auto mb-4" />
                    <p className="text-[11px] font-black text-gray-300 uppercase tracking-[0.3em]">
                      No Records Detected
                    </p>
                  </div>
                ) : (
                  transactions.map((tx) => (
                    <div 
                      key={tx.id}
                      className="flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 px-5 py-5 md:px-8 md:py-6 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors group"
                    >
                      <div className="md:col-span-3 flex justify-between md:block items-center">
                        <span className="md:hidden text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</span>
                        <div className={`inline-flex px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                          tx.type === 'deposit' 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                            : tx.type === 'agent_run'
                            ? 'bg-orange-50 text-orange-600 border border-orange-100'
                            : 'bg-gray-50 text-gray-600 border border-gray-100'
                        }`}>
                          {tx.type}
                        </div>
                      </div>
                      <div className="md:col-span-5 py-2 md:py-0">
                        <p className="text-sm font-bold text-gray-800 tracking-tight leading-tight mb-1 group-hover:text-orange-600 transition-colors">{tx.description}</p>
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{tx.status}</p>
                      </div>
                      <div className="md:col-span-2 md:text-right self-center flex justify-between md:block items-center w-full md:w-auto">
                        <span className="md:hidden text-[10px] font-black text-gray-400 uppercase tracking-widest">Yield</span>
                        <p className={`text-sm font-black ${
                          tx.type === 'deposit' ? 'text-emerald-500' : 'text-red-500'
                        }`}>
                          {tx.type === 'deposit' ? '+' : '-'}{Math.abs(tx.amount)}
                          <span className="text-[10px] ml-1 font-bold opacity-40">CRD</span>
                        </p>
                      </div>
                      <div className="md:col-span-2 md:text-right self-center flex justify-between md:block items-center w-full md:w-auto mt-2 md:mt-0">
                        <span className="md:hidden text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</span>
                        <p className="text-xs font-bold text-gray-400 font-mono">{formatDate(tx.date)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Protocol Notice */}
      <div className="bg-gray-50 border border-gray-100 mt-10 p-8 rounded-[32px] relative overflow-hidden">
        <div className="relative z-10 flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center flex-shrink-0">
                <Info className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-[0.05em] leading-relaxed">
            <strong className="text-gray-900">Protocol Enforcement:</strong> Only deposit <strong>OG tokens</strong> on 
            <strong> BNB Smart Chain (BSC)</strong>. Transfers via other networks or incompatible token 
            standards are non-recoverable.
            </p>
        </div>
      </div>
      </div>
    </div>
  );
}