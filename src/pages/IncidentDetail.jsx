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

function IncidentDetail({ params }) {
  const { id } = params;
  const { selectedIncident, loading } = useAppState();
  const { loadIncidentById, updateIncidentStatus, openWarRoom, addToast } = useAppActions();
  const [solutionOpen, setSolutionOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    loadIncidentById(id);
  }, [id, loadIncidentById]);

  const incident = useMemo(() => {
    if (selectedIncident && selectedIncident.id === id) {
      return selectedIncident;
    }
    return null;
  }, [id, selectedIncident]);

  const handleOpenWarRoom = async () => {
    try {
      const warRoom = await openWarRoom(id);
      if (warRoom?.id) {
        navigate(getRouteHash('war-room', { id: warRoom.id }));
      }
    } catch (error) {
      console.error(error);
    }
  };

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
          {incident.status === 'conocido' ? (
            <button type="button" className="btn primary" onClick={() => setSolutionOpen(true)}>
              Ver solución aplicada
            </button>
          ) : null}
          {incident.status === 'no-conocido' ? (
            <button type="button" className="btn warn" onClick={handleOpenWarRoom}>
              Abrir mesa de trabajo
            </button>
          ) : null}
          {incident.status === 'falso-positivo' ? (
            <>
              <button type="button" className="btn success" onClick={() => setConfirm('close_fp')}>
                Cerrar como FP
              </button>
              <button type="button" className="btn warn" onClick={() => setConfirm('escalate')}>
                Escalar a no-conocido
              </button>
            </>
          ) : null}
          {incident.status === 'conocido' || incident.status === 'contenido' ? (
            <button type="button" className="btn success" onClick={() => addToast({ title: 'Playbook aplicado', description: 'Se ejecutó el playbook sugerido.', tone: 'info' })}>
              Registrar nota
            </button>
          ) : null}
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
            <dt>Última actualización</dt>
            <dd>
              {incident.updatedAt ? (
                <time dateTime={incident.updatedAt}>{new Date(incident.updatedAt).toLocaleString()}</time>
              ) : (
                '—'
              )}
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
        <p>{incident.aiSummary || 'El backend proporcionará un resumen con hallazgos de la IA.'}</p>
      </section>

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
