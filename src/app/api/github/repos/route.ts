import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Enable CORS for this API route
export const dynamic = 'force-dynamic';

export async function GET() {
  console.log('[/api/github/repos] Request received');
  
  try {
    console.log('[/api/github/repos] Getting session...');
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      console.error('[/api/github/repos] No access token in session');
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized - No session found' }), 
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }

    console.log('[/api/github/repos] Fetching repositories from GitHub...');
    const response = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[/api/github/repos] GitHub API error:', {
        status: response.status,
        statusText: response.statusText,
        error
      });
      
      return new NextResponse(
        JSON.stringify({ 
          error: 'GitHub API error',
          status: response.status,
          details: error 
        }), 
        { 
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    const repos = await response.json();
    console.log(`[/api/github/repos] Successfully fetched ${repos.length} repositories`);
    
    return new NextResponse(JSON.stringify(repos), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[/api/github/repos] Error:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  }
}

// Handle OPTIONS method for CORS preflight
// This is necessary for some browsers
// @ts-ignore - TypeScript doesn't know about the OPTIONS method
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
