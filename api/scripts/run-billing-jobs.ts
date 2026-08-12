// Roda os tres jobs de billing em sequencia - pensado pra um unico cron
// diario (ver README/CLAUDE.md pra como o cron esta configurado em prod).
import { expireTrials } from "../src/application/jobs/expireTrials";
import { expirePastDue } from "../src/application/jobs/expirePastDue";
import { sendTrialReminders } from "../src/application/jobs/sendTrialReminders";

const trials = await expireTrials();
console.log(`Expired trials downgraded: ${trials.expired}`);

const pastDue = await expirePastDue();
console.log(`Past-due subscriptions downgraded: ${pastDue.expired}`);

const reminders = await sendTrialReminders();
console.log(`Trial reminders sent: ${reminders.notified}`);
