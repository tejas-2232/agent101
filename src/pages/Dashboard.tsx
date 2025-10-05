import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Plus, Bot, MessageCircle, Settings, TrendingUp, Users, Zap } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  description: string | null;
  status: string;
  total_documents: number;
  total_chunks: number;
  model: string;
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="badge-rh-success">Active</span>;
      case 'training':
        return <span className="badge-rh-warning">Training</span>;
      case 'error':
        return <span className="badge-rh-error">Error</span>;
      default:
        return <span className="badge-rh bg-rh-gray-500/10 text-rh-gray-400 border border-rh-gray-500/20">Inactive</span>;
    }
  };

  const getModelDisplay = (model: string) => {
    const modelMap: { [key: string]: string } = {
      'llama-3.3-70b': 'Llama 3.3 70B',
      'llama-3.1-70b': 'Llama 3.1 70B',
      'llama-3.1-8b': 'Llama 3.1 8B',
    };
    return modelMap[model] || model;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-rh-dark-900 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-2 border-rh-green-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-rh-gray-400">Loading your agents...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rh-dark-900">
      {/* Navigation */}
      <nav className="nav-rh">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-rh-green-500 rounded-lg flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-white">AgenticAI</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/create-agent')}
                className="btn-rh-primary flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Agent</span>
              </button>
              
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-rh-green-500 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={signOut}
                  className="text-rh-gray-400 hover:text-white transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card-rh p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-rh-gray-400 text-sm font-medium">Total Agents</p>
                <p className="text-2xl font-bold text-white">{agents.length}</p>
              </div>
              <div className="w-12 h-12 bg-rh-green-500/10 rounded-rh flex items-center justify-center">
                <Bot className="w-6 h-6 text-rh-green-400" />
              </div>
            </div>
          </div>
          
          <div className="card-rh p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-rh-gray-400 text-sm font-medium">Active Agents</p>
                <p className="text-2xl font-bold text-white">
                  {agents.filter(a => a.status === 'active').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-rh-green-500/10 rounded-rh flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-rh-green-400" />
              </div>
            </div>
          </div>
          
          <div className="card-rh p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-rh-gray-400 text-sm font-medium">Total Documents</p>
                <p className="text-2xl font-bold text-white">
                  {agents.reduce((sum, agent) => sum + agent.total_documents, 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-rh-green-500/10 rounded-rh flex items-center justify-center">
                <Users className="w-6 h-6 text-rh-green-400" />
              </div>
            </div>
          </div>
          
          <div className="card-rh p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-rh-gray-400 text-sm font-medium">Total Chunks</p>
                <p className="text-2xl font-bold text-white">
                  {agents.reduce((sum, agent) => sum + agent.total_chunks, 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-rh-green-500/10 rounded-rh flex items-center justify-center">
                <Zap className="w-6 h-6 text-rh-green-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Agents Grid */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">Your Agents</h2>
          
          {agents.length === 0 ? (
            <div className="card-rh p-12 text-center">
              <div className="w-16 h-16 bg-rh-green-500/10 rounded-rh-lg flex items-center justify-center mx-auto mb-4">
                <Bot className="w-8 h-8 text-rh-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No agents yet</h3>
              <p className="text-rh-gray-400 mb-6">
                Create your first AI agent to get started with intelligent conversations
              </p>
              <button
                onClick={() => navigate('/create-agent')}
                className="btn-rh-primary"
              >
                Create Your First Agent
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agents.map((agent) => (
                <div key={agent.id} className="card-rh p-6 hover:shadow-rh-xl transition-all duration-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-rh-green-500/10 rounded-rh flex items-center justify-center">
                        <Bot className="w-5 h-5 text-rh-green-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{agent.name}</h3>
                        <p className="text-sm text-rh-gray-400">{getModelDisplay(agent.model)}</p>
                      </div>
                    </div>
                    {getStatusBadge(agent.status)}
                  </div>
                  
                  {agent.description && (
                    <p className="text-rh-gray-400 text-sm mb-4 line-clamp-2">
                      {agent.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-rh-gray-400 mb-4">
                    <span>{agent.total_documents} documents</span>
                    <span>{agent.total_chunks} chunks</span>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => navigate(`/chat/${agent.id}`)}
                      disabled={agent.status !== 'active'}
                      className="flex-1 btn-rh-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Chat</span>
                    </button>
                    <button
                      onClick={() => navigate(`/agent/${agent.id}`)}
                      className="btn-rh-secondary flex items-center justify-center"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}