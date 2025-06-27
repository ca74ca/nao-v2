export function getWhoopAuthUrl(wallet?: string) {
  const params = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_WHOOP_CLIENT_ID!,
    redirect_uri: process.env.NEXT_PUBLIC_WHOOP_REDIRECT_URI!,
    response_type: "code",
    scope: "read:recovery read:cycles read:workout read:sleep read:profile read:body_measurement",
  });

  if (wallet) {
    params.append("state", wallet);
  }

  return `https://api.prod.whoop.com/oauth/oauth2/auth?${params.toString()}`;
}
