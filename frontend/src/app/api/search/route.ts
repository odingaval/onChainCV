import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/prisma'

// Manual validation function
function validateSearchParams(params: any) {
  const errors: string[] = []
  
  if (!params.q || typeof params.q !== 'string' || params.q.trim().length === 0) {
    errors.push('Search query is required')
  } else if (params.q.length > 100) {
    errors.push('Search query must be less than 100 characters')
  }
  
  const page = parseInt(params.page) || 1
  if (page < 1) {
    errors.push('Page must be at least 1')
  }
  
  const limit = parseInt(params.limit) || 10
  if (limit < 1 || limit > 50) {
    errors.push('Limit must be between 1 and 50')
  }
  
  if (params.category && !['developer', 'designer', 'manager', 'other'].includes(params.category)) {
    errors.push('Invalid category')
  }
  
  if (params.experience && !['junior', 'mid', 'senior', 'lead'].includes(params.experience)) {
    errors.push('Invalid experience level')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    data: {
      q: params.q?.trim() || '',
      page,
      limit,
      category: params.category,
      experience: params.experience
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())
    
    const validation = validateSearchParams(params)
    
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.errors
        },
        { status: 400 }
      )
    }
    
    const { q, page, limit, category, experience } = validation.data
    
    const skip = (page - 1) * limit
    
    // Build search conditions
    const where: any = {
      AND: [
        { isPublic: true }, // Only search public profiles
        {
          OR: [
            { displayName: { contains: q, mode: 'insensitive' } },
            { title: { contains: q, mode: 'insensitive' } },
            { bio: { contains: q, mode: 'insensitive' } },
            { skills: { path: '$', string_contains: q } },
          ]
        }
      ]
    }
    
    // Add optional filters
    if (category) {
      where.AND.push({ category })
    }
    
    if (experience) {
      where.AND.push({ experience })
    }
    
    // Execute search with pagination
    const [profiles, total] = await Promise.all([
      prisma.userProfile.findMany({
        where,
        select: {
          id: true,
          displayName: true,
          title: true,
          bio: true,
          category: true,
          experience: true,
          skills: true,
          avatarUrl: true,
          walletAddress: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: [
          { updatedAt: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit,
      }),
      prisma.userProfile.count({ where })
    ])
    
    // Calculate pagination info
    const totalPages = Math.ceil(total / limit)
    const hasNextPage = page < totalPages
    const hasPreviousPage = page > 1
    
    return NextResponse.json({
      success: true,
      data: {
        profiles,
        pagination: {
          currentPage: page,
          totalPages,
          totalResults: total,
          resultsPerPage: limit,
          hasNextPage,
          hasPreviousPage,
        }
      }
    })
    
  } catch (error) {
    console.error('Search error:', error)
    
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to search profiles',
        message: 'Please try again later'
      },
      { status: 500 }
    )
  }
}