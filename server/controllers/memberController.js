const Member = require('../models/Member');
const Expense = require('../models/Expense');

// GET /api/members
exports.getMembers = async (req, res) => {
  try {
    const members = await Member.find().select('_id name createdAt');
    return res.status(200).json(members);
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected server error occurred.',
      field: null
    });
  }
};

// POST /api/members
exports.createMember = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Member name is required.',
        field: 'name'
      });
    }

    if (name.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Member name must not exceed 50 characters.',
        field: 'name'
      });
    }

    const member = new Member({ name: name.trim() });
    const savedMember = await member.save();
    return res.status(201).json(savedMember);
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected server error occurred.',
      field: null
    });
  }
};

// DELETE /api/members/:id
exports.deleteMember = async (req, res) => {
  try {
    const { id } = req.params;

    const member = await Member.findById(id);
    if (!member) {
      return res.status(404).json({
        success: false,
        error: 'Member not found.',
        field: 'id'
      });
    }

    // Check if member is referenced in any expenses as paidBy or splits.member
    const linkedExpense = await Expense.findOne({
      $or: [
        { paidBy: id },
        { 'splits.member': id }
      ]
    });

    if (linkedExpense) {
      return res.status(409).json({
        success: false,
        error: 'Member cannot be removed because they are linked to an existing expense.',
        field: 'id'
      });
    }

    await Member.findByIdAndDelete(id);
    return res.status(200).json({ message: 'Member removed' });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected server error occurred.',
      field: null
    });
  }
};
