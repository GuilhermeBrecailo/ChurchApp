// Registro de todos os handlers da demo. Para cobrir um endpoint novo, crie
// (ou edite) o arquivo da área e acrescente aqui - veja demo/README.md.

import type { DemoRouter } from "../lib";
import admin from "./admin";
import auth from "./auth";
import billing from "./billing";
import church from "./church";
import content from "./content";
import departments from "./departments";
import holyrics from "./holyrics";
import messages from "./messages";
import notifications from "./notifications";
import occurrences from "./occurrences";
import people from "./people";
import reports from "./reports";
import schedules from "./schedules";

const AREAS = [
  auth,
  church,
  departments,
  schedules,
  occurrences,
  people,
  content,
  notifications,
  messages,
  reports,
  billing,
  holyrics,
  admin,
];

export function registerAllHandlers(router: DemoRouter) {
  for (const register of AREAS) register(router);
}
