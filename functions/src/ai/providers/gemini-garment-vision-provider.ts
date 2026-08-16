import { GoogleGenAI } from '@google/genai';

import { GARMENT_ANALYSIS_MODEL } from '../contracts.js';
import type {
  GarmentAnalysisResult,
  GarmentVisionInput,
  GarmentVisionProvider,
} from '../contracts.js';
import { GarmentAnalysisError } from '../errors.js';
import {
  GARMENT_ANALYSIS_JSON_SCHEMA,
  GARMENT_ANALYSIS_PROMPT,
} from '../garment-schema.js';
import { parseGarmentProviderResult } from '../garment-result.js';

const PROVIDER_TIMEOUT_MS = 45_000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new GarmentAnalysisError(
          'PROVIDER_TIMEOUT',
          'Garment vision provider timed out.',
        ),
      );
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export class GeminiGarmentVisionProvider implements GarmentVisionProvider {
  private readonly client: GoogleGenAI;

  constructor(apiKey: string) {
    const normalizedApiKey = apiKey.trim();
    if (!normalizedApiKey) {
      throw new GarmentAnalysisError(
        'INTERNAL_ERROR',
        'Gemini API key is not configured.',
      );
    }

    this.client = new GoogleGenAI({ apiKey: normalizedApiKey });
  }

  async analyze(input: GarmentVisionInput): Promise<GarmentAnalysisResult> {
    try {
      const interaction = await withTimeout(
        this.client.interactions.create({
          model: GARMENT_ANALYSIS_MODEL,
          input: [
            {
              type: 'image',
              data: input.imageBase64,
              mime_type: input.mimeType,
            },
            {
              type: 'text',
              text: GARMENT_ANALYSIS_PROMPT,
            },
          ],
          response_format: {
            type: 'text',
            mime_type: 'application/json',
            schema: GARMENT_ANALYSIS_JSON_SCHEMA,
          },
        }),
        PROVIDER_TIMEOUT_MS,
      );

      const rawText = interaction.output_text;
      if (typeof rawText !== 'string' || !rawText.trim()) {
        throw new GarmentAnalysisError(
          'INVALID_PROVIDER_OUTPUT',
          'Gemini returned no structured text output.',
        );
      }

      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(rawText);
      } catch {
        throw new GarmentAnalysisError(
          'INVALID_PROVIDER_OUTPUT',
          'Gemini returned invalid JSON.',
        );
      }

      return parseGarmentProviderResult(parsedJson);
    } catch (error: unknown) {
      if (error instanceof GarmentAnalysisError) {
        throw error;
      }

      throw new GarmentAnalysisError(
        'PROVIDER_UNAVAILABLE',
        'Gemini request failed.',
      );
    }
  }
}
