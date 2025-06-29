// pages/passport.tsx – v1.0 futuristic NAO Health Passport

import { useEffect, useState } from "react";
import QRCode from "qrcode.react";
import copy from "copy-to-clipboard";

/* -------------------------------------------------------
   Simple ENG / ESP i18n (extendable later)              */
const i18n = {
  en: {
    head: "🧬 Your Health Passport",
    intro:
      "Secure, on‑chain record of your fitness metrics & NFT identity. Share with a physician via the glowing QR.",
    wallet: "Wallet ID",
    passport: "Passport ID",
    qrCaption: "Doctor‑scan QR",
    copyBtn: "Copy Share Link",
    copied: "Copied!",
    cards: { vo2: "VO₂ Max", cal: "Active Calories", steps: "Steps", hr: "Heart Rate" },
    legal1:
      "Encrypted & owned by you. HIPAA / GDPR‑ready. NAO is not a licensed medical provider.",
    legal2: "By using NAO you accept our Terms & Privacy.",
    toggle: "ES",
  },
  es: {
    head: "🧬 Tu Pasaporte de Salud",
    intro:
      "Registro seguro en cadena de tus métricas y NFT. Compártelo con tu médico usando el QR iluminado.",
    wallet: "ID de Wallet",
    passport: "ID de Pasaporte",
    qrCaption: "QR para Doctor",
    copyBtn: "Copiar enlace de acceso",
    copied: "¡Copiado!",
    cards: { vo2: "VO₂ Máx", cal: "Calorías activas", steps: "Pasos", hr: "Frecuencia cardíaca" },
    legal1:
      "Datos cifrados y en tu poder. Cumple HIPAA/GDPR. NAO no reemplaza consejo médico profesional.",
    legal2: "Al usar NAO aceptas nuestros Términos y Privacidad.",
    toggle: "EN",
  },
};
//-------------------------------------------------------*/

export default function HealthPassport() {
  const [user, setUser] = useState<any>(null);
  const [lang, setLang] = useState<"en" | "es">("en");
  const t = i18n[lang];
  const [copied, setCopied] = useState(false);

  /* hydrate user from localStorage */
  useEffect(() => {
    const stored = localStorage.getItem("nao_user");
    if (stored) try { setUser(JSON.parse(stored)); } catch {}
  }, []);

  const shareUrl =
    typeof window !== "undefined" && user?.passportId
      ? `${window.location.origin}/doctor/${user.passportId}`
      : "";

  const handleCopy = () => {
    if (!shareUrl) return;
    copy(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="min-h-screen bg-black text-white px-6 py-10 sm:px-4 relative overflow-hidden">
      {/* subtle animated grid background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,255,0.05),transparent_70%)] animate-pulse-slow" />

      {/* language toggle */}
      <button
        onClick={() => setLang(lang === "en" ? "es" : "en")}
        className="fixed top-4 right-4 z-20 text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded-xl border border-white/20"
      >
        {t.toggle}
      </button>

      {/* header */}
      <h1 className="text-4xl font-bold mb-2 text-cyan-400 drop-shadow">{t.head}</h1>
      <p className="text-sm text-gray-400 mb-8 max-w-xl">{t.intro}</p>

      {/* identity card */}
      <div className="mb-10 w-full max-w-md bg-white/5 backdrop-blur-lg border border-cyan-400/40 rounded-2xl p-6 relative shadow-lg">
        <div className="absolute -top-6 left-6 bg-cyan-500/80 text-black text-xs px-2 py-[2px] rounded-md tracking-wider shadow">NAO NFT</div>
        <p className="text-xs text-gray-400 mb-1">{t.wallet}</p>
        <p className="break-all text-sm mb-4">{user?.walletId ?? "—"}</p>
        <p className="text-xs text-gray-400 mb-1">{t.passport}</p>
        <p className="break-all text-sm">{user?.passportId ?? "—"}</p>
      </div>

      {/* QR + share row */}
      <div className="flex flex-col sm:flex-row items-start gap-6 mb-12">
        <div className="relative">
          {/* pulsing ring  */}
          <span className="absolute -inset-2 rounded-xl border-2 border-cyan-400/40 animate-pulse" />
          <QRCode value={user?.passportId || "NAO-UNKNOWN"} size={180} bgColor="#000" fgColor="#00FFFF" />
        </div>
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-400">{t.qrCaption}</p>
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-xl text-sm font-medium transition"
          >
            {copied ? t.copied : t.copyBtn}
          </button>
        </div>
      </div>

      {/* vitals grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 max-w-3xl">
        <StatCard label={t.cards.vo2} value={user?.vo2Max} />
        <StatCard label={t.cards.cal} value={user?.calories} />
        <StatCard label={t.cards.steps} value={user?.steps} />
        <StatCard label={t.cards.hr} value={user?.heartRate} />
      </div>

      {/* legal footer */}
      <div className="mt-12 text-xs text-gray-500 max-w-2xl space-y-2">
        <p>{t.legal1}</p>
        <p>{t.legal2}</p>
      </div>
    </div>
  );
}

/* reusable stat */
function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 hover:border-cyan-400/40 transition">
      <h2 className="text-lg font-semibold mb-1">{label}</h2>
      <p className="text-xl">
        {value ?? <span className="text-gray-500">—</span>}
      </p>
    </div>
  );
}

/* slow background pulse keyframes (tailwind add if needed) */
// .animate-pulse-slow { animation: pulse 6s infinite; }
