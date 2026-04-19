'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { ARCREMIT_CONTRACT_ADDRESS, ARCREMIT_ABI, RemittanceStatus } from '@/lib/contracts';

export interface Remittance {
  id: number;
  sender: `0x${string}`;
  receiver: `0x${string}`;
  amount: bigint;
  fee: bigint;
  message: string;
  status: RemittanceStatus;
  createdAt: bigint;
  claimedAt: bigint;
}

export function useArcRemit() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const createRemittance = async (
    receiver: `0x${string}`,
    amount: string,
    message: string = ''
  ) => {
    const amountWei = parseUnits(amount, 6);
    writeContract({
      address: ARCREMIT_CONTRACT_ADDRESS,
      abi: ARCREMIT_ABI,
      functionName: 'createRemittance',
      args: [receiver, amountWei, message],
    });
  };

  const claimRemittance = async (remittanceId: number) => {
    writeContract({
      address: ARCREMIT_CONTRACT_ADDRESS,
      abi: ARCREMIT_ABI,
      functionName: 'claimRemittance',
      args: [BigInt(remittanceId)],
    });
  };

  const refundRemittance = async (remittanceId: number) => {
    writeContract({
      address: ARCREMIT_CONTRACT_ADDRESS,
      abi: ARCREMIT_ABI,
      functionName: 'refundRemittance',
      args: [BigInt(remittanceId)],
    });
  };

  return {
    createRemittance,
    claimRemittance,
    refundRemittance,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

export function usePendingRemittances(address?: `0x${string}`) {
  const { data, isLoading, refetch } = useReadContract({
    address: ARCREMIT_CONTRACT_ADDRESS,
    abi: ARCREMIT_ABI,
    functionName: 'getPendingRemittances',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  return {
    pendingIds: (data as bigint[]) || [],
    isLoading,
    refetch,
  };
}

export function useSentRemittances(address?: `0x${string}`) {
  const { data, isLoading, refetch } = useReadContract({
    address: ARCREMIT_CONTRACT_ADDRESS,
    abi: ARCREMIT_ABI,
    functionName: 'getSentRemittances',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  return {
    sentIds: (data as bigint[]) || [],
    isLoading,
    refetch,
  };
}

export function useRemittance(remittanceId?: number) {
  const { data, isLoading, refetch } = useReadContract({
    address: ARCREMIT_CONTRACT_ADDRESS,
    abi: ARCREMIT_ABI,
    functionName: 'getRemittance',
    args: remittanceId !== undefined ? [BigInt(remittanceId)] : undefined,
    query: { enabled: remittanceId !== undefined },
  });

  const remittance = data
    ? {
        id: remittanceId!,
        sender: (data as any).sender as `0x${string}`,
        receiver: (data as any).receiver as `0x${string}`,
        amount: (data as any).amount as bigint,
        fee: (data as any).fee as bigint,
        message: (data as any).message as string,
        status: (data as any).status as RemittanceStatus,
        createdAt: (data as any).createdAt as bigint,
        claimedAt: (data as any).claimedAt as bigint,
      }
    : undefined;

  return {
    remittance,
    isLoading,
    refetch,
  };
}

export function useFeePercentage() {
  const { data, isLoading } = useReadContract({
    address: ARCREMIT_CONTRACT_ADDRESS,
    abi: ARCREMIT_ABI,
    functionName: 'feePercentage',
  });

  return {
    feePercentage: data ? Number(data) : 30,
    isLoading,
  };
}

export function formatUSDC(amount: bigint): string {
  return formatUnits(amount, 6);
}

export function parseUSDC(amount: string): bigint {
  return parseUnits(amount, 6);
}

// ============ Batch Send ============

export function useBatchCreateRemittances() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const batchCreate = async (
    receivers: `0x${string}`[],
    amounts: bigint[],
    messages: string[]
  ) => {
    writeContract({
      address: ARCREMIT_CONTRACT_ADDRESS,
      abi: ARCREMIT_ABI,
      functionName: 'batchCreateRemittances',
      args: [receivers, amounts, messages],
    });
  };

  return { batchCreate, hash, isPending, isConfirming, isConfirmed, error };
}

// ============ Schedules ============

export function useCreateSchedule() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const createSchedule = async (
    receiver: `0x${string}`,
    amount: bigint,
    frequency: number,
    totalCycles: number
  ) => {
    writeContract({
      address: ARCREMIT_CONTRACT_ADDRESS,
      abi: ARCREMIT_ABI,
      functionName: 'createSchedule',
      args: [receiver, amount, BigInt(frequency), BigInt(totalCycles)],
    });
  };

  return { createSchedule, hash, isPending, isConfirming, isConfirmed, error };
}

export function useExecuteSchedule() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const executeSchedule = async (scheduleId: number) => {
    writeContract({
      address: ARCREMIT_CONTRACT_ADDRESS,
      abi: ARCREMIT_ABI,
      functionName: 'executeSchedule',
      args: [BigInt(scheduleId)],
    });
  };

  return { executeSchedule, hash, isPending, isConfirming, isConfirmed, error };
}

export function useCancelSchedule() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const cancelSchedule = async (scheduleId: number) => {
    writeContract({
      address: ARCREMIT_CONTRACT_ADDRESS,
      abi: ARCREMIT_ABI,
      functionName: 'cancelSchedule',
      args: [BigInt(scheduleId)],
    });
  };

  return { cancelSchedule, hash, isPending, isConfirming, isConfirmed, error };
}

// ============ Contacts ============

export function useSetNickname() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const setNickname = async (contact: `0x${string}`, nickname: string) => {
    writeContract({
      address: ARCREMIT_CONTRACT_ADDRESS,
      abi: ARCREMIT_ABI,
      functionName: 'setNickname',
      args: [contact, nickname],
    });
  };

  return { setNickname, hash, isPending, isConfirming, isConfirmed, error };
}

export function useGetNickname(contact?: `0x${string}`) {
  const { data, isLoading, refetch } = useReadContract({
    address: ARCREMIT_CONTRACT_ADDRESS,
    abi: ARCREMIT_ABI,
    functionName: 'getNickname',
    args: contact ? [contact] : undefined,
    query: { enabled: !!contact },
  });

  return {
    nickname: (data as string) || '',
    isLoading,
    refetch,
  };
}

// ============ Referral ============

export function useSetReferrer() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const setReferrer = async (referrer: `0x${string}`) => {
    writeContract({
      address: ARCREMIT_CONTRACT_ADDRESS,
      abi: ARCREMIT_ABI,
      functionName: 'setReferrer',
      args: [referrer],
    });
  };

  return { setReferrer, hash, isPending, isConfirming, isConfirmed, error };
}

export function useReferrer(user?: `0x${string}`) {
  const { data, isLoading, refetch } = useReadContract({
    address: ARCREMIT_CONTRACT_ADDRESS,
    abi: ARCREMIT_ABI,
    functionName: 'referrerOf',
    args: user ? [user] : undefined,
    query: { enabled: !!user },
  });

  return {
    referrer: data ? (data as `0x${string}`) : undefined,
    isLoading,
    refetch,
  };
}

export function useReferralEarnings(user?: `0x${string}`) {
  const { data, isLoading, refetch } = useReadContract({
    address: ARCREMIT_CONTRACT_ADDRESS,
    abi: ARCREMIT_ABI,
    functionName: 'referralEarnings',
    args: user ? [user] : undefined,
    query: { enabled: !!user },
  });

  return {
    earnings: data ? formatUnits(data as bigint, 6) : '0',
    isLoading,
    refetch,
  };
}

// ============ Templates ============

export function useSaveTemplate() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const saveTemplate = async (
    receiver: `0x${string}`,
    amount: bigint,
    description: string
  ) => {
    writeContract({
      address: ARCREMIT_CONTRACT_ADDRESS,
      abi: ARCREMIT_ABI,
      functionName: 'saveTemplate',
      args: [receiver, amount, description],
    });
  };

  return { saveTemplate, hash, isPending, isConfirming, isConfirmed, error };
}

export function useCreateFromTemplate() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const createFromTemplate = async (templateId: number, message: string = '') => {
    writeContract({
      address: ARCREMIT_CONTRACT_ADDRESS,
      abi: ARCREMIT_ABI,
      functionName: 'createFromTemplate',
      args: [BigInt(templateId), message],
    });
  };

  return { createFromTemplate, hash, isPending, isConfirming, isConfirmed, error };
}

export function useDeleteTemplate() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const deleteTemplate = async (templateId: number) => {
    writeContract({
      address: ARCREMIT_CONTRACT_ADDRESS,
      abi: ARCREMIT_ABI,
      functionName: 'deleteTemplate',
      args: [BigInt(templateId)],
    });
  };

  return { deleteTemplate, hash, isPending, isConfirming, isConfirmed, error };
}

export function useGetUserTemplates(user?: `0x${string}`) {
  const { data, isLoading, refetch } = useReadContract({
    address: ARCREMIT_CONTRACT_ADDRESS,
    abi: ARCREMIT_ABI,
    functionName: 'getUserTemplates',
    args: user ? [user] : undefined,
    query: { enabled: !!user },
  });

  return {
    templateIds: (data as bigint[]) || [],
    isLoading,
    refetch,
  };
}
