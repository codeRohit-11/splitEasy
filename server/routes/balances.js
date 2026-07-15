const express = require('express');
const router = express.Router();
const balanceController = require('../controllers/balanceController');

router.get('/', balanceController.getBalances);
router.get('/settlements', balanceController.getSettlements);

module.exports = router;
