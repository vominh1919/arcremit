export const ARCREMIT_CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_ARCREMIT_ADDRESS as `0x${string}`) ||
  '0x5FbDB2315678afecb367f032d93F642f64180aa3';

export enum RemittanceStatus {
  Pending = 0,
  Claimed = 1,
  Refunded = 2,
}

export const ARCREMIT_ABI = [
  // ============ Core Remittance ============
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
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  // ============ Batch Send ============
  {
    type: 'function',
    name: 'batchCreateRemittances',
    inputs: [
      { name: 'receivers', type: 'address[]' },
      { name: 'amounts', type: 'uint256[]' },
      { name: 'messages', type: 'string[]' },
    ],
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'nonpayable',
  },
  // ============ Schedules ============
  {
    type: 'function',
    name: 'createSchedule',
    inputs: [
      { name: 'receiver', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'frequency', type: 'uint256' },
      { name: 'totalCycles', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'executeSchedule',
    inputs: [{ name: 'scheduleId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'cancelSchedule',
    inputs: [{ name: 'scheduleId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getSchedule',
    inputs: [{ name: 'scheduleId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'sender', type: 'address' },
          { name: 'receiver', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'frequency', type: 'uint256' },
          { name: 'totalCycles', type: 'uint256' },
          { name: 'completedCycles', type: 'uint256' },
          { name: 'nextExecution', type: 'uint256' },
          { name: 'isActive', type: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getUserSchedules',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
  },
  // ============ Contacts / Nicknames ============
  {
    type: 'function',
    name: 'setNickname',
    inputs: [
      { name: 'contact', type: 'address' },
      { name: 'nickname', type: 'string' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getNickname',
    inputs: [{ name: 'contact', type: 'address' }],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
  // ============ Referral ============
  {
    type: 'function',
    name: 'setReferrer',
    inputs: [{ name: 'referrer', type: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'referrerOf',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'referralEarnings',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'claimReferralEarnings',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  // ============ Templates ============
  {
    type: 'function',
    name: 'saveTemplate',
    inputs: [
      { name: 'receiver', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'description', type: 'string' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'createFromTemplate',
    inputs: [
      { name: 'templateId', type: 'uint256' },
      { name: 'message', type: 'string' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'deleteTemplate',
    inputs: [{ name: 'templateId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getUserTemplates',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getTemplate',
    inputs: [{ name: 'templateId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'owner', type: 'address' },
          { name: 'receiver', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'description', type: 'string' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  // ============ Events ============
  {
    type: 'event',
    name: 'RemittanceCreated',
    inputs: [
      { name: 'id', type: 'uint256', indexed: true },
      { name: 'sender', type: 'address', indexed: true },
      { name: 'receiver', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'fee', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'RemittanceClaimed',
    inputs: [
      { name: 'id', type: 'uint256', indexed: true },
      { name: 'receiver', type: 'address', indexed: true },
    ],
  },
  {
    type: 'event',
    name: 'ScheduleCreated',
    inputs: [
      { name: 'id', type: 'uint256', indexed: true },
      { name: 'sender', type: 'address', indexed: true },
      { name: 'receiver', type: 'address', indexed: true },
    ],
  },
  {
    type: 'event',
    name: 'ReferralSet',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'referrer', type: 'address', indexed: true },
    ],
  },
] as const;
