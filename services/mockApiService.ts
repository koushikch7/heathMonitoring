
import { HealthMetrics } from "../types";

/**
 * Simulates an API call to a remote AI server.
 * In a real Android app, this would be an Axios or Fetch call to your backend.
 */
export const pushToAiServer = async (metrics: HealthMetrics): Promise<{ success: boolean; message: string }> => {
  console.log("Pushing metrics to mock API:", metrics);
  
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Simulate random server error (5% chance)
  if (Math.random() < 0.05) {
    throw new Error("Server reached timeout or internal error.");
  }

  return {
    success: true,
    message: `Data received at ${new Date().toISOString()}`
  };
};
