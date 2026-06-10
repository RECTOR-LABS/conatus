import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

// The project .env lives at the repo root. Import this module FIRST in any entrypoint
// so env is populated before other modules read it.
dotenv.config({ path: fileURLToPath(new URL("../../.env", import.meta.url)) });
