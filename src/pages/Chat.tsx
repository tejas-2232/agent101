import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Send, Bot, User, Loader2, Settings } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface Agent {
  id: string;
  name: string;
  status: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

interface Conversation {
  id: string;
  title: string | null;
}

export function Chat() {
  const { agentId } = useParams<{ agentId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadAgent();
    loadOrCreateConversation();
  }, [agentId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadAgent = async () => {
    if (!agentId) return;

    const { data, error } = await supabase
      .from('agents')
      .select('id, name, status, model, temperature, max_tokens')
      .eq('id', agentId)
      .single();

    if (error) {
      console.error('Error loading agent:', error);
      navigate('/dashboard');
    } else {
      setAgent(data);
    }
  };

  const loadOrCreateConversation = async () => {
    if (!user || !agentId) return;

    let { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (convError) {
      console.error('Error loading conversation:', convError);
      return;
    }

    let conv: Conversation;

    if (!conversations || conversations.length === 0) {
      const { data: newConv, error: createError } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          agent_id: agentId,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating conversation:', createError);
        return;
      }
      conv = newConv;
    } else {
      conv = conversations[0];
    }

    setConversation(conv);
    loadMessages(conv.id);
  };

  const loadMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
    } else {
      setMessages(data || []);
    }
    setInitialLoading(false);
  };

  const handleSend = async () => {
    if (!input.trim() || !conversation || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    const userMsg: Message = {
      id: 'temp-user-' + Date.now(),
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);

    try {
      const { data: savedUserMsg, error: userError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          role: 'user',
          content: userMessage,
        })
        .select()
        .single();

      if (userError) throw userError;

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_id: agentId,
          message: userMessage,
          conversation_id: conversation.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const assistantMsg: Message = {
        id: data.message_id || 'temp-assistant-' + Date.now(),
        role: 'assistant',
        content: data.response,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev.filter(m => m.id !== userMsg.id), savedUserMsg, assistantMsg]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMsg: Message = {
        id: 'error-' + Date.now(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-rh-dark-900 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-2 border-rh-green-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-rh-gray-400">Loading conversation...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rh-dark-900 flex flex-col">
      {/* Navigation */}
      <nav className="nav-rh">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-rh-ghost flex items-center space-x-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-rh-green-500 rounded-rh flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-semibold text-white">{agent?.name || 'Agent'}</h1>
                  <p className="text-xs text-rh-gray-400">
                    {getModelDisplay(agent?.model || 'llama-3.3-70b')}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate(`/agent/${agentId}`)}
              className="btn-rh-ghost"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {messages.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-rh-green-500/10 rounded-rh-lg flex items-center justify-center mx-auto mb-4">
                <Bot className="w-8 h-8 text-rh-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Start a conversation</h3>
              <p className="text-rh-gray-400">
                Ask me anything about the content I've been trained on
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-3 max-w-3xl ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${message.role === 'user' ? 'bg-rh-green-500' : 'bg-rh-dark-800 border border-rh-dark-600'}`}>
                      {message.role === 'user' ? (
                        <User className="w-5 h-5 text-white" />
                      ) : (
                        <Bot className="w-5 h-5 text-rh-green-400" />
                      )}
                    </div>
                    <div className={`px-4 py-3 rounded-rh-lg ${message.role === 'user' ? 'bg-rh-green-500 text-white' : 'card-rh text-white'}`}>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-3 max-w-3xl">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-rh-dark-800 border border-rh-dark-600">
                      <Bot className="w-5 h-5 text-rh-green-400" />
                    </div>
                    <div className="card-rh px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-rh-green-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-rh-gray-400">Thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      {/* Input */}
      <div className="border-t border-rh-dark-700 bg-rh-dark-800">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-end space-x-4">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              rows={1}
              className="input-rh resize-none"
              style={{ minHeight: '52px', maxHeight: '200px' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="btn-rh-primary p-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}