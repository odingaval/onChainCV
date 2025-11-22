// src/app/api/profile/route.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');
    
    if (!walletAddress) {
      return new Response(JSON.stringify({ error: 'Wallet address is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const profile = await prisma.userProfile.findUnique({
      where: { walletAddress },
      include: {
        shareSettings: true,
      },
    });

    return new Response(JSON.stringify(profile), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Profile GET error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch profile',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}