import React from "react";
import { useConnect, metamaskWallet, coinbaseWallet, useAddress } from "@thirdweb-dev/react";
import { useRouter } from "next/router";

// SiteButton component for consistent button styling
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
        w-full py-3 rounded-full font-extrabold text-white
        bg-gradient-to-r ${gradient || defaultGradient}
        shadow-lg hover:opacity-90 transition-all
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
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-8 py-16 space-y-10 relative overflow-hidden">
      {/* FULL PAGE WATERMARK LOGO BACKGROUND */}
      <img
        src="/nao_circle_logo_fo.png"
        alt="NAO Logo Watermark"
        className="fixed inset-0 w-full h-full object-cover opacity-10 pointer-events-none select-none"
        style={{ zIndex: 0 }}
      />

      {/* Main Content Layered Above Watermark */}
      <div className="relative z-10 max-w-xl w-full flex flex-col items-center">
        {/* Optional: Small logo for branding above content */}
        <img
          src="/nao_circle_logo_fo.png"
          alt="NAO Logo"
          className="w-40 opacity-30 mb-4"
        />

        <h1 className="text-4xl md:text-5xl font-bold text-center mt-8 drop-shadow-lg">
          Welcome to NAO: Your Fitness, Rewarded!
        </h1>

        <p className="text-center text-lg leading-relaxed mt-4 max-w-2xl">
          Congratulations! You're officially onboarded with NAO, where your dedication to any form of fitness translates directly into tangible cash rewards. <br /><br />
          We believe your hard work deserves more than just personal bests — it deserves real financial incentives.
        </p>
      </div>

      <section className="relative z-10 text-left max-w-lg space-y-6">
        <h2 className="text-cyan-400 font-semibold text-xl">Track Your Progress</h2>
        <p>NAO tracks your fitness activity and rewards your effort.</p>

        <h2 className="text-cyan-400 font-semibold text-xl">Earn Rewards</h2>
        <p>Hit milestones, get paid.</p>

        <h2 className="text-cyan-400 font-semibold text-xl">Redeem Your Earnings</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>Apple Pay</li>
          <li>Mastercard</li>
          <li>Coinbase</li>
        </ul>

        <h2 className="text-cyan-400 font-semibold text-xl">No Gimmicks—Just Results</h2>
        <p>
          NAO makes fitness rewarding and simple. No tricks. Real incentives.
        </p>
      </section>

      <div className="relative z-10 space-y-4 w-full max-w-xs">
        {!address && (
          <>
            <SiteButton onClick={() => connect(metamaskWallet())} gradient="from-purple-500 to-indigo-900">
              Connect MetaMask
            </SiteButton>
            <SiteButton onClick={() => connect(coinbaseWallet())} gradient="from-yellow-500 via-pink-500 to-purple-500">
              Connect Coinbase Wallet
            </SiteButton>
          </>
        )}

        {address && (
          <div className="text-center">
            <p className="text-cyan-300">Connected Wallet:</p>
            <p className="font-mono">{address}</p>
          </div>
        )}

        <SiteButton onClick={handleContinue} className="w-full">
          SYNC LIVE REWARD DASHBOARD HERE
        </SiteButton>
      </div>
    </main>
  );
};

export default FinalOnboarding;
