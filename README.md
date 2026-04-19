# ArcRemit - Cross-Border USDC Remittance on ARC Network

> Send USDC home in seconds. Sub-second finality. 0.3% fee. 15+ chains.

## Overview

ArcRemit is a decentralized cross-border remittance application built on [ARC Network](https://arc.network) - Circle's purpose-built Layer-1 blockchain for real-time finance. It enables instant, low-cost USDC transfers globally using ARC's sub-second finality and native USDC gas.

## Problem

- Global remittance fees average 6.5% (World Bank 2024)
- Traditional transfers take 1-3 business days
- Hidden FX markups eat into recipient amounts
- Vietnam alone receives $18B+/year in remittances

## Solution

ArcRemit leverages ARC's unique properties:
- **Sub-second settlement**: Money arrives in <1 second
- **USDC as gas**: Predictable fees in USD terms
- **0.3% platform fee**: 20x cheaper than traditional
- **Opt-in privacy**: Hide amounts or addresses
- **Multi-chain**: Bridge from any Circle-supported chain

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│  ArcRemit.sol    │────▶│   USDC Token    │
│   (Next.js)     │     │  (Escrow)        │     │   (ERC-20)      │
│                 │     │                  │     │                 │
│  - wagmi/viem   │     │  - createRemit() │     │  - On ARC L1    │
│  - RainbowKit   │     │  - claimRemit()  │     │  - 6 decimals   │
│  - TailwindCSS  │     │  - refundRemit() │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

## Smart Contract

**ArcRemit.sol** - USDC escrow contract with:
- Escrow-based remittance (sender locks, receiver claims)
- Configurable fees (0.3% default, max 1%)
- Expiry mechanism (up to 30 days, auto-refund)
- ReentrancyGuard + SafeERC20 protection
- Event logging for all operations

### Key Functions

| Function | Description |
|----------|-------------|
| `createRemittance(receiver, amount, message, expiresInHours)` | Lock USDC in escrow |
| `claimRemittance(id)` | Receiver claims the funds |
| `refundRemittance(id)` | Sender refunds expired remittance |
| `getPendingRemittances(receiver)` | Get all pending for a receiver |

## Frontend

Next.js 14 app with:
- Dark glassmorphism design
- Vietnamese/English language toggle
- QR code for receiving payments
- Real-time fee calculation
- Transaction history dashboard
- Mobile-first responsive design

### Pages

| Page | Route | Description |
|------|-------|-------------|
| Landing | `/` | Hero, stats, features, how-it-works |
| Send | `/send` | Send USDC form with validation |
| Receive | `/receive` | QR code + claim pending remittances |
| History | `/history` | Transaction table with filters |
| Dashboard | `/dashboard` | Stats, charts, balance overview |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A wallet with USDC on ARC testnet

### Deploy Contracts

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Fill in ARC_TESTNET_PRIVATE_KEY and USDC_ADDRESS

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to ARC testnet
npx hardhat run scripts/deploy.ts --network arcTestnet
```

### Run Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local
# Fill in NEXT_PUBLIC_ARCREMIT_ADDRESS from deploy output

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## ARC Testnet Configuration

| Parameter | Value |
|-----------|-------|
| RPC URL | `https://rpc.testnet.arc.network` |
| Chain ID | `5042002` |
| Currency | USDC |
| Explorer | `https://testnet.arcscan.app` |
| Faucet | `https://faucet.circle.com` |

## Fee Comparison

| Method | Fee | Time | ArcRemit Savings |
|--------|-----|------|-----------------|
| Bank Wire | $25-45 flat | 1-3 days | 95%+ |
| Western Union | 3-7% | 1-2 days | 90%+ |
| Wise | 0.5-1.5% | 1-2 days | 60%+ |
| **ArcRemit** | **0.3%** | **<1 second** | **-** |

## Tech Stack

- **Smart Contracts**: Solidity 0.8.20, OpenZeppelin, Hardhat
- **Frontend**: Next.js 14, React 18, TypeScript
- **Web3**: wagmi, viem, RainbowKit
- **Styling**: TailwindCSS, Framer Motion
- **Blockchain**: ARC Network (Circle L1)

## License

MIT
