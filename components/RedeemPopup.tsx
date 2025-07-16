import React from "react";

export default function RedeemPopup({
  onRedeem,
  onClose,
}: {
  onRedeem: (method: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute top-24 left-1/2 transform -translate-x-1/2 bg-black/90 text-white p-8 border border-cyan-500 rounded-2xl shadow-2xl z-50 max-w-md w-full">
      <h2 className="text-2xl font-bold mb-4 text-cyan-400">Redeem Rewards</h2>
      <p className="mb-6 text-sm text-gray-300">Choose your redemption method below:</p>
      <div className="space-y-4">
        <button
          onClick={() => onRedeem("apple-pay")}
          className="w-full py-3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-semibold shadow hover:scale-105 transition"
        >
          Apple Pay
        </button>
        <button
          onClick={() => onRedeem("coinbase")}
          className="w-full py-3 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-700 text-white font-semibold shadow hover:scale-105 transition"
        >
          Coinbase
        </button>
        <button
          onClick={onClose}
          className="w-full py-2 text-sm text-gray-400 hover:text-white mt-4"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
