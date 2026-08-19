export type GarmentAnalysisFailureCode =
  | 'IMAGE_NOT_FOUND'
  | 'IMAGE_INVALID'
  | 'IMAGE_NOT_GARMENT'
  | 'PROVIDER_TIMEOUT'
  | 'PROVIDER_UNAVAILABLE'
  | 'INVALID_PROVIDER_OUTPUT'
  | 'INTERNAL_ERROR';

export class GarmentAnalysisError extends Error {
  readonly code: GarmentAnalysisFailureCode;

  constructor(code: GarmentAnalysisFailureCode, message: string) {
    super(message);
    this.name = 'GarmentAnalysisError';
    this.code = code;
  }
}
