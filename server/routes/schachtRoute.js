import express from 'express';
import { getSchachten, addSchacht, updatePoints, deleteSchacht } from '../controllers/schachtController.js';

const router = express.Router();

router.get('/', getSchachten);
router.post('/', addSchacht);
router.patch('/:id', updatePoints);
router.delete('/:id', deleteSchacht); // <- added

export default router;
