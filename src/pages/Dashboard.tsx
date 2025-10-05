import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Bot, Plus, LogOut, MessageSquare, FileText, Loader2, Trash2 } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  description: string | null;
  status: 'training' | 'active' | 'error' | 'inactive';
  total_documents: number;
  total_chunks: number;
  created_at: string;
}

export function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgents();
  }, [user]);

  const loadAgents = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading agents:', error);
    } else {
      setAgents(data || []);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this agent? This action cannot be undone.')) {
      return;
    }

    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', agentId);

    if (error) {
      console.error('Error deleting agent:', error);
      alert('Failed to delete agent');
    } else {
      setAgents(agents.filter(a => a.id !== agentId));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-400 border border-green-500/20';
      case 'training':
        return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
      case 'error':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'inactive':
        return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <nav className="bg-black/50 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-purple-500 to-blue-500 p-2 rounded-lg">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">AgentsForYou</span>
            </Link>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">{user?.email}</span>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Your AI Agents</h1>
            <p className="mt-2 text-gray-400">
              Create and manage agents that understand your content
            </p>
          </div>

          <button
            onClick={() => navigate('/create-agent')}
            className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            <span>Create Agent</span>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : agents.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No agents yet</h3>
            <p className="text-gray-400 mb-6">
              Create your first AI agent to get started
            </p>
            <button
              onClick={() => navigate('/create-agent')}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              <span>Create Your First Agent</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition hover:scale-105 hover:-translate-y-1 duration-300"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 p-3 rounded-xl border border-purple-500/30">
                    <Bot className="w-6 h-6 text-purple-400" />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(agent.status)}`}>
                    {agent.status}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-white mb-2">{agent.name}</h3>
                <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                  {agent.description || 'No description provided'}
                </p>

                <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                  <div className="flex items-center space-x-1">
                    <FileText className="w-4 h-4" />
                    <span>{agent.total_documents} docs</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageSquare className="w-4 h-4" />
                    <span>{agent.total_chunks} chunks</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => navigate(`/chat/${agent.id}`)}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition"
                  >
                    Chat
                  </button>
                  <button
                    onClick={() => navigate(`/agent/${agent.id}`)}
                    className="flex-1 bg-white/5 border border-white/10 text-gray-300 px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/10 transition"
                  >
                    Manage
                  </button>
                  <button
                    onClick={() => handleDeleteAgent(agent.id)}
                    className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2 rounded-xl hover:bg-red-500/20 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
