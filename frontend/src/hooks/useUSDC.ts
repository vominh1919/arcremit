'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits, maxUint256 } from 'viem';
import { USDC_CONTRACT_ADDRESS, USDC_ABI, ARCREMIT_CONTRACT_ADDRESS } from '@/lib/contracts';

export function useUSDC() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const approve = (amount?: bigint) => {
    writeContract({
      address: USDC_CONTRACT_ADDRESS,
      abi: USDC_ABI,
      functionName: 'approve',
      args: [ARCREMIT_CONTRACT_ADDRESS, amount ?? maxUint256],
    });
  };

  const approveExact = (amount: string) => {
    const amountWei = parseUnits(amount, 6);
    writeContract({
      address: USDC_CONTRACT_ADDRESS,
      abi: USDC_ABI,
      functionName: 'approve',
      args: [ARCREMIT_CONTRACT_ADDRESS, amountWei],
    });
  };

  return {
    approve,
    approveExact,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

export function useUSDCBalance(address?: `0x${string}`) {
  const { data, isLoading, refetch } = useReadContract({
    address: USDC_CONTRACT_ADDRESS,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  return {
    balance: data as bigint | undefined,
    formattedBalance: data ? formatUnits(data as bigint, 6) : '0',
    isLoading,
    refetch,
  };
}

export function useUSDCAllowance(owner?: `0x${string}`) {
  const { data, isLoading, refetch } = useReadContract({
    address: USDC_CONTRACT_ADDRESS,
    abi: USDC_ABI,
    functionName: 'allowance',
    args: owner ? [owner, ARCREMIT_CONTRACT_ADDRESS] : undefined,
    query: { enabled: !!owner },
  });

  return {
    allowance: data as bigint | undefined,
    formattedAllowance: data ? formatUnits(data as bigint, 6) : '0',
    isLoading,
    refetch,
  };
}

export function formatUSDCDisplay(amount: bigint | undefined): string {
  if (!amount) return '0.00';
  const formatted = formatUnits(amount, 6);
  const num = parseFloat(formatted);
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
