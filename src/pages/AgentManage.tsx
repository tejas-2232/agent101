import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Upload, Link as LinkIcon, FileText, Loader2, Trash2, RefreshCw } from 'lucide-react';

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
        return 'text-green-600 bg-green-50';
      case 'processing':
        return 'text-yellow-600 bg-yellow-50';
      case 'error':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{agent?.name}</h1>
          <p className="mt-2 text-gray-600">
            {agent?.description || 'Manage knowledge base and settings'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Status</p>
            <p className="text-2xl font-bold text-gray-900 capitalize">{agent?.status}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Documents</p>
            <p className="text-2xl font-bold text-gray-900">{agent?.total_documents}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Knowledge Chunks</p>
            <p className="text-2xl font-bold text-gray-900">{agent?.total_chunks}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Knowledge Base</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              <Upload className="w-4 h-4" />
              <span>Add Content</span>
            </button>
          </div>

          <div className="p-6">
            {documents.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No documents yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                    <div className="flex items-center space-x-4">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        {doc.source_type === 'url' ? (
                          <LinkIcon className="w-5 h-5 text-blue-600" />
                        ) : (
                          <FileText className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {doc.source_type === 'url' ? doc.source_url : doc.file_name}
                        </p>
                        <div className="flex items-center space-x-3 mt-1">
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(doc.processing_status)}`}>
                            {doc.processing_status}
                          </span>
                          <span className="text-sm text-gray-500">{doc.total_chunks} chunks</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add Content</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSourceType('file')}
                  className={`p-4 border-2 rounded-lg transition ${sourceType === 'file' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}
                >
                  <Upload className={`w-6 h-6 mx-auto mb-2 ${sourceType === 'file' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <p className="text-sm font-medium">Files</p>
                </button>
                <button
                  onClick={() => setSourceType('url')}
                  className={`p-4 border-2 rounded-lg transition ${sourceType === 'url' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}
                >
                  <LinkIcon className={`w-6 h-6 mx-auto mb-2 ${sourceType === 'url' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <p className="text-sm font-medium">URL</p>
                </button>
              </div>

              {sourceType === 'url' ? (
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.txt,.md"
                    onChange={(e) => setFiles(e.target.files)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  />
                  <p className="mt-2 text-sm text-gray-500">PDF, TXT, or Markdown</p>
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddDocument}
                disabled={uploading || (sourceType === 'url' ? !url : !files)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {uploading ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
