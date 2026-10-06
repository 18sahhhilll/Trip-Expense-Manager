import type { SplitConfig, GroupSplitItem } from '../types';

export interface SplitResult {
  isValid: boolean;
  errorMessage?: string;
  unassignedPaise: number; // Positive = unassigned amount remaining; Negative = over-allocated
  allocations: Record<string, number>; // personId -> amountPaise
}

/**
 * Distributes integer paise among a list of participants based on non-negative weights.
 * Handles remainder paise deterministically so sum of allocations equals totalPaise exactly.
 */
export function distributePaiseProportionally(
  totalPaise: number,
  participantIds: string[],
  weights: number[]
): Record<string, number> {
  const result: Record<string, number> = {};
  if (participantIds.length === 0 || totalPaise <= 0) {
    participantIds.forEach(id => { result[id] = 0; });
    return result;
  }

  const totalWeight = weights.reduce((acc, w) => acc + (w > 0 ? w : 0), 0);

  // If total weight is zero or invalid, fall back to equal distribution
  if (totalWeight <= 0) {
    return distributePaiseEqually(totalPaise, participantIds);
  }

  let allocatedSum = 0;
  const fractions: { id: string; remainder: number; originalIndex: number }[] = [];

  participantIds.forEach((id, index) => {
    const weight = weights[index] > 0 ? weights[index] : 0;
    const rawShare = Math.floor((totalPaise * weight) / totalWeight);
    const fractionRemainder = (totalPaise * weight) % totalWeight;

    result[id] = rawShare;
    allocatedSum += rawShare;
    fractions.push({ id, remainder: fractionRemainder, originalIndex: index });
  });

  const leftoverPaise = totalPaise - allocatedSum;

  // Sort by fraction remainder descending, then original index to preserve stability
  fractions.sort((a, b) => {
    if (b.remainder !== a.remainder) {
      return b.remainder - a.remainder;
    }
    return a.originalIndex - b.originalIndex;
  });

  for (let i = 0; i < leftoverPaise; i++) {
    const winnerId = fractions[i % fractions.length].id;
    result[winnerId] = (result[winnerId] || 0) + 1;
  }

  return result;
}

/**
 * Distributes integer paise equally among participants, with deterministic remainder assignment.
 */
export function distributePaiseEqually(
  totalPaise: number,
  participantIds: string[]
): Record<string, number> {
  const result: Record<string, number> = {};
  if (participantIds.length === 0) return result;

  const count = participantIds.length;
  const baseShare = Math.floor(totalPaise / count);
  const remainder = totalPaise % count;

  participantIds.forEach((id, index) => {
    result[id] = baseShare + (index < remainder ? 1 : 0);
  });

  return result;
}

/**
 * Compute allocations and validate split configuration for an expense.
 */
export function calculateSplitAllocations(
  totalPaise: number,
  splitConfig: SplitConfig,
  allParticipantIds: string[]
): SplitResult {
  const result: SplitResult = {
    isValid: true,
    unassignedPaise: 0,
    allocations: {},
  };

  // Initialize all participants with 0
  allParticipantIds.forEach(id => {
    result.allocations[id] = 0;
  });

  if (totalPaise <= 0 || allParticipantIds.length === 0) {
    return result;
  }

  switch (splitConfig.mode) {
    case 'equal_everyone': {
      result.allocations = distributePaiseEqually(totalPaise, allParticipantIds);
      return result;
    }

    case 'equal_selected': {
      const selected = splitConfig.selectedParticipantIds || [];
      if (selected.length === 0) {
        result.isValid = false;
        result.errorMessage = 'Select at least one person to share this expense.';
        result.unassignedPaise = totalPaise;
        return result;
      }
      const selectedAllocations = distributePaiseEqually(totalPaise, selected);
      allParticipantIds.forEach(id => {
        result.allocations[id] = selectedAllocations[id] || 0;
      });
      return result;
    }

    case 'group_split': {
      const groups = splitConfig.groups || [];
      if (groups.length === 0) {
        result.isValid = false;
        result.errorMessage = 'Add at least one group for group split.';
        result.unassignedPaise = totalPaise;
        return result;
      }

      let explicitGroupSumPaise = 0;
      let remainderGroup: GroupSplitItem | undefined;

      for (const group of groups) {
        if (group.isRemainder) {
          if (remainderGroup) {
            result.isValid = false;
            result.errorMessage = 'Only one group can be designated as remainder.';
            return result;
          }
          remainderGroup = group;
        } else {
          explicitGroupSumPaise += group.amountPaise || 0;
        }
      }

      const remainingPaiseForRemainderGroup = totalPaise - explicitGroupSumPaise;

      if (remainingPaiseForRemainderGroup < 0) {
        result.isValid = false;
        result.errorMessage = 'Group amounts exceed total bill amount.';
        result.unassignedPaise = remainingPaiseForRemainderGroup;
        return result;
      }

      if (!remainderGroup && remainingPaiseForRemainderGroup !== 0) {
        result.isValid = false;
        result.unassignedPaise = remainingPaiseForRemainderGroup;
        result.errorMessage = `Group total does not match bill total. ${Math.abs(remainingPaiseForRemainderGroup / 100)} unassigned.`;
      }

      // Calculate each group's allocations
      const tempAllocations: Record<string, number> = {};
      allParticipantIds.forEach(id => { tempAllocations[id] = 0; });

      for (const group of groups) {
        const groupAmount = group.isRemainder
          ? Math.max(0, remainingPaiseForRemainderGroup)
          : (group.amountPaise || 0);

        if (group.participantIds.length === 0) {
          result.isValid = false;
          result.errorMessage = `Group "${group.name || 'Unnamed'}" has no members.`;
          return result;
        }

        const groupMemberShares = distributePaiseEqually(groupAmount, group.participantIds);
        for (const memberId of group.participantIds) {
          tempAllocations[memberId] = (tempAllocations[memberId] || 0) + (groupMemberShares[memberId] || 0);
        }
      }

      result.allocations = tempAllocations;
      return result;
    }

    case 'exact': {
      const exacts = splitConfig.exactAmountsPaise || {};
      let sumPaise = 0;
      allParticipantIds.forEach(id => {
        const val = exacts[id] || 0;
        sumPaise += val;
        result.allocations[id] = val;
      });

      const diff = totalPaise - sumPaise;
      result.unassignedPaise = diff;
      if (diff !== 0) {
        result.isValid = false;
        result.errorMessage = diff > 0 
          ? `Exact amounts sum to less than bill total (${diff / 100} unassigned).`
          : `Exact amounts exceed bill total by ${Math.abs(diff) / 100}.`;
      }
      return result;
    }

    case 'percentage': {
      const pctMap = splitConfig.percentages || {};
      let pctSum = 0;
      const weights: number[] = [];

      allParticipantIds.forEach(id => {
        const pct = pctMap[id] || 0;
        pctSum += pct;
        weights.push(pct);
      });

      // Allow 0.01 tolerance for floating point percentage inputs
      if (Math.abs(pctSum - 100) > 0.01) {
        result.isValid = false;
        result.errorMessage = `Percentages must sum to 100% (currently ${pctSum.toFixed(1)}%).`;
        result.unassignedPaise = Math.round(((100 - pctSum) / 100) * totalPaise);
        return result;
      }

      result.allocations = distributePaiseProportionally(totalPaise, allParticipantIds, weights);
      return result;
    }

    case 'shares': {
      const sharesMap = splitConfig.shares || {};
      const weights: number[] = [];
      let totalShares = 0;

      allParticipantIds.forEach(id => {
        const s = sharesMap[id] || 0;
        totalShares += Math.max(0, s);
        weights.push(Math.max(0, s));
      });

      if (totalShares <= 0) {
        result.isValid = false;
        result.errorMessage = 'Enter at least one share ratio value greater than 0.';
        result.unassignedPaise = totalPaise;
        return result;
      }

      result.allocations = distributePaiseProportionally(totalPaise, allParticipantIds, weights);
      return result;
    }

    default:
      return result;
  }
}
