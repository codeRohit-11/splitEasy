const Member = require('../models/Member');
const Expense = require('../models/Expense');

// GET /api/balances
exports.getBalances = async (req, res) => {
  try {
    const members = await Member.find();
    const expenses = await Expense.find();

    // Map to keep track of net balances
    const balanceMap = new Map();

    // Initialize all members with 0 balance
    members.forEach((member) => {
      balanceMap.set(member._id.toString(), {
        memberId: member._id,
        name: member.name,
        netBalance: 0
      });
    });

    // Compute balances based on expenses
    expenses.forEach((expense) => {
      const payerIdStr = expense.paidBy.toString();
      
      // Add amount to the payer's balance
      if (balanceMap.has(payerIdStr)) {
        const payerData = balanceMap.get(payerIdStr);
        payerData.netBalance += expense.amount;
        balanceMap.set(payerIdStr, payerData);
      }

      // Subtract shareAmount from each participant's balance
      expense.splits.forEach((split) => {
        const participantIdStr = split.member.toString();
        if (balanceMap.has(participantIdStr)) {
          const participantData = balanceMap.get(participantIdStr);
          participantData.netBalance -= split.shareAmount;
          balanceMap.set(participantIdStr, participantData);
        }
      });
    });

    // Convert map to array, round values to 2 decimals, and check sanity invariant
    const balances = [];
    let sum = 0;

    balanceMap.forEach((data) => {
      const roundedBalance = Number(data.netBalance.toFixed(2));
      sum += roundedBalance;
      balances.push({
        memberId: data.memberId,
        name: data.name,
        netBalance: roundedBalance
      });
    });

    // Sanity check invariant (sum of balances is 0 within tolerance)
    if (Math.abs(sum) > 0.05) {
      console.warn(`Sanity Check Failed: Sum of net balances is ${sum}, which is not 0.`);
    }

    // Sort by name alphabetically
    balances.sort((a, b) => a.name.localeCompare(b.name));

    return res.status(200).json(balances);
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected server error occurred.',
      field: null
    });
  }
};
