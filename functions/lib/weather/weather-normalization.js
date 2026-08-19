export function temperatureBandFor(apparentTemperatureC) {
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
export function outerwearNeedFor(apparentTemperatureC, precipitationMm, windSpeedKmh) {
    if (apparentTemperatureC < 8) {
        return 'required';
    }
    if (apparentTemperatureC < 15 ||
        precipitationMm > 0.2 ||
        windSpeedKmh >= 30) {
        return 'recommended';
    }
    if (apparentTemperatureC >= 27 && precipitationMm <= 0.2) {
        return 'avoid';
    }
    return 'optional';
}
export function rainProtectionRecommended(precipitationMm, rainMm, precipitationProbabilityPercent) {
    return (precipitationMm > 0.2 ||
        rainMm > 0.2 ||
        (precipitationProbabilityPercent !== null &&
            precipitationProbabilityPercent >= 45));
}
//# sourceMappingURL=weather-normalization.js.map