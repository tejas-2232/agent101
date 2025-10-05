# Quick Start Guide - PDF-Powered AI Agents

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Node.js installed
- Supabase account (free tier works!)
- Cerebras API key (free - 1M tokens/day)

### Step 1: Setup Environment (2 minutes)

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://fnsxysryvdqezsnmenap.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

Get your Supabase anon key:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Settings → API → Copy `anon` `public` key

### Step 2: Install Dependencies (1 minute)

```bash
npm install
```

### Step 3: Deploy PDF Extraction Function (2 minutes)

**Option A: Automated (PowerShell on Windows)**
```powershell
.\deploy-pdf-extraction.ps1
```

**Option B: Manual**
```bash
npm install -g supabase
supabase login
supabase link --project-ref <xxxxxxxxxxxxxxxxxxxx>
supabase functions deploy process-document
supabase secrets set CEREBRAS_API_KEY=your_key_here
```

Get your Cerebras key:
1. Visit [cerebras.ai](https://cerebras.ai)
2. Sign up (free)
3. Dashboard → API Keys

### Step 4: Run the App (30 seconds)

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Step 5: Create Your First PDF Agent (1 minute)

1. **Register** an account
2. Click **"Create Agent"**
3. Enter name: "FAQ Bot"
4. Upload a PDF file (try with any FAQ or manual)
5. Wait ~5 seconds for processing
6. Click **"Chat"**
7. Ask questions about your PDF!

## 🎯 Example Test

Upload a PDF with this content:
```
FAQ Document
Q: What are your business hours?
A: Monday-Friday, 9am-5pm EST

Q: What is your return policy?
A: 30-day money-back guarantee
```

Then ask:
- "What are your business hours?" ✅
- "Can I return items?" ✅
- "Tell me about your return policy" ✅

The agent will answer using the PDF context!

## 🔧 Troubleshooting

### Frontend won't start
- Check `.env` file exists with correct keys
- Run `npm install` again

### Function deployment fails
- Check Supabase CLI is installed: `supabase --version`
- Re-login: `supabase login`
- Check project ref is correct

### PDF not processing
- Check Edge Function logs in Supabase Dashboard
- Verify `CEREBRAS_API_KEY` is set
- Try a simple text-based PDF first

### No response in chat
- Check browser console for errors
- Verify agent status is "active" in dashboard
- Check chunks were created (Supabase DB → chunks table)

## 📚 Learn More

- **Full Guide**: See `PDF_EXTRACTION_GUIDE.md`
- **Architecture**: See `SETUP_INSTRUCTIONS.md`
- **Support**: Check browser console and Supabase logs

## ✨ What's Next?

1. ✅ Try with different PDFs (manuals, FAQs, docs)
2. ✅ Upload multiple PDFs to same agent
3. ✅ Create specialized agents (Support, Sales, Technical)
4. 📝 Optional: Add LlamaParse for scanned PDFs
5. 🎨 Optional: Customize system prompts for each agent

---

**You're ready to build!** 🎉

Create AI agents that understand your documents and provide intelligent, context-aware responses just like Amazon Textract!
