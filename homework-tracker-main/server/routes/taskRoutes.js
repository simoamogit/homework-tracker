const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const ctrl    = require('../controllers/taskController');

router.use(auth);

router.get('/',               ctrl.getTasks);
router.post('/',              ctrl.createTask);
router.patch('/reorder',      ctrl.reorderTasks);
router.put('/:id',            ctrl.updateTask);
router.patch('/:id/complete', ctrl.toggleTask);
router.delete('/:id',         ctrl.deleteTask);

// ── Nuovo: PATCH /api/tasks/:id per la dashboard ──
// Riceve { "completed": boolean }, restituisce formato dashboard-friendly
router.patch('/:id',          ctrl.patchCompleted);

module.exports = router;