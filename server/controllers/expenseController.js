const Expense = require('../models/Expense');
const Member = require('../models/Member');
const mongoose = require('mongoose');

// GET /api/expenses
exports.getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find()
      .populate('paidBy', '_id name')
      .populate('splits.member', '_id name')
      .sort({ createdAt: -1 });
    return res.status(200).json(expenses);
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected server error occurred.',
      field: null
    });
  }
};

// POST /api/expenses
exports.createExpense = async (req, res) => {
  try {
    const { description, amount, paidBy, splitType, participantIds, splits } = req.body;

    // 1. Common Validations
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Description is required.',
        field: 'description'
      });
    }

    if (description.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Description must not exceed 100 characters.',
        field: 'description'
      });
    }

    if (amount === undefined || typeof amount !== 'number' || amount < 0.01) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be at least 0.01.',
        field: 'amount'
      });
    }

    if (!paidBy || !mongoose.Types.ObjectId.isValid(paidBy)) {
      return res.status(400).json({
        success: false,
        error: 'A valid payer member ID is required.',
        field: 'paidBy'
      });
    }

    // Verify payer exists in DB
    const payerExists = await Member.findById(paidBy);
    if (!payerExists) {
      return res.status(404).json({
        success: false,
        error: 'Payer member not found.',
        field: 'paidBy'
      });
    }

    if (!splitType || !['EQUAL', 'CUSTOM'].includes(splitType)) {
      return res.status(400).json({
        success: false,
        error: 'Split type must be EQUAL or CUSTOM.',
        field: 'splitType'
      });
    }

    let finalSplits = [];

    // 2. EQUAL Split Handling
    if (splitType === 'EQUAL') {
      if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Participant IDs array is required for EQUAL split.',
          field: 'participantIds'
        });
      }

      // Verify all participants exist and are valid object IDs
      for (const pId of participantIds) {
        if (!mongoose.Types.ObjectId.isValid(pId)) {
          return res.status(400).json({
            success: false,
            error: `Invalid participant ID: ${pId}`,
            field: 'participantIds'
          });
        }
        const memberExists = await Member.findById(pId);
        if (!memberExists) {
          return res.status(404).json({
            success: false,
            error: `Participant member not found: ${pId}`,
            field: 'participantIds'
          });
        }
      }

      const N = participantIds.length;
      const baseShare = Number((amount / N).toFixed(2));
      const totalCalculated = Number((baseShare * N).toFixed(2));
      const remainder = Number((amount - totalCalculated).toFixed(2));
      const firstShare = Number((baseShare + remainder).toFixed(2));

      finalSplits = participantIds.map((pId, idx) => ({
        member: pId,
        shareAmount: idx === 0 ? firstShare : baseShare
      }));
    }

    // 3. CUSTOM Split Handling
    if (splitType === 'CUSTOM') {
      if (!splits || !Array.isArray(splits) || splits.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Splits array is required for CUSTOM split.',
          field: 'splits'
        });
      }

      let sum = 0;
      for (const split of splits) {
        if (!split.member || !mongoose.Types.ObjectId.isValid(split.member)) {
          return res.status(400).json({
            success: false,
            error: 'Each split must contain a valid member ID.',
            field: 'splits'
          });
        }
        if (split.shareAmount === undefined || typeof split.shareAmount !== 'number' || split.shareAmount < 0) {
          return res.status(400).json({
            success: false,
            error: 'Each split must contain a shareAmount of at least 0.',
            field: 'splits'
          });
        }

        const memberExists = await Member.findById(split.member);
        if (!memberExists) {
          return res.status(404).json({
            success: false,
            error: `Split member not found: ${split.member}`,
            field: 'splits'
          });
        }

        sum += split.shareAmount;
        finalSplits.push({
          member: split.member,
          shareAmount: split.shareAmount
        });
      }

      // Check sum(splits.shareAmount) === amount within a 0.01 epsilon
      if (Math.abs(sum - amount) > 0.01) {
        return res.status(400).json({
          success: false,
          error: `Sum of split shares (${sum}) must equal the total amount (${amount}) within 0.01 epsilon.`,
          field: 'splits'
        });
      }
    }

    // 4. Create and Save the Expense
    const expense = new Expense({
      description: description.trim(),
      amount,
      paidBy,
      splitType,
      splits: finalSplits
    });

    const savedExpense = await expense.save();

    // Populate the newly created expense object
    const populatedExpense = await Expense.findById(savedExpense._id)
      .populate('paidBy', '_id name')
      .populate('splits.member', '_id name');

    return res.status(201).json(populatedExpense);
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected server error occurred.',
      field: null
    });
  }
};

// DELETE /api/expenses/:id
exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found.',
        field: 'id'
      });
    }

    await Expense.findByIdAndDelete(id);
    return res.status(200).json({ message: 'Expense deleted' });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected server error occurred.',
      field: null
    });
  }
};
