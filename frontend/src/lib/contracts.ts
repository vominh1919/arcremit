export const ARCREMIT_CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000' as const;
export const USDC_CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

export const ARCREMIT_ABI = [
  {
    type: 'function',
    name: 'createRemittance',
    inputs: [
      { name: 'receiver', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'message', type: 'string' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'claimRemittance',
    inputs: [{ name: 'remittanceId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'refundRemittance',
    inputs: [{ name: 'remittanceId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getRemittance',
    inputs: [{ name: 'remittanceId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'sender', type: 'address' },
          { name: 'receiver', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'fee', type: 'uint256' },
          { name: 'message', type: 'string' },
          { name: 'status', type: 'uint8' },
          { name: 'createdAt', type: 'uint256' },
          { name: 'claimedAt', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getPendingRemittances',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getSentRemittances',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'feePercentage',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'nextRemittanceId',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'RemittanceCreated',
    inputs: [
      { name: 'remittanceId', type: 'uint256', indexed: true },
      { name: 'sender', type: 'address', indexed: true },
      { name: 'receiver', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'fee', type: 'uint256', indexed: false },
      { name: 'message', type: 'string', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'RemittanceClaimed',
    inputs: [
      { name: 'remittanceId', type: 'uint256', indexed: true },
      { name: 'receiver', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'RemittanceRefunded',
    inputs: [
      { name: 'remittanceId', type: 'uint256', indexed: true },
      { name: 'sender', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
] as const;

export const USDC_ABI = [
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'decimals',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'symbol',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
] as const;

export enum RemittanceStatus {
  Pending = 0,
  Claimed = 1,
  Refunded = 2,
}

export const FEE_PERCENTAGE = 30; // 0.3% = 30 basis points
export const FEE_DENOMINATOR = 10000;
