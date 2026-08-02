"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockDb = void 0;
exports.mockDb = {
    user: {
        findUnique: jest.fn(),
        create: jest.fn(),
    },
    engagement: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
    },
    report: {
        create: jest.fn(),
    },
    finding: {
        create: jest.fn(),
    },
    findingTemplate: {
        findMany: jest.fn(),
        create: jest.fn(),
    },
    // Add other models and methods as needed
};
jest.mock('../src/db', () => ({
    db: exports.mockDb,
}));
beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
});
