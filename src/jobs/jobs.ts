import { sendWelcomeEmailJob } from "./handlers/sendWelcomeEmailJob";

/**
 * Register all job functions here. This allows for better type safety and easier maintenance as the application grows.
 */
export const jobs = {
    sendWelcomeEmailJob,
}