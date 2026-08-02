"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockDb = void 0;
exports.mockDb = {
    $transaction: jest.fn(),
    tenant: {
        create: jest.fn(),
        findUnique: jest.fn(),
    },
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
    auditLog: {
        create: jest.fn().mockResolvedValue({}),
    },
};
exports.mockDb.$transaction.mockImplementation(async (callback) => callback(exports.mockDb));
jest.mock('../src/db', () => ({
    db: exports.mockDb,
}));
beforeEach(() => {
    jest.clearAllMocks();
    exports.mockDb.$transaction.mockImplementation(async (callback) => callback(exports.mockDb));
    exports.mockDb.auditLog.create.mockResolvedValue({});
});
