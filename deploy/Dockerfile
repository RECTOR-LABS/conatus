FROM node:24-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 python3-venv python3-pip git curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Foundry (forge) — Slither compiles via a temp Foundry workspace per audit
RUN curl -L https://foundry.paradigm.xyz | bash && /root/.foundry/bin/foundryup
ENV PATH="/root/.foundry/bin:${PATH}"

# Slither in a venv (same layout as local: .venv/bin/slither)
RUN python3 -m venv /app/.venv && /app/.venv/bin/pip install --no-cache-dir slither-analyzer
ENV SLITHER_BIN=/app/.venv/bin/slither

WORKDIR /app/agent
RUN corepack enable
COPY agent/package.json agent/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY agent/ ./

EXPOSE 8787
CMD ["pnpm", "start"]
