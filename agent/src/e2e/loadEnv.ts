import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

// The project .env lives at the repo root, but `pnpm e2e` runs from agent/. Load it explicitly, and
// import this module FIRST in the E2E entrypoint so env is populated before any other module reads it.
dotenv.config({ path: fileURLToPath(new URL("../../../.env", import.meta.url)) });
