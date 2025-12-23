/**
 * Waits for the specified number of seconds.
 *
 * @param {Seconds} seconds - The number of seconds to wait.
 * @return {Promise<void>} A Promise that resolves after the specified number of seconds.
 */
export async function wait(seconds: Seconds): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000))
}

export enum Seconds {
  FIVE = 5,
  TEN = 10,
}
