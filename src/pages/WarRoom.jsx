import { useEffect, useMemo, useState, useRef } from 'react';
import { useAppActions, useAppState } from '../app/state.js';
import { getRouteHash, navigate } from '../app/router.js';
import { connectAlertsWebSocket } from '../app/api.js';
import Loader from '../components/Loader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';

const formatTimestamp = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const POLL_INTERVAL = Number(import.meta?.env?.VITE_WARROOM_POLL_INTERVAL || 10000);

function WarRoom({ params }) {
  const warRoomId = params.id;
  const { warRooms, loading, auth, settings } = useAppState();
  const {
    openWarRoom,
    loadWarRoomMessages,
    sendWarRoomMessage,
    updateIncidentStatus,
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

  const incidentId = useMemo(() => {
    if (warRoom?.incidentId) return warRoom.incidentId;
    if (warRoomId?.startsWith('WR-')) return warRoomId.substring(3);
    return warRoomId;
  }, [warRoom, warRoomId]);

  // Función para formatear duración en MM:SS
  const formatDuration = (seconds) => {
    if (seconds === null || seconds === undefined || seconds < 0) return '00:00:00';
    
    const numSeconds = Number(seconds);
    if (isNaN(numSeconds)) return '00:00:00';
    
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
      // Only leave if we've been in the room for at least 5 seconds to avoid false dismounts
      const now = Date.now();
      const joinedTime = hasJoinedRef.current ? (joinedTimeRef.current || now) : now;
      const timeInRoom = now - joinedTime;
      
      if (hasJoinedRef.current && meetingIdRef.current && timeInRoom > 5000) {

        leaveWarRoom(meetingIdRef.current);
        hasJoinedRef.current = false;
        meetingIdRef.current = null;
        joinedTimeRef.current = null;
      } else if (hasJoinedRef.current) {

      }
    };
  }, [leaveWarRoom]);

  // WebSocket connection for real-time participant updates
  useEffect(() => {
    if (!auth?.token || !settings.apiBaseUrl || !warRoomId) return;
    
    const handleWebSocketEvent = (eventType, payload) => {
      console.log('WebSocket event received in WarRoom:', eventType, payload);
      console.log('Current warRoomId:', warRoomId, 'Payload warRoomId:', payload.warRoomId);
      
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
        console.log('Warroom resolved event received, redirecting...', payload);
        
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
    if (!incidentId) return;
    
    // Verificar que el usuario sea administrador
    const isAdmin = auth?.user?.role?.includes('ADMIN') || auth?.user?.roles?.includes('ADMIN');
    if (!isAdmin) {
      addToast({
        title: 'Acceso denegado',
        description: 'Solo los administradores pueden marcar incidentes como contenidos.',
        tone: 'danger',
      });
      setConfirmContain(false);
      return;
    }
    
    try {
      await updateIncidentStatus(incidentId, 'mark_contained');
      setConfirmContain(false);
      navigate(getRouteHash('incident-detail', { id: incidentId }));
    } catch (error) {
      // El error ya es manejado por updateIncidentStatus, solo cerramos el modal
      setConfirmContain(false);
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
            <button type="button" className="btn primary" onClick={() => navigate(getRouteHash('dashboard'))}>
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
            {warRoom.status && (
              <>
                <span style={{ marginLeft: '1em' }}>Estado: <strong>{warRoom.status === 'ACTIVE' ? 'Activa' : (warRoom.status === 'RESOLVED' || warRoom.status === 'ENDED') ? 'Resuelta' : warRoom.status}</strong></span>
              </>
            )}
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
          <button
            type="button"
            className="btn subtle"
            onClick={() => navigate(getRouteHash('incident', { id: incidentId }))}
          >
            Volver al detalle
          </button>
          {/* Solo mostrar el botón si el usuario es administrador */}
          {(auth?.user?.role?.includes('ADMIN') || auth?.user?.roles?.includes('ADMIN')) && (
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
    </div>
  );
}

export default WarRoom;
