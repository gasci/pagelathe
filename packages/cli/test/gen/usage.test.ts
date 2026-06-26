import { describe, expect, it, vi } from "vitest";
import { TokenMeter, makeBudgetGuard, BudgetAbortError } from "../../src/gen/usage.js";

describe("TokenMeter", () => {
  it("accumulates usage and fires onRecord with the running total", () => {
    const meter = new TokenMeter();
    const seen: number[] = [];
    meter.onRecord = (_u, agg) => seen.push(agg.totalTokens);
    meter.record({ promptTokens: 10, completionTokens: 5, totalTokens: 15 });
    meter.record({ promptTokens: 20, completionTokens: 10, totalTokens: 30 });
    expect(meter.total).toBe(45);
    expect(meter.usage).toEqual({ promptTokens: 30, completionTokens: 15, totalTokens: 45 });
    expect(seen).toEqual([15, 45]);
  });
});

describe("makeBudgetGuard", () => {
  const usage = (n: number) => ({ promptTokens: n, completionTokens: 0, totalTokens: n });

  it("does not prompt while under budget", async () => {
    const meter = new TokenMeter();
    meter.record(usage(50));
    const confirm = vi.fn().mockResolvedValue(true);
    const guard = makeBudgetGuard(meter, 100, confirm);
    await guard();
    expect(confirm).not.toHaveBeenCalled();
  });

  it("prompts once at/over budget; continuing suppresses further prompts", async () => {
    const meter = new TokenMeter();
    meter.record(usage(120));
    const confirm = vi.fn().mockResolvedValue(true);
    const guard = makeBudgetGuard(meter, 100, confirm);
    await guard();
    meter.record(usage(50)); // now 170, still over
    await guard();
    expect(confirm).toHaveBeenCalledTimes(1); // confirmed once, no re-prompt
    expect(confirm).toHaveBeenCalledWith(120, 100);
  });

  it("throws BudgetAbortError when the user declines", async () => {
    const meter = new TokenMeter();
    meter.record(usage(120));
    const guard = makeBudgetGuard(meter, 100, () => false);
    await expect(guard()).rejects.toBeInstanceOf(BudgetAbortError);
  });

  it("never prompts when the cap is disabled (maxTokens <= 0)", async () => {
    const meter = new TokenMeter();
    meter.record(usage(10_000));
    const confirm = vi.fn().mockResolvedValue(false);
    const guard = makeBudgetGuard(meter, 0, confirm);
    await guard();
    expect(confirm).not.toHaveBeenCalled();
  });
});
