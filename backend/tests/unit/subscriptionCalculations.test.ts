import { SubscriptionCycle } from '@prisma/client';

describe('Subscription Run-rate Calculations Unit Tests', () => {
  function calculateCosts(amount: number, cycle: SubscriptionCycle) {
    let monthly = 0;
    let annual = 0;

    switch (cycle) {
      case SubscriptionCycle.MONTHLY:
        monthly = amount;
        annual = amount * 12;
        break;
      case SubscriptionCycle.ANNUAL:
        monthly = amount / 12;
        annual = amount;
        break;
      case SubscriptionCycle.QUARTERLY:
        monthly = amount / 3;
        annual = amount * 4;
        break;
      case SubscriptionCycle.WEEKLY:
        monthly = (amount * 52) / 12;
        annual = amount * 52;
        break;
    }

    return {
      monthly: Math.round(monthly * 100) / 100,
      annual: Math.round(annual * 100) / 100
    };
  }

  test('calculates MONTHLY subscription costs accurately', () => {
    const res = calculateCosts(20, SubscriptionCycle.MONTHLY);
    expect(res.monthly).toBe(20);
    expect(res.annual).toBe(240);
  });

  test('calculates ANNUAL subscription costs accurately', () => {
    const res = calculateCosts(120, SubscriptionCycle.ANNUAL);
    expect(res.monthly).toBe(10);
    expect(res.annual).toBe(120);
  });

  test('calculates QUARTERLY subscription costs accurately', () => {
    const res = calculateCosts(90, SubscriptionCycle.QUARTERLY);
    expect(res.monthly).toBe(30);
    expect(res.annual).toBe(360);
  });

  test('calculates WEEKLY subscription costs accurately', () => {
    const res = calculateCosts(10, SubscriptionCycle.WEEKLY);
    expect(res.monthly).toBe(43.33); // (10 * 52) / 12 = 43.33
    expect(res.annual).toBe(520);
  });
});
