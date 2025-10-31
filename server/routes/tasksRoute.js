import express from 'express';
import { getTasks, getCompletions, completeTask, deleteCompletion } from '../controllers/taskController.js';

const router = express.Router();

router.get('/tasks', getTasks);
router.get('/completions/:schachtId', getCompletions);
router.post('/completions', completeTask);
router.delete('/completions/:completionId', deleteCompletion);

export default router;
