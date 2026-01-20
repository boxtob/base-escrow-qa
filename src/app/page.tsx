'use client'

import { useState, useEffect } from 'react'
import { createPublicClient, http, parseUnits } from 'viem'
import { baseSepolia } from 'viem/chains'
import { CoinbaseConnectButton } from '@/components/CoinbaseConnectButton'
import { hexlify, toUtf8Bytes, id } from 'ethers'  // correct v6 imports

const CONTRACT_ADDRESS = '0xb4575AC1cCe8511feF15386BBD3012e35Ae573aa' as `0x${string}`
const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as `0x${string}`

const bountyAbi = [
  {
    inputs: [],
    name: 'bountyCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'questionId', type: 'string' },
    ],
    name: 'postBounty',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http('https://sepolia.base.org'),
})

export default function Home() {
  const [bountyCount, setBountyCount] = useState('0')
  const [isLoadingCount, setIsLoadingCount] = useState(false)
  const [readError, setReadError] = useState<string | null>(null)

  const [amount, setAmount] = useState('')
  const [questionId, setQuestionId] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const [postResult, setPostResult] = useState<string | null>(null)
  const [postError, setPostError] = useState<string | null>(null)

  // Read bounty count
  useEffect(() => {
    setIsLoadingCount(true)
    setReadError(null)

    publicClient
      .readContract({
        address: CONTRACT_ADDRESS,
        abi: bountyAbi,
        functionName: 'bountyCount',
      })
      .then((count) => setBountyCount(count.toString()))
      .catch((err) => setReadError(err.message || 'Failed to read'))
      .finally(() => setIsLoadingCount(false))
  }, [postResult])  // auto-refresh after post

  // Post bounty function
  const postBounty = async () => {
    if (!amount || !questionId) {
      setPostError('Please fill both fields')
      return
    }

    setIsPosting(true)
    setPostError(null)
    setPostResult(null)

    try {
      const provider = window.ethereum
      if (!provider) throw new Error('No injected provider')

      const accounts = await provider.request({ method: 'eth_requestAccounts' })
      const userAddress = accounts[0]
      if (!userAddress) throw new Error('No account selected')

      console.log('User address:', userAddress)

      // Step 1: Approve USDC (higher amount)
      const approveAmount = parseUnits('10', 6)  // 10 USDC allowance
      const approveData = '0x095ea7b3' +
        CONTRACT_ADDRESS.slice(2).padStart(64, '0') +
        approveAmount.toString(16).padStart(64, '0')

      console.log('Sending approve tx with data:', approveData)

      const approveTx = await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: userAddress,
          to: USDC_ADDRESS,
          data: approveData,
        }],
      })
      console.log('Approve tx hash:', approveTx)
      setPostResult(`USDC approved! Tx: ${approveTx.slice(0, 10)}...`)

      // Wait 15 seconds for approve to be mined
      await new Promise(resolve => setTimeout(resolve, 15000))

      // Step 2: Post bounty
      const amountWei = parseUnits(amount, 6)
      const questionBytes = hexlify(toUtf8Bytes(questionId)).padEnd(64, '0')

      const postSig = id('postBounty(uint256,string)').slice(0, 10)
      const postData = postSig +
        amountWei.toString(16).padStart(64, '0') +
        questionBytes

      console.log('Sending postBounty tx with data:', postData)

      const postTx = await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: userAddress,
          to: CONTRACT_ADDRESS,
          data: postData,
        }],
      })

      console.log('Post tx hash:', postTx)
      setPostResult(`Bounty posted! Tx: ${postTx.slice(0, 10)}...`)
      setAmount('')
      setQuestionId('')
    } catch (err: any) {
      console.error('Transaction failed:', err)
      setPostError(err.message || 'Transaction failed – check wallet or allowance')
    } finally {
      setIsPosting(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="max-w-md w-full space-y-12 text-center">
        <h1 className="text-4xl font-bold">Base Bounty Q&A</h1>
        <p className="text-lg opacity-80">Decentralized bounties on Coinbase Base</p>

        <CoinbaseConnectButton />

        <div className="mt-12">
          <p className="text-xl mb-4">Current bounty count</p>
          {isLoadingCount ? (
            <p className="text-3xl font-bold animate-pulse">Loading...</p>
          ) : readError ? (
            <p className="text-red-400">{readError}</p>
          ) : (
            <p className="text-5xl font-bold">{bountyCount}</p>
          )}
        </div>

        <div className="mt-12 bg-gray-800/50 p-8 rounded-xl border border-gray-700">
          <h2 className="text-2xl font-bold mb-6">Post a New Bounty</h2>

          <input
            type="text"
            placeholder="Amount in USDC (e.g. 1)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-3 mb-4 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500"
          />

          <input
            type="text"
            placeholder="Question ID (e.g. test-question)"
            value={questionId}
            onChange={(e) => setQuestionId(e.target.value)}
            className="w-full p-3 mb-6 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500"
          />

          <button
            onClick={postBounty}
            disabled={isPosting || !amount || !questionId}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-8 py-4 rounded-lg text-white font-medium text-lg transition"
          >
            {isPosting ? 'Posting...' : 'Post Bounty'}
          </button>

          {postResult && <p className="text-green-400 mt-4">{postResult}</p>}
          {postError && <p className="text-red-400 mt-4">{postError}</p>}
        </div>
      </div>
    </main>
  )
}