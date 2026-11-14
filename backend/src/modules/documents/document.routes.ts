import { Router } from 'express';
import multer from 'multer';
import { documentController } from './document.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorizeWorkspace } from '../../middleware/authorizeWorkspace';
import { validateRequest } from '../../middleware/validateRequest';
import { updateDocumentSchema } from './document.validation';
import { env } from '../../config/env';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024
  }
});

// Download route with short-lived HMAC signature verification does not require bearer header
// (allows direct browser download / inline preview)
router.get('/:documentId/download', documentController.downloadDocument);

// Protected routes requiring authentication & workspace membership
router.use(authenticate);
router.use(authorizeWorkspace());

router.get('/', documentController.getDocuments);
router.post('/upload', upload.single('file'), documentController.uploadDocument);
router.get('/:documentId', documentController.getDocumentById);
router.patch('/:documentId', validateRequest({ body: updateDocumentSchema }), documentController.updateDocument);
router.delete('/:documentId', documentController.deleteDocument);

export const documentRoutes = router;
