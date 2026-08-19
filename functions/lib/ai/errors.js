export class GarmentAnalysisError extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.name = 'GarmentAnalysisError';
        this.code = code;
    }
}
//# sourceMappingURL=errors.js.map