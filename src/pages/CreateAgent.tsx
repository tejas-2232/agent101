import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Bot, FileText, Link as LinkIcon, Upload, Loader2 } from 'lucide-react';

type Step = 'info' | 'source' | 'processing';
type SourceType = 'url' | 'file';

export function CreateAgent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('info');
  const [loading, setLoading] = useState(false);

  const [agentName, setAgentName] = useState('');
  const [agentDescription, setAgentDescription] = useState('');
  const [sourceType, setSourceType] = useState<SourceType>('file');
  const [url, setUrl] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [error, setError] = useState('');

  const handleNext = () => {
    if (step === 'info') {
      if (!agentName.trim()) {
        setError('Please enter an agent name');
        return;
      }
      setError('');
      setStep('source');
    } else if (step === 'source') {
      if (sourceType === 'url' && !url.trim()) {
        setError('Please enter a valid URL');
        return;
      }
      if (sourceType === 'file' && (!files || files.length === 0)) {
        setError('Please select at least one file');
        return;
      }
      setError('');
      handleCreate();
    }
  };

  const handleCreate = async () => {
    if (!user) return;
    setLoading(true);
    setStep('processing');

    try {
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .insert({
          user_id: user.id,
          name: agentName,
          description: agentDescription || null,
          status: 'training',
        })
        .select()
        .single();

      if (agentError) throw agentError;

      if (sourceType === 'url') {
        const { error: docError } = await supabase
          .from('documents')
          .insert({
            agent_id: agent.id,
            source_type: 'url',
            source_url: url,
            processing_status: 'pending',
          });

        if (docError) throw docError;
      } else if (files) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const fileExt = file.name.split('.').pop()?.toLowerCase();
          const filePath = `${user.id}/${agent.id}/${Date.now()}_${file.name}`;

          const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(filePath, file);

          if (uploadError) {
            console.error('Upload error:', uploadError);
            continue;
          }

          const { error: docError } = await supabase
            .from('documents')
            .insert({
              agent_id: agent.id,
              source_type: 'file',
              file_name: file.name,
              file_type: fileExt || 'unknown',
              file_size: file.size,
              storage_path: filePath,
              processing_status: 'pending',
            });

          if (docError) {
            console.error('Document insert error:', docError);
          }
        }
      }

      const { data: pendingDocs } = await supabase
        .from('documents')
        .select('id')
        .eq('agent_id', agent.id)
        .eq('processing_status', 'pending');

      if (pendingDocs && pendingDocs.length > 0) {
        for (const doc of pendingDocs) {
          try {
            const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-document`;
            await fetch(apiUrl, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ document_id: doc.id }),
            });
          } catch (err) {
            console.error('Error processing document:', err);
          }
        }
      }

      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      console.error('Error creating agent:', err);
      setError('Failed to create agent. Please try again.');
      setLoading(false);
      setStep('source');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <nav className="bg-black/50 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => step === 'info' ? navigate('/dashboard') : setStep('info')}
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            <Link to="/" className="flex items-center space-x-2">
              <div className="bg-gradient-to-br from-purple-500 to-blue-500 p-2 rounded-lg">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">AgentsForYou</span>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Create New Agent</h1>
          <p className="text-gray-400">
            Build an AI agent that understands your content
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${step === 'info' || step === 'source' || step === 'processing' ? 'text-purple-400' : 'text-gray-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'info' || step === 'source' || step === 'processing' ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white' : 'bg-white/5 border border-white/10'}`}>
                1
              </div>
              <span className="font-medium hidden sm:inline">Info</span>
            </div>
            <div className={`w-16 h-0.5 ${step === 'source' || step === 'processing' ? 'bg-gradient-to-r from-purple-500 to-blue-500' : 'bg-white/10'}`} />
            <div className={`flex items-center space-x-2 ${step === 'source' || step === 'processing' ? 'text-purple-400' : 'text-gray-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'source' || step === 'processing' ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white' : 'bg-white/5 border border-white/10'}`}>
                2
              </div>
              <span className="font-medium hidden sm:inline">Source</span>
            </div>
            <div className={`w-16 h-0.5 ${step === 'processing' ? 'bg-gradient-to-r from-purple-500 to-blue-500' : 'bg-white/10'}`} />
            <div className={`flex items-center space-x-2 ${step === 'processing' ? 'text-purple-400' : 'text-gray-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'processing' ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white' : 'bg-white/5 border border-white/10'}`}>
                3
              </div>
              <span className="font-medium hidden sm:inline">Process</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl animate-slide-down">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
          {step === 'info' && (
            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  Agent Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="Customer Support Bot"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition text-white placeholder-gray-500"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  value={agentDescription}
                  onChange={(e) => setAgentDescription(e.target.value)}
                  placeholder="Answers questions about our products and services"
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition text-white placeholder-gray-500"
                />
              </div>
            </div>
          )}

          {step === 'source' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-4">
                  Choose Data Source
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => setSourceType('file')}
                    className={`p-6 border-2 rounded-xl transition ${sourceType === 'file' ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 hover:border-white/20 bg-white/5'}`}
                  >
                    <Upload className={`w-8 h-8 mx-auto mb-3 ${sourceType === 'file' ? 'text-purple-400' : 'text-gray-400'}`} />
                    <p className="font-medium text-white">Upload Files</p>
                    <p className="text-sm text-gray-400 mt-1">PDF, TXT, Markdown</p>
                  </button>

                  <button
                    onClick={() => setSourceType('url')}
                    className={`p-6 border-2 rounded-xl transition ${sourceType === 'url' ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 hover:border-white/20 bg-white/5'}`}
                  >
                    <LinkIcon className={`w-8 h-8 mx-auto mb-3 ${sourceType === 'url' ? 'text-blue-400' : 'text-gray-400'}`} />
                    <p className="font-medium text-white">Website URL</p>
                    <p className="text-sm text-gray-400 mt-1">Scrape web content</p>
                  </button>
                </div>
              </div>

              {sourceType === 'url' && (
                <div>
                  <label htmlFor="url" className="block text-sm font-medium text-gray-300 mb-2">
                    Website URL
                  </label>
                  <input
                    id="url"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition text-white placeholder-gray-500"
                  />
                  <p className="mt-2 text-sm text-gray-400">
                    The agent will scrape content from this URL and its linked pages
                  </p>
                </div>
              )}

              {sourceType === 'file' && (
                <div>
                  <label htmlFor="files" className="block text-sm font-medium text-gray-300 mb-2">
                    Upload Documents
                  </label>
                  <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-white/30 transition bg-white/5">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <label htmlFor="files" className="cursor-pointer">
                      <span className="text-purple-400 hover:text-purple-300 font-medium">
                        Click to upload
                      </span>
                      <span className="text-gray-400"> or drag and drop</span>
                    </label>
                    <p className="text-sm text-gray-500 mt-2">
                      PDF, TXT, or Markdown files
                    </p>
                    <input
                      id="files"
                      type="file"
                      multiple
                      accept=".pdf,.txt,.md"
                      onChange={(e) => setFiles(e.target.files)}
                      className="hidden"
                    />
                  </div>
                  {files && files.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-300 mb-2">
                        Selected files:
                      </p>
                      <ul className="space-y-1">
                        {Array.from(files).map((file, i) => (
                          <li key={i} className="text-sm text-gray-400">
                            • {file.name} ({(file.size / 1024).toFixed(1)} KB)
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 'processing' && (
            <div className="text-center py-8">
              <Loader2 className="w-16 h-16 animate-spin text-purple-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Creating Your Agent
              </h3>
              <p className="text-gray-400">
                Processing your content and training the agent...
              </p>
            </div>
          )}

          {step !== 'processing' && (
            <div className="flex justify-end mt-8 space-x-4">
              {step === 'source' && (
                <button
                  onClick={() => setStep('info')}
                  className="px-6 py-3 border border-white/20 rounded-xl font-medium text-gray-300 hover:bg-white/5 transition"
                >
                  Back
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-medium hover:opacity-90 transition disabled:opacity-50"
              >
                {step === 'info' ? 'Next' : 'Create Agent'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
