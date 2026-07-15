const express = require('express');
const router = express.Router();
const balanceController = require('../controllers/balanceController');

router.get('/', balanceController.getBalances);

module.exports = router;
