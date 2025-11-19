import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/prisma'
import { Address, createPublicClient, http, defineChain } from 'viem'
import { credentialSbtAbi, addresses, isValidAddress } from '@/contracts'
import { toGatewayUrl } from '@/lib/ipfs'

export const runtime = "nodejs"
const isDev = process.env.NODE_ENV !== "production"

// Manual validation function
function validateSyncParams(body: any) {
  const errors: string[] = []
  
  if (!body.walletAddress || typeof body.walletAddress !== 'string' || !/^0x[a-fA-F0-9]{40}$/.test(body.walletAddress)) {
    errors.push('Invalid wallet address')
  }
  
  // Note: contractAddress and credentialTypes are optional for basic sync
  // If provided, validate them
  if (body.contractAddress && (typeof body.contractAddress !== 'string' || !/^0x[a-fA-F0-9]{40}$/.test(body.contractAddress))) {
    errors.push('Invalid contract address')
  }
  
  if (body.credentialTypes) {
    if (!Array.isArray(body.credentialTypes)) {
      errors.push('Credential types must be an array')
    } else {
      const validTypes = ['education', 'work', 'skill']
      for (const type of body.credentialTypes) {
        if (!validTypes.includes(type)) {
          errors.push('Invalid credential type: ' + type)
        }
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    data: {
      walletAddress: body.walletAddress,
      contractAddress: body.contractAddress,
      credentialTypes: body.credentialTypes
    }
  }
}

// POST - Sync credentials for a wallet address
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validation = validateSyncParams(body)
    
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
    
    const { walletAddress, contractAddress, credentialTypes } = validation.data

    // Get or create user profile
    const profile = await prisma.userProfile.upsert({
      where: { walletAddress },
      update: {},
      create: { walletAddress }
    })

    // Fetch credentials from blockchain
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || process.env.RPC_URL
    const chainIdStr = process.env.NEXT_PUBLIC_CHAIN_ID || process.env.CHAIN_ID || "1287"
    
    if (!rpcUrl) {
      return NextResponse.json({ error: 'RPC URL not configured' }, { status: 500 })
    }

    if (!isValidAddress(addresses.sbt)) {
      return NextResponse.json({ error: 'SBT address not set' }, { status: 500 })
    }

    const chain = defineChain({
      id: Number(chainIdStr),
      name: "Custom",
      nativeCurrency: { name: "Unit", symbol: "UNIT", decimals: 18 },
      rpcUrls: { default: { http: [rpcUrl] } },
    })

    const client = createPublicClient({ transport: http(rpcUrl), chain })
    const contract = addresses.sbt as Address

    // Get latest block number
    const latest = await client.getBlockNumber()
    const window = 100_000n
    const fromBlock = latest > window ? latest - window : 0n
    const toBlock = latest

    // Fetch credential events
    const issuedEventAbi = credentialSbtAbi.find((item: any) => item.name === "CredentialIssued")
    const revokedEventAbi = credentialSbtAbi.find((item: any) => item.name === "CredentialRevoked")
    
    if (!issuedEventAbi || !revokedEventAbi) {
      return NextResponse.json({
        success: false,
        error: 'Required event ABIs not found in contract ABI'
      }, { status: 500 })
    }

    // Helper: chunked getLogs
    async function getLogsChunked(params: { address: Address; fromBlock: bigint; toBlock: bigint; event: any; args?: any }, step = 256n) {
      const { address, fromBlock, toBlock, event, args } = params
      const results: any[] = []
      let cursor = fromBlock
      const maxStep = 256n
      const effectiveStep = step > maxStep ? maxStep : step
      
      while (cursor <= toBlock) {
        const end = (cursor + effectiveStep) > toBlock ? toBlock : (cursor + effectiveStep)
        try {
          const logs = await client.getLogs({ address, fromBlock: cursor, toBlock: end, event, args })
          results.push(...logs)
        } catch (e) {
          console.error('Error fetching logs:', e)
        }
        cursor = end + 1n
      }
      return results
    }

    // Fetch issued and revoked logs
    const [issuedLogs, revokedLogs] = await Promise.all([
      getLogsChunked({
        address: contract,
        fromBlock,
        toBlock,
        event: issuedEventAbi,
        args: { subject: walletAddress }
      }),
      getLogsChunked({
        address: contract,
        fromBlock,
        toBlock,
        event: revokedEventAbi,
        args: { subject: walletAddress }
      })
    ])

    // Process credentials
    const credentials: any[] = []
    const revokedTokenIds = new Set<string>()

    // Process revoked logs first
    for (const log of revokedLogs) {
      const parsed = log.args as any
      if (parsed.tokenId) {
        revokedTokenIds.add(parsed.tokenId.toString())
      }
    }

    // Process issued logs
    for (const log of issuedLogs) {
      const parsed = log.args as any
      const tokenId = parsed.tokenId?.toString()
      
      if (tokenId && !revokedTokenIds.has(tokenId)) {
        credentials.push({
          tokenId,
          issuer: parsed.issuer,
          subject: parsed.subject,
          cid: parsed.cid,
          uri: parsed.uri,
          gatewayUrl: toGatewayUrl(parsed.cid),
          issuedAtBlock: log.blockNumber.toString(),
          revoked: false
        })
      }
    }

    // Upsert credentials in database
    const upsertPromises = credentials.map(cred => 
      prisma.credential.upsert({
        where: {
          tokenId_userProfileId: {
            tokenId: cred.tokenId,
            userProfileId: profile.id
          }
        },
        update: {
          revoked: cred.revoked,
          revokedAtBlock: null
        },
        create: {
          ...cred,
          userProfileId: profile.id
        }
      })
    );

    // Mark revoked credentials
    const updatePromises = Array.from(revokedTokenIds).map(tokenId =>
      prisma.credential.updateMany({
        where: { tokenId },
        data: { revoked: true, revokedAtBlock: latest.toString() }
      })
    );

    await Promise.all(upsertPromises)
    await Promise.all(updatePromises)

    return NextResponse.json({
      success: true,
      message: 'Credentials synced successfully',
      data: {
        credentialsCount: credentials.length,
        revokedCount: revokedTokenIds.size,
        syncedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}