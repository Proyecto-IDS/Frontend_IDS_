import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import './AIPrivateChat.css';

const formatTimestamp = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

function AIPrivateChat({ warRoomId, privateMessages, loading, onSendMessage, onLoadMessages, isAdmin }) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [privateMessages]);

  // Load messages when component mounts or admin status changes
  useEffect(() => {
    if (warRoomId) {
      onLoadMessages(warRoomId);
    }
  }, [warRoomId, onLoadMessages, isAdmin]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!message.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onSendMessage(warRoomId, message.trim());
      setMessage('');
    } catch (error) {
      console.error('Failed to send AI message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event);
    }
  };

  return (
    <section className="ai-private-chat" aria-labelledby="ai-chat-heading">
      <header className="ai-chat-header">
        <h4 id="ai-chat-heading">🤖 Chat con IA del Admin</h4>
        <span className="ai-chat-subtitle">Conversación visible para todo el equipo</span>
      </header>
      
      <div className="ai-chat-messages" aria-live="polite">
        {loading ? (
          <div className="ai-chat-loading">
            <span>Cargando mensajes...</span>
          </div>
        ) : privateMessages && privateMessages.length > 0 ? (
          <>
            {privateMessages.map((msg) => (
              <article key={msg.id} className={`ai-chat-message ai-chat-${msg.role}`}>
                <div className="ai-chat-content">
                  <div className="ai-chat-header-msg">
                    <span className="ai-chat-sender">
                      {msg.role === 'assistant' ? '🤖 IA' : '👤 Admin'}
                    </span>
                    <time className="ai-chat-time" dateTime={msg.createdAt}>
                      {formatTimestamp(msg.createdAt)}
                    </time>
                  </div>
                  <p className="ai-chat-text">{msg.content}</p>
                </div>
              </article>
            ))}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="ai-chat-empty">
            {isAdmin ? (
              <>
                <p>👋 ¡Hola Admin! Soy el asistente de IA del equipo.</p>
                <p>Tus preguntas y mis respuestas serán visibles para todo el equipo en tiempo real.</p>
                <div className="ai-chat-suggestions">
                  <p><strong>Pregúntame cómo resolver:</strong></p>
                  <ul>
                    <li>"¿Cómo bloqueo esta IP en el firewall?"</li>
                    <li>"¿Qué comandos uso para contener esto?"</li>
                    <li>"¿Cómo configuro reglas WAF contra este ataque?"</li>
                    <li>"¿Cuál es el siguiente paso para resolver esto?"</li>
                    <li>"¿Cómo aíslo el servidor comprometido?"</li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <p>👀 Chat de IA del Admin</p>
                <p>Aquí puedes ver las consultas que el administrador hace a la IA y sus respuestas.</p>
                <p>💡 Solo el administrador puede escribir mensajes en este chat.</p>
              </>
            )}
          </div>
        )}
      </div>
      
      {isAdmin ? (
        <form className="ai-chat-form" onSubmit={handleSubmit}>
          <div className="ai-chat-input-container">
            <textarea
              className="ai-chat-input"
              rows={2}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="¿Cómo resuelvo esta alerta? ¿Qué comandos necesito?"
              disabled={isSubmitting}
              required
            />
            <button 
              type="submit" 
              className="ai-chat-send-btn"
              disabled={!message.trim() || isSubmitting}
              title="Enviar mensaje (Enter)"
            >
              {isSubmitting ? '⏳' : '📤'}
            </button>
          </div>
          <div className="ai-chat-help">
            <span>💡 Tip: Presiona Enter para enviar, Shift+Enter para nueva línea</span>
          </div>
        </form>
      ) : (
        <div className="ai-chat-readonly-notice">
          <p>👁️ Solo puedes leer este chat. El administrador maneja las consultas a la IA.</p>
        </div>
      )}
    </section>
  );
}

AIPrivateChat.propTypes = {
  warRoomId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  privateMessages: PropTypes.array,
  loading: PropTypes.bool,
  onSendMessage: PropTypes.func.isRequired,
  onLoadMessages: PropTypes.func.isRequired,
  isAdmin: PropTypes.bool,
};

AIPrivateChat.defaultProps = {
  privateMessages: [],
  loading: false,
  isAdmin: false,
};

export default AIPrivateChat;