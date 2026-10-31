const { addIncome, getIncomes, deleteIncomes, updateIncome } = require("../controllers/income")
const { addExpense, getExpenses, deleteExpenses, updateExpense } = require("../controllers/expense")
const requireAuth = require("../middleware/requireAuth")

const router = require("express").Router()

router.use(requireAuth)
router.post("/add-income", addIncome)
    .get("/get-incomes", getIncomes)
    .delete("/delete-income/:id", deleteIncomes)
    .put("/update-income/:id", updateIncome)
    .patch("/update-income/:id", updateIncome)
    .post("/add-expense", addExpense)
    .get("/get-expenses", getExpenses)
    .delete("/delete-expense/:id", deleteExpenses)
    .put("/update-expense/:id", updateExpense)
    .patch("/update-expense/:id", updateExpense)

module.exports = router