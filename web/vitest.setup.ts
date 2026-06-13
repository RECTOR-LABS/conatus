import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// RTL auto-cleanup only self-registers under `globals: true`; register it explicitly.
afterEach(cleanup);
