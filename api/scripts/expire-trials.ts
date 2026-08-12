import { expireTrials } from "../src/application/jobs/expireTrials";

const result = await expireTrials();
console.log(`Expired trials downgraded: ${result.expired}`);
