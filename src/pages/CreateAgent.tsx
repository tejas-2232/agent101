import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Bot, FileText, Link as LinkIcon, Upload, Loader2 } from 'lucide-react';

type Step = 'info' | 'source' | 'processing';
type SourceType = 'url' | 'file';

// Llama model configurations
const LLAMA_MODELS = {
  "llama-3.3-70b": {
    name: "Llama 3.3 70B",
    description: "Most capable model for complex reasoning",
    maxTokens: 2000,
    temperature: 0.7
  },
  "llama-3.1-70b": {
    name: "Llama 3.1 70B", 
    description: "Balanced performance and speed",
    maxTokens: 1500,
    temperature: 0.7
  },
  "llama-3.1-8b": {
    name: "Llama 3.1 8B",
    description: "Fast responses for simple queries",
    maxTokens: 1000,
    temperature: 0.8
  }
};

export function CreateAgent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('info');
  const [loading, setLoading] = useState(false);

  const [agentName, setAgentName] = useState('');
  const [agentDescription, setAgentDescription] = useState('');
  const [selectedModel, setSelectedModel] = useState('llama-3.3-70b');
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
          model: selectedModel,
          temperature: LLAMA_MODELS[selectedModel].temperature,
          max_tokens: LLAMA_MODELS[selectedModel].maxTokens,
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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => step === 'info' ? navigate('/dashboard') : setStep('info')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Agent</h1>
          <p className="text-gray-600">
            Build an AI agent that understands your content
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${step === 'info' || step === 'source' || step === 'processing' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'info' || step === 'source' || step === 'processing' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="font-medium">Info</span>
            </div>
            <div className={`w-16 h-0.5 ${step === 'source' || step === 'processing' ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div className={`flex items-center space-x-2 ${step === 'source' || step === 'processing' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'source' || step === 'processing' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="font-medium">Source</span>
            </div>
            <div className={`w-16 h-0.5 ${step === 'processing' ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div className={`flex items-center space-x-2 ${step === 'processing' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'processing' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                3
              </div>
              <span className="font-medium">Process</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {step === 'info' && (
            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Agent Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="Customer Support Bot"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  value={agentDescription}
                  onChange={(e) => setAgentDescription(e.target.value)}
                  placeholder="Answers questions about our products and services"
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-2">
                  Llama Model
                </label>
                <select
                  id="model"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Object.entries(LLAMA_MODELS).map(([key, model]) => (
                    <option key={key} value={key}>
                      {model.name} - {model.description}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-sm text-gray-500">
                  Choose the Llama model that best fits your needs. Larger models provide better reasoning but are slower.
                </p>
              </div>
            </div>
          )}

          {step === 'source' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Choose Data Source
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setSourceType('file')}
                    className={`p-6 border-2 rounded-lg transition ${sourceType === 'file' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <Upload className={`w-8 h-8 mx-auto mb-3 ${sourceType === 'file' ? 'text-blue-600' : 'text-gray-400'}`} />
                    <p className="font-medium text-gray-900">Upload Files</p>
                    <p className="text-sm text-gray-500 mt-1">PDF, TXT, Markdown</p>
                  </button>

                  <button
                    onClick={() => setSourceType('url')}
                    className={`p-6 border-2 rounded-lg transition ${sourceType === 'url' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <LinkIcon className={`w-8 h-8 mx-auto mb-3 ${sourceType === 'url' ? 'text-blue-600' : 'text-gray-400'}`} />
                    <p className="font-medium text-gray-900">Website URL</p>
                    <p className="text-sm text-gray-500 mt-1">Scrape web content</p>
                  </button>
                </div>
              </div>

              {sourceType === 'url' && (
                <div>
                  <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                    Website URL
                  </label>
                  <input
                    id="url"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    The agent will scrape content from this URL and its linked pages
                  </p>
                </div>
              )}

              {sourceType === 'file' && (
                <div>
                  <label htmlFor="files" className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Documents
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <label htmlFor="files" className="cursor-pointer">
                      <span className="text-blue-600 hover:text-blue-700 font-medium">
                        Click to upload
                      </span>
                      <span className="text-gray-600"> or drag and drop</span>
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
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Selected files:
                      </p>
                      <ul className="space-y-1">
                        {Array.from(files).map((file, i) => (
                          <li key={i} className="text-sm text-gray-600">
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
              <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Creating Your Agent
              </h3>
              <p className="text-gray-600">
                Processing your content and training the agent...
              </p>
            </div>
          )}

          {step !== 'processing' && (
            <div className="flex justify-end mt-8 space-x-4">
              {step === 'source' && (
                <button
                  onClick={() => setStep('info')}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Back
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
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
