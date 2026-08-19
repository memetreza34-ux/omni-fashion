export const GARMENT_ANALYSIS_PROMPT = `
You are the garment metadata extraction system for Omni Fashion.
Analyze the uploaded image and identify the main wearable fashion item.

Rules:
- Set isGarment=false if the image does not primarily contain one analyzable garment, shoe, bag, jewelry/accessory, or other wearable fashion item.
- category must be exactly one of: Top, Bottom, Shoes, Accessory, Outerwear, Other.
- season must be exactly one of: Spring, Summer, Autumn, Winter, All.
- Write human-readable subcategory, color, material, and styleTags in German.
- Only return a brand when it is visually reliable from the image. Otherwise brand must be null.
- Do not infer a brand from style similarity.
- Material may be null when it cannot be judged reliably from appearance.
- Keep secondaryColors to at most 5 and styleTags to at most 20.
- Every confidence value must be between 0 and 1.
- Confidence means visual certainty, not how fashionable the item is.
- If isGarment=false, use category Other, color "Unbekannt", season All, empty arrays, null optional fields, and confidence values near 0.
- Return only the requested structured data.
`;
export const GARMENT_ANALYSIS_JSON_SCHEMA = {
    type: 'object',
    additionalProperties: false,
    properties: {
        isGarment: { type: 'boolean' },
        category: {
            type: 'string',
            enum: ['Top', 'Bottom', 'Shoes', 'Accessory', 'Outerwear', 'Other'],
        },
        subcategory: {
            anyOf: [{ type: 'string' }, { type: 'null' }],
        },
        color: { type: 'string' },
        secondaryColors: {
            type: 'array',
            maxItems: 5,
            items: { type: 'string' },
        },
        brand: {
            anyOf: [{ type: 'string' }, { type: 'null' }],
        },
        material: {
            anyOf: [{ type: 'string' }, { type: 'null' }],
        },
        season: {
            type: 'string',
            enum: ['Spring', 'Summer', 'Autumn', 'Winter', 'All'],
        },
        styleTags: {
            type: 'array',
            maxItems: 20,
            items: { type: 'string' },
        },
        confidence: {
            type: 'number',
            minimum: 0,
            maximum: 1,
        },
        fieldConfidence: {
            type: 'object',
            additionalProperties: false,
            properties: {
                category: { type: 'number', minimum: 0, maximum: 1 },
                subcategory: { type: 'number', minimum: 0, maximum: 1 },
                color: { type: 'number', minimum: 0, maximum: 1 },
                brand: { type: 'number', minimum: 0, maximum: 1 },
                material: { type: 'number', minimum: 0, maximum: 1 },
                season: { type: 'number', minimum: 0, maximum: 1 },
                styleTags: { type: 'number', minimum: 0, maximum: 1 },
            },
            required: [
                'category',
                'subcategory',
                'color',
                'brand',
                'material',
                'season',
                'styleTags',
            ],
        },
    },
    required: [
        'isGarment',
        'category',
        'subcategory',
        'color',
        'secondaryColors',
        'brand',
        'material',
        'season',
        'styleTags',
        'confidence',
        'fieldConfidence',
    ],
};
//# sourceMappingURL=garment-schema.js.map