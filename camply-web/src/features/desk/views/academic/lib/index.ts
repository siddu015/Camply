export {
  checkHandbookExists,
  getUserHandbook,
  getUserHandbooks,
  deleteHandbook,
  subscribeToHandbookChanges
} from './handbook';

export {
  validateHandbookFile,
  generateFilePath,
  uploadFileToStorage,
  createHandbookRecord,
  triggerBackendProcessing,
  checkUserAuthentication,
  uploadHandbook
} from './handbookUpload';

export {
  createUserQuery,
  createBotResponse,
  createErrorResponse,
  queryHandbookBackend,
  validateQuery,
  processHandbookQuery,
  getSuggestedQuestions
} from './handbookQuery';

export type { QueryResponse, QueryState } from './handbookQuery';
export type { UploadValidationError, UploadProgress } from './handbookUpload'; 