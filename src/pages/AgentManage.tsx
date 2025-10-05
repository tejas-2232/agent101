import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Upload, Link as LinkIcon, FileText, Loader2, Trash2, Bot, Sparkles, Zap, Brain } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  description: string | null;
  status: string;
  total_documents: number;
  total_chunks: number;
}

interface Document {
  id: string;
  source_type: string;
  source_url: string | null;
  file_name: string | null;
  file_type: string | null;
  processing_status: string;
  total_chunks: number;
  created_at: string;
}

export function AgentManage() {
  const { agentId } = useParams<{ agentId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [sourceType, setSourceType] = useState<'url' | 'file'>('file');
  const [url, setUrl] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadAgent();
    loadDocuments();
  }, [agentId]);

  const loadAgent = async () => {
    if (!agentId) return;

    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (error) {
      console.error('Error loading agent:', error);
      navigate('/dashboard');
    } else {
      setAgent(data);
    }
    setLoading(false);
  };

  const loadDocuments = async () => {
    if (!agentId) return;

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading documents:', error);
    } else {
      setDocuments(data || []);
    }
  };

  const handleAddDocument = async () => {
    if (!user || !agentId) return;
    setUploading(true);

    try {
      if (sourceType === 'url') {
        const { error } = await supabase
          .from('documents')
          .insert({
            agent_id: agentId,
            source_type: 'url',
            source_url: url,
            processing_status: 'pending',
          });

        if (error) throw error;
      } else if (files) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const fileExt = file.name.split('.').pop()?.toLowerCase();
          const filePath = `${user.id}/${agentId}/${Date.now()}_${file.name}`;

          const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { error: docError } = await supabase
            .from('documents')
            .insert({
              agent_id: agentId,
              source_type: 'file',
              file_name: file.name,
              file_type: fileExt || 'unknown',
              file_size: file.size,
              storage_path: filePath,
              processing_status: 'pending',
            });

          if (docError) throw docError;
        }
      }

      setShowAddModal(false);
      setUrl('');
      setFiles(null);

      const { data: pendingDocs } = await supabase
        .from('documents')
        .select('id')
        .eq('agent_id', agentId)
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

      loadDocuments();
    } catch (error) {
      console.error('Error adding document:', error);
      alert('Failed to add document');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('Delete this document?')) return;

    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', docId);

    if (error) {
      console.error('Error deleting document:', error);
    } else {
      loadDocuments();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400 bg-green-500/10 border border-green-500/20';
      case 'processing':
        return 'text-yellow-400 bg-yellow-500/10 border border-yellow-500/20';
      case 'error':
        return 'text-red-400 bg-red-500/10 border border-red-500/20';
      default:
        return 'text-gray-400 bg-gray-500/10 border border-gray-500/20';
    }
  };

  const aiQuotes = [
    { text: "The question of whether a computer can think is no more interesting than the question of whether a submarine can swim.", author: "Edsger Dijkstra" },
    { text: "Artificial intelligence is the new electricity.", author: "Andrew Ng" },
    { text: "We're making this analogy that AI is the new electricity. Electricity transformed industries: agriculture, transportation, communication, manufacturing.", author: "Andrew Ng" },
    { text: "Success in creating AI would be the biggest event in human history.", author: "Stephen Hawking" },
    { text: "I visualize a time when we will be to robots what dogs are to humans.", author: "Claude Shannon" },
  ];

  const [currentQuote] = useState(aiQuotes[Math.floor(Math.random() * aiQuotes.length)]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 relative overflow-hidden">
        {/* Galaxy Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-gray-950 to-blue-900/20" />
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white star-twinkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${Math.random() * 3 + 1}px`,
                height: `${Math.random() * 3 + 1}px`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${Math.random() * 3 + 2}s`
              }}
            />
          ))}
        </div>
        <Loader2 className="w-8 h-8 animate-spin text-purple-500 z-10" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 relative overflow-hidden">
      {/* Galaxy Background with Moving Stars */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-gray-950 to-blue-900/20" />
        {[...Array(100)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white star-twinkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 4 + 2}s`
            }}
          />
        ))}
        {/* Shooting Stars */}
        {[...Array(3)].map((_, i) => (
          <div
            key={`shooting-${i}`}
            className="absolute h-px bg-gradient-to-r from-transparent via-white to-transparent shooting-star"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 50}%`,
              width: '100px',
              animationDelay: `${i * 8}s`
            }}
          />
        ))}
      </div>

      <nav className="bg-black/50 backdrop-blur-xl border-b border-white/10 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
            <Link to="/" className="flex items-center space-x-2">
              <div className="bg-gradient-to-br from-purple-500 to-blue-500 p-2 rounded-lg">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent hidden sm:inline">AgentsForYou</span>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Hero Section */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl mb-4 animate-float">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              {agent?.name}
            </span>
          </h1>
          <p className="text-xl text-gray-400">
            {agent?.description || 'Manage knowledge base and settings'}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="group bg-gradient-to-br from-purple-900/40 to-purple-800/20 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 hover:scale-105 transition-all duration-300 hover:border-purple-500/50">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-purple-300 font-medium">Status</p>
              <Sparkles className="w-5 h-5 text-purple-400 group-hover:animate-spin" />
            </div>
            <p className="text-3xl font-bold text-white capitalize">{agent?.status}</p>
            <div className="mt-2 h-1 bg-purple-500/20 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse" style={{ width: '100%' }} />
            </div>
          </div>
          
          <div className="group bg-gradient-to-br from-blue-900/40 to-blue-800/20 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-6 hover:scale-105 transition-all duration-300 hover:border-blue-500/50">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-blue-300 font-medium">Documents</p>
              <FileText className="w-5 h-5 text-blue-400 group-hover:scale-110 transition" />
            </div>
            <p className="text-3xl font-bold text-white">{agent?.total_documents}</p>
            <p className="text-xs text-blue-300 mt-2">Knowledge sources</p>
          </div>
          
          <div className="group bg-gradient-to-br from-pink-900/40 to-pink-800/20 backdrop-blur-xl border border-pink-500/20 rounded-2xl p-6 hover:scale-105 transition-all duration-300 hover:border-pink-500/50">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-pink-300 font-medium">Knowledge Chunks</p>
              <Zap className="w-5 h-5 text-pink-400 group-hover:rotate-12 transition" />
            </div>
            <p className="text-3xl font-bold text-white">{agent?.total_chunks}</p>
            <p className="text-xs text-pink-300 mt-2">Training data points</p>
          </div>
        </div>

        {/* Knowledge Base Section */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-purple-500/10 to-blue-500/10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Knowledge Base</h2>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-5 py-2.5 rounded-xl hover:opacity-90 transition hover:scale-105"
            >
              <Upload className="w-4 h-4" />
              <span className="font-medium">Add Content</span>
            </button>
          </div>

          <div className="p-6">
            {documents.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-10 h-10 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No Documents Yet</h3>
                <p className="text-gray-400 mb-6">Start building your agent's knowledge base</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-xl hover:opacity-90 transition hover:scale-105"
                >
                  <Upload className="w-5 h-5" />
                  <span>Add Your First Document</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc, index) => (
                  <div 
                    key={doc.id} 
                    className="group flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:border-purple-500/30"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className={`p-3 rounded-xl ${doc.source_type === 'url' ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-purple-500/20 border border-purple-500/30'}`}>
                        {doc.source_type === 'url' ? (
                          <LinkIcon className="w-5 h-5 text-blue-400" />
                        ) : (
                          <FileText className="w-5 h-5 text-purple-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate group-hover:text-purple-300 transition">
                          {doc.source_type === 'url' ? doc.source_url : doc.file_name}
                        </p>
                        <div className="flex items-center space-x-3 mt-1">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(doc.processing_status)}`}>
                            {doc.processing_status}
                          </span>
                          <span className="text-sm text-gray-400 flex items-center">
                            <Sparkles className="w-3 h-3 mr-1" />
                            {doc.total_chunks} chunks
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="text-red-400 hover:bg-red-500/10 border border-red-500/20 p-2 rounded-lg transition hover:scale-110"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* AI Quote Footer */}
        <div className="mt-12 mb-8">
          <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 animate-pulse-slow" />
            <div className="relative z-10">
              <Sparkles className="w-8 h-8 text-purple-400 mx-auto mb-4 animate-float" />
              <blockquote className="text-lg md:text-xl text-gray-300 italic mb-4 max-w-3xl mx-auto">
                "{currentQuote.text}"
              </blockquote>
              <p className="text-sm text-purple-400 font-medium">— {currentQuote.author}</p>
            </div>
          </div>
        </div>
      </main>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-gray-900 border border-white/10 rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-slide-up">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Upload className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white">Add Content</h3>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSourceType('file')}
                  className={`p-5 border-2 rounded-xl transition-all ${sourceType === 'file' ? 'border-purple-500 bg-purple-500/10 scale-105' : 'border-white/10 hover:border-white/20 bg-white/5'}`}
                >
                  <Upload className={`w-7 h-7 mx-auto mb-2 ${sourceType === 'file' ? 'text-purple-400' : 'text-gray-400'}`} />
                  <p className="text-sm font-medium text-white">Files</p>
                </button>
                <button
                  onClick={() => setSourceType('url')}
                  className={`p-5 border-2 rounded-xl transition-all ${sourceType === 'url' ? 'border-blue-500 bg-blue-500/10 scale-105' : 'border-white/10 hover:border-white/20 bg-white/5'}`}
                >
                  <LinkIcon className={`w-7 h-7 mx-auto mb-2 ${sourceType === 'url' ? 'text-blue-400' : 'text-gray-400'}`} />
                  <p className="text-sm font-medium text-white">URL</p>
                </button>
              </div>

              {sourceType === 'url' ? (
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition text-white placeholder-gray-500"
                />
              ) : (
                <div>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.txt,.md"
                    onChange={(e) => setFiles(e.target.files)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gradient-to-r file:from-purple-500 file:to-blue-500 file:text-white file:cursor-pointer hover:file:opacity-90"
                  />
                  <p className="mt-2 text-sm text-gray-400">PDF, TXT, or Markdown files</p>
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-3 border border-white/20 rounded-xl text-gray-300 hover:bg-white/5 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddDocument}
                disabled={uploading || (sourceType === 'url' ? !url : !files)}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:opacity-90 disabled:opacity-50 transition font-medium"
              >
                {uploading ? (
                  <span className="flex items-center justify-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Adding...</span>
                  </span>
                ) : (
                  'Add Content'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
