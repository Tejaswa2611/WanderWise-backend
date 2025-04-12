const { fetchExpenses, addExpenses, deleteExpenses } = require('../controllers/ExpenseController');
const ensureAuthenticated = require('../middlewares/Auth'); // ✅ Add this line

const router = require('express').Router();

// ✅ Protect each route using the middleware
router.get('/', fetchExpenses);
router.post('/', addExpenses);
router.delete('/:expenseId', deleteExpenses);

module.exports = router;
