import express from 'express';
import { body, param } from 'express-validator';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { normalizeICMiddleware } from '../middleware/normalizeIC.js';
import { normalizePhoneMiddleware } from '../middleware/normalizePhone.js';
import {
  listPicUsers,
  createPicUser,
  updatePicUser,
  deletePicUser
} from '../controllers/picUserController.js';
import { isValidICFormat } from '../utils/icNormalizer.js';
import { isValidPhoneFormat } from '../utils/phoneNormalizer.js';

const router = express.Router();

const statusOptions = ['aktif', 'tidak_aktif', 'cuti', 'pending'];

const createValidation = [
  body('nama')
    .trim()
    .isLength({ min: 3, max: 150 })
    .withMessage('Nama mesti di antara 3 hingga 150 aksara.'),
  body('ic')
    .notEmpty()
    .withMessage('IC diperlukan.')
    .custom((value) => {
      if (!isValidICFormat(value)) {
        throw new Error('IC mesti mengikut format sah (contoh: 123456-78-9012).');
      }
      return true;
    }),
  body('email')
    .optional({ nullable: true, checkFalsy: true })
    .isEmail()
    .withMessage('Emel mesti sah.')
    .isLength({ max: 191 })
    .withMessage('Emel tidak boleh melebihi 191 aksara.'),
  body('telefon')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (!isValidPhoneFormat(value)) {
        throw new Error('Telefon mesti merupakan nombor Malaysia yang sah.');
      }
      return true;
    }),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Kata laluan mesti sekurang-kurangnya 6 aksara.'),
  body('status')
    .optional()
    .isIn(statusOptions)
    .withMessage(`Status mesti salah satu daripada: ${statusOptions.join(', ')}`)
];

const updateValidation = [
  param('ic')
    .custom((value) => {
      if (!isValidICFormat(value)) {
        throw new Error('IC mesti mengikut format sah (contoh: 123456-78-9012).');
      }
      return true;
    }),
  body('nama')
    .optional()
    .trim()
    .isLength({ min: 3, max: 150 })
    .withMessage('Nama mesti di antara 3 hingga 150 aksara.'),
  body('email')
    .optional({ nullable: true, checkFalsy: true })
    .isEmail()
    .withMessage('Emel mesti sah.')
    .isLength({ max: 191 })
    .withMessage('Emel tidak boleh melebihi 191 aksara.'),
  body('telefon')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (!isValidPhoneFormat(value)) {
        throw new Error('Telefon mesti merupakan nombor Malaysia yang sah.');
      }
      return true;
    }),
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Kata laluan mesti sekurang-kurangnya 6 aksara.'),
  body('status')
    .optional()
    .isIn(statusOptions)
    .withMessage(`Status mesti salah satu daripada: ${statusOptions.join(', ')}`)
];

router.use(authenticateToken);
router.use(requireRole(['admin']));

router.get('/', listPicUsers);
router.post('/', createValidation, normalizeICMiddleware, normalizePhoneMiddleware, createPicUser);
router.put('/:ic', updateValidation, normalizeICMiddleware, normalizePhoneMiddleware, updatePicUser);
router.delete(
  '/:ic',
  param('ic')
    .custom((value) => {
      if (!isValidICFormat(value)) {
        throw new Error('IC mesti mengikut format sah (contoh: 123456-78-9012).');
      }
      return true;
    }),
  normalizeICMiddleware,
  deletePicUser
);

export default router;

