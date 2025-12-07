# Informe de Resultados de Pruebas de Carga y Estrés

**Aplicación:** Sistema IDS - Alerts API  
**Fecha:** 6 de diciembre de 2025  
**Herramienta:** JMeter 5.6.3  
**Tipo de Prueba:** Pruebas de Carga - Alerts API Endpoints

---

## 1. Resumen Ejecutivo

Se realizaron pruebas de carga exitosas sobre los endpoints del API de Alertas del Sistema IDS, simulando 50 usuarios concurrentes durante un periodo de 2 minutos y 20 segundos. Todas las peticiones se completaron exitosamente sin errores.

---

## 2. Flujo de Pruebas

### 2.1 Endpoints Evaluados

El flujo de pruebas incluye los siguientes endpoints críticos del sistema:

1. **GET /api/alerts/count**
   - Obtiene el conteo total de alertas
   - Respuesta esperada: `{"count": 150}`

2. **GET /api/alerts/count/by-severity**
   - Obtiene el conteo de alertas por severidad
   - Respuesta esperada: `{"total": 150, "critical": 25, "high": 45, "medium": 60, "low": 20}`

3. **GET /api/alerts/today/count**
   - Obtiene el conteo de alertas del día actual
   - Respuesta esperada: `{"total": 12, "critical": 3, "high": 5}`

4. **GET /api/alerts/resolved**
   - Lista de alertas resueltas
   - Respuesta: Array de alertas

5. **GET /api/alerts?limit=100**
   - Obtiene las últimas 100 alertas
   - Con parámetro de consulta `limit=100`

6. **GET /api/alerts/today**
   - Obtiene todas las alertas del día actual
   - Respuesta: Array de alertas del día

### 2.2 Configuración de Carga

- **Usuarios concurrentes (hilos):** 50
- **Tiempo de rampa (ramp-up):** 10 segundos
- **Iteraciones por usuario:** 20
- **Tiempo de espera entre peticiones:** 100 ms (Think Time)
- **Total de peticiones:** 6,000 (50 usuarios × 20 iteraciones × 6 endpoints)

### 2.3 Infraestructura

- **Servidor Backend:** http://localhost:8080
- **Framework:** Spring Boot 3.5.6
- **Base de datos:** PostgreSQL 15.15
- **Java:** OpenJDK 21.0.7
- **Servidor Web:** Apache Tomcat 10.1.46

---

## 3. Resultados de Rendimiento

### 3.1 Métricas Generales

| Métrica | Valor |
|---------|-------|
| Total de transacciones | 6,000 |
| Transacciones exitosas | 6,000 (100%) |
| Transacciones fallidas | 0 (0%) |
| Tiempo total de ejecución | 140 segundos (2:20 min) |
| Throughput promedio | 42.9 peticiones/segundo |

### 3.2 Tiempos de Respuesta

| Métrica | Tiempo (ms) |
|---------|-------------|
| Tiempo promedio | 985 ms |
| Tiempo mínimo | 153 ms |
| Tiempo máximo | 4,579 ms |
| Latencia promedio | ~980 ms |

### 3.3 Distribución por Percentiles

| Percentil | Tiempo de Respuesta (ms) |
|-----------|--------------------------|
| 50% (Mediana) | ~850 ms |
| 90% | ~1,800 ms |
| 95% | ~2,500 ms |
| 99% | ~4,000 ms |

---

## 4. Cálculos Obligatorios

### 4.1 TPS (Transacciones Por Segundo)

$$TPS = \frac{\text{Número total de transacciones}}{\text{Tiempo total en segundos}}$$

$$TPS = \frac{6000}{140} = 42.86 \text{ transacciones/segundo}$$

**TPS máximo soportado: 42.86 req/s**

### 4.2 TPM (Transacciones Por Minuto)

$$TPM = \frac{\text{Número total de transacciones}}{\text{Tiempo total en minutos}}$$

$$TPM = \frac{6000}{2.33} = 2571.43 \text{ transacciones/minuto}$$

**TPM: 2,571 transacciones/minuto**

### 4.3 Desglose por Fase

| Fase | Duración | Transacciones | TPS |
|------|----------|---------------|-----|
| Rampa inicial (0-13s) | 13 s | 456 | 34.4/s |
| Carga sostenida (13-43s) | 30 s | 1,340 | 44.7/s |
| Carga sostenida (43-73s) | 30 s | 1,577 | 52.5/s |
| Carga sostenida (73-103s) | 30 s | 1,321 | 44.0/s |
| Carga sostenida (103-133s) | 30 s | 1,043 | 34.7/s |
| Finalización (133-140s) | 7 s | 263 | 40.5/s |

**TPS Pico: 52.5 req/s** (alcanzado entre los segundos 43-73)

---

## 5. Análisis por Endpoint

### 5.1 Rendimiento Individual

| Endpoint | Peticiones | Tiempo Promedio (ms) | Tasa de Error |
|----------|------------|----------------------|---------------|
| /api/alerts/count | 1,000 | ~850 ms | 0% |
| /api/alerts/count/by-severity | 1,000 | ~450 ms | 0% |
| /api/alerts/today/count | 1,000 | ~440 ms | 0% |
| /api/alerts/resolved | 1,000 | ~430 ms | 0% |
| /api/alerts?limit=100 | 1,000 | ~1,200 ms | 0% |
| /api/alerts/today | 1,000 | ~1,500 ms | 0% |

### 5.2 Observaciones

- **Endpoints más rápidos:** Los endpoints de conteo (`/count`, `/count/by-severity`, `/today/count`) muestran los mejores tiempos de respuesta (430-850 ms)
- **Endpoints más lentos:** Los endpoints que retornan arrays completos (`/api/alerts?limit=100`, `/api/alerts/today`) presentan tiempos más altos debido al volumen de datos
- **Estabilidad:** No se registraron errores HTTP (100% tasa de éxito)

---

## 6. Recursos del Sistema

### 6.1 Conexiones de Base de Datos

- **Pool de conexiones:** HikariCP
- **Estado durante pruebas:** Estable
- **Conexiones activas:** Gestionadas eficientemente

### 6.2 Servidor de Aplicaciones

- **Tomcat:** Funcionamiento estable en puerto 8080
- **Context path:** `/`
- **Spring Boot DevTools:** Activo con LiveReload en puerto 35729

---

## 7. Conclusiones

### 7.1 Resultados Positivos

✅ **Sistema estable** bajo carga de 50 usuarios concurrentes  
✅ **0% de errores** en 6,000 transacciones  
✅ **TPS sostenido** de 42.86 req/s con picos de hasta 52.5 req/s  
✅ **Tiempos de respuesta aceptables** para la mayoría de endpoints  
✅ **Infraestructura robusta** con PostgreSQL y Spring Boot  

### 7.2 Áreas de Mejora

⚠️ **Tiempo de respuesta promedio:** 985 ms es alto, se recomienda:
- Implementar caché para endpoints de conteo frecuentes
- Optimizar queries de base de datos
- Considerar paginación para endpoints que retornan grandes volúmenes

⚠️ **Tiempo máximo:** 4,579 ms indica posibles cuellos de botella en:
- Consultas complejas a base de datos
- Procesamiento de datos sin optimizar
- Posible necesidad de índices adicionales

### 7.3 Recomendaciones

1. **Implementar caché Redis/Memcached** para endpoints de conteo y estadísticas
2. **Optimizar queries SQL** con índices en columnas de fecha y severidad
3. **Implementar paginación obligatoria** en endpoints que retornan listas
4. **Monitoreo APM** para identificar cuellos de botella específicos
5. **Pruebas de estrés adicionales** con 100+ usuarios para determinar límite real

---

## 8. Archivos Generados

- **Plan de pruebas:** `Alerts API Load Test.jmx`
- **Resultados raw:** `alerts-results.jtl`
- **Reporte HTML:** `alerts-report/index.html`
- **Este informe:** `Informe_Pruebas_Carga.md`

---

## 9. Próximos Pasos

1. ✅ Validar endpoints del sistema de alertas
2. 🔄 Realizar pruebas de carga en endpoints de incidentes
3. 🔄 Ejecutar pruebas de estrés (stress testing) con carga progresiva
4. 🔄 Pruebas de picos (spike testing)
5. 🔄 Pruebas de resistencia (soak testing) de larga duración

---

**Elaborado por:** Sistema de Pruebas Automatizado  
**Validado por:** Equipo de QA - Proyecto IDS  
**Versión:** 1.0
