/** Token usage reported by a provider for a single LLM call. */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/** Sink the provider clients call after each response (including retries). */
export type UsageSink = (usage: TokenUsage) => void;

/** Thrown when the user declines to continue past the token budget. */
export class BudgetAbortError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BudgetAbortError";
  }
}

/** Accumulates token usage across all LLM calls in a generation run. */
export class TokenMeter {
  private prompt = 0;
  private completion = 0;
  private totalUsed = 0;
  /** Called after every recorded usage with the latest entry + running total. */
  onRecord?: (usage: TokenUsage, aggregate: TokenUsage) => void;

  record(usage: TokenUsage): void {
    this.prompt += usage.promptTokens;
    this.completion += usage.completionTokens;
    this.totalUsed += usage.totalTokens;
    this.onRecord?.(usage, this.usage);
  }

  get usage(): TokenUsage {
    return {
      promptTokens: this.prompt,
      completionTokens: this.completion,
      totalTokens: this.totalUsed,
    };
  }

  get total(): number {
    return this.totalUsed;
  }
}

export type BudgetConfirm = (used: number, budget: number) => boolean | Promise<boolean>;

/**
 * Build a `beforeStep` guard: once the meter crosses `maxTokens`, it asks
 * `confirm` whether to continue. Continuing suppresses further prompts for the
 * rest of the run; declining throws BudgetAbortError. `maxTokens <= 0` disables
 * the cap entirely (counter only).
 */
export function makeBudgetGuard(
  meter: TokenMeter,
  maxTokens: number,
  confirm: BudgetConfirm,
): () => Promise<void> {
  let confirmed = false;
  return async () => {
    if (maxTokens <= 0 || confirmed) return;
    if (meter.total < maxTokens) return;
    const proceed = await confirm(meter.total, maxTokens);
    if (!proceed) {
      throw new BudgetAbortError(
        `Token budget reached: used ${meter.total} of ${maxTokens}. Re-run with a higher --max-tokens to continue.`,
      );
    }
    confirmed = true;
  };
}
