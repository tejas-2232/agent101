# Getting Started Checklist ✅

Follow this checklist to get your PDF-powered AI agent platform running!

## Prerequisites

- [ ] Node.js installed (v16+)
- [ ] Supabase account created
- [ ] Git installed (optional)

---

## Step 1: Environment Setup (3 minutes)

### Create `.env` file in project root:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**Where to get your keys:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the `anon` `public` key

**Checklist:**
- [ ] Created `.env` file
- [ ] Added Supabase URL
- [ ] Added Supabase anon key

---

## Step 2: Install Dependencies (1 minute)

```bash
npm install
```

**Checklist:**
- [ ] Dependencies installed successfully
- [ ] No error messages

---

## Step 3: Get API Keys (5 minutes)

### Cerebras API (Required)

1. Visit [https://cerebras.ai](https://cerebras.ai)
2. Click "Sign Up" or "Get API Key"
3. Complete registration
4. Go to Dashboard → API Keys
5. Copy your API key

**Save this key - you'll need it in Step 4!**

- [ ] Cerebras account created
- [ ] API key copied

### LlamaParse API (Optional - for scanned PDFs)

1. Visit [https://cloud.llamaindex.ai](https://cloud.llamaindex.ai)
2. Sign up for free account
3. Go to API Keys
4. Create new key
5. Copy the key

**Save this key if you want scanned PDF support!**

- [ ] LlamaParse account created (optional)
- [ ] API key copied (optional)

---

## Step 4: Deploy Edge Functions (3 minutes)

### Option A: Automated (Recommended for Windows)

```powershell
.\deploy-pdf-extraction.ps1
```

Follow the prompts to:
- Link Supabase project
- Add Cerebras API key
- Add LlamaParse API key (optional)
- Deploy function

**Checklist:**
- [ ] Script completed successfully
- [ ] Function deployed
- [ ] API keys set

### Option B: Manual

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref <xxxxxxxxxxxxxxxxxxxx>

# Set secrets
supabase secrets set CEREBRAS_API_KEY=your_key_here

# Optional: for scanned PDFs
supabase secrets set LLAMAPARSE_API_KEY=your_key_here

# Deploy
supabase functions deploy process-document
```

**Checklist:**
- [ ] Supabase CLI installed
- [ ] Logged in to Supabase
- [ ] Project linked
- [ ] Cerebras API key set
- [ ] LlamaParse API key set (optional)
- [ ] Function deployed

---

## Step 5: Test the Setup (2 minutes)

### Start the development server:

```bash
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**Checklist:**
- [ ] Dev server started
- [ ] No errors in terminal
- [ ] Can open http://localhost:5173

---

## Step 6: Create Your First Agent (2 minutes)

### In the browser:

1. **Register**
   - Go to http://localhost:5173
   - Click "Register"
   - Enter email and password
   - [ ] Account created

2. **Create Agent**
   - Click "Create Agent"
   - Name: "Test FAQ Bot"
   - Description: "Testing PDF extraction"
   - [ ] Agent info entered

3. **Upload PDF**
   - Select "Upload Files"
   - Choose a PDF file (any FAQ or document)
   - Click "Create Agent"
   - [ ] PDF uploaded
   - [ ] Processing started

4. **Wait for Processing**
   - Watch for agent status to change to "Active"
   - Should take 5-30 seconds
   - [ ] Agent is active

5. **Test Chat**
   - Click "Chat" on your agent
   - Ask a question about the PDF content
   - [ ] Received response
   - [ ] Response uses PDF context

---

## Step 7: Verify Everything Works ✅

### Test Checklist:

- [ ] Frontend loads without errors
- [ ] Can register/login
- [ ] Can create agents
- [ ] Can upload PDFs
- [ ] PDFs process successfully
- [ ] Agent status changes to "active"
- [ ] Can chat with agent
- [ ] Agent responds with PDF context
- [ ] Multiple questions work correctly

---

## 🎉 Success!

If all checkboxes are checked, congratulations! Your PDF-powered AI agent platform is fully operational!

### What You Can Do Now:

✅ Upload more PDFs to your test agent
✅ Create specialized agents (Support, Sales, Technical)
✅ Try different types of documents
✅ Test with multiple PDFs per agent
✅ Share with users/team

---

## 🐛 Troubleshooting

### Issue: "Missing Supabase environment variables"

**Solution:** Check your `.env` file exists and has correct keys

### Issue: Function deployment fails

**Solution:** 
```bash
# Re-login to Supabase
supabase logout
supabase login

# Try deploying again
supabase functions deploy process-document
```

### Issue: PDF not processing

**Check:**
1. Supabase Dashboard → Edge Functions → Logs
2. Look for errors in process-document function
3. Verify CEREBRAS_API_KEY is set

### Issue: Chat not working

**Check:**
1. Browser console for errors
2. Verify agent status is "active"
3. Check CEREBRAS_API_KEY is set correctly

### Issue: TypeScript errors in IDE

**Solution:** Ignore them! These are expected for Deno edge functions. The code works when deployed.

---

## 📚 Next Steps

After setup is complete:

1. **Read Documentation:**
   - [ ] Review [PDF_EXTRACTION_GUIDE.md](PDF_EXTRACTION_GUIDE.md)
   - [ ] Check [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)

2. **Experiment:**
   - [ ] Try different PDF types
   - [ ] Upload multiple documents
   - [ ] Customize system prompts
   - [ ] Test with real use cases

3. **Optional Enhancements:**
   - [ ] Add LlamaParse for scanned PDFs
   - [ ] Customize chunk sizes
   - [ ] Adjust RAG retrieval count
   - [ ] Add custom styling

---

## 🆘 Need Help?

- **Setup Issues**: Check [QUICK_START.md](QUICK_START.md)
- **PDF Problems**: See [PDF_EXTRACTION_GUIDE.md](PDF_EXTRACTION_GUIDE.md)
- **Technical Details**: Review [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
- **Supabase Logs**: Dashboard → Edge Functions → Logs
- **Browser Console**: F12 → Console tab

---

**Happy Building! 🚀**

You now have a production-ready AI agent platform that understands PDF documents!
