import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role') === 'MENTOR' ? 'MENTOR' : 'STUDENT';

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/google/callback`;

  if (!clientId) {
    return NextResponse.json({ error: 'GOOGLE_CLIENT_ID is not configured.' }, { status: 500 });
  }

  // Pass chosen role as the OAuth state parameter so we can process it in the callback
  const state = JSON.stringify({ role });

  const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=openid%20email%20profile&state=${encodeURIComponent(
    state
  )}`;

  return NextResponse.redirect(oauthUrl);
}
