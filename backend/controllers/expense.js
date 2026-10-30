const expenseSchema = require("../models/expenseModel")


exports.addExpense = async (req, res) => {
    const {title, amount, category, description, date} = req.body

    const expense = expenseSchema({
        owner: req.user._id,
        title,
        amount,
        category,
        description,
        date
    })

    try{
        //validations
        if(!title || !amount || !category || !date) {
            return res.status(400).json({error: "All fields are required"})
        }
        if(amount <= 0 || typeof amount !== "number") {
            return res.status(400).json({error: "Amount should be a positive number"})
        }
        await expense.save()
        return res.status(201).json({message: "Expense added successfully"})
    }catch (error) {
        return res.status(500).json({error: error.message})
    }
}

exports.getExpenses = async (req, res) => {
    try{
        const expenses = await expenseSchema.find({ owner: req.user._id }).sort({createdAt: -1})
        res.status(200).json(expenses)
    }catch (error) {
        res.status(500).json({error: error.message})
    }
}

exports.deleteExpenses = async (req, res) => {
    const {id} = req.params;
    try {
        const expense = await expenseSchema.findOneAndDelete({ _id: id, owner: req.user._id })
        if (!expense) {
            return res.status(404).json({ error: "Expense not found." })
        }
        return res.status(200).json({message: "Expense deleted successfully"})
    } catch (error) {
        return res.status(500).json({error: error.message})
    }
}