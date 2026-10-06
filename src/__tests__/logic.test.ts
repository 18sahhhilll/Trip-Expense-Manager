import { describe, it, expect } from 'vitest';
import { distributePaiseEqually, calculateSplitAllocations } from '../logic/splitEngine';
import { calculateBalances } from '../logic/balances';
import { calculateSettlementPlan } from '../logic/settlement';
import { getSampleTrip } from '../data/sampleData';
import type { PersonBalance } from '../types';

describe('Split Engine Logic', () => {
  it('should split paise equally with deterministic remainder distribution', () => {
    // 10000 paise (₹100) split among 3 people
    const result = distributePaiseEqually(10000, ['a', 'b', 'c']);
    expect(result['a']).toBe(3334);
    expect(result['b']).toBe(3333);
    expect(result['c']).toBe(3333);
    const sum = Object.values(result).reduce((acc, val) => acc + val, 0);
    expect(sum).toBe(10000);
  });

  it('should handle group split (6 veg / 4 non-veg ₹5000 total)', () => {
    const vegIds = ['v1', 'v2', 'v3', 'v4', 'v5', 'v6'];
    const nonVegIds = ['nv1', 'nv2', 'nv3', 'nv4'];
    const allIds = [...vegIds, ...nonVegIds];

    const splitConfig = {
      mode: 'group_split' as const,
      groups: [
        {
          id: 'g_veg',
          name: 'Veg Group',
          participantIds: vegIds,
          amountPaise: 240000, // ₹2,400
        },
        {
          id: 'g_nonveg',
          name: 'Non-Veg Group',
          participantIds: nonVegIds,
          isRemainder: true, // should absorb ₹2,600 (260000 paise)
        },
      ],
    };

    const res = calculateSplitAllocations(500000, splitConfig, allIds);
    expect(res.isValid).toBe(true);

    // Veg group: ₹2,400 / 6 = ₹400 (40000 paise) each
    vegIds.forEach(id => {
      expect(res.allocations[id]).toBe(40000);
    });

    // Non-veg group: ₹2,600 / 4 = ₹650 (65000 paise) each
    nonVegIds.forEach(id => {
      expect(res.allocations[id]).toBe(65000);
    });

    const sum = Object.values(res.allocations).reduce((acc, val) => acc + val, 0);
    expect(sum).toBe(500000);
  });

  it('should validate exact amounts sum to total', () => {
    const allIds = ['p1', 'p2'];
    const invalidConfig = {
      mode: 'exact' as const,
      exactAmountsPaise: { p1: 10000, p2: 10000 },
    };
    const res = calculateSplitAllocations(30000, invalidConfig, allIds);
    expect(res.isValid).toBe(false);
    expect(res.unassignedPaise).toBe(10000);
  });

  it('should validate percentages sum to 100%', () => {
    const allIds = ['p1', 'p2'];
    const invalidConfig = {
      mode: 'percentage' as const,
      percentages: { p1: 50, p2: 40 },
    };
    const res = calculateSplitAllocations(10000, invalidConfig, allIds);
    expect(res.isValid).toBe(false);
    expect(res.errorMessage).toContain('Percentages must sum to 100%');
  });
});

describe('Sample Dataset Integration Verification', () => {
  const sampleTrip = getSampleTrip();

  it('Table 1: should sum total expense amount to ₹7,195', () => {
    const totalExpensePaise = sampleTrip.expenses.reduce((acc, e) => acc + e.amountPaise, 0);
    expect(totalExpensePaise).toBe(719500); // 7195 * 100
  });

  it('Table 2: should produce exact expected Balance Summary for sample data', () => {
    const balances = calculateBalances(sampleTrip.participants, sampleTrip.expenses);

    // Check Total Paid
    const totalPaid = balances.reduce((acc, b) => acc + b.paidPaise, 0);
    expect(totalPaid).toBe(719500);

    // Check Total Share
    const totalShare = balances.reduce((acc, b) => acc + b.sharePaise, 0);
    expect(totalShare).toBe(719500);

    // Map by person ID for easy lookup
    const balanceMap = new Map<string, PersonBalance>();
    balances.forEach(b => balanceMap.set(b.personId, b));

    // Niraj: Paid 590 (849 less)
    const niraj = balanceMap.get('p_niraj')!;
    expect(niraj.paidPaise).toBe(59000);
    expect(niraj.sharePaise).toBe(143900);
    expect(niraj.netPaise).toBe(-84900); // 849 less

    // Ved Ramjiyani: Paid 335 (1,104 less)
    const vedRam = balanceMap.get('p_ved_ramjiyani')!;
    expect(vedRam.paidPaise).toBe(33500);
    expect(vedRam.sharePaise).toBe(143900);
    expect(vedRam.netPaise).toBe(-110400); // 1,104 less

    // Ved Ruparel: Paid 2,490 (1,051 more)
    const vedRup = balanceMap.get('p_ved_ruparel')!;
    expect(vedRup.paidPaise).toBe(249000);
    expect(vedRup.sharePaise).toBe(143900);
    expect(vedRup.netPaise).toBe(105100); // 1,051 more

    // Sahil: Paid 1,790 (351 more)
    const sahil = balanceMap.get('p_sahil')!;
    expect(sahil.paidPaise).toBe(179000);
    expect(sahil.sharePaise).toBe(143900);
    expect(sahil.netPaise).toBe(35100); // 351 more

    // Jay: Paid 1,990 (551 more)
    const jay = balanceMap.get('p_jay')!;
    expect(jay.paidPaise).toBe(199000);
    expect(jay.sharePaise).toBe(143900);
    expect(jay.netPaise).toBe(55100); // 551 more
  });

  it('Table 3: should produce exactly 4 transactions that fully settle all balances', () => {
    const balances = calculateBalances(sampleTrip.participants, sampleTrip.expenses);
    const settlements = calculateSettlementPlan(balances);

    expect(settlements).toHaveLength(4);

    // Verify Niraj pays Ved Ruparel ₹849
    const nirajToVedRup = settlements.find(s => s.fromPersonId === 'p_niraj' && s.toPersonId === 'p_ved_ruparel');
    expect(nirajToVedRup).toBeDefined();
    expect(nirajToVedRup?.amountPaise).toBe(84900);

    // Verify Ved Ramjiyani pays Ved Ruparel ₹202
    const vedRamToVedRup = settlements.find(s => s.fromPersonId === 'p_ved_ramjiyani' && s.toPersonId === 'p_ved_ruparel');
    expect(vedRamToVedRup).toBeDefined();
    expect(vedRamToVedRup?.amountPaise).toBe(20200);

    // Verify Ved Ramjiyani pays Sahil ₹351
    const vedRamToSahil = settlements.find(s => s.fromPersonId === 'p_ved_ramjiyani' && s.toPersonId === 'p_sahil');
    expect(vedRamToSahil).toBeDefined();
    expect(vedRamToSahil?.amountPaise).toBe(35100);

    // Verify Ved Ramjiyani pays Jay ₹551
    const vedRamToJay = settlements.find(s => s.fromPersonId === 'p_ved_ramjiyani' && s.toPersonId === 'p_jay');
    expect(vedRamToJay).toBeDefined();
    expect(vedRamToJay?.amountPaise).toBe(55100);
  });
});
