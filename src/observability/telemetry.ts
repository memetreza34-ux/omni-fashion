export interface TelemetryContext {
  area?: string;
  operation?: string;
  errorCode?: string;
  route?: string;
}

export interface TelemetryProvider {
  captureException: (error: Error, context?: TelemetryContext) => void;
  captureEvent?: (
    name: string,
    properties?: Record<string, string | number | boolean | null>,
  ) => void;
}

let provider: TelemetryProvider | null = null;

export function registerTelemetryProvider(
  nextProvider: TelemetryProvider,
): void {
  provider = nextProvider;
}

export function clearTelemetryProvider(): void {
  provider = null;
}

export function captureException(
  error: unknown,
  context?: TelemetryContext,
): void {
  const normalized =
    error instanceof Error ? error : new Error('Unknown application error');

  if (provider) {
    provider.captureException(normalized, context);
    return;
  }

  if (__DEV__) {
    console.error('Telemetry exception', { error: normalized, context });
  }
}

export function captureEvent(
  name: string,
  properties?: Record<string, string | number | boolean | null>,
): void {
  if (provider?.captureEvent) {
    provider.captureEvent(name, properties);
    return;
  }

  if (__DEV__) {
    console.info('Telemetry event', { name, properties });
  }
}
