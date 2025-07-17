import React from "react";
import { useConnect, metamaskWallet, coinbaseWallet, useAddress } from "@thirdweb-dev/react";
import { useRouter } from "next/router";

const SiteButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  gradient?: string;
  className?: string;
}> = ({ children, onClick, gradient, className = "", ...props }) => {
  const defaultGradient = "from-cyan-400 to-blue-500";
  return (
    <button
      onClick={onClick}
      className={`
        w-full py-3 rounded-full font-extrabold text-black
        bg-gradient-to-r ${gradient || defaultGradient}
        shadow-xl hover:opacity-90 transition-all tracking-wide uppercase
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

const FinalOnboarding: React.FC = () => {
  const connect = useConnect();
  const address = useAddress();
  const router = useRouter();

  const handleContinue = () => {
    if (address) {
      router.push("/mint");
    } else {
      alert("Please connect your wallet to continue.");
    }
  };

  return (
    <main className="relative min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 py-16 overflow-hidden">
      {/* 🔥 Fullscreen Watermark Background, no tiling, no repeats */}
      <img
        src="/nao_circle_logo_fo.png"
        alt="NAO Watermark"
        className="fixed top-0 left-0 w-screen h-screen object-cover opacity-10 pointer-events-none select-none"
        style={{ zIndex: 0 }}
      />

      {/* 🔥 Foreground Content */}
      <div className="relative z-10 max-w-2xl w-full text-center space-y-8">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent drop-shadow-xl">
          Welcome to NAO
        </h1>

        <p className="text-lg leading-relaxed max-w-2xl mx-auto text-white/90">
          Congratulations! You're officially onboarded with NAO, where your dedication to any form of fitness translates directly into tangible cash rewards.
          <br /><br />
          We believe your hard work deserves more than just personal bests — it deserves real financial incentives. This is health, evolved.
        </p>
      </div>

      {/* 🔥 Key Benefits */}
      <section className="relative z-10 mt-10 max-w-xl space-y-8 text-center text-lg">
        <div className="space-y-2">
          <h2 className="text-cyan-400 font-bold text-2xl">Track Your Progress</h2>
          <p>AI verifies your sessions. NAO tracks it all — no wearables required.</p>
        </div>

        <div className="space-y-2">
          <h2 className="text-cyan-400 font-bold text-2xl">Earn Real Rewards</h2>
          <p>Complete goals. Level up. Get paid.</p>
        </div>

        <div className="space-y-2">
          <h2 className="text-cyan-400 font-bold text-2xl">Withdraw How You Want</h2>
          <p>Apple Pay. Mastercard. Crypto. Your rewards, your choice.</p>
        </div>
      </section>

      {/* 🔥 Wallet Actions */}
      <div className="relative z-10 mt-12 space-y-4 w-full max-w-xs">
        {!address && (
          <>
            <SiteButton onClick={() => connect(metamaskWallet())} gradient="from-purple-500 to-indigo-900">
              Connect MetaMask
            </SiteButton>
            <SiteButton onClick={() => connect(coinbaseWallet())} gradient="from-yellow-400 via-pink-500 to-purple-500">
              Connect Coinbase Wallet
            </SiteButton>
          </>
        )}

        {address && (
          <div className="text-center space-y-1">
            <p className="text-cyan-300 uppercase tracking-wider text-sm">Connected Wallet:</p>
            <p className="font-mono text-white text-xs">{address}</p>
          </div>
        )}

        <SiteButton onClick={handleContinue} className="w-full" gradient="from-cyan-400 to-blue-600">
          Sync My NAO Rewards
        </SiteButton>
      </div>

      {/* 🔥 Footer NAO Branding */}
      <p className="relative z-10 mt-16 text-xs text-white/50 tracking-wide uppercase">
        Powered by NAO • AI. Rewards. Blockchain.
      </p>
    </main>
  );
};

export default FinalOnboarding;
