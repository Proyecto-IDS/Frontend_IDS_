import { useEffect, useMemo, useState, useRef } from 'react';
import { useAppActions, useAppState } from '../app/state.js';
import { getRouteHash, navigate } from '../app/router.js';
import { connectAlertsWebSocket } from '../app/api.js';
import Loader from '../components/Loader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import LoadingOverlay from '../components/LoadingOverlay.jsx';

const formatTimestamp = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

function isAdmin(user) {
  if (!user) return false;
  const role = user.role;
  const authorities = user.authorities;
  
  if (typeof role === 'string' && (role === 'ROLE_ADMIN' || role === 'ADMIN' || role === 'admin')) {
    return true;
  }
  
  if (Array.isArray(authorities)) {
    return authorities.some(auth => {
      const authStr = typeof auth === 'string' ? auth : auth?.authority || '';
      return authStr === 'ROLE_ADMIN' || authStr === 'ADMIN';
    });
  }
  
  if (Array.isArray(user.roles)) {
    return user.roles.some(r => r === 'ROLE_ADMIN' || r === 'ADMIN' || r === 'admin');
  }
  
  return false;
}

const POLL_INTERVAL = Number(import.meta?.env?.VITE_WARROOM_POLL_INTERVAL || 10000);

function WarRoom({ params }) {
  const warRoomId = params.id;
  const { warRooms, loading, auth, settings } = useAppState();
  const {
    openWarRoom,
    loadWarRoomMessages,
    sendWarRoomMessage,
    updateWarRoomChecklist,
    joinWarRoom,
    leaveWarRoom,
    addToast,
  } = useAppActions();

  const warRoom = warRooms[warRoomId];
  const [message, setMessage] = useState('');
  const [confirmContain, setConfirmContain] = useState(false);
  const [localChecklist, setLocalChecklist] = useState(warRoom?.checklist || []);
  
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

  // Función para formatear duración en MM:SS
  const formatDuration = (seconds) => {
    if (seconds === null || seconds === undefined || seconds < 0) return '00:00:00';
    
    const numSeconds = Number(seconds);
    if (Number.isNaN(numSeconds)) return '00:00:00';
    
    const hours = Math.floor(numSeconds / 3600);
    const minutes = Math.floor((numSeconds % 3600) / 60);
    const remainingSeconds = numSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

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
      
      // Si la diferencia es negativa, significa que startTime está en el futuro
      // En ese caso, la reunión aún no ha empezado, mostrar 0
      if (durationSeconds < 0) {
        setCurrentDuration(0);
      } else {
        setCurrentDuration(durationSeconds);
      }
    };

    // Actualizar inmediatamente
    updateDuration();
    
    // Siempre actualizar cada segundo para tener un cronómetro en tiempo real
    const interval = setInterval(updateDuration, 1000);
    
    return () => {
      clearInterval(interval);
    };
  }, [warRoom?.startTime, warRoom?.status]);

  // Efecto para redirigir cuando la reunión está terminada
  useEffect(() => {
    if (warRoom?.status === 'ENDED' || warRoom?.status === 'RESOLVED') {
      // Mostrar notificación
      addToast({
        title: 'Reunión finalizada ✅',
        description: 'La reunión ha terminado exitosamente.',
        tone: 'success',
      });
      
      // Redirigir inmediatamente
      const hash = getRouteHash('incident-detail', { id: incidentId });
      navigate(hash);
    }
  }, [warRoom?.status, incidentId, addToast]);

  // Efecto separado para manejar actualizaciones del WebSocket
  useEffect(() => {
    if (warRoom?.currentDurationSeconds !== undefined) {
      // Solo usar valor del WebSocket si es positivo
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
    
    // Only join if we haven't joined yet and we're not already a participant
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
      // We're already a participant (maybe we created the meeting)
      hasJoinedRef.current = true;
      meetingIdRef.current = warRoom.id;
      joinedTimeRef.current = Date.now();
    }
  }, [warRoom?.id, warRoom?.code, warRoom?.participantEmails, auth.user?.email, joinWarRoom]);

  // Cleanup: leave meeting when component unmounts (user navigates away)
  useEffect(() => {
    return () => {
      // Only leave if we've been in the room for at least 2 seconds to avoid false dismounts
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

  // WebSocket connection for real-time participant updates
  useEffect(() => {
    if (!auth?.token || !settings.apiBaseUrl || !warRoomId) return;
    
    const handleWebSocketEvent = (eventType, payload) => {

      
      // Handle warroom participant updates
      if (eventType === 'warroom.participants' && (payload.warRoomId === warRoomId || payload.warRoomId === Number(warRoomId))) {
        // Refresh the war room data to get updated participant list
        openWarRoom(incidentId);
      }
      
      // Handle warroom duration updates
      if (eventType === 'warroom.duration' && (payload.warRoomId === warRoomId || payload.warRoomId === Number(warRoomId))) {

        // The duration will be handled by the global state management
        openWarRoom(incidentId);
      }
      
      // Handle warroom resolution events
      if (eventType === 'warroom.resolved' && (payload.warRoomId === warRoomId || payload.warRoomId === Number(warRoomId))) {

        
        // Show notification that incident was resolved
        addToast({
          title: 'Incidente resuelto ✅',
          description: 'La reunión ha finalizado exitosamente.',
          tone: 'success',
        });
        
        // Redirect all users to the incident detail page (no delay needed)
        const hash = getRouteHash('incident-detail', { id: incidentId });
        navigate(hash);
      }
      
      // Handle new messages (if implemented in backend)
      if (eventType === 'warroom.message' && payload.warRoomId === warRoomId) {
        // Refresh messages
        loadWarRoomMessages(warRoomId);
      }
    };

    const socket = connectAlertsWebSocket(settings.apiBaseUrl, handleWebSocketEvent, {
      onOpen: () => {

      },
      onClose: () => {

      },
      onError: (error) => {
        console.warn('WarRoom: WebSocket error:', error);
      },
    });

    return () => {
      socket.close();
    };
  }, [auth?.token, settings.apiBaseUrl, warRoomId, incidentId, openWarRoom, loadWarRoomMessages]);

  useEffect(() => {
    if (!warRoomId) return;
    loadWarRoomMessages(warRoomId);
    const interval = window.setInterval(() => loadWarRoomMessages(warRoomId), POLL_INTERVAL);
    return () => window.clearInterval(interval);
  }, [warRoomId, loadWarRoomMessages]);

  useEffect(() => {
    if (warRoom?.checklist) {
      setLocalChecklist(warRoom.checklist);
    }
  }, [warRoom]);

  // Deshabilitar navegación hacia atrás durante la reunión
  useEffect(() => {
    const disableBackButton = () => {
      // Agregar una entrada al historial para bloquear el back
      window.history.pushState(null, null, window.location.pathname);
    };

    const handlePopState = (event) => {
      // Bloquear la navegación hacia atrás
      window.history.pushState(null, null, window.location.pathname);
      
      // Mostrar mensaje opcional (puedes comentar esto si no quieres el toast)
      // addToast({
      //   title: '🚫 Navegación bloqueada',
      //   description: 'Usa el botón "Dashboard" para salir de la reunión.',
      //   tone: 'warning'
      // });
    };

    // Bloquear inmediatamente al entrar
    disableBackButton();
    
    // Escuchar intentos de navegación hacia atrás
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Interceptar clics en botones de navegación del sidebar
  useEffect(() => {
    const handleSidebarClick = async (event) => {
      const target = event.target;
      
      // Buscar si el clic es en el botón Dashboard del sidebar
      const sidebarButton = target.closest('.sidebar-nav button');
      const navLabel = sidebarButton?.querySelector('.nav-label');
      
      // Si es el botón Dashboard
      if (sidebarButton && navLabel?.textContent === 'Dashboard') {
        event.preventDefault();
        event.stopPropagation();
        
        // Mostrar overlay de salida
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
        navigate(getRouteHash('dashboard'));
      }
    };

    // Escuchar clics en toda la página con captura
    document.addEventListener('click', handleSidebarClick, true);
    
    return () => {
      document.removeEventListener('click', handleSidebarClick, true);
    };
  }, [navigate]);

  // Bloquear recarga de página durante la reunión
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Bloquear F5
      if (event.key === 'F5') {
        event.preventDefault();
        return false;
      }
      
      // Bloquear Ctrl+R y Cmd+R
      if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
        event.preventDefault();
        return false;
      }
      
      // Bloquear Ctrl+F5 (hard refresh)
      if (event.ctrlKey && event.key === 'F5') {
        event.preventDefault();
        return false;
      }
    };

    const handleBeforeUnload = (event) => {
      // Mostrar mensaje de confirmación al intentar cerrar/recargar
      event.preventDefault();
      event.returnValue = 'Estás en una reunión activa. Si sales, serás removido de la mesa de trabajo.';
      return 'Estás en una reunión activa. Si sales, serás removido de la mesa de trabajo.';
    };

    const handleUnload = () => {
      // Hacer leave cuando realmente se está saliendo de la página
      if (hasJoinedRef.current && meetingIdRef.current) {
        try {
          // Usar sendBeacon para garantizar que la petición se envíe
          const url = `${settings.apiBaseUrl}/war-rooms/${meetingIdRef.current}/leave`;
          
          if (navigator.sendBeacon) {
            // sendBeacon es más confiable para unload
            const data = new FormData();
            data.append('userId', auth?.user?.id || '');
            navigator.sendBeacon(url, data);
          } else {
            // Fallback con fetch + keepalive
            fetch(url, {
              method: 'POST',
              keepalive: true,
              headers: {
                'Authorization': `Bearer ${auth?.token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({})
            }).catch(() => {}); // Ignorar errores en unload
          }
          
          hasJoinedRef.current = false;
          meetingIdRef.current = null;
          joinedTimeRef.current = null;
        } catch (error) {
          // Ignorar errores durante unload
        }
      }
    };

    // Agregar listeners
    document.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);

    return () => {
      // Cleanup
      document.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
    };
  }, [settings.apiBaseUrl, auth?.token, auth?.user?.id]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!message.trim()) return;
    await sendWarRoomMessage(warRoomId, message.trim());
    setMessage('');
  };

  const handleChecklistToggle = (itemId) => {
    setLocalChecklist((current) => {
      const updated = current.map((item) =>
        item.id === itemId ? { ...item, done: !item.done } : item,
      );
      updateWarRoomChecklist(warRoomId, updated);
      return updated;
    });
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

  // Función para salir a Dashboard con overlay
  const handleExitToDashboard = async () => {
    setLoadingOverlay({
      isVisible: true,
      title: '🚪 Saliendo de la reunión',
      description: 'Finalizando sesión de mesa de trabajo...',
      icon: '👋'
    });

    try {
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      setLoadingOverlay({
        isVisible: true,
        title: '📊 Regresando al Dashboard',
        description: 'Cargando vista principal...',
        icon: '🏠'
      });
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setLoadingOverlay(prev => ({ ...prev, isVisible: false }));
      navigate(getRouteHash('dashboard'));
    } catch (error) {
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

  const messages = warRoom.messages || [];

  return (
    <div className="page war-room-page">
      <header className="page-header">
        <div>
          <h2>ID: {warRoom.id}</h2>
          <p>Incidente {incidentId}</p>
          <div className="war-room-info" style={{ fontSize: '0.9em', marginTop: '0.5em', opacity: 0.8 }}>
            <span>Código: <strong>{warRoom.code}</strong></span>
            {warRoom.startTime && (
              <>
                <span style={{ marginLeft: '1em' }}>Inicio: <strong>{new Date(warRoom.startTime).toLocaleDateString()}</strong></span>
              </>
            )}
            {(warRoom.status === 'RESOLVED' || warRoom.status === 'ENDED') && warRoom.durationSeconds && (
              <>
                <span style={{ marginLeft: '1em' }}>Duración total: <strong>{formatDuration(warRoom.durationSeconds)}</strong></span>
              </>
            )}
            {(warRoom.status === 'RESOLVED' || warRoom.status === 'ENDED') && warRoom.endTime && (
              <>
                <span style={{ marginLeft: '1em' }}>Fin: <strong>{new Date(warRoom.endTime).toLocaleString()}</strong></span>
              </>
            )}
            {warRoom.status && (() => {
              let statusLabel = warRoom.status;
              if (warRoom.status === 'ACTIVE') {
                statusLabel = 'Activa';
              } else if (warRoom.status === 'RESOLVED' || warRoom.status === 'ENDED') {
                statusLabel = 'Resuelta';
              }
              return (
                <span style={{ marginLeft: '1em' }}>Estado: <strong>{statusLabel}</strong></span>
              );
            })()}
          </div>
          
          {/* Cronómetro en tiempo real para reuniones activas */}
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
          {/* Solo mostrar el botón si el usuario es administrador */}
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
            <h3 id="chat-heading">Chat con IA de respuesta</h3>
            <span>Actualiza cada 10 segundos</span>
          </header>
          <div className="chat-messages" aria-live="polite">
            {messages.map((item) => (
              <article key={item.id} className={`chat-message chat-${item.role}`}>
                <header>
                  <span>{item.role === 'assistant' ? 'Asistente' : 'Analista'}</span>
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
              placeholder="Describe el siguiente paso o pregunta a la IA."
              required
            />
            <div className="chat-actions">
              <button type="submit" className="btn primary">
                Enviar
              </button>
            </div>
          </form>
        </section>

        <aside className="panel checklist-panel" aria-labelledby="checklist-heading">
          <header>
            <h3 id="checklist-heading">Checklist sugerida</h3>
          </header>
          <ul className="checklist">
            {localChecklist.map((item) => (
              <li key={item.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => handleChecklistToggle(item.id)}
                  />
                  <span>{item.label}</span>
                </label>
              </li>
            ))}
          </ul>
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
      
      {/* Loading Overlay for exit actions */}
      <LoadingOverlay 
        isVisible={loadingOverlay.isVisible}
        title={loadingOverlay.title}
        description={loadingOverlay.description}
        icon={loadingOverlay.icon}
      />
    </div>
  );
}

export default WarRoom;
