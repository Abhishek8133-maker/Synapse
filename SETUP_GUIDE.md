# Setup Guide - Project Synapse

## 🔑 **API Key Configuration**

### OpenAI API Key (for Semantic Search)

**Status:** ✅ Configured and tested
**Location:** `apps/web/.env.local` (gitignored for security)
**Result:** Valid API key, requires billing setup

### Next Steps:

1. **Set up OpenAI Billing:**
   - Visit: https://platform.openai.com/account/billing
   - Add payment method
   - Set usage limits (optional but recommended)

2. **After Billing Setup:**
   - Test semantic search functionality
   - Verify embedding generation works
   - Enjoy advanced AI-powered search

## 🚀 **Quick Start**

```bash
cd /workspace/cmhpwri2r00p5r3ilg7ltlvhe/Synapse

# Start databases
docker-compose up -d

# Run migrations
npm run db:migrate

# Start development servers
npm run dev
```

## 🧪 **Testing the API**

Visit `http://localhost:3000/test` to:
- Verify OpenAI API connectivity
- Test embedding generation
- Validate semantic search

## 💡 **What Works Now**

Even without billing setup:
- ✅ Keyword search (full-text)
- ✅ Content capture (browser extension)
- ✅ Metadata filtering
- ✅ User authentication
- ✅ Data storage
- ✅ Basic semantic search (local fallback)

## 📊 **Cost Estimates**

OpenAI embeddings (text-embedding-3-small):
- ~$0.02 per 1M tokens
- Typical usage: $0.01-0.05 per month
- Very cost-effective for personal use

---

**Status:** ✅ Ready for Development
**Updated:** November 8, 2024