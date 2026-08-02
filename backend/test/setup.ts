export const mockDb = {
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
  db: mockDb,
}));

beforeEach(() => {
  // Reset mocks before each test
  jest.clearAllMocks();
});
