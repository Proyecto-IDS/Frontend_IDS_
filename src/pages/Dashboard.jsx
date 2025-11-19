import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useAppActions, useAppState } from '../app/state.js';
import { getRouteHash, navigate } from '../app/router.js';
import { connectAlertsWebSocket } from '../app/api.js';
import StatCard from '../components/StatCard.jsx';
import Table from '../components/Table.jsx';
import Tag from '../components/Tag.jsx';
import Pill from '../components/Pill.jsx';
import SearchBox from '../components/SearchBox.jsx';
import MonitorTraffic from '../components/MonitorTraffic/MonitorTraffic.jsx';
import LoadingOverlay from '../components/LoadingOverlay.jsx';

const statusOptions = [
  { value: '', label: 'Todos' },
  { value: 'conocido', label: 'Conocidos' },
  { value: 'no-conocido', label: 'No conocidos' },
  { value: 'falso-positivo', label: 'Falsos positivos' },
];

const severityOptions = [
  { value: '', label: 'Todas' },
  { value: 'critica', label: 'Críticas' },
  { value: 'alta', label: 'Altas' },
  { value: 'media', label: 'Medias' },
  { value: 'baja', label: 'Bajas' },
];

const meetingOptions = [
  { value: '', label: 'Todas' },
  { value: 'inactive', label: 'Sin reunión' },
  { value: 'active', label: 'Con reunión activa' },
  { value: 'resolved', label: 'Incidentes contenidos' },
];

const statusTone = {
  conocido: 'success',
  'no-conocido': 'warn',
  'falso-positivo': 'info',
  cerrado: 'muted',
  contenido: 'success',
};

const severityTone = {
  critica: 'danger',
  critical: 'danger',
  CRITICAL: 'danger',
  alta: 'warn',
  high: 'warn',
  HIGH: 'warn',
  media: 'info',
  medium: 'info',
  MEDIUM: 'info',
  baja: 'success',
  low: 'success',
  LOW: 'success',
};

// Normalize severity to Spanish for filtering
const normalizeSeverity = (severity) => {
  if (!severity) return '';
  const lower = String(severity).toLowerCase();
  if (lower === 'critical') return 'critica';
  if (lower === 'high') return 'alta';
  if (lower === 'medium') return 'media';
  if (lower === 'low') return 'baja';
  return lower;
};

function Dashboard() {
  const { incidents, loading, traffic, settings, auth } = useAppState();
  const { loadIncidents, setTrafficIpFilter, selectTrafficPacket, openWarRoom, loadResolvedIncidents, addToast } = useAppActions();
  const [filters, setFilters] = useState({
    query: '',
    status: '',
    severity: '',
    meeting: '',
    from: '',
    to: '',
  });
  const [alerts, setAlerts] = useState([]);
  const [alertsPage, setAlertsPage] = useState(1);
  const [meetingActions, setMeetingActions] = useState({}); // Track loading states for meetings
  const [loadingOverlay, setLoadingOverlay] = useState({
    isVisible: false,
    title: '',
    description: '',
    icon: '🔄'
  });
  const itemsPerPage = 5;
  const isAdmin = auth?.user?.role?.includes('ADMIN') || auth?.user?.roles?.includes('ADMIN') || auth?.user?.role === 'ROLE_ADMIN';
  


  // Load incidents on first mount (only if authenticated)
  useEffect(() => {
    if (auth?.token) {
      loadIncidents({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth?.token]);

  // Clear meeting actions when incidents change (to clean up stale loading states)
  useEffect(() => {
    setMeetingActions({});
  }, [incidents]);

  // Helper: convert Spanish severity to English for backend
  const convertSeverityToEnglish = useCallback((severity) => {
    if (!severity) return '';
    
    const severityMap = {
      'critica': 'critical',
      'alta': 'high',
      'media': 'medium',
      'baja': 'low'
    };
    
    return severityMap[severity] || severity;
  }, []);

  // Helper: load incidents based on filter type
  const loadFilteredIncidents = useCallback(() => {
    if (filters.meeting === 'resolved') {
      loadResolvedIncidents();
      return;
    }
    
    const backendFilters = {
      ...filters,
      severity: convertSeverityToEnglish(filters.severity),
    };
    loadIncidents(backendFilters);
  }, [filters, loadIncidents, loadResolvedIncidents, convertSeverityToEnglish]);

  // Apply filters when they change (only if authenticated)
  useEffect(() => {
    if (!auth?.token) return;
    const timeoutId = globalThis.setTimeout(loadFilteredIncidents, 250);
    return () => globalThis.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, auth?.token]);

  // Convertir incidentes críticos en alertas
  // Solo mostrar alertas activas (no resueltsa, no falsos positivos)
  useEffect(() => {
    const criticalIncidents = incidents
      .filter(i => {
        // Accept both Spanish and English severity levels
        const isCriticalSeverity = 
          i.severity === 'critica' || 
          i.severity === 'critical' || 
          i.severity === 'CRITICAL';
        const isActive = i.status !== 'cerrado' && i.status !== 'falso-positivo' && i.status !== 'contenido' && i.status !== 'closed';
        return isCriticalSeverity && isActive;
      })
      .map(incident => ({
        id: incident.id,
        timestamp: incident.createdAt,
        severity: incident.severity,
        incidentId: incident.id,
        packetId: incident.source || 'N/A',
        score: incident.detection?.model_score,
        model_version: incident.detection?.model_version,
      }));
    
    setAlerts(criticalIncidents);
    setAlertsPage(1); // Reset to first page when alerts change
  }, [incidents]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!auth?.token || !settings.apiBaseUrl) return;
    
    const handleWebSocketEvent = (eventType, payload) => {
      // Handle warroom resolved events
      if (eventType === 'warroom.resolved') {
        // Reload incidents to reflect the resolved status change
        if (filters.meeting === 'resolved') {
          loadResolvedIncidents();
        } else {
          loadIncidents({});
        }
      }
      
      // Handle warroom created events (new meeting started)
      if (eventType === 'warroom.created') {
        // Reload incidents to reflect the new meeting status
        loadIncidents({});
      }
      
      // Handle new alerts
      if (eventType === 'alert') {
        // The alert is already handled by state.js, but we can reload to be sure
        loadIncidents({});
      }
    };

    const socket = connectAlertsWebSocket(settings.apiBaseUrl, handleWebSocketEvent, {
      onOpen: () => {},
      onClose: () => {},
      onError: () => {},
    });

    return () => {
      socket.close();
    };
  }, [auth?.token, settings.apiBaseUrl, filters.meeting, loadIncidents, loadResolvedIncidents]);

  const metrics = useMemo(() => {
    // Calcular métricas directamente desde los incidents
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const todayIncidents = incidents.filter(inc => {
      if (!inc.createdAt) return false;
      const incDate = new Date(inc.createdAt);
      return incDate >= todayStart;
    });
    
    const criticalIncidents = incidents.filter(inc => {
      const isCriticalSeverity = 
        inc.severity === 'critica' || 
        inc.severity === 'critical' || 
        inc.severity === 'CRITICAL';
      const isActive = inc.status !== 'cerrado' && inc.status !== 'closed';
      return isCriticalSeverity && isActive;
    });
    
    const highIncidents = incidents.filter(inc => {
      const isHighSeverity = 
        inc.severity === 'alta' || 
        inc.severity === 'high' || 
        inc.severity === 'HIGH';
      const isActive = inc.status !== 'cerrado' && inc.status !== 'closed';
      return isHighSeverity && isActive;
    });
    
    return [
      { label: 'Incidentes hoy', value: todayIncidents.length },
      { label: 'Críticos activos', value: criticalIncidents.length, tone: 'danger' },
      { label: 'Alertas altas', value: highIncidents.length, tone: 'warn' },
      {
        label: 'Total alertas',
        value: incidents.length,
        tone: 'info',
      },
    ];
  }, [incidents]);

  const columns = useMemo(
    () => [
      { key: 'id', label: 'ID' },
      { key: 'type', label: 'Tipo' },
      { key: 'source', label: 'Origen' },
      {
        key: 'status',
        label: 'Estado',
        render: (value) => <Tag tone={statusTone[value] || 'neutral'}>{value}</Tag>,
      },
      {
        key: 'severity',
        label: 'Severidad',
        render: (value) => <Pill tone={severityTone[value] || 'neutral'}>{value}</Pill>,
      },
      {
        key: 'detection',
        label: 'Detección',
        render: (_, row) => {
          const modelLabel = row.detection?.model_label;
          const modelScore = row.detection?.model_score;
          const modelVersion = row.detection?.model_version;
          if (!modelLabel) return '—';
          return `${modelLabel}${modelScore !== undefined ? ` (${modelScore})` : ''}${
            modelVersion ? ` · v${modelVersion}` : ''
          }`;
        },
      },
      {
        key: 'createdAt',
        label: 'Detectado',
        render: (value) => (
          <time dateTime={value}>{new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
        ),
      },
      {
        key: 'actions',
        label: 'Acciones',
        render: (_, row) => {
          if (row.status === 'contenido') {
            return <span>—</span>;
          }
          if (row.warRoomId) {
            const isJoining = meetingActions[`join-${row.warRoomId}`];
            return (
              <button
                type="button"
                className="btn-link"
                disabled={isJoining}
                onClick={(e) => {
                  e.stopPropagation();
                  handleJoinWarRoom(row.warRoomId);
                }}
                title="Unirse a reunión"
                style={{
                  opacity: isJoining ? 0.6 : 1,
                  cursor: isJoining ? 'not-allowed' : 'pointer'
                }}
              >
                📋 Unirse a reunión
              </button>
            );
          }
          if (isAdmin && row.status === 'no-conocido') {
            const actionState = meetingActions[row.id];
            return (
              <button
                type="button"
                className="btn-link"
                disabled={actionState}
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenWarRoom(row.id);
                }}
                title="Crear reunión"
                style={{
                  opacity: actionState ? 0.6 : 1,
                  cursor: actionState ? 'not-allowed' : 'pointer'
                }}
              >
                🚨 Crear reunión
              </button>
            );
          }
          return <span>—</span>;
        },
      },
    ],
    [auth, meetingActions],
  );

  const displayIncidents = useMemo(() => {
    let filtered = [...incidents];
    
    // Filter by IP (from traffic monitor)
    if (traffic.selectedIp) {
      const target = traffic.selectedIp.toLowerCase();
      filtered = filtered.filter((incident) => {
        const matchesSource = (incident.source || '').toLowerCase().includes(target);
        const matchesNotes = (incident.notes || '').toLowerCase().includes(target);
        const matchesAssets = Array.isArray(incident.relatedAssets)
          ? incident.relatedAssets.some((asset) => asset.toLowerCase().includes(target))
          : false;
        return matchesSource || matchesNotes || matchesAssets;
      });
    }

    // Exclude resolved incidents from all sections except "resolved"
    if (filters.meeting !== 'resolved') {
      filtered = filtered.filter((incident) => incident.status !== 'contenido');
    }

    // Filter by status
    if (filters.status) {
      filtered = filtered.filter((incident) => incident.status === filters.status);
    }

    // Filter by severity (normalize to Spanish for comparison)
    if (filters.severity) {
      filtered = filtered.filter((incident) => {
        const normalizedIncidentSeverity = normalizeSeverity(incident.severity);
        return normalizedIncidentSeverity === filters.severity;
      });
    }

    // Filter by meeting status
    if (filters.meeting) {
      if (filters.meeting === 'active') {
        // Con reunión activa: tiene warRoomId
        filtered = filtered.filter((incident) => incident.warRoomId);
      } else if (filters.meeting === 'inactive') {
        // Sin reunión: no tiene warRoomId
        filtered = filtered.filter((incident) => !incident.warRoomId);
      } else if (filters.meeting === 'resolved') {
        // Incidentes contenidos: status es "contenido"
        filtered = filtered.filter((incident) => incident.status === 'contenido');
      }
    }

    // Filter by search query
    if (filters.query) {
      const query = filters.query.toLowerCase();
      filtered = filtered.filter((incident) => {
        const id = (incident.id || '').toLowerCase();
        const source = (incident.source || '').toLowerCase();
        const notes = (incident.notes || '').toLowerCase();
        return id.includes(query) || source.includes(query) || notes.includes(query);
      });
    }

    // Filter by date range
    if (filters.from || filters.to) {
      filtered = filtered.filter((incident) => {
        if (!incident.createdAt) return false;
        const incidentDate = new Date(incident.createdAt);
        if (filters.from) {
          const fromDate = new Date(filters.from);
          if (incidentDate < fromDate) return false;
        }
        if (filters.to) {
          const toDate = new Date(filters.to);
          toDate.setHours(23, 59, 59, 999); // Include entire day
          if (incidentDate > toDate) return false;
        }
        return true;
      });
    }

    return filtered;
  }, [incidents, traffic.selectedIp, filters]);

  const handleRangeChange = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }));
  };

  const handleClearTrafficFilter = () => {
    setTrafficIpFilter(null);
    selectTrafficPacket(null, null);
  };

  const handleOpenWarRoom = async (incidentId) => {
    // Prevent multiple clicks on the same incident
    if (meetingActions[incidentId]) return;
    

    setMeetingActions(prev => ({ ...prev, [incidentId]: 'creating' }));
    
    // Show creating overlay
    setLoadingOverlay({
      isVisible: true,
      title: '� Creando reunión de emergencia',
      description: `Preparando mesa de trabajo para incidente crítico ${incidentId}`,
      icon: '🔄'
    });
    
    try {
      // Add a delay to show the overlay longer
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const warRoom = await openWarRoom(incidentId);
      const warRoomId = warRoom?.id || warRoom?.warRoomId;
      if (warRoomId) {
        setMeetingActions(prev => ({ ...prev, [incidentId]: 'joining' }));
        
        // Show entering overlay
        setLoadingOverlay({
          isVisible: true,
          title: '🚪 Entrando a la reunión',
          description: 'Redirigiendo a la mesa de trabajo de emergencia...',
          icon: '✨'
        });
        
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        // Hide overlay before navigation
        setLoadingOverlay(prev => ({ ...prev, isVisible: false }));
        
        navigate(getRouteHash('war-room', { id: warRoomId }));
      }
    } catch (error) {
      console.warn('[dashboard] Error creando reunión de emergencia:', error?.message);
      // Remove loading state without unused destructuring variable
      setMeetingActions(prev => {
        const rest = { ...prev };
        delete rest[incidentId];
        return rest;
      });

      // Hide overlay and show error
      setLoadingOverlay(prev => ({ ...prev, isVisible: false }));

      addToast({
        title: '❌ Error al crear reunión',
        description: 'No se pudo crear la mesa de trabajo. Intenta nuevamente.',
        tone: 'danger'
      });
    }
  };

  const handleJoinWarRoom = async (warRoomId) => {

    // Prevent multiple clicks on the same meeting
    if (meetingActions[`join-${warRoomId}`]) {

      return;
    }
    

    setMeetingActions(prev => ({ ...prev, [`join-${warRoomId}`]: 'joining' }));
    
    // Show joining overlay
    setLoadingOverlay({
      isVisible: true,
      title: '🔄 Uniéndose a reunión activa',
      description: `Accediendo a la mesa de trabajo de emergencia...`,
      icon: '🚪'
    });
    
    try {
      // Add a delay to show the overlay longer
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Show entering overlay
      setLoadingOverlay({
        isVisible: true,
        title: '✅ ¡Reunión encontrada!',
        description: 'Entrando a la mesa de trabajo...',
        icon: '🎯'
      });
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Hide overlay before navigation
      setLoadingOverlay(prev => ({ ...prev, isVisible: false }));
      
      navigate(getRouteHash('war-room', { id: warRoomId }));
    } catch (error) {
      console.warn('[dashboard] Error uniéndose a reunión:', error?.message);
      // Remove loading state without unused destructuring variable
      setMeetingActions(prev => {
        const rest = { ...prev };
        delete rest[`join-${warRoomId}`];
        return rest;
      });

      // Hide overlay and show error
      setLoadingOverlay(prev => ({ ...prev, isVisible: false }));

      addToast({
        title: '❌ Error al unirse',
        description: 'No se pudo acceder a la reunión. Intenta nuevamente.',
        tone: 'danger'
      });
    }
  };

  return (
    <div className="page dashboard-page">
      <section className="page-header">
        <div>
          <h2>Monitoreo de incidentes</h2>
          <p>Busca y filtra los eventos detectados por el IDS universitario.</p>
        </div>
        <SearchBox
          inputId="dashboard-search"
          defaultValue={filters.query}
          onSearch={(query) => setFilters((current) => ({ ...current, query }))}
        />
      </section>

      <section className="filters-bar" aria-label="Filtros de incidentes">
        <fieldset className="filter-group">
          <legend className="filter-label">Estado</legend>
          <div className="chip-group" aria-label="Filtrar por estado">
            {statusOptions.map((option) => (
              <button
                key={option.value || 'all-status'}
                type="button"
                className={`chip ${filters.status === option.value ? 'is-active' : ''}`}
                onClick={() => setFilters((current) => ({ ...current, status: option.value }))}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="filter-group">
          <legend className="filter-label">Severidad</legend>
          <div className="chip-group" aria-label="Filtrar por severidad">
            {severityOptions.map((option) => (
              <button
                key={option.value || 'all-severity'}
                type="button"
                className={`chip ${filters.severity === option.value ? 'is-active' : ''}`}
                onClick={() => setFilters((current) => ({ ...current, severity: option.value }))}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="filter-group">
          <span className="filter-label">Rango</span>
          <div className="range-inputs">
            <label>
              Desde
              <input
                type="date"
                value={filters.from}
                onChange={(event) => handleRangeChange('from', event.target.value)}
              />
            </label>
            <label>
              Hasta
              <input
                type="date"
                value={filters.to}
                onChange={(event) => handleRangeChange('to', event.target.value)}
              />
            </label>
          </div>
        </div>
      </section>

      {/* Solo ADMIN ve métricas, monitor de tráfico y alertas críticas */}
      {isAdmin && (
        <>
          <section className="metrics-grid" aria-label="Métricas clave">
            {metrics.map((metric) => (
              <StatCard key={metric.label} label={metric.label} value={metric.value} helper={metric.helper} tone={metric.tone} />
            ))}
          </section>

          <MonitorTraffic />

          <section className="alerts-section" aria-live="polite">
        <header>
          <h3>Alertas de incidentes críticos</h3>
          <span className="alerts-count">
            {alerts.length} alertas activas
          </span>
        </header>
        {alerts.length === 0 ? (
          <p className="alerts-empty">
            No hay incidentes críticos en este momento.
          </p>
        ) : (
          <>
            <ul className="alerts-list">
              {alerts
                .slice((alertsPage - 1) * itemsPerPage, alertsPage * itemsPerPage)
                .map((alert, index) => {
                  const uniqueKey = `${alert.id}-${alert.timestamp}-${index}`;
                  return (
                    <li key={uniqueKey} className={`alert-item severity-${alert.severity || 'medium'}`}>
                      <div className="alert-header">
                        <Pill tone={severityTone[alert.severity] || 'neutral'}>{alert.severity || 'media'}</Pill>
                        <time dateTime={alert.timestamp}>
                          {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </time>
                      </div>
                      <div className="alert-body">
                        <strong>Paquete: {alert.packetId}</strong>
                        {alert.incidentId && <span> → Incidente: {alert.incidentId}</span>}
                        {alert.score !== undefined && <span> · Score: {alert.score}</span>}
                        {alert.model_version && <span> · Modelo v{alert.model_version}</span>}
                      </div>
                    </li>
                  );
                })}
            </ul>
            <div className="pagination-controls" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center', marginTop: '1rem' }}>
              <button
                type="button"
                className="btn subtle"
                disabled={alertsPage === 1}
                onClick={() => {
                  if (alertsPage > 1) setAlertsPage(alertsPage - 1);
                }}
              >
                ← Anterior
              </button>
              <span style={{ fontWeight: '500', minWidth: '120px', textAlign: 'center' }}>
                Página {alertsPage} de {Math.ceil(alerts.length / itemsPerPage)}
              </span>
              <button
                type="button"
                className="btn subtle"
                disabled={alertsPage >= Math.ceil(alerts.length / itemsPerPage)}
                onClick={() => {
                  const maxPage = Math.ceil(alerts.length / itemsPerPage);
                  if (alertsPage < maxPage) setAlertsPage(alertsPage + 1);
                }}
              >
                Siguiente →
              </button>
            </div>
          </>
        )}
      </section>
        </>
      )}

      <section className="table-section">
        <header>
          <h3>Incidentes recientes</h3>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <fieldset className="chip-group" aria-label="Filtrar por estado de reunión">
              <legend className="visually-hidden">Estado de reunión</legend>
              {meetingOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`chip ${filters.meeting === option.value ? 'is-active' : ''}`}
                  onClick={() => setFilters((current) => ({ ...current, meeting: option.value }))}
                >
                  {option.label}
                </button>
              ))}
            </fieldset>
            <span>{displayIncidents.length} registros</span>
          </div>
        </header>
        {traffic.selectedIp ? (
          <div className="traffic-filter-banner">
            <span>
              Filtrando por IP <strong>{traffic.selectedIp}</strong>
            </span>
            <button type="button" className="btn subtle" onClick={handleClearTrafficFilter}>
              Limpiar filtro
            </button>
          </div>
        ) : null}
        <Table
          columns={columns}
          data={displayIncidents}
          loading={loading.incidents}
          pageSize={itemsPerPage}
          onRowClick={(row) => navigate(getRouteHash('incident', { id: row.id }))}
          emptyMessage="No se encontraron incidentes con los filtros actuales."
        />
      </section>
      
      {/* Loading Overlay for meeting actions */}
      <LoadingOverlay 
        isVisible={loadingOverlay.isVisible}
        title={loadingOverlay.title}
        description={loadingOverlay.description}
        icon={loadingOverlay.icon}
      />
    </div>
  );
}

export default Dashboard;
