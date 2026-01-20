'use client'

import { useState, useEffect } from 'react'
import { createCoinbaseWalletSDK } from '@coinbase/wallet-sdk'

export function CoinbaseConnectButton() {
  const [address, setAddress] = useState<string | null>(null)
  const [sdk, setSdk] = useState<any>(null)
  const [connectError, setConnectError] = useState<string | null>(null)

  useEffect(() => {
    console.log("Initializing new Coinbase SDK...")
    try {
      const coinbaseSdk = createCoinbaseWalletSDK({
        appName: 'Base Bounty Q&A'
      })
      console.log("New SDK initialized:", coinbaseSdk)
      setSdk(coinbaseSdk)
      setConnectError(null)
    } catch (err) {
      console.error("SDK init failed:", err)
      setConnectError('Failed to initialize wallet SDK')
    }
  }, [])

  const connect = async () => {
    if (!sdk) {
      setConnectError('SDK not ready yet')
      return
    }

    try {
      setConnectError(null)

      console.log("Getting provider from SDK...")

      // New SDK: getProvider() returns the Web3Provider
      const provider = await sdk.getProvider({
        chainId: 84532,
        rpcUrl: 'https://sepolia.base.org',
      })

      console.log("Provider received:", provider)

      const accounts = await provider.request({ method: 'eth_requestAccounts' })
      console.log("Accounts:", accounts)

      if (accounts && accounts.length > 0) {
        setAddress(accounts[0])
        console.log("Address set:", accounts[0])
      } else {
        throw new Error('No accounts returned')
      }
    } catch (error: any) {
      console.error('Connection failed:', error)
      setConnectError(error.message || 'Failed to connect wallet')
    }
  }

  const disconnect = () => {
    setAddress(null)
    setConnectError(null)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {connectError && <p className="text-red-400 text-sm">{connectError}</p>}

      {!address ? (
        <button
          onClick={connect}
          className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-lg text-white font-medium text-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!sdk}
        >
          {sdk ? 'Connect Coinbase Wallet' : 'Initializing...'}
        </button>
      ) : (
        <div className="text-center">
          <p className="text-lg mb-2">Connected:</p>
          <p className="font-mono text-sm break-all bg-gray-900 text-white p-3 rounded-lg inline-block">
            {address}
          </p>
          <button
            onClick={disconnect}
            className="mt-4 bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg text-white text-sm transition"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  )
}