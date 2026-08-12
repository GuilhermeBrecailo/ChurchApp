import { sendTrialReminders } from "../src/application/jobs/sendTrialReminders";

const result = await sendTrialReminders();
console.log(`Trial reminders sent: ${result.notified}`);
