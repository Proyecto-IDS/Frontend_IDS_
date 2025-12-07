import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useAppActions, useAppState } from '../app/state.js';
import { getRouteHash, navigate } from '../app/router.js';
import Tag from '../components/Tag.jsx';
import Pill from '../components/Pill.jsx';
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

// Helper function to get severity tag class
const getSeverityTagClass = (severity) => {
  if (severity === 'critica') return 'danger';
  if (severity === 'alta') return 'warn';
  return 'info';
};

// Helper function to compute participant count
const getParticipantCount = (warRoomState, isResolved) => {
  if (isResolved) {
    if (warRoomState?.maxParticipantCount !== undefined) {
      return warRoomState.maxParticipantCount;
    }
    if (Array.isArray(warRoomState?.participantEmails)) {
      return warRoomState.participantEmails.length;
    }
    return '—';
  }
  
  if (warRoomState?.currentParticipantCount !== undefined) {
    return warRoomState.currentParticipantCount;
  }
  if (Array.isArray(warRoomState?.participantEmails)) {
    return warRoomState.participantEmails.length;
  }
  return '—';
};

// Helper: Render action buttons based on incident status
// Función para generar y descargar el PDF del informe
const handleDownloadPDF = (incident, mlInfo, warRoomState, computeEndTime) => {
  // Crear el contenido HTML para el PDF
  const content = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
        h1 { color: #1e40af; border-bottom: 3px solid #1e40af; padding-bottom: 10px; }
        h2 { color: #2563eb; margin-top: 30px; border-bottom: 2px solid #ddd; padding-bottom: 8px; }
        h3 { color: #3b82f6; margin-top: 20px; }
        .header-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
        .info-group { background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; }
        .info-label { font-weight: bold; color: #64748b; font-size: 12px; text-transform: uppercase; }
        .info-value { font-size: 16px; margin-top: 5px; }
        .metrics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
        .metric-card { background: #f1f5f9; padding: 15px; border-radius: 8px; }
        .metric-label { font-size: 12px; color: #64748b; font-weight: 600; }
        .metric-value { font-size: 20px; font-weight: bold; color: #1e293b; margin-top: 5px; }
        .tag { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; margin-right: 8px; }
        .tag-success { background: #dcfce7; color: #166534; }
        .tag-warn { background: #fef3c7; color: #854d0e; }
        .tag-danger { background: #fee2e2; color: #991b1b; }
        .tag-info { background: #dbeafe; color: #1e40af; }
        .checklist { list-style: none; padding: 0; }
        .checklist li { padding: 8px 0; padding-left: 30px; position: relative; }
        .checklist li:before { content: "✓"; position: absolute; left: 0; color: #10b981; font-weight: bold; font-size: 18px; }
        .analysis-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin: 15px 0; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #ddd; text-align: center; color: #64748b; font-size: 12px; }
      </style>
    </head>
    <body>
      <h1>📋 Informe de Incidente: ${incident.id}</h1>
      
      <div class="header-info">
        <div class="info-group">
          <div class="info-label">Tipo de Incidente</div>
          <div class="info-value">${incident.type || '—'}</div>
        </div>
        <div class="info-group">
          <div class="info-label">Origen</div>
          <div class="info-value">${incident.source || '—'}</div>
        </div>
        <div class="info-group">
          <div class="info-label">Estado</div>
          <div class="info-value">
            <span class="tag tag-${incident.status === 'contenido' ? 'success' : 'warn'}">${incident.status}</span>
          </div>
        </div>
        <div class="info-group">
          <div class="info-label">Severidad</div>
          <div class="info-value">
            <span class="tag tag-${getSeverityTagClass(incident.severity)}">${incident.severity}</span>
          </div>
        </div>
      </div>

      ${incident.warRoomCode ? `
        <h2>👥 Información de la War Room</h2>
        <div class="info-group">
          <div class="info-label">Código</div>
          <div class="info-value">${incident.warRoomCode}</div>
        </div>
        <div class="info-group" style="margin-top: 10px;">
          <div class="info-label">Inicio</div>
          <div class="info-value">${incident.warRoomStartTime ? new Date(incident.warRoomStartTime).toLocaleString() : '—'}</div>
        </div>
        ${incident.status === 'contenido' && computeEndTime ? `
          <div class="info-group" style="margin-top: 10px;">
            <div class="info-label">Fin</div>
            <div class="info-value">${computeEndTime.toLocaleString()}</div>
          </div>
        ` : ''}
      ` : ''}

      <h2>🤖 Análisis IA</h2>
      <div class="analysis-box">
        ${incident.aiSummary || 'El backend proporcionará un resumen con hallazgos de la IA.'}
      </div>

      <h3>Detalles ML</h3>
      <p><strong>Probabilidad:</strong> ${typeof incident.attackProbability === 'number' ? `${(incident.attackProbability * 100).toFixed(2)}%` : '—'}</p>
      <p><strong>Categoría:</strong> ${mlInfo.nombre} (${incident.category || '—'})</p>

      ${incident.standardProtocol ? `
        <h3>Protocolo estándar sugerido</h3>
        <pre style="background: #f1f5f9; padding: 15px; border-radius: 8px; white-space: pre-wrap; font-size: 12px;">${incident.standardProtocol}</pre>
      ` : ''}

      <h2>🛡️ Protocolo de Respuesta</h2>
      <h3>${mlInfo.nombre}</h3>
      <p>${mlInfo.descripcion}</p>
      <h4>Checklist de acciones sugeridas:</h4>
      <ul class="checklist">
        ${mlInfo.checklist.map(item => `<li>${item}</li>`).join('')}
      </ul>

      <div class="footer">
        <p>Informe generado el ${new Date().toLocaleString()} - Sistema de Detección de Intrusos</p>
      </div>
    </body>
    </html>
  `;

  // Crear un iframe oculto para imprimir
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow.document;
  iframeDoc.open();
  iframeDoc.write(content);
  iframeDoc.close();

  // Esperar a que se cargue el contenido y luego imprimir/guardar como PDF
  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    
    // Remover el iframe después de un tiempo
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 500);
};

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

  // Mapping de descripciones y checklist por categoría de ataque (ML)
  const categoryDetails = {
    dos: {
      nombre: 'Denegación de Servicio (DoS/DDoS)',
      descripcion: 'Ataque orientado a agotar recursos del servicio (CPU, ancho de banda, sesiones) para impedir acceso legítimo.',
      checklist: [
        'Activar mitigaciones DoS/DDoS en firewall/WAF / CDN',
        'Aplicar rate limiting y SYN cookies si aplica',
        'Bloquear IP/rango origen anómalo',
        'Revisar capacidad de balanceadores y escalamiento automático',
        'Notificar a ISP / proveedor de infraestructura',
      ],
    },
    probe: {
      nombre: 'Reconocimiento / Sondeo',
      descripcion: 'Actividad previa a explotación: escaneo de puertos, fingerprinting de servicios o enumeración.',
      checklist: [
        'Correlacionar con logs de firewall y IDS',
        'Verificar si existen intentos de autenticación fallidos subsecuentes',
        'Aumentar nivel de logging temporalmente',
        'Evaluar bloqueo temporal de origen si persistente',
      ],
    },
    r2l: {
      nombre: 'Remote to Local (R2L)',
      descripcion: 'Intentos de acceder o extraer recursos internos desde un origen externo no autorizado.',
      checklist: [
        'Revisar credenciales usadas / intentos fallidos',
        'Verificar configuración de MFA en cuentas sensibles',
        'Examinar accesos recientes a datos críticos',
        'Aislar IP origen si hay patrones de exfiltración',
      ],
    },
    u2r: {
      nombre: 'User to Root (U2R)',
      descripcion: 'Escalada de privilegios desde una cuenta normal hacia privilegios elevados.',
      checklist: [
        'Revisar comandos ejecutados y sudo logs',
        'Comparar hashes de binarios críticos (integridad)',
        'Rotar credenciales comprometidas',
        'Forzar revisión de accesos privilegiados recientes',
      ],
    },
    normal: {
      nombre: 'Tráfico Normal',
      descripcion: 'No se detectó patrón significativo de ataque en este flujo analizado.',
      checklist: [
        'Registrar para trazabilidad',
        'Mantener monitoreo continuo',
      ],
    },
  };

  const mlCategory = incident?.category || 'normal';
  const mlInfo = categoryDetails[mlCategory] || categoryDetails.normal;

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
          <button type="button" className="btn primary" onClick={() => handleDownloadPDF(incident, mlInfo, warRoomState, computeEndTime)}>
            📄 Descargar PDF
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
          {incident.attackProbability !== undefined && (
            <div>
              <dt>Probabilidad de ataque</dt>
              <dd>{(incident.attackProbability * 100).toFixed(2)}%</dd>
            </div>
          )}
          {incident.category && (
            <div>
              <dt>Categoría ML</dt>
              <dd>{mlInfo.nombre} ({incident.category})</dd>
            </div>
          )}
          {incident.detection?.prediction && (
            <div>
              <dt>Predicción</dt>
              <dd>{incident.detection.prediction}</dd>
            </div>
          )}
        </dl>
      </section>

      {incident.warRoomId && (
        <section>
          <fieldset className={`meeting-card minimal ${incident.status === 'contenido' ? 'resolved' : 'active'}`} aria-label="Información de mesa de trabajo">
            <legend className="meeting-title">Información de Mesa de Trabajo</legend>
            <div className="meeting-header">
              <span className={`meeting-badge ${incident.status === 'contenido' ? 'resolved' : 'active'}`}>{incident.status === 'contenido' ? 'Resuelta' : 'Activa'}</span>
            </div>
            <div className="meeting-info-grid">
              <div className="meeting-info-item">
                <span className="meeting-info-label">Código</span>
                <span className="meeting-info-value">{incident.warRoomCode || '—'}</span>
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
          </fieldset>
        </section>
      )}

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
          <div className="ml-details" style={{ marginTop: '1rem' }}>
            <h4 style={{ marginBottom: '.5rem' }}>Detalles ML</h4>
            <p style={{ margin: 0 }}><strong>Probabilidad:</strong> {typeof incident.attackProbability === 'number' ? `${(incident.attackProbability * 100).toFixed(2)}%` : '—'}</p>
            <p style={{ margin: 0 }}><strong>Categoría:</strong> {mlInfo.nombre} ({incident.category || '—'})</p>
            {incident.standardProtocol && (
              <details style={{ marginTop: '.75rem' }}>
                <summary style={{ cursor: 'pointer' }}>Protocolo estándar sugerido</summary>
                <pre style={{ whiteSpace: 'pre-wrap', background: 'var(--bg-secondary,#f1f5f9)', padding: '.75rem', borderRadius: '6px', fontSize: '.75rem' }}>{incident.standardProtocol}</pre>
              </details>
            )}
            <details style={{ marginTop: '.75rem' }}>
              <summary style={{ cursor: 'pointer' }}>Descripción y checklist</summary>
              <p style={{ marginTop: '.5rem' }}>{mlInfo.descripcion}</p>
              <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                {mlInfo.checklist.map(item => <li key={item}>{item}</li>)}
              </ul>
            </details>
            {incident.probabilities && typeof incident.probabilities === 'object' && (
              <details style={{ marginTop: '.75rem' }}>
                <summary style={{ cursor: 'pointer' }}>Distribución de probabilidades</summary>
                <ul style={{ marginTop: '.5rem', paddingLeft: '1.2rem' }}>
                  {Object.entries(incident.probabilities).map(([k,v]) => (
                    <li key={k}>{k}: {(Number(v) * 100).toFixed(2)}%</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        </div>
      </section>

      {incident.status === 'contenido' ? (
        <section>
          <output className="resolved-banner" aria-live="polite">
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
          </output>
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

IncidentDetail.propTypes = {
  params: PropTypes.shape({
    id: PropTypes.string.isRequired,
  }).isRequired,
};

export default IncidentDetail;
