import { useEffect, useState } from 'react';
import { useAppActions, useAppState } from '../app/state.js';

const themeOptions = [
  { value: 'auto', label: 'Automático' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
];

function Settings() {
  const { settings } = useAppState();
  const { saveSettings, addToast } = useAppActions();
  const [form, setForm] = useState(settings);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleThresholdChange = (key, value) => {
    const numeric = Number(value);
    setForm((current) => ({
      ...current,
      severityThresholds: {
        ...current.severityThresholds,
        [key]: Number.isNaN(numeric) ? 0 : numeric,
      },
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    saveSettings(form);
  };

  return (
    <div className="page settings-page">
      <header className="page-header">
        <div>
          <h2>Configuración</h2>
          <p>Personaliza la experiencia y la conexión con el backend.</p>
        </div>
      </header>

      <form className="panel form-panel" onSubmit={handleSubmit}>
        <fieldset>
          <legend>Backend</legend>
          <label>
            URL base de la API
            <input
              type="url"
              value={form.apiBaseUrl}
              onChange={(event) => handleChange('apiBaseUrl', event.target.value)}
              placeholder="https://ids-campus/api"
            />
          </label>
          <button
            type="button"
            className="btn subtle"
            onClick={() => addToast({ title: 'Ping enviado', description: 'Se probará la API al guardar.', tone: 'info' })}
          >
            Probar conexión
          </button>
        </fieldset>

        <fieldset>
          <legend>Notificaciones</legend>
          <label className="switch">
            <input
              type="checkbox"
              checked={form.notifications}
              onChange={(event) => handleChange('notifications', event.target.checked)}
            />
            <span>Activar notificaciones críticas</span>
          </label>
        </fieldset>

        <fieldset>
          <legend>Umbrales de severidad</legend>
          <div className="threshold-grid">
            {Object.entries(form.severityThresholds || {}).map(([key, value]) => (
              <label key={key}>
                {key}
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={value}
                  onChange={(event) => handleThresholdChange(key, event.target.value)}
                />
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>Tema</legend>
          <label>
            Modo de color
            <select value={form.theme} onChange={(event) => handleChange('theme', event.target.value)}>
              {themeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </fieldset>

        <div className="form-actions">
          <button type="submit" className="btn primary">
            Guardar cambios
          </button>
        </div>
      </form>
    </div>
  );
}

export default Settings;
