import { useEffect, useMemo, useState } from 'react';
import { useAppActions, useAppState } from '../app/state.js';
import { getRouteHash, navigate } from '../app/router.js';
import Tag from '../components/Tag.jsx';
import Pill from '../components/Pill.jsx';
import Stepper from '../components/Stepper.jsx';
import Loader from '../components/Loader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Modal from '../components/Modal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';

const statusTone = {
  conocido: 'success',
  'no-conocido': 'warn',
  'falso-positivo': 'info',
  cerrado: 'muted',
  contenido: 'success',
};

const severityTone = {
  critica: 'danger',
  alta: 'warn',
  media: 'info',
  baja: 'success',
};

// Helper function to format duration from seconds to HH:MM:SS
const formatDuration = (seconds) => {
  if (!seconds || seconds === 0) return '00:00:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Helper: Render action buttons based on incident status
const renderActionButtons = (incident, setSolutionOpen, setConfirm, addToast) => {
  if (incident.status === 'contenido') {
    return null;
  }

  return (
    <>
      {incident.status === 'conocido' && (
        <button type="button" className="btn primary" onClick={() => setSolutionOpen(true)}>
          Ver solución aplicada
        </button>
      )}
      {incident.status === 'falso-positivo' && (
        <>
          <button type="button" className="btn success" onClick={() => setConfirm('close_fp')}>
            Cerrar como FP
          </button>
          <button type="button" className="btn warn" onClick={() => setConfirm('escalate')}>
            Escalar a no-conocido
          </button>
        </>
      )}
      {incident.status === 'conocido' && (
        <button type="button" className="btn success" onClick={() => addToast({ title: 'Playbook aplicado', description: 'Se ejecutó el playbook sugerido.', tone: 'info' })}>
          Registrar nota
        </button>
      )}
    </>
  );
};

function IncidentDetail({ params }) {
  const { id } = params;
  const { selectedIncident, loading, warRooms } = useAppState();
  const { loadIncidentById, clearSelectedIncident, updateIncidentStatus, addToast } = useAppActions();
  const [solutionOpen, setSolutionOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    if (id) {
      loadIncidentById(id);
    }
    
    // Cleanup when component unmounts
    return () => {
      if (id) {
        clearSelectedIncident();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const incident = useMemo(() => {
    if (selectedIncident && selectedIncident.id === id) {
      return selectedIncident;
    }
    return null;
  }, [id, selectedIncident]);

  const warRoomState = useMemo(() => {
    if (!incident?.warRoomId) return null;
    return warRooms?.[incident.warRoomId] || null;
  }, [warRooms, incident?.warRoomId]);

  const computeEndTime = useMemo(() => {
    if (incident?.warRoomStartTime && incident?.warRoomDuration) {
      const start = new Date(incident.warRoomStartTime).getTime();
      const endMs = start + Number(incident.warRoomDuration || 0) * 1000;
      return new Date(endMs);
    }
    return null;
  }, [incident?.warRoomStartTime, incident?.warRoomDuration]);


  const handleConfirmAction = async () => {
    if (!confirm) return;
    try {
      await updateIncidentStatus(id, confirm);
    } finally {
      setConfirm(null);
    }
  };

  if (loading.incident && !incident) {
    return (
      <div className="page">
        <Loader label="Cargando incidente" />
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="page">
        <EmptyState
          title="Incidente no disponible"
          description="No encontramos información para este identificador."
          action={
            <button type="button" className="btn primary" onClick={() => navigate(getRouteHash('dashboard'))}>
              Volver al dashboard
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="page incident-page">
      <header className="page-header">
        <div>
          <h2>{incident.id}</h2>
          <p>{incident.type} desde {incident.source}</p>
          <div className="labels-row">
            <Tag tone={statusTone[incident.status] || 'neutral'}>{incident.status}</Tag>
            <Pill tone={severityTone[incident.severity] || 'neutral'}>{incident.severity}</Pill>
          </div>
        </div>
        <div className="actions-row">
          <button type="button" className="btn subtle" onClick={() => navigate(getRouteHash('dashboard'))}>
            Volver
          </button>
          {renderActionButtons(incident, setSolutionOpen, setConfirm, addToast)}
        </div>
      </header>

      <section className="panel">
        <header>
          <h3>Resumen del caso</h3>
        </header>
        <dl className="detail-grid">
          <div>
            <dt>Detectado</dt>
            <dd>
              <time dateTime={incident.createdAt}>{new Date(incident.createdAt).toLocaleString()}</time>
            </dd>
          </div>
          <div>
            <dt>Activos relacionados</dt>
            <dd>{incident.relatedAssets?.join(', ') || 'Sin referencias'}</dd>
          </div>
          <div>
            <dt>Notas</dt>
            <dd>{incident.notes || 'Agrega notas para el equipo de respuesta.'}</dd>
          </div>
        </dl>
      </section>

      {incident.warRoomId && (
        <section>
          <div className={`meeting-card minimal ${incident.status === 'contenido' ? 'resolved' : 'active'}`} role="group" aria-label="Información de mesa de trabajo">
            <div className="meeting-header">
              <h4 className="meeting-title">Información de Mesa de Trabajo</h4>
              <span className={`meeting-badge ${incident.status === 'contenido' ? 'resolved' : 'active'}`}>{incident.status === 'contenido' ? 'Resuelta' : 'Activa'}</span>
            </div>
            <div className="meeting-info-grid">
              <div className="meeting-info-item">
                <span className="meeting-info-label">Código</span>
                <span className="meeting-info-value">{incident.warRoomCode || '—'}</span>
              </div>
              <div className="meeting-info-item">
                <span className="meeting-info-label">Participantes{incident.status !== 'contenido' ? ' actuales' : ''}</span>
                <span className="meeting-info-value">
                  {incident.status === 'contenido'
                    ? (warRoomState?.maxParticipantCount ?? (Array.isArray(warRoomState?.participantEmails) ? warRoomState.participantEmails.length : '—'))
                    : (warRoomState?.currentParticipantCount ?? (Array.isArray(warRoomState?.participantEmails) ? warRoomState.participantEmails.length : '—'))}
                </span>
              </div>
              <div className="meeting-info-item">
                <span className="meeting-info-label">Inicio</span>
                <span className="meeting-info-value">
                  {incident.warRoomStartTime ? (
                    <time dateTime={incident.warRoomStartTime}>{new Date(incident.warRoomStartTime).toLocaleString()}</time>
                  ) : '—'}
                </span>
              </div>
              {incident.status === 'contenido' && computeEndTime && (
                <div className="meeting-info-item">
                  <span className="meeting-info-label">Fin</span>
                  <span className="meeting-info-value">
                    <time dateTime={computeEndTime.toISOString()}>{computeEndTime.toLocaleString()}</time>
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="panel">
        <header>
          <h3>Línea de tiempo</h3>
        </header>
        <Stepper steps={incident.timeline || []} />
      </section>

      <section className="panel">
        <header>
          <h3>Análisis IA</h3>
        </header>
        <div className="ai-analysis">
          <div className="ai-analysis-header">
            <div className="ai-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
              </svg>
            </div>
            <h4 className="ai-analysis-title">Análisis generado por IA</h4>
          </div>
          <div className="ai-analysis-content">
            {incident.aiSummary || 'El backend proporcionará un resumen con hallazgos de la IA.'}
          </div>
        </div>
      </section>

      {incident.status === 'contenido' ? (
        <section>
          <div className="resolved-banner" role="status" aria-live="polite">
            <div className="resolved-banner-header">
              <div className="resolved-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17 4.83 12l-1.42 1.41L9 19l12-12-1.41-1.41z" />
                </svg>
              </div>
              <div className="resolved-content">
                <h4>Incidente Completamente Resuelto</h4>
                <p>
                  La mesa de trabajo ha finalizado exitosamente y el incidente ha sido marcado como contenido. No se
                  requieren acciones adicionales.
                </p>
              </div>
            </div>
            {incident.warRoomDuration && (
              <div className="resolved-banner-time">
                <div className="resolved-banner-time-value">{formatDuration(incident.warRoomDuration)}</div>
                <div className="resolved-banner-time-label">TIEMPO DE RESOLUCIÓN</div>
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="panel">
          <header>
            <h3>Acciones disponibles</h3>
          </header>
          <ul className="actions-list">
            {incident.status === 'conocido' && <li>Revisar los logs asociados y validar que el bloqueo siga vigente.</li>}
            {incident.status === 'no-conocido' && (
              <li>Documentar hallazgos y asignar responsables dentro de la mesa de trabajo.</li>
            )}
            {incident.status === 'falso-positivo' && (
              <li>Confirmar con el equipo involucrado si el evento corresponde a una prueba controlada.</li>
            )}
            <li>Registrar notas relevantes para auditoría.</li>
          </ul>
        </section>
      )}

      <Modal
        open={solutionOpen}
        title="Solución aplicada"
        description="Resumen del playbook ejecutado"
        onClose={() => setSolutionOpen(false)}
      >
        <p>
          Se activaron reglas de protección en el WAF institucional y se notificó al sistema de base de datos
          para bloquear parámetros sospechosos. Verifica que la aplicación siga disponible para usuarios finales.
        </p>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Confirmar acción"
        description="Esta acción actualizará el estado del incidente."
        tone={confirm === 'close_fp' ? 'success' : 'warn'}
        confirmLabel="Confirmar"
        cancelLabel="Cancelar"
        onCancel={() => setConfirm(null)}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
}

export default IncidentDetail;
