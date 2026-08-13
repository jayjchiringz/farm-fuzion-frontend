// src/components/Wallet/WalletModal.tsx

import React, { useEffect, useState } from "react";
import { api } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import TransactionTable from "./TransactionTable";
import { formatCurrencyKES } from "../../utils/format";

export default function WalletModal({
  farmerId,
  onClose,
}: {
  farmerId: string;
  onClose: () => void;
}) {
  const { 
    walletStatus, 
    authenticateWallet, 
    setupWallet, 
    verifyWalletSetup, 
    refreshWalletStatus,
    requestWalletOTP,
    verifyWalletOTP,
  } = useAuth();

  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"mpesa" | "airtel">("mpesa");
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<"deposit" | "withdraw" | "transfer" | "pay">("deposit");
  const [destination, setDestination] = useState("");
  const [transferPreview, setTransferPreview] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [payType, setPayType] = useState<"till" | "paybill">("till");
  const [paybillNo, setPaybillNo] = useState("");
  const [accNo, setAccNo] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  // PIN Authentication states
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinLoading, setPinLoading] = useState(false);

  // OTP Authentication states
  const [showOTPPrompt, setShowOTPPrompt] = useState(false);
  const [otpStep, setOtpStep] = useState<'request' | 'verify'>('request');
  const [otpId, setOtpId] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpResendTimer, setOtpResendTimer] = useState(0);

  // Wallet setup states
  const [showSetup, setShowSetup] = useState(false);
  const [setupPin, setSetupPin] = useState("");
  const [setupOtpId, setSetupOtpId] = useState("");
  const [setupOtpCode, setSetupOtpCode] = useState("");
  const [setupStep, setSetupStep] = useState<"pin" | "otp">("pin");
  const [setupLoading, setSetupLoading] = useState(false);

  // src/components/Wallet/WalletModal.tsx - Update useEffect

  useEffect(() => {
    console.log("💰 WalletModal: Current status:", walletStatus);

    if (walletStatus.authenticated) {
      setShowOTPPrompt(false);
      setShowPinPrompt(false);
      setShowSetup(false);
      fetchBalance();
    } else if (walletStatus.requiresOTP) {
      // ✅ Show OTP prompt for existing wallets
      setShowOTPPrompt(true);
      setOtpStep('request');
      setShowPinPrompt(false);
      setShowSetup(false);
    } else if (walletStatus.needsPin) {
      // Fallback to PIN prompt
      setShowPinPrompt(true);
      setShowOTPPrompt(false);
      setShowSetup(false);
    } else if (walletStatus.needsSetup) {
      setShowSetup(true);
      setShowOTPPrompt(false);
      setShowPinPrompt(false);
    } else {
      refreshWalletStatus();
    }
  }, [walletStatus]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (otpResendTimer > 0) {
      const interval = setInterval(() => {
        setOtpResendTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [otpResendTimer]);

  const fetchBalance = async () => {
    try {
      const res = await api.get(`/wallet/${farmerId}/balance`);
      setBalance(res.data?.balance || 0);
    } catch (error) {
      console.error("Error fetching balance:", error);
      setBalance(0);
    }
  };

  // ==================== PIN AUTHENTICATION ====================

  const handlePinAuth = async () => {
    if (pin.length !== 4) {
      setPinError("PIN must be 4 digits");
      return;
    }

    setPinLoading(true);
    setPinError("");

    try {
      const success = await authenticateWallet(pin);
      if (success) {
        setShowPinPrompt(false);
        setPin("");
        await fetchBalance();
      } else {
        setPinError("Invalid PIN. Please try again.");
      }
    } catch (err) {
      setPinError("Authentication failed. Please try again.");
    } finally {
      setPinLoading(false);
    }
  };

  // ==================== OTP AUTHENTICATION ====================

  const handleRequestOTP = async () => {
    setOtpLoading(true);
    setOtpError('');
    
    try {
      const result = await requestWalletOTP(farmerId);
      setOtpId(result.otpId);
      setOtpStep('verify');
      setOtpResendTimer(60);
      alert('OTP sent to your phone! Please enter the code.');
    } catch (err) {
      setOtpError('Failed to send OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length < 4) {
      setOtpError('Please enter the full OTP code');
      return;
    }
    
    setOtpLoading(true);
    setOtpError('');
    
    try {
      const success = await verifyWalletOTP(farmerId, otpId, otpCode);
      if (success) {
        setShowOTPPrompt(false);
        setOtpCode('');
        await fetchBalance();
      } else {
        setOtpError('Invalid OTP code. Please try again.');
      }
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || 'Verification failed';
      setOtpError(message);
    } finally {
      setOtpLoading(false);
    }
  };

  // ==================== SETUP METHODS ====================

  const handleSetupPin = async () => {
    if (setupPin.length !== 4) {
      alert("PIN must be 4 digits");
      return;
    }

    setSetupLoading(true);
    try {
      const result = await setupWallet(setupPin);
      setSetupOtpId(result.otpId);
      setSetupStep("otp");
    } catch (err) {
      alert("Failed to setup wallet. Please try again.");
    } finally {
      setSetupLoading(false);
    }
  };

  const handleVerifySetup = async () => {
    if (setupOtpCode.length < 4) {
      alert("Please enter the OTP code");
      return;
    }

    setSetupLoading(true);
    try {
      const success = await verifyWalletSetup(setupOtpId, setupOtpCode);
      if (success) {
        setShowSetup(false);
        await fetchBalance();
        alert("🎉 Wallet setup complete! You can now use your wallet.");
      } else {
        alert("Invalid OTP code. Please try again.");
      }
    } catch (err) {
      alert("Verification failed. Please try again.");
    } finally {
      setSetupLoading(false);
    }
  };

  // ==================== SEARCH ====================

  const searchFarmers = async (q: string) => {
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await api.get(`/wallet/search-farmers?q=${q}`);
      setSearchResults(res.data || []);
    } catch (err) {
      console.error("Farmer search failed", err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // ==================== RENDER: PIN PROMPT ====================

  if (showPinPrompt) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-brand-dark rounded-xl w-full max-w-md p-6 shadow-2xl">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🔐</div>
            <h2 className="text-2xl font-bold">Enter Wallet PIN</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Enter your Unipesa wallet PIN to access your funds
            </p>
          </div>

          {pinError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg mb-4 text-sm">
              {pinError}
            </div>
          )}

          <input
            type="password"
            placeholder="Enter 4-digit PIN"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.replace(/\D/g, '').slice(0, 4));
              setPinError('');
            }}
            maxLength={4}
            className="w-full border p-4 rounded-lg mb-4 focus:ring-2 focus:ring-brand-green outline-none text-center text-2xl tracking-widest"
            autoFocus
          />

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePinAuth}
              disabled={pinLoading || pin.length !== 4}
              className="flex-1 px-4 py-3 rounded-lg bg-brand-green text-white font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {pinLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  Authenticating...
                </span>
              ) : (
                'Unlock Wallet'
              )}
            </button>
          </div>

          {/* Sandbox hint */}
          {process.env.NODE_ENV !== 'production' && (
            <p className="text-xs text-center text-gray-500 mt-4">
              Sandbox: Try PIN 1234, 0000, or 0928
            </p>
          )}
        </div>
      </div>
    );
  }

  // ==================== RENDER: OTP PROMPT ====================

  if (showOTPPrompt) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-brand-dark rounded-xl w-full max-w-md p-6 shadow-2xl">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">📧</div>
            <h2 className="text-2xl font-bold">
              {otpStep === 'request' ? 'Authenticate Wallet' : 'Enter OTP'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              {otpStep === 'request' 
                ? 'We\'ll send a one-time password to your registered email' 
                : `Enter the 6-digit code sent to your email`}
            </p>
          </div>

          {otpError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg mb-4 text-sm">
              {otpError}
            </div>
          )}

          {otpStep === 'request' ? (
            <button
              onClick={handleRequestOTP}
              disabled={otpLoading}
              className="w-full px-4 py-3 rounded-lg bg-brand-green text-white font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {otpLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  Sending...
                </span>
              ) : (
                'Send OTP to Email'
              )}
            </button>
          ) : (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 text-center">
                Check your email for the 6-digit code
              </p>
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otpCode}
                onChange={(e) => {
                  setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                  setOtpError('');
                }}
                maxLength={6}
                className="w-full border p-4 rounded-lg mb-4 focus:ring-2 focus:ring-brand-green outline-none text-center text-2xl tracking-widest"
                autoFocus
              />
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowOTPPrompt(false);
                    setOtpStep('request');
                    setOtpCode('');
                  }}
                  className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVerifyOTP}
                  disabled={otpLoading || otpCode.length < 4}
                  className="flex-1 px-4 py-3 rounded-lg bg-brand-green text-white font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {otpLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                      Verifying...
                    </span>
                  ) : (
                    'Verify & Unlock'
                  )}
                </button>
              </div>

              {otpResendTimer > 0 ? (
                <p className="text-sm text-center text-gray-500 mt-4">
                  Resend available in {otpResendTimer}s
                </p>
              ) : (
                <button
                  onClick={handleRequestOTP}
                  className="text-sm text-center text-brand-green hover:underline mt-4 w-full"
                >
                  Resend OTP to Email
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // ==================== RENDER: SETUP MODAL ====================

  if (showSetup) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-brand-dark rounded-xl w-full max-w-md p-6 shadow-2xl">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🏦</div>
            <h2 className="text-2xl font-bold">
              {setupStep === "pin" ? "Setup Your Wallet" : "Verify OTP"}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              {setupStep === "pin"
                ? "Create a 4-digit PIN to secure your Unipesa wallet"
                : "Enter the OTP sent to your phone to complete setup"}
            </p>
          </div>

          {setupStep === "pin" ? (
            <>
              <input
                type="password"
                placeholder="Create 4-digit PIN"
                value={setupPin}
                onChange={(e) => setSetupPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                maxLength={4}
                className="w-full border p-4 rounded-lg mb-4 focus:ring-2 focus:ring-brand-green outline-none text-center text-2xl tracking-widest"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSetupPin}
                  disabled={setupLoading || setupPin.length !== 4}
                  className="flex-1 px-4 py-3 rounded-lg bg-brand-green text-white font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {setupLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                      Creating...
                    </span>
                  ) : (
                    'Create Wallet'
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                We sent an OTP to your registered phone number
              </p>
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={setupOtpCode}
                onChange={(e) => setSetupOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="w-full border p-4 rounded-lg mb-4 focus:ring-2 focus:ring-brand-green outline-none text-center text-2xl tracking-widest"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setSetupStep("pin")}
                  className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleVerifySetup}
                  disabled={setupLoading || setupOtpCode.length < 4}
                  className="flex-1 px-4 py-3 rounded-lg bg-brand-green text-white font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {setupLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                      Verifying...
                    </span>
                  ) : (
                    'Verify & Complete'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ==================== RENDER: MAIN WALLET ====================

  if (!walletStatus.authenticated) {
    return null;
  }

  type WalletAction = "deposit" | "withdraw" | "transfer" | "pay";

  const handleSubmit = () => {
    setLoading(true);

    if (action === "deposit") {
      api
        .post(`/wallet/topup/${method}`, {
          farmer_id: farmerId,
          amount: Number(amount),
        })
        .then(() => {
          alert("✅ Top-up successful!");
          fetchBalance();
          triggerRefresh();
          setAmount("");
        })
        .catch(() => alert("❌ Top-up failed"))
        .finally(() => setLoading(false));
    } else if (action === "withdraw") {
      api
        .post(`/wallet/withdraw/${method}`, {
          farmer_id: farmerId,
          amount: Number(amount),
          destination,
        })
        .then(() => {
          alert("✅ Withdrawal successful!");
          fetchBalance();
          triggerRefresh();
          setAmount("");
          setDestination("");
        })
        .catch(() => alert("❌ Withdrawal failed"))
        .finally(() => setLoading(false));
    } else if (action === "transfer") {
      if (!transferPreview) {
        api
          .post("/wallet/transfer", {
            farmer_id: farmerId,
            amount: Number(amount),
            destination,
          })
          .then((res) => {
            if (res.data.preview) {
              setTransferPreview(res.data);
            } else {
              alert("Unexpected response");
            }
          })
          .catch(() => alert("❌ Transfer preview failed"))
          .finally(() => setLoading(false));
      } else {
        api
          .post("/wallet/transfer", {
            farmer_id: farmerId,
            amount: Number(amount),
            destination,
            confirm: true,
          })
          .then(() => {
            alert("✅ Transfer successful!");
            fetchBalance();
            triggerRefresh();
            setTransferPreview(null);
            setAmount("");
            setDestination("");
            setSearchQuery("");
          })
          .catch(() => alert("❌ Transfer failed"))
          .finally(() => setLoading(false));
      }
    } else if (action === "pay") {
      let finalDestination = "";
      if (payType === "till") {
        finalDestination = `TILL:${destination}`;
      } else if (payType === "paybill") {
        finalDestination = `PAYBILL:${paybillNo}|ACC:${accNo}`;
      }

      api
        .post("/wallet/payment", {
          farmer_id: farmerId,
          amount: Number(amount),
          destination: finalDestination,
          merchant: finalDestination,
        })
        .then(() => {
          alert("✅ Payment successful!");
          fetchBalance();
          triggerRefresh();
          setAmount("");
          setDestination("");
          setPaybillNo("");
          setAccNo("");
        })
        .catch(() => alert("❌ Payment failed"))
        .finally(() => setLoading(false));
    }
  };

  const renderActionForm = () => (
    <>
      <div className="flex gap-3 mb-4">
        <input
          type="number"
          placeholder={`Enter amount to ${action}`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="flex-1 border p-3 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent outline-none"
          min="1"
          step="0.01"
        />

        {(action === "deposit" || action === "withdraw") && (
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as "mpesa" | "airtel")}
            className="border p-3 rounded-lg min-w-[120px] bg-white dark:bg-gray-800 focus:ring-2 focus:ring-brand-green outline-none"
          >
            <option value="mpesa">📱 MPESA</option>
            <option value="airtel">📞 Airtel</option>
          </select>
        )}
      </div>

      {action === "transfer" && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Select Recipient Farmer</label>
          <input
            type="text"
            placeholder="Search by name or phone number..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              searchFarmers(e.target.value);
            }}
            className="border p-3 rounded-lg w-full mb-2 focus:ring-2 focus:ring-brand-green outline-none"
          />

          {searching && (
            <div className="flex items-center gap-2 text-sm text-gray-500 p-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-green"></div>
              Searching...
            </div>
          )}

          {searchResults.length > 0 && (
            <ul className="border rounded-lg max-h-40 overflow-y-auto bg-white dark:bg-gray-800 shadow-lg">
              {searchResults.map((farmer) => (
                <li
                  key={farmer.id}
                  onClick={() => {
                    setDestination(farmer.id);
                    setSearchQuery(
                      `${farmer.first_name} ${farmer.last_name} (${farmer.mobile})`
                    );
                    setSearchResults([]);
                  }}
                  className="p-3 hover:bg-brand-green hover:text-white cursor-pointer text-sm border-b last:border-b-0 transition-colors"
                >
                  <div className="font-medium">{farmer.first_name} {farmer.last_name}</div>
                  <div className="text-xs opacity-75">{farmer.mobile}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {action === "pay" && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Payment Method</label>
          <div className="flex gap-6 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="till"
                checked={payType === "till"}
                onChange={() => setPayType("till")}
                className="w-4 h-4 text-brand-green"
              />
              <span>Till Number</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="paybill"
                checked={payType === "paybill"}
                onChange={() => setPayType("paybill")}
                className="w-4 h-4 text-brand-green"
              />
              <span>PayBill</span>
            </label>
          </div>

          {payType === "till" && (
            <input
              type="text"
              placeholder="Enter Till Number"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-brand-green outline-none"
            />
          )}

          {payType === "paybill" && (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="PayBill Number"
                value={paybillNo}
                onChange={(e) => setPaybillNo(e.target.value)}
                className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-brand-green outline-none"
              />
              <input
                type="text"
                placeholder="Account Number"
                value={accNo}
                onChange={(e) => setAccNo(e.target.value)}
                className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-brand-green outline-none"
              />
            </div>
          )}
        </div>
      )}

      {action === "withdraw" && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Destination Phone Number</label>
          <input
            type="text"
            placeholder="e.g., 254712345678"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-brand-green outline-none"
          />
          <p className="text-xs text-gray-500 mt-1">Enter phone number in international format</p>
        </div>
      )}
    </>
  );

  const isContinueDisabled =
    loading ||
    !amount ||
    Number(amount) <= 0 ||
    (action === "transfer" && !destination) ||
    (action === "pay" && payType === "till" && !destination) ||
    (action === "pay" && payType === "paybill" && (!paybillNo || !accNo)) ||
    (action === "withdraw" && !destination);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-brand-dark rounded-xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-brand-green dark:text-brand-apple flex items-center gap-2">
                <span>💰</span> My Wallet
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Manage your funds, transfer to other farmers, and make payments
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              title="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Balance Card */}
          <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Balance</p>
            <p className="text-3xl font-bold text-brand-green dark:text-brand-apple">
              {formatCurrencyKES(balance)}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Action Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { id: "deposit", label: "Deposit", icon: "💰" },
              { id: "withdraw", label: "Withdraw", icon: "💸" },
              { id: "transfer", label: "Transfer", icon: "🔄" },
              { id: "pay", label: "Pay", icon: "📱" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setAction(tab.id as WalletAction);
                  setTransferPreview(null);
                  setDestination("");
                  setSearchQuery("");
                  setPaybillNo("");
                  setAccNo("");
                  setPayType("till");
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${action === tab.id
                    ? "bg-brand-green text-white shadow-md scale-105"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {renderActionForm()}

          {/* Transfer confirmation */}
          {transferPreview && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg mb-4">
              <p className="text-yellow-800 dark:text-yellow-300 font-medium mb-3">
                {transferPreview.message}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setTransferPreview(null)}
                  className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50"
                >
                  {loading ? "Processing..." : "Confirm Transfer"}
                </button>
              </div>
            </div>
          )}

          <hr className="my-6 border-gray-200 dark:border-gray-700" />

          <TransactionTable farmerId={farmerId} refreshkey={refreshKey} />
        </div>

        {/* Footer */}
        {!transferPreview && (
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-4">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2 rounded-lg bg-brand-green hover:bg-green-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={isContinueDisabled}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                'Continue'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
