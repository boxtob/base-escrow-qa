'use client'

import { useState, useEffect } from 'react'
import { createPublicClient, http } from 'viem'
import { baseSepolia } from 'viem/chains'
import { CoinbaseConnectButton } from '@/components/CoinbaseConnectButton'

const CONTRACT_ADDRESS = '0xb4575AC1cCe8511feF15386BBD3012e35Ae573aa' as `0x${string}`

const bountyAbi = [
  {
    inputs: [],
    name: 'bountyCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http('https://sepolia.base.org'),
})

export default function Home() {
  const [bountyCount, setBountyCount] = useState('0')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsLoading(true)
    publicClient
      .readContract({
        address: CONTRACT_ADDRESS,
        abi: bountyAbi,
        functionName: 'bountyCount',
      })
      .then((count) => setBountyCount(count.toString()))
      .catch((err) => setError(err.message || 'Failed to read'))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="max-w-md w-full space-y-12 text-center">
        <h1 className="text-4xl font-bold">Base Bounty Q&A</h1>
        <p className="text-lg opacity-80">Decentralized bounties on Coinbase Base</p>

        <CoinbaseConnectButton />

        <div className="mt-12">
          <p className="text-xl mb-4">Current bounty count</p>
          {isLoading ? (
            <p className="text-3xl font-bold animate-pulse">Loading...</p>
          ) : error ? (
            <p className="text-red-400">{error}</p>
          ) : (
            <p className="text-5xl font-bold">{bountyCount}</p>
          )}
        </div>
      </div>
    </main>
  )
}