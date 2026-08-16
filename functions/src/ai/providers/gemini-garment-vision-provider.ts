import { GoogleGenAI } from '@google/genai';

import {
  GARMENT_ANALYSIS_MODEL,
} from '../contracts.js';
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
      const response = await withTimeout(
        this.client.models.generateContent({
          model: GARMENT_ANALYSIS_MODEL,
          contents: [
            {
              inlineData: {
                mimeType: input.mimeType,
                data: input.imageBase64,
              },
            },
            { text: GARMENT_ANALYSIS_PROMPT },
          ],
          config: {
            temperature: 0.1,
            responseFormat: {
              text: {
                mimeType: 'application/json',
                schema: GARMENT_ANALYSIS_JSON_SCHEMA,
              },
            },
          },
        }),
        PROVIDER_TIMEOUT_MS,
      );

      const rawText = response.text;
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
