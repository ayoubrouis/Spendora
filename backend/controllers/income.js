const IncomeSchema = require("../models/incomeModel")


exports.addIncome = async (req, res) => {
    const {title, amount, category, description, date} = req.body

    const income = IncomeSchema({
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
        await income.save()
        return res.status(201).json({message: "Income added successfully"})
    }catch (error) {
        return res.status(500).json({error: error.message})
    }
}

exports.getIncomes = async (req, res) => {
    try{
        const incomes = await IncomeSchema.find({ owner: req.user._id }).sort({createdAt: -1})
        res.status(200).json(incomes)
    }catch (error) {
        res.status(500).json({error: error.message})
    }
}

exports.deleteIncomes = async (req, res) => {
    const {id} = req.params;
    try {
        const income = await IncomeSchema.findOneAndDelete({ _id: id, owner: req.user._id })
        if (!income) {
            return res.status(404).json({ error: "Income not found." })
        }
        return res.status(200).json({message: "Income deleted successfully"})
    } catch (error) {
        return res.status(500).json({error: error.message})
    }
}