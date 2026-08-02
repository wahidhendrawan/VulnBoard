export const mockDb: any = {
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
  // Add other models and methods as needed
};

// $transaction executes the callback with the mockDb itself as the tx
mockDb.$transaction.mockImplementation(async (callback: any) => callback(mockDb));

jest.mock('../src/db', () => ({
  db: mockDb,
}));

beforeEach(() => {
  // Reset mocks before each test
  jest.clearAllMocks();
  // Re-establish default implementations after clearAllMocks
  mockDb.$transaction.mockImplementation(async (callback: any) => callback(mockDb));
  mockDb.auditLog.create.mockResolvedValue({});
});
