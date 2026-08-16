import type {
  OuterwearNeed,
  TemperatureBand,
} from './contracts.js';

export function temperatureBandFor(
  apparentTemperatureC: number,
): TemperatureBand {
  if (apparentTemperatureC < 0) {
    return 'very-cold';
  }
  if (apparentTemperatureC < 8) {
    return 'cold';
  }
  if (apparentTemperatureC < 14) {
    return 'cool';
  }
  if (apparentTemperatureC < 20) {
    return 'mild';
  }
  if (apparentTemperatureC < 27) {
    return 'warm';
  }
  return 'hot';
}

export function outerwearNeedFor(
  apparentTemperatureC: number,
  precipitationMm: number,
  windSpeedKmh: number,
): OuterwearNeed {
  if (apparentTemperatureC < 8) {
    return 'required';
  }

  if (
    apparentTemperatureC < 15 ||
    precipitationMm > 0.2 ||
    windSpeedKmh >= 30
  ) {
    return 'recommended';
  }

  if (apparentTemperatureC >= 27 && precipitationMm <= 0.2) {
    return 'avoid';
  }

  return 'optional';
}

export function rainProtectionRecommended(
  precipitationMm: number,
  rainMm: number,
  precipitationProbabilityPercent: number | null,
): boolean {
  return (
    precipitationMm > 0.2 ||
    rainMm > 0.2 ||
    (precipitationProbabilityPercent !== null &&
      precipitationProbabilityPercent >= 45)
  );
}
