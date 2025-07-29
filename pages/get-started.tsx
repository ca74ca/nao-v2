// pages/get-started.tsx
import { signIn, signOut, useSession } from "next-auth/react";

export default function GetStartedPage() {
  const { data: session } = useSession();

  return (
    <div style={{ padding: "2rem", color: "#fff", textAlign: "center" }}>
      <h1>🔑 Get Your EffortNet API Key</h1>
      {!session ? (
        <>
          <p>Please sign in with GitHub or Google to continue.</p>
          <button onClick={() => signIn("github")}>Sign in with GitHub</button>
          <button onClick={() => signIn("google")}>Sign in with Google</button>
        </>
      ) : (
        <>
          <p>Welcome, {session.user?.email}</p>
          <button onClick={() => signOut()}>Sign out</button>
        </>
      )}
    </div>
  );
}
