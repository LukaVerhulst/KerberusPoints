import express from 'express';
import { getTasks, getCompletions, completeTask, deleteCompletion, createCustomTask } from '../controllers/taskController.js';

const router = express.Router();

router.get('/tasks', getTasks);
router.get('/completions/:schachtId', getCompletions);
router.post('/completions', completeTask);
router.post('/custom-tasks', createCustomTask); // NEW: create custom task for a schacht and auto-complete it
router.delete('/completions/:completionId', deleteCompletion);

export default router;
