const express    = require('express');
const router     = express.Router();
const authMiddleware = require('../middleware/auth');
const {
  getTasks,
  createTask,
  toggleComplete,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');

// Tutte le route qui sotto richiedono un token JWT valido
router.use(authMiddleware);

router.get('/',              getTasks);
router.post('/',             createTask);
router.patch('/:id/complete', toggleComplete);
router.put('/:id',           updateTask);
router.delete('/:id',        deleteTask);

module.exports = router;