import { useEffect, useMemo, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { useAppActions, useAppState } from '../app/state.js';
import { getRouteHash, navigate } from '../app/router.js';
import { connectAlertsWebSocket, connectWarRoomChatWebSocket } from '../app/api.js';
import Loader from '../components/Loader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import LoadingOverlay from '../components/LoadingOverlay.jsx';
import AIPrivateChat from '../components/AIPrivateChat.jsx';

// Helper functions
const formatTimestamp = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDuration = (seconds) => {
  if (seconds === null || seconds === undefined || seconds < 0) return '00:00:00';
  
  const numSeconds = Number(seconds);
  if (Number.isNaN(numSeconds)) return '00:00:00';
  
  const hours = Math.floor(numSeconds / 3600);
  const minutes = Math.floor((numSeconds % 3600) / 60);
  const remainingSeconds = numSeconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const getStatusLabel = (status) => {
  if (status === 'ACTIVE') return 'Activa';
  if (status === 'RESOLVED' || status === 'ENDED') return 'Resuelta';
  return status;
};

const isAdminRole = (value) => {
  if (!value) return false;
  const str = typeof value === 'string' ? value : value?.authority || '';
  return str === 'ROLE_ADMIN' || str === 'ADMIN' || str === 'admin';
};

function isAdmin(user) {
  if (!user) return false;
  
  if (isAdminRole(user.role)) return true;
  if (Array.isArray(user.authorities) && user.authorities.some(isAdminRole)) return true;
  if (Array.isArray(user.roles) && user.roles.some(isAdminRole)) return true;
  
  return false;
}



// Comparar si dos mensajes representan el mismo contenido
const isSameChatMessage = (a, b) => {
  if (!a || !b) return false;

  // 1) Si tienen id y coincide, es el mismo mensaje
  if (a.id && b.id && a.id === b.id) return true;

  // 2) Normalizar contenido
  const contentA = (a.content || '').trim();
  const contentB = (b.content || '').trim();
  if (!contentA || !contentB) return false;
  if (contentA !== contentB) return false;

  // 3) Comparar remitente (email o nombre si no hay email)
  const senderA = (a.senderEmail || a.senderName || '').toLowerCase();
  const senderB = (b.senderEmail || b.senderName || '').toLowerCase();
  if (senderA && senderB && senderA !== senderB) return false;

  // 4) Si ambos tienen fecha, solo considerarlos diferentes
  //    si están MUY separados en el tiempo (por ejemplo > 2 minutos)
  if (a.createdAt && b.createdAt) {
    const tA = new Date(a.createdAt).getTime();
    const tB = new Date(b.createdAt).getTime();
    if (!Number.isNaN(tA) && !Number.isNaN(tB) && Math.abs(tA - tB) > 2 * 60 * 1000) {
      return false;
    }
  }

  // Si llegamos aquí, consideramos que representan el mismo mensaje
  return true;
};

const POLL_INTERVAL = Number(import.meta?.env?.VITE_WARROOM_POLL_INTERVAL || 10000);

function WarRoom({ params }) {
  const warRoomId = params.id;
  const { warRooms, loading, auth, settings } = useAppState();
  const {
    openWarRoom,
    loadWarRoomMessages,
    sendWarRoomMessage,
    joinWarRoom,
    leaveWarRoom,
    loadAIPrivateMessages,
    sendAIPrivateMessage,
    addToast,
  } = useAppActions();
  // ==== Resolver etiqueta de remitente usando también el usuario logueado ====
  const getMessageSenderLabel = (message) => {
    if (!message) return '';

    // 1) Mensajes de la IA
    if (message.role === 'assistant') {
      return 'Asistente';
    }

    // 2) Si el backend ya mandó senderName, úsalo
    if (message.senderName && String(message.senderName).trim().length > 0) {
      return message.senderName;
    }

    // 3) Si hay senderEmail, usar la parte antes de @
    if (message.senderEmail && typeof message.senderEmail === 'string') {
      const [localPart] = message.senderEmail.split('@');
      if (localPart) return localPart;
      return message.senderEmail;
    }

    // 4) Fallback: si no vino nada de remitente, asumir que es el usuario actual
    if (auth?.user) {
      const candidateName =
        auth.user.name ||
        auth.user.fullName ||
        (auth.user.email && auth.user.email.split('@')[0]);

      if (candidateName && candidateName.trim().length > 0) {
        return candidateName;
      }
    }

    // 5) Último fallback
    return 'Analista';
  };

  const warRoom = warRooms[warRoomId];
  const meetingId = warRoom?.id;
  
  const [message, setMessage] = useState('');
  const [confirmContain, setConfirmContain] = useState(false);
  
  // Estado para el cronómetro en tiempo real
  const [currentDuration, setCurrentDuration] = useState(0);
  
  // Estado para el loading overlay
  const [loadingOverlay, setLoadingOverlay] = useState({
    isVisible: false,
    title: '',
    description: '',
    icon: '🔄'
  });

  const incidentId = useMemo(() => {
    if (warRoom?.incidentId) return warRoom.incidentId;
    if (warRoomId?.startsWith('WR-')) return warRoomId.substring(3);
    return warRoomId;
  }, [warRoom, warRoomId]);

  // Efecto para calcular la duración en tiempo real
  useEffect(() => {
    if (!warRoom?.startTime) {
      setCurrentDuration(0);
      return;
    }
    
    if (warRoom?.status === 'RESOLVED' || warRoom?.status === 'ENDED') {
      return;
    }

    const updateDuration = () => {
      const startTime = new Date(warRoom.startTime);
      const now = new Date();
      const durationSeconds = Math.floor((now - startTime) / 1000);
      
      if (durationSeconds < 0) {
        setCurrentDuration(0);
      } else {
        setCurrentDuration(durationSeconds);
      }
    };

    updateDuration();
    
    const interval = setInterval(updateDuration, 1000);
    
    return () => {
      clearInterval(interval);
    };
  }, [warRoom?.startTime, warRoom?.status]);

  // Efecto para redirigir cuando la reunión está terminada
  useEffect(() => {
    if (warRoom?.status === 'ENDED' || warRoom?.status === 'RESOLVED') {
      addToast({
        title: 'Reunión finalizada ✅',
        description: 'La reunión ha terminado exitosamente.',
        tone: 'success',
      });
      
      const hash = getRouteHash('incident-detail', { id: incidentId });
      navigate(hash);
    }
  }, [warRoom?.status, incidentId, addToast]);

  // Efecto separado para manejar actualizaciones del WebSocket
  useEffect(() => {
    if (warRoom?.currentDurationSeconds !== undefined) {
      if (warRoom.currentDurationSeconds >= 0) {
        setCurrentDuration(warRoom.currentDurationSeconds);
      }
    }
  }, [warRoom?.currentDurationSeconds]);

  useEffect(() => {
    if (!warRoom && incidentId) {
      openWarRoom(incidentId);
    }
  }, [warRoom, incidentId, openWarRoom]);

  // Track if we've joined this meeting
  const hasJoinedRef = useRef(false);
  const meetingIdRef = useRef(null);
  const joinedTimeRef = useRef(null);

  // Auto-join meeting when entering the room if user is not a participant
  useEffect(() => {
    if (!warRoom || !auth.user) return;
    
    const userEmail = auth.user.email;
    const participants = warRoom.participantEmails || [];
    const isParticipant = participants.includes(userEmail);
    
    if (!isParticipant && warRoom.code && !hasJoinedRef.current) {
      joinWarRoom(warRoom.code)
        .then(() => {
          hasJoinedRef.current = true;
          meetingIdRef.current = warRoom.id;
          joinedTimeRef.current = Date.now();
        })
        .catch(error => {
          addToast({
            title: 'No se pudo unir a la reunión',
            description: error.message || 'Intenta unirte nuevamente más tarde.',
            tone: 'danger',
          });
        });
    } else if (isParticipant && !hasJoinedRef.current) {
      hasJoinedRef.current = true;
      meetingIdRef.current = warRoom.id;
      joinedTimeRef.current = Date.now();
    }
  }, [warRoom?.id, warRoom?.code, warRoom?.participantEmails, auth.user?.email, joinWarRoom]);

  // Cleanup: leave meeting when component unmounts (user navigates away)
  useEffect(() => {
    return () => {
      const now = Date.now();
      const joinedTime = hasJoinedRef.current ? (joinedTimeRef.current || now) : now;
      const timeInRoom = now - joinedTime;
      
      if (hasJoinedRef.current && meetingIdRef.current && timeInRoom > 2000) {
        leaveWarRoom(meetingIdRef.current);
        hasJoinedRef.current = false;
        meetingIdRef.current = null;
        joinedTimeRef.current = null;
      }
    };
  }, [leaveWarRoom]);

  // WebSocket connection for real-time participant updates and War Room events
  useEffect(() => {
    if (!auth?.token || !settings.apiBaseUrl || !warRoomId) return;
    
    if (eventType === 'warroom.duration' && isWarRoomMatch(payload.warRoomId)) {
      openWarRoom(incidentId);
    }
    
    const handleWebSocketEvent = (eventType, payload) => {
      // Handle warroom participant updates
      if (eventType === 'warroom.participants' && isWarRoomMatch(payload.warRoomId)) {
        openWarRoom(incidentId);
      }
      
      // Handle warroom duration updates
      if (eventType === 'warroom.duration' && isWarRoomMatch(payload.warRoomId)) {
        openWarRoom(incidentId);
      }
      
      // Handle warroom resolution events
      if (eventType === 'warroom.resolved' && isWarRoomMatch(payload.warRoomId)) {
        addToast({
          title: 'Incidente resuelto ✅',
          description: 'La reunión ha finalizado exitosamente.',
          tone: 'success',
        });
        
        const hash = getRouteHash('incident-detail', { id: incidentId });
        navigate(hash);
      }
    };

    const socket = connectAlertsWebSocket(settings.apiBaseUrl, handleWebSocketEvent, {
      onOpen: () => {

    if (eventType === 'warroom.message' && isWarRoomMatch(payload.warRoomId)) {
      // 👇 recarga mensajes de ESTA reunión por meetingId
      loadWarRoomMessages(meetingId);
    }
  };

  const socket = connectAlertsWebSocket(settings.apiBaseUrl, handleWebSocketEvent, {
    onOpen: () => {},
    onClose: () => {},
    onError: (error) => {
      console.warn('WarRoom: WebSocket error:', error);
    },
  });

    return () => {
      socket.close();
    };
  }, [auth?.token, settings.apiBaseUrl, warRoomId, incidentId, openWarRoom, addToast]);

  // WebSocket connection for real-time chat messages
  useEffect(() => {
    if (!auth?.token || !settings.apiBaseUrl || !warRoomId) return;

    const handleChatMessage = (messageData) => {
      // Handle different types of messages
      if (messageData.role === 'ai_user' || messageData.role === 'ai_assistant') {
        // This is an AI chat message, reload AI messages
        loadAIPrivateMessages(warRoomId);
      } else {
        // Regular team chat message, reload team messages
        // Regular team chat message, reload team messages
        loadWarRoomMessages(warRoomId);
      }
    };

    const chatSocket = connectWarRoomChatWebSocket(
      settings.apiBaseUrl,
      warRoomId,
      handleChatMessage,
      {
        onOpen: () => {
          console.log('War Room Chat WebSocket connected');
        },
        onClose: () => {
          console.log('War Room Chat WebSocket disconnected');
        },
        onError: (error) => {
          console.warn('War Room Chat WebSocket error:', error);
        },
      }
    );

    return () => {
      chatSocket.close();
    };
  }, [auth?.token, settings.apiBaseUrl, warRoomId, loadWarRoomMessages]);

  // Fallback polling for messages (in case WebSocket disconnects)
  useEffect(() => {
    if (!meetingId) return;
    loadWarRoomMessages(meetingId);
    const interval = globalThis.setInterval(
      () => loadWarRoomMessages(meetingId),
      POLL_INTERVAL,
    );
    return () => globalThis.clearInterval(interval);
  }, [meetingId, loadWarRoomMessages]);



  // Deshabilitar navegación hacia atrás durante la reunión
  useEffect(() => {
    const disableBackButton = () => {
      if (globalThis.history && globalThis.location) {
        globalThis.history.pushState(null, null, globalThis.location.pathname);
      }
    };

    const handlePopState = (event) => {
      if (event && typeof event.preventDefault === 'function') {
        event.preventDefault();
      }
      disableBackButton();
    };

    disableBackButton();
    globalThis.addEventListener('popstate', handlePopState);

    return () => {
      globalThis.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Interceptar clics en botones de navegación del sidebar
  useEffect(() => {
    const handleSidebarClick = async (event) => {
      const target = event.target;
      const sidebarButton = target.closest('.sidebar-nav button');
      const navLabel = sidebarButton?.querySelector('.nav-label');
      
      if (sidebarButton && navLabel?.textContent === 'Dashboard') {
        event.preventDefault();
        event.stopPropagation();
        await showNavigationOverlay(getRouteHash('dashboard'));
      }
    };

    document.addEventListener('click', handleSidebarClick, true);
    
    return () => {
      document.removeEventListener('click', handleSidebarClick, true);
    };
  }, [navigate]);

  // Bloquear recarga de página durante la reunión
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'F5') {
        event.preventDefault();
        return false;
      }
      
      if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
        event.preventDefault();
        return false;
      }
      
      if (event.ctrlKey && event.key === 'F5') {
        event.preventDefault();
        return false;
      }
    };

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = 'Estás en una reunión activa. Si sales, serás removido de la mesa de trabajo.';
      return 'Estás en una reunión activa. Si sales, serás removido de la mesa de trabajo.';
    };

    const handleUnload = () => {
      if (hasJoinedRef.current && meetingIdRef.current) {
        try {
          const url = `${settings.apiBaseUrl}/war-rooms/${meetingIdRef.current}/leave`;
          
          if (navigator.sendBeacon) {
            const data = new FormData();
            data.append('userId', auth?.user?.id || '');
            navigator.sendBeacon(url, data);
          } else {
            fetch(url, {
              method: 'POST',
              keepalive: true,
              headers: {
                'Authorization': `Bearer ${auth?.token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({})
            }).catch(() => {});
          }
          
          hasJoinedRef.current = false;
          meetingIdRef.current = null;
          joinedTimeRef.current = null;
        } catch (error_) {
          console.warn('[WarRoom] Unload leave meeting failed:', error_?.message);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    globalThis.addEventListener('beforeunload', handleBeforeUnload);
    globalThis.addEventListener('unload', handleUnload);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      globalThis.removeEventListener('beforeunload', handleBeforeUnload);
      globalThis.removeEventListener('unload', handleUnload);
    };
  }, [settings.apiBaseUrl, auth?.token, auth?.user?.id]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!message.trim()) return;
    
    try {
      await sendWarRoomMessage(warRoomId, message.trim());
      setMessage('');
      // Give backend time to persist and broadcast, then reload
      setTimeout(() => loadWarRoomMessages(warRoomId), 200);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };



  const handleMarkContained = async () => {
    if (!isAdmin(auth?.user)) {
      addToast({
        title: 'Acceso denegado',
        description: 'Solo los administradores pueden marcar incidentes como contenidos.',
        tone: 'danger',
      });
      setConfirmContain(false);
      return;
    }

    if (!warRoomId) {
      addToast({
        title: 'Error',
        description: 'No se encontró el ID de la reunión.',
        tone: 'danger',
      });
      setConfirmContain(false);
      return;
    }

    try {
      const { markIncidentAsResolved } = await import('../app/api.js');
      await markIncidentAsResolved(warRoomId, settings.apiBaseUrl);
      
      addToast({
        title: 'Reunión finalizada ✅',
        description: 'El incidente ha sido marcado como resuelto.',
        tone: 'success',
      });
      
      setConfirmContain(false);
      
      if (incidentId && incidentId !== warRoomId) {
        navigate(getRouteHash('incident-detail', { id: incidentId }));
      } else {
        navigate(getRouteHash('dashboard'));
      }
    } catch (error) {
      addToast({
        title: 'No se pudo marcar como contenido',
        description: error.message || 'Intenta nuevamente.',
        tone: 'danger',
      });
      setConfirmContain(false);
    }
  };

  // Helper to show loading overlay sequence for navigation
  const showNavigationOverlay = async (exitRoute) => {
    setLoadingOverlay({
      isVisible: true,
      title: '🚪 Saliendo de la reunión',
      description: 'Finalizando sesión de mesa de trabajo...',
      icon: '👋'
    });

    await new Promise(resolve => setTimeout(resolve, 1200));
    
    setLoadingOverlay({
      isVisible: true,
      title: '📊 Regresando al Dashboard',
      description: 'Cargando vista principal...',
      icon: '🏠'
    });
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setLoadingOverlay(prev => ({ ...prev, isVisible: false }));
    navigate(exitRoute);
  };

  // Función para salir a Dashboard con overlay
  const handleExitToDashboard = async () => {
    try {
      await showNavigationOverlay(getRouteHash('dashboard'));
    } catch (error_) {
      console.warn('[WarRoom] Exit navigation failed:', error_?.message);
      setLoadingOverlay(prev => ({ ...prev, isVisible: false }));
    }
  };

  if (loading.warRoom && !warRoom) {
    return (
      <div className="page">
        <Loader label="Cargando mesa de trabajo" />
      </div>
    );
  }

  if (!warRoom) {
    return (
      <div className="page">
        <EmptyState
          title="Mesa de trabajo no encontrada"
          description="Verifica que el incidente tenga una mesa asignada."
          action={
            <button type="button" className="btn primary" onClick={handleExitToDashboard}>
              Volver al dashboard
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="page war-room-page">
      <header className="page-header">
        <div>
          <h2>ID: {warRoom.id}</h2>
          <p>Incidente {incidentId}</p>
          <div className="war-room-info" style={{ fontSize: '0.9em', marginTop: '0.5em', opacity: 0.8 }}>
            <span>Código: <strong>{warRoom.code}</strong></span>
            {warRoom.startTime && (
              <span style={{ marginLeft: '1em' }}>Inicio: <strong>{new Date(warRoom.startTime).toLocaleDateString()}</strong></span>
            )}
            {(warRoom.status === 'RESOLVED' || warRoom.status === 'ENDED') && warRoom.durationSeconds && (
              <span style={{ marginLeft: '1em' }}>Duración total: <strong>{formatDuration(warRoom.durationSeconds)}</strong></span>
            )}
            {(warRoom.status === 'RESOLVED' || warRoom.status === 'ENDED') && warRoom.endTime && (
              <span style={{ marginLeft: '1em' }}>Fin: <strong>{new Date(warRoom.endTime).toLocaleString()}</strong></span>
            )}
            {warRoom.status && (
              <span style={{ marginLeft: '1em' }}>Estado: <strong>{getStatusLabel(warRoom.status)}</strong></span>
            )}
          </div>
          
          {warRoom.startTime && (
            <div className="war-room-timer" style={{ fontSize: '1.1em', marginTop: '0.8em', padding: '0.5em', backgroundColor: 'var(--color-success-100)', borderRadius: '4px', border: '1px solid var(--color-success-300)' }}>
              <span style={{ color: 'var(--color-success-700)', fontWeight: '600' }}>⏱️ Duración: <strong style={{ fontFamily: 'monospace', fontSize: '1.2em' }}>{formatDuration(currentDuration)}</strong></span>
            </div>
          )}
          
          <div className="war-room-participants" style={{ fontSize: '0.85em', marginTop: '0.8em', opacity: 0.7 }}>
            <span>Participantes: <strong>{warRoom.currentParticipantCount || warRoom.participantEmails?.length || 0}</strong></span>
          </div>
        </div>
        <div className="actions-row">
          {isAdmin(auth?.user) && (
            <button type="button" className="btn success" onClick={() => setConfirmContain(true)}>
              Marcar como contenido
            </button>
          )}
        </div>
      </header>

      <div className="war-room-layout">
        <section className="panel chat-panel" aria-labelledby="chat-heading">
          <header>
            <h3 id="chat-heading">💬 Chat del equipo</h3>
            <span>Conversación grupal - Actualiza cada 10 segundos</span>
          </header>
          <div className="chat-messages" aria-live="polite">
            {messages.filter(item => item && item.id).map((item) => (
              <article key={item.id} className={`chat-message chat-${item.role}`}>
                <header>
                  <span>{item.role === 'assistant' ? 'Asistente' : item.senderEmail || 'Analista'}</span>
                  <time dateTime={item.createdAt}>{formatTimestamp(item.createdAt)}</time>
                </header>
                <p>{item.content}</p>
              </article>
            ))}
          </div>
          <form className="chat-form" onSubmit={handleSubmit}>
            <label htmlFor="chat-input" className="sr-only">
              Escribe un mensaje
            </label>
            <textarea
              id="chat-input"
              rows={3}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Describe el siguiente paso o pregunta a la IA (visible para todos)."
              required
                style={{
                  minHeight: '56px',
                  maxHeight: '120px',
                  resize: 'vertical',
                }}
            />
            <div className="chat-actions">
              <button type="submit" className="btn primary">
                Enviar
              </button>
            </div>
          </form>
        </section>

        <aside className="panel ai-private-panel ai-private-panel-large">
          <AIPrivateChat
            warRoomId={warRoomId}
            privateMessages={warRoom?.privateMessages}
            loading={loading.warRoom}
            onSendMessage={sendAIPrivateMessage}
            onLoadMessages={loadAIPrivateMessages}
            isAdmin={isAdmin(auth?.user)}
          />
        </aside>
      </div>

      <ConfirmDialog
        open={confirmContain}
        title="Marcar incidente como contenido"
        description="Se actualizará el estado del incidente asociado."
        tone="success"
        confirmLabel="Marcar contenido"
        cancelLabel="Cancelar"
        onCancel={() => setConfirmContain(false)}
        onConfirm={handleMarkContained}
      />
      
      <LoadingOverlay 
        isVisible={loadingOverlay.isVisible}
        title={loadingOverlay.title}
        description={loadingOverlay.description}
        icon={loadingOverlay.icon}
      />
    </div>
  );
}

WarRoom.propTypes = {
  params: PropTypes.shape({
    id: PropTypes.string.isRequired,
  }).isRequired,
};

export default WarRoom;
