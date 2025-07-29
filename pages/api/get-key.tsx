import { useSession } from "next-auth/react";

export default function GetKeyPage() {
  const { data: session, status } = useSession();

  if (status === "loading") return <p>Loading...</p>;
  if (!session) return <p>Access denied. Please sign in.</p>;

  return <div>Your API Key: ************</div>;
}
