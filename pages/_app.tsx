import "../styles/globals.css";
import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";
import { ThirdwebProvider } from "@thirdweb-dev/react";
import { ThreadProvider } from "@/components/ThreadContext";
import { WalletProvider } from "../context/WalletContext";

const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || process.env.THIRDWEB_CLIENT_ID;

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <SessionProvider session={pageProps.session}> {/* ✅ FIX ADDED HERE */}
      <WalletProvider>
        <ThirdwebProvider activeChain="polygon" clientId={clientId}>
          <ThreadProvider>
            <Component {...pageProps} />
          </ThreadProvider>
        </ThirdwebProvider>
      </WalletProvider>
    </SessionProvider>
  );
}
