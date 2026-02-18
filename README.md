# Blockchain Explorer UI (Multi-chain)

Run:

```bash
npm i
npm run dev
```

## What works out of the box
- **BTC / ETH / LTC** lookups (address + tx) via **BlockCypher** free endpoints (rate-limited).
- **TON / TRON** return demo data unless you provide API keys.

## Optional env keys
Create `.env.local`:

```bash
# TON
TONCENTER_API_KEY=your_key
TONCENTER_BASE_URL=https://toncenter.com/api/v2

# TRON
TRONGRID_API_KEY=your_key
TRONGRID_BASE_URL=https://api.trongrid.io
```

Then restart `npm run dev`.
