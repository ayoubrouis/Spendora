const { addIncome, getIncomes, deleteIncomes } = require("../controllers/income")
const { addExpense, getExpenses, deleteExpenses } = require("../controllers/expense")
const requireAuth = require("../middleware/requireAuth")

const router = require("express").Router()

router.use(requireAuth)
router.post("/add-income", addIncome)
    .get("/get-incomes", getIncomes)
    .delete("/delete-income/:id", deleteIncomes)
    .post("/add-expense", addExpense)
    .get("/get-expenses", getExpenses)
    .delete("/delete-expense/:id", deleteExpenses)

module.exports = router