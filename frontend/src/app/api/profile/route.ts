import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/prisma'
import { Address } from 'viem'

// GET - Get user profile
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const walletAddress = searchParams.get('walletAddress') as Address
    const username = searchParams.get('username')
    const slug = searchParams.get('slug')

    let profile
    
    if (walletAddress) {
      profile = await prisma.userProfile.findUnique({
        where: { walletAddress },
        include: {
          shareSettings: true,
          credentials: {
            where: { revoked: false },
            orderBy: { issuedAtBlock: 'desc' }
          }
        }
      })
    } else if (username) {
      profile = await prisma.userProfile.findUnique({
        where: { username },
        include: {
          shareSettings: true,
          credentials: {
            where: { revoked: false },
            orderBy: { issuedAtBlock: 'desc' }
          }
        }
      })
    } else if (slug) {
      profile = await prisma.userProfile.findUnique({
        where: { customSlug: slug },
        include: {
          shareSettings: true,
          credentials: {
            where: { revoked: false },
            orderBy: { issuedAtBlock: 'desc' }
          }
        }
      })
    }

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check if profile is public
    if (!profile.isPublic) {
      return NextResponse.json({ error: 'Profile is not public' }, { status: 403 })
    }

    // Apply privacy settings
    const publicProfile = {
      id: profile.id,
      username: profile.username,
      displayName: profile.displayName,
      title: profile.title,
      bio: profile.bio,
      category: profile.category,
      experience: profile.experience,
      skills: profile.skills as string[] || [],
      avatarUrl: profile.avatarUrl,
      createdAt: profile.createdAt,
      credentials: profile.shareSettings?.showCredentials ? profile.credentials : [],
      showWalletAddress: profile.shareSettings?.showWalletAddress ? profile.walletAddress : null
    }

    return NextResponse.json(publicProfile)
  } catch (error) {
    console.error('Profile GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create or update user profile
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { walletAddress, username, displayName, bio, avatarUrl, isPublic, customSlug, title, category, experience, skills } = body

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 })
    }

    const profile = await prisma.userProfile.upsert({
      where: { walletAddress },
      update: {
        username,
        displayName,
        bio,
        avatarUrl,
        isPublic,
        customSlug,
        title,
        category,
        experience,
        skills
      },
      create: {
        walletAddress,
        username,
        displayName,
        bio,
        avatarUrl,
        isPublic,
        customSlug,
        title,
        category,
        experience,
        skills
      },
      include: {
        shareSettings: true
      }
    })

    // Create default share settings if they don't exist
    if (!profile.shareSettings) {
      await prisma.shareSettings.create({
        data: {
          userProfileId: profile.id
        }
      })
    }

    return NextResponse.json(profile)
  } catch (error: any) {
    console.error('Profile POST error:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Username or custom slug already taken' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update sharing settings
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { walletAddress, showCredentials, showActivity, showWalletAddress, allowSearch } = body

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 })
    }

    // Get or create user profile
    const profile = await prisma.userProfile.upsert({
      where: { walletAddress },
      update: {},
      create: { walletAddress },
      include: { shareSettings: true }
    })

    // Update or create share settings
    const shareSettings = await prisma.shareSettings.upsert({
      where: { userProfileId: profile.id },
      update: {
        showCredentials,
        showActivity,
        showWalletAddress,
        allowSearch
      },
      create: {
        userProfileId: profile.id,
        showCredentials,
        showActivity,
        showWalletAddress,
        allowSearch
      }
    })

    return NextResponse.json(shareSettings)
  } catch (error) {
    console.error('Share settings PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}