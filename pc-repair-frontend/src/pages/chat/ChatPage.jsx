import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Bot, User, AlertCircle, Loader, MessageSquare, Trash2, History } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import TextArea from '../../components/common/TextArea';
import Alert from '../../components/common/Alert';
import Modal from '../../components/common/Modal';
import { chatAPI, ticketsAPI } from '../../services/apiService';
import { formatRelativeTime, handleApiError } from '../../utils/helpers';
import toast from 'react-hot-toast';

const ChatPage = () => {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [escalationSuggested, setEscalationSuggested] = useState(false);
  const [showEscalationModal, setShowEscalationModal] = useState(false);
  const [problemSummary, setProblemSummary] = useState('');
  const [previousSessions, setPreviousSessions] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState(null);

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await chatAPI.listSessions();
      const sessions = Array.isArray(response.data) ? response.data : response.data.results || [];
      setPreviousSessions(sessions);
      
      // If there's an active session, load it. Otherwise just show empty state
      const activeSession = sessions.find(s => s.status === 'active');
      if (activeSession) {
        await loadSession(activeSession.id);
      } else {
        // Don't create a session automatically - just set loading to false
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
      setLoading(false);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadSession = async (sessionIdToLoad) => {
    setLoading(true);
    try {
      const response = await chatAPI.getChatHistory(sessionIdToLoad);
      const sessionData = response.data;
      setSessionId(sessionData.id);
      setEscalationSuggested(sessionData.status === 'escalated');
      
      // Load all messages from the session
      const loadedMessages = sessionData.messages.map(msg => ({
        id: msg.id,
        message: msg.message,
        is_ai: msg.sender === 'ai',
        timestamp: msg.timestamp,
      }));
      setMessages(loadedMessages);
    } catch (error) {
      toast.error('Failed to load chat session');
      console.error('Load session error:', error);
    } finally {
      setLoading(false);
    }
  };

  const startNewSession = async () => {
    setLoading(true);
    try {
      const response = await chatAPI.startSession({ issue_type: 'hardware' });
      const sessionData = response.data.session;
      setSessionId(sessionData.id);
      
      // Get the welcome message from the session messages
      if (sessionData.messages && sessionData.messages.length > 0) {
        const welcomeMsg = sessionData.messages[0];
        setMessages([
          {
            id: welcomeMsg.id,
            message: welcomeMsg.message,
            is_ai: true,
            timestamp: welcomeMsg.timestamp,
          },
        ]);
      } else {
        setMessages([
          {
            id: 'welcome',
            message: 'Hello! I\'m your AI assistant. How can I help you with your PC today?',
            is_ai: true,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch (error) {
      toast.error('Failed to start chat session');
      console.error('Chat start error:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || sendingMessage) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setSendingMessage(true);

    try {
      // If no session exists, create one first
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        const sessionResponse = await chatAPI.startSession({ issue_type: 'hardware' });
        const sessionData = sessionResponse.data.session;
        currentSessionId = sessionData.id;
        setSessionId(currentSessionId);
        
        // Add welcome message if available
        if (sessionData.messages && sessionData.messages.length > 0) {
          const welcomeMsg = sessionData.messages[0];
          setMessages([
            {
              id: welcomeMsg.id,
              message: welcomeMsg.message,
              is_ai: true,
              timestamp: welcomeMsg.timestamp,
            },
          ]);
        }
      }

      // Add user message to UI
      const tempUserMsg = {
        id: `temp-${Date.now()}`,
        message: userMessage,
        is_ai: false,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempUserMsg]);

      const response = await chatAPI.sendMessage(currentSessionId, userMessage);
      const data = response.data;

      // Remove temp message and add real messages
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMsg.id),
        { 
          id: data.user_message.id,
          message: data.user_message.message,
          is_ai: false,
          timestamp: data.user_message.timestamp,
        },
        {
          id: data.ai_message.id,
          message: data.ai_message.message,
          is_ai: true,
          timestamp: data.ai_message.timestamp,
        },
      ]);

      // Check for escalation
      if (data.should_escalate && !escalationSuggested) {
        setEscalationSuggested(true);
        // Get problem summary from session data
        const summary = data.session?.problem_summary || data.problem_summary || '';
        setProblemSummary(summary);
        setShowEscalationModal(true);
      }
    } catch (error) {
      toast.error(handleApiError(error));
      // Remove temp message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
    } finally {
      setSendingMessage(false);
    }
  };

  const handleCreateTicket = async () => {
    try {
      const ticketData = {
        chat_session: sessionId,
        title: 'Support Request from AI Chat',
        description: problemSummary || 'Issue requires technician assistance',
        issue_type: 'hardware', // Default to hardware, can be enhanced later
        requires_visit: false,
      };

      const response = await ticketsAPI.createTicket(ticketData);
      
      // Show success message
      if (response.data?.limits) {
        toast.success('Support ticket created successfully!');
      } else {
        toast.success('Support ticket created successfully!');
      }
      
      setShowEscalationModal(false);
      
      // Navigate to the ticket detail page
      const ticketId = response.data.ticket?.id || response.data.id;
      navigate(`/tickets/${ticketId}`);
    } catch (error) {
      console.error('Ticket creation error:', error.response?.data);
      
      // Handle rate limit errors
      if (error.response?.status === 429) {
        const errorData = error.response.data;
        if (errorData.cooldown_remaining_seconds) {
          const minutes = Math.ceil(errorData.cooldown_remaining_seconds / 60);
          toast.error(
            `Please wait ${minutes} more minute(s) before creating another ticket.`,
            { duration: 6000 }
          );
        } else if (errorData.pending_tickets) {
          toast.error(
            `You have ${errorData.pending_tickets} pending tickets. Please wait for them to be processed first.`,
            { duration: 6000 }
          );
        } else {
          toast.error(handleApiError(error), { duration: 6000 });
        }
      } else {
        toast.error(handleApiError(error));
      }
    }
  };

  const handleContinueChat = () => {
    setShowEscalationModal(false);
  };

  const handleEndSession = async () => {
    if (!sessionId) return;

    try {
      await chatAPI.closeSession(sessionId);
      toast.success('Chat session ended');
      
      // Clear current session and reload history
      setSessionId(null);
      setMessages([]);
      setEscalationSuggested(false);
      
      // Reload the list of previous sessions
      const response = await chatAPI.listSessions();
      const sessions = Array.isArray(response.data) ? response.data : response.data.results || [];
      setPreviousSessions(sessions);
    } catch (error) {
      toast.error('Failed to end session');
    }
  };

  const handleViewHistory = () => {
    setShowHistory(!showHistory);
  };

  const handleSelectSession = async (session) => {
    await loadSession(session.id);
    setShowHistory(false);
  };

  const handleDeleteSession = async (sessionIdToDelete, e) => {
    e.stopPropagation(); // Prevent session selection when clicking delete
    
    if (!confirm('Are you sure you want to delete this chat session? This action cannot be undone.')) {
      return;
    }

    setDeletingSessionId(sessionIdToDelete);
    try {
      await chatAPI.deleteSession(sessionIdToDelete);
      toast.success('Chat session deleted successfully');
      
      // Remove from local state
      setPreviousSessions(prev => prev.filter(s => s.id !== sessionIdToDelete));
      
      // If we deleted the current session, clear the state
      if (sessionIdToDelete === sessionId) {
        setSessionId(null);
        setMessages([]);
        setEscalationSuggested(false);
      }
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setDeletingSessionId(null);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Loader className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
              <MessageSquare className="w-7 h-7 sm:w-8 sm:h-8 mr-3 text-primary-600" />
              AI Chat Support
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Powered by Google Gemini AI
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleViewHistory}>
              <MessageSquare className="w-4 h-4 mr-2" />
              History ({previousSessions.length})
            </Button>
            {sessionId && (
              <Button variant="danger" size="sm" onClick={handleEndSession}>
                <Trash2 className="w-4 h-4 mr-2" />
                End Session
              </Button>
            )}
          </div>
        </div>

        {/* Chat History Sidebar */}
        {showHistory && (
          <Card className="mb-4 max-h-96 overflow-y-auto">
            <h3 className="font-semibold text-gray-900 mb-3">Previous Chat Sessions</h3>
            {previousSessions.length === 0 ? (
              <p className="text-gray-500 text-sm">No previous chat sessions</p>
            ) : (
              <div className="space-y-2">
                {previousSessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => handleSelectSession(session)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      session.id === sessionId
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {session.issue_type.charAt(0).toUpperCase() + session.issue_type.slice(1)} Issue
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          session.status === 'active' ? 'bg-green-100 text-green-700' :
                          session.status === 'escalated' ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {session.status}
                        </span>
                        <button
                          onClick={(e) => handleDeleteSession(session.id, e)}
                          disabled={deletingSessionId === session.id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors disabled:opacity-50"
                          title="Delete chat session"
                        >
                          {deletingSessionId === session.id ? (
                            <Loader className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      {session.message_count} messages • {formatRelativeTime(session.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {escalationSuggested && !showEscalationModal && (
          <Alert type="info" className="mb-4">
            Based on our conversation, I recommend creating a support ticket for personalized assistance from our technicians.
            <Button
              variant="primary"
              size="sm"
              className="mt-3"
              onClick={() => setShowEscalationModal(true)}
            >
              Create Ticket
            </Button>
          </Alert>
        )}

        {/* Chat Card with Animated Instagram Gradient Border */}
        <div className="relative rounded-2xl" style={{ height: 'calc(100vh - 280px)', minHeight: '500px' }}>
          {/* Multiple Animated Instagram Gradient Layers */}
          <div className="absolute inset-0 rounded-2xl overflow-hidden">
            {/* Outer rotating gradient - Instagram colors */}
            <div className="absolute inset-0 animate-border-spin">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 opacity-70"></div>
            </div>
            
            {/* Middle layer - opposite rotation */}
            <div className="absolute inset-0" style={{ animation: 'border-spin 6s linear infinite reverse' }}>
              <div className="absolute inset-0 bg-gradient-to-l from-yellow-400 via-orange-500 to-pink-600 opacity-60"></div>
            </div>
            
            {/* Inner animated gradient - Full Instagram spectrum */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-500 via-orange-400 to-yellow-300 animate-gradient opacity-50"></div>
          </div>
          
          {/* White inner card with padding for border effect */}
          <div className="absolute inset-0 m-1 rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="h-full flex flex-col">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-4 sm:px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-white font-semibold">AI Assistant</h2>
                  <p className="text-primary-100 text-xs">Online • Ready to help</p>
                </div>
              </div>
            </div>

            {/* Messages Container - Scrollable */}
            <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-white p-4 sm:p-6">
              <div className="space-y-4">
                {messages.length === 0 && !sessionId && (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center mb-6">
                      <Bot className="w-10 h-10 text-primary-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Welcome to AI Assistant!
                    </h3>
                    <p className="text-gray-600 max-w-md mb-6">
                      I'm here to help you troubleshoot PC issues. Start a conversation by typing your question below, and I'll do my best to assist you.
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <button
                        onClick={() => setInputMessage("My computer won't turn on")}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-sm text-gray-700 transition-colors"
                      >
                        💻 Computer won't turn on
                      </button>
                      <button
                        onClick={() => setInputMessage("My internet is very slow")}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-sm text-gray-700 transition-colors"
                      >
                        🌐 Slow internet
                      </button>
                      <button
                        onClick={() => setInputMessage("My screen is flickering")}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-sm text-gray-700 transition-colors"
                      >
                        🖥️ Screen issues
                      </button>
                    </div>
                  </div>
                )}
                
                {messages.map((msg, index) => (
                  <div
                    key={msg.id || `msg-${index}`}
                    className={`flex items-end gap-2 ${msg.is_ai ? '' : 'flex-row-reverse'}`}
                  >
                    {/* Avatar */}
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        msg.is_ai
                          ? 'bg-primary-600'
                          : 'bg-gray-700'
                      }`}
                    >
                      {msg.is_ai ? (
                        <Bot className="w-4 h-4 text-white" />
                      ) : (
                        <User className="w-4 h-4 text-white" />
                      )}
                    </div>

                    {/* Message Bubble */}
                    <div className={`flex flex-col max-w-[75%] sm:max-w-[70%] ${msg.is_ai ? 'items-start' : 'items-end'}`}>
                      <div
                        className={`rounded-2xl px-4 py-2.5 ${
                          msg.is_ai
                            ? 'bg-white border border-gray-200 rounded-bl-none'
                            : 'bg-primary-600 text-white rounded-br-none'
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {msg.message}
                        </p>
                      </div>
                      {msg.timestamp && (
                        <p className="text-xs text-gray-400 mt-1 px-2">
                          {formatRelativeTime(msg.timestamp)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {sendingMessage && (
                  <div className="flex items-end gap-2">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <Loader className="w-4 h-4 animate-spin text-primary-600" />
                        <span className="text-sm text-gray-600">Typing...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 bg-white p-4">
              <form onSubmit={sendMessage} className="flex items-end gap-2 sm:gap-3">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(e);
                    }
                  }}
                  placeholder="Type your message..."
                  rows={2}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  disabled={sendingMessage}
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || sendingMessage}
                  className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 rounded-xl flex items-center justify-center transition-colors"
                >
                  <Send className="w-5 h-5 text-white" />
                </button>
              </form>
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* Escalation Modal */}
      <Modal
        isOpen={showEscalationModal}
        onClose={() => setShowEscalationModal(false)}
        title="Create Support Ticket"
        footer={
          <React.Fragment>
            <Button variant="ghost" onClick={handleContinueChat}>
              Continue Chat
            </Button>
            <Button variant="primary" onClick={handleCreateTicket}>
              Create Ticket
            </Button>
          </React.Fragment>
        }
      >
        <div className="space-y-4">
          <Alert type="info">
            Our AI has analyzed your issue and recommends creating a support ticket for personalized assistance from our expert technicians.
          </Alert>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Problem Summary
            </label>
            <TextArea
              value={problemSummary}
              onChange={(e) => setProblemSummary(e.target.value)}
              rows={6}
              placeholder="Describe your issue..."
            />
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
};

export default ChatPage;
