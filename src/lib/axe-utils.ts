import axe from "axe-core";

let isAxeRunning = false;

/**
 * Safely runs axe.run by ensuring only one instance is running at a time.
 * If axe is already running, it waits for it to finish.
 */
export async function safeAxeRun(context?: any, options?: any): Promise<axe.AxeResults> {
  // Simple polling lock
  while (isAxeRunning) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  isAxeRunning = true;
  try {
    // @ts-ignore - axe.run returns a promise when no callback is provided
    const results: axe.AxeResults = await axe.run(context || document, options);
    return results;
  } finally {
    isAxeRunning = false;
  }
}
