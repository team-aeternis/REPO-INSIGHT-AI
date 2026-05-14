export const emitTelemetry = (event, payload = {}) => {
  const stamp = new Date().toISOString();
  console.log(`[Telemetry] ${stamp} ${event}`, payload);
};
