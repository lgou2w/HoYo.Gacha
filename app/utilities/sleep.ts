// Utility function to pause execution for a specified duration
export default async function sleep (ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
