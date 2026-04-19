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
