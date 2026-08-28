const express = require('express');
const router  = express.Router({ mergeParams: true });
const auth    = require('../middleware/auth');
const { uploadAttachment, deleteAttachment } = require('../controllers/uploadController');

router.use(auth);
router.post('/',           uploadAttachment);
router.delete('/:attId',   deleteAttachment);

module.exports = router;