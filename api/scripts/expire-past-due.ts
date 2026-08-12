import { expirePastDue } from "../src/application/jobs/expirePastDue";

const result = await expirePastDue();
console.log(`Past-due subscriptions downgraded: ${result.expired}`);
