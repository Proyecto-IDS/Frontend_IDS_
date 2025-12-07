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
import Top5Probabilities from '../components/Top5Probabilities.jsx';
import AllProbabilitiesChart from '../components/AllProbabilitiesChart.jsx';
import MetricsGauge from '../components/MetricsGauge.jsx';
import ThreatLevelIndicator from '../components/ThreatLevelIndicator.jsx';

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
    // Ref para el contenedor de mensajes del chat de equipo
    const teamChatMessagesRef = useRef(null);
  const warRoomId = params.id;
  // Estado para mostrar el modal de probabilidades
  const [showProbModal, setShowProbModal] = useState(false);
  const state = useAppState();
  const { warRooms, loading, auth, settings } = state;
  const {
    openWarRoom,
    loadWarRoomMessages,
    sendWarRoomMessage,
    joinWarRoom,
    leaveWarRoom,
    loadAIPrivateMessages,
    sendAIPrivateMessage,
    updateWarRoomMetrics,
    addToast,
    forceReloadIncident,
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
  const messages = Array.isArray(warRoom?.messages) ? warRoom.messages : [];

  // Scroll automático al fondo cuando llegan nuevos mensajes al chat de equipo.
  // FORZAR: siempre desplazar al último mensaje (tanto al recibir como al enviar).
  useEffect(() => {
    const el = teamChatMessagesRef.current;
    if (!el) return;

    const id = globalThis.setTimeout(() => {
      try {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      } catch (e) {
        el.scrollTop = el.scrollHeight;
      }
    }, 50);

    return () => globalThis.clearTimeout(id);
  }, [messages]);
  
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

  // Usar métricas ML del estado global (ya cargadas en state.js)
  const mlMetrics = warRoom?.mlMetrics || null;
  const loadingMetrics = false; // Ya no necesitamos estado de loading local

  // Log para debugging - ver estado de métricas
  useEffect(() => {
    if (warRoom) {
      console.log('[WarRoom] Estado actual:', {
        warRoomId: warRoom.id,
        hasAlertId: !!warRoom.alertId,
        alertId: warRoom.alertId,
        hasMetrics: !!warRoom.mlMetrics,
        metricsKeys: warRoom.mlMetrics ? Object.keys(warRoom.mlMetrics) : []
      });
    }
  }, [warRoom?.id, warRoom?.alertId, warRoom?.mlMetrics]);

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

  // Helper function to match warRoom IDs
  const isWarRoomMatch = (payloadWarRoomId) => {
    if (!payloadWarRoomId) return false;
    return payloadWarRoomId === warRoomId || payloadWarRoomId === meetingId || payloadWarRoomId === warRoom?.id;
  };

  // WebSocket connection for real-time participant updates and War Room events
  useEffect(() => {
    if (!auth?.token || !settings.apiBaseUrl || !warRoomId) return;
    const handleWebSocketEvent = (eventType, payload) => {
      // Handle warroom participant updates
      if (eventType === 'warroom.participants' && isWarRoomMatch(payload.warRoomId)) {
        openWarRoom(incidentId);
      }
      
      // Handle warroom duration updates
      if (eventType === 'warroom.duration' && isWarRoomMatch(payload.warRoomId)) {
        openWarRoom(incidentId);
      }
      
      // Handle new chat messages
      if (eventType === 'warroom.message' && isWarRoomMatch(payload.warRoomId)) {
        if (meetingId) loadWarRoomMessages(meetingId);
      }

      // Handle ML metrics updates - sincronizar métricas entre usuarios
      if (eventType === 'warroom.metrics' && isWarRoomMatch(payload.warRoomId)) {
        console.log('[WarRoom] Received ML metrics update from WebSocket:', payload.mlMetrics);
        if (payload.mlMetrics && meetingId) {
          updateWarRoomMetrics(meetingId, payload.mlMetrics);
        }
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
      onOpen: () => {},
      onClose: () => {},
      onError: (error) => {
        console.warn('WarRoom: WebSocket error:', error);
      },
    });

    return () => {
      socket.close();
    };
  }, [auth?.token, settings.apiBaseUrl, warRoomId, incidentId, openWarRoom, addToast, meetingId, updateWarRoomMetrics]);

  // WebSocket connection for real-time chat messages
  useEffect(() => {
    if (!auth?.token || !settings.apiBaseUrl || !warRoomId) return;

    const handleChatMessage = (messageData) => {
      // Handle different types of messages
      if (messageData.role === 'ai_user' || messageData.role === 'ai_assistant') {
        // This is an AI chat message, reload AI messages
        if (meetingId) loadAIPrivateMessages(meetingId);
      } else {
        if (meetingId) loadWarRoomMessages(meetingId);
      }
    };

    const chatSocket = connectWarRoomChatWebSocket(
      settings.apiBaseUrl,
      meetingId || warRoomId,
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
  }, [auth?.token, settings.apiBaseUrl, warRoomId, meetingId, loadWarRoomMessages, loadAIPrivateMessages]);

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
      try {
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

        // Bloquear zoom con teclado (Ctrl/Cmd + +/-/0)
        if ((event.ctrlKey || event.metaKey) && (event.key === '+' || event.key === '-' || event.key === '0' || event.key === '=' || event.key.toLowerCase() === 'ñ')) {
          event.preventDefault();
          return false;
        }

        // Bloquear búsqueda del navegador (Ctrl/Cmd + F)
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
          event.preventDefault();
          return false;
        }
      } catch (error) {
        console.warn('Error handling keydown:', error);
      }
    };

    const handleWheel = (event) => {
      try {
        // Bloquear zoom con scroll (Ctrl/Cmd + scroll)
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          return false;
        }
      } catch (error) {
        console.warn('Error handling wheel:', error);
      }
    };

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = 'Estás en una reunión activa. Si sales, serás removido de la mesa de trabajo.';
      return 'Estás en una reunión activa. Si sales, serás removido de la mesa de trabajo.';
    };

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('wheel', handleWheel, { passive: false });
    globalThis.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('wheel', handleWheel);
      globalThis.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [settings.apiBaseUrl, auth?.token, auth?.user?.id]);

  // Forzar zoom al 80% al entrar a la WarRoom
  useEffect(() => {
    // Guardar el zoom original
    const originalZoom = document.body.style.zoom;
    
    // Aplicar zoom al 80%
    document.body.style.zoom = '0.8';
    
    // Restaurar el zoom original al salir
    return () => {
      document.body.style.zoom = originalZoom;
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!message.trim()) return;
    
    try {
      await sendWarRoomMessage(meetingId || warRoomId, message.trim());
      setMessage('');
      // Forzar scroll al enviar (el propio remitente debe ver su mensaje)
      const el = teamChatMessagesRef.current;
      if (el) {
        try {
          el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
        } catch (e) {
          el.scrollTop = el.scrollHeight;
        }
      }
      // Give backend time to persist and broadcast, then reload
      setTimeout(() => {
        if (meetingId) loadWarRoomMessages(meetingId);
      }, 200);
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

    if (!meetingId && !warRoomId) {
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
      await markIncidentAsResolved(meetingId || warRoomId, settings.apiBaseUrl);
      
      addToast({
        title: 'Reunión finalizada ✅',
        description: 'El incidente ha sido marcado como resuelto.',
        tone: 'success',
      });
      
      setConfirmContain(false);
      
      // Recargar el incidente actualizado antes de navegar
      if (incidentId && incidentId !== warRoomId) {
        try {
          // Forzar recarga del incidente desde el backend (invalida caché)
          await forceReloadIncident(incidentId);
        } catch (reloadError) {
          console.warn('Failed to reload incident after marking as contained:', reloadError);
        }
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

  // Memorizar el panel de métricas para evitar re-renders
  const mlMetricsPanel = useMemo(() => {
    if (loadingMetrics) {
      return (
        <section className="panel ml-metrics-panel">
          <header>
            <h3>📊 Métricas del Modelo ML</h3>
          </header>
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <Loader label="Cargando métricas..." />
          </div>
        </section>
      );
    }

    if (!mlMetrics) {
      return (
        <section className="panel ml-metrics-panel">
          <header>
            <h3>Métricas del Modelo ML</h3>
          </header>
          <div className="ml-metrics-empty">
            <p>No hay métricas disponibles para esta alerta.</p>
          </div>
        </section>
      );
    }

    return (
      <>
        {/* Panel 1: Indicador de nivel de amenaza */}
        <div className="metric-card">
          <ThreatLevelIndicator
            prediction={mlMetrics.prediction}
            attackProbability={mlMetrics.attack_probability || 0}
            state={mlMetrics.state}
          />
        </div>

        {/* Panel 2: Gauge de probabilidad de ataque */}
        <div className="metric-card">
          <MetricsGauge
            value={mlMetrics.attack_probability || 0}
            label="Probabilidad de Ataque"
            thresholds={{ low: 0.3, medium: 0.7 }}
          />
        </div>

        {/* Panel 3: Protocolo de Respuesta */}
        {mlMetrics.standard_protocol && (
          <section className="panel metric-card">
            <header>
              <h3>📋 Protocolo de Respuesta</h3>
            </header>
            <div className="metric-content protocol-content">
              {mlMetrics.standard_protocol}
            </div>
          </section>
        )}
      </>
    );
  }, [mlMetrics, loadingMetrics]);

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
      <header className="page-header war-room-header">
        <div className="war-room-header-content">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h2 className="war-room-id">ID: <span className="id-number">{warRoom.id}</span></h2>
              <p className="war-room-incident">Incidente <span className="incident-number">{incidentId}</span></p>
            </div>
            <div className="war-room-participants">
              <span className="participants-label">Participantes:</span>
              <strong className="participants-count">{warRoom.currentParticipantCount || warRoom.participantEmails?.length || 0}</strong>
            </div>
          </div>
          
          <div className="war-room-info">
            <span className="info-item">Código: <strong className="info-value">{warRoom.code}</strong></span>
            {warRoom.startTime && (
              <span className="info-item">Inicio: <strong className="info-value">{new Date(warRoom.startTime).toLocaleDateString()}</strong></span>
            )}
            {warRoom.status && (
              <span className="info-item">Estado: <strong className="info-value status-badge">{getStatusLabel(warRoom.status)}</strong></span>
            )}
            {warRoom.startTime && (
              <div className="war-room-timer">
                <span className="timer-label">⏱️</span>
                <strong className="timer-value">{formatDuration(currentDuration)}</strong>
              </div>
            )}
            {(warRoom.status === 'RESOLVED' || warRoom.status === 'ENDED') && warRoom.durationSeconds && (
              <span className="info-item">Duración total: <strong className="info-value">{formatDuration(warRoom.durationSeconds)}</strong></span>
            )}
            {(warRoom.status === 'RESOLVED' || warRoom.status === 'ENDED') && warRoom.endTime && (
              <span className="info-item">Fin: <strong className="info-value">{new Date(warRoom.endTime).toLocaleString()}</strong></span>
            )}
          </div>
          
          {isAdmin(auth?.user) && (
            <button type="button" className="btn success" onClick={() => setConfirmContain(true)}>
              Marcar como contenido
            </button>
          )}
        </div>
      </header>




      <div className="war-room-layout war-room-executive">
        {/* Columna izquierda: Chat IA + Chat Equipo */}
        <div className="war-room-col war-room-col-left">
          <aside className="panel ai-private-panel">
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

        {/* Columna central: Métricas ML principales */}
        <div className="war-room-col war-room-col-center">
          {mlMetricsPanel}
        </div>

        {/* Columna derecha: Top 5 + Todas las probabilidades */}
        <div className="war-room-col war-room-col-right">
          <section className="panel top5-panel">
            <header>
              <h3>Top 5 Probabilidades</h3>
            </header>
            <div style={{ padding: '1rem' }}>
              <Top5Probabilities probabilities={mlMetrics?.probabilities} showHeader={false} />
            </div>
          </section>
          
          <div className="panel all-prob-panel" style={{ marginTop: '1.2rem' }}>
            <header>
              <h3>Todas las probabilidades</h3>
            </header>
            <button className="btn primary" style={{ width: '100%', margin: '0.5rem 0' }} onClick={() => setShowProbModal(true)}>
              Ver todas las amenazas
            </button>
          </div>
        </div>
      </div>

      {/* Chat del equipo - Ancho completo debajo */}
      <div className="war-room-team-chat-section">
        <section className="panel chat-panel" aria-labelledby="chat-heading">
          <header>
            <h3 id="chat-heading">💬 Chat del equipo</h3>
            <span>Conversación grupal - Actualiza cada 10 segundos</span>
          </header>
          <div ref={teamChatMessagesRef} className="chat-messages" aria-live="polite">
            {messages.filter(item => item && item.id).map((item) => (
              <article key={item.id} className={`chat-message chat-${item.role}`}>
                <header>
                  <span>{getMessageSenderLabel(item)}</span>
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
              name="chat-input"
              rows={3}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  handleSubmit(event);
                }
              }}
              placeholder="Habla con tu equipo (visible para todos). Presiona Enter para enviar, Shift+Enter para nueva línea."
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
      </div>

      {/* Modal para mostrar la gráfica completa */}
      {showProbModal && (
        <div 
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="prob-modal-title"
          className="modal-backdrop" 
          onClick={() => setShowProbModal(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setShowProbModal(false);
            }
          }}
          tabIndex={-1}
        >
          <div className="modal" onClick={e => e.stopPropagation()} role="document">
            <header style={{ marginBottom: '1rem', textAlign: 'center' }}>
              <h3 id="prob-modal-title">Resultados de Probabilidades</h3>
            </header>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <AllProbabilitiesChart probabilities={mlMetrics?.probabilities} />
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => setShowProbModal(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

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
