import { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Send, Bot, User, Loader2 } from 'lucide-react';

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
      .select('id, name, status')
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

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <nav className="bg-black/50 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-purple-500 to-blue-500 p-2 rounded-lg">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-semibold text-white">{agent?.name || 'Agent'}</h1>
                  <p className="text-xs text-gray-400">AI Assistant</p>
                </div>
              </div>
            </div>
            <Link to="/" className="flex items-center space-x-2">
              <div className="bg-gradient-to-br from-purple-500 to-blue-500 p-2 rounded-lg">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent hidden sm:inline">AgentsForYou</span>
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {messages.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bot className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Start a conversation</h3>
              <p className="text-gray-400">
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
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${message.role === 'user' ? 'bg-gradient-to-r from-purple-500 to-blue-500' : 'bg-white/10 border border-white/10'}`}>
                      {message.role === 'user' ? (
                        <User className="w-5 h-5 text-white" />
                      ) : (
                        <Bot className="w-5 h-5 text-purple-400" />
                      )}
                    </div>
                    <div className={`px-4 py-3 rounded-2xl ${message.role === 'user' ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white' : 'bg-white/5 backdrop-blur-xl border border-white/10 text-gray-100'}`}>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-3 max-w-3xl">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-white/10 border border-white/10">
                      <Bot className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="px-4 py-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10">
                      <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      <div className="border-t border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-end space-x-4">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              rows={1}
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-white placeholder-gray-500"
              style={{ minHeight: '52px', maxHeight: '200px' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="bg-gradient-to-r from-purple-500 to-blue-500 text-white p-3 rounded-xl hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

