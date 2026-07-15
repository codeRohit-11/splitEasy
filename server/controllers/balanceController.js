const Member = require('../models/Member');
const Expense = require('../models/Expense');

// Helper to calculate member net balances
const computeBalancesHelper = (members, expenses) => {
  const balanceMap = new Map();

  members.forEach((member) => {
    balanceMap.set(member._id.toString(), {
      memberId: member._id,
      name: member.name,
      netBalance: 0
    });
  });

  expenses.forEach((expense) => {
    const payerIdStr = expense.paidBy.toString();
    if (balanceMap.has(payerIdStr)) {
      const payerData = balanceMap.get(payerIdStr);
      payerData.netBalance += expense.amount;
      balanceMap.set(payerIdStr, payerData);
    }

    expense.splits.forEach((split) => {
      const participantIdStr = split.member.toString();
      if (balanceMap.has(participantIdStr)) {
        const participantData = balanceMap.get(participantIdStr);
        participantData.netBalance -= split.shareAmount;
        balanceMap.set(participantIdStr, participantData);
      }
    });
  });

  const balances = [];
  balanceMap.forEach((data) => {
    balances.push({
      memberId: data.memberId,
      name: data.name,
      netBalance: Number(data.netBalance.toFixed(2))
    });
  });

  return balances;
};

// GET /api/balances
exports.getBalances = async (req, res) => {
  try {
    const members = await Member.find();
    const expenses = await Expense.find();

    const balances = computeBalancesHelper(members, expenses);

    // Sanity check invariant
    const sum = balances.reduce((acc, curr) => acc + curr.netBalance, 0);
    if (Math.abs(sum) > 0.05) {
      console.warn(`Sanity Check Failed: Sum of net balances is ${sum}, which is not 0.`);
    }

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

// GET /api/balances/settlements
exports.getSettlements = async (req, res) => {
  try {
    const members = await Member.find();
    const expenses = await Expense.find();

    const balances = computeBalancesHelper(members, expenses);

    const creditors = [];
    const debtors = [];

    balances.forEach((b) => {
      if (b.netBalance > 0) {
        creditors.push({ name: b.name, balance: b.netBalance });
      } else if (b.netBalance < 0) {
        debtors.push({ name: b.name, balance: Math.abs(b.netBalance) });
      }
    });

    const settlements = [];

    // Greedily match largest debtor against largest creditor
    while (creditors.length > 0 && debtors.length > 0) {
      creditors.sort((a, b) => b.balance - a.balance);
      debtors.sort((a, b) => b.balance - a.balance);

      const c = creditors[0];
      const d = debtors[0];

      const amount = Number(Math.min(c.balance, d.balance).toFixed(2));

      if (amount > 0) {
        settlements.push({
          from: d.name,
          to: c.name,
          amount
        });
      }

      c.balance = Number((c.balance - amount).toFixed(2));
      d.balance = Number((d.balance - amount).toFixed(2));

      if (c.balance < 0.01) creditors.shift();
      if (d.balance < 0.01) debtors.shift();
    }

    return res.status(200).json(settlements);
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected server error occurred.',
      field: null
    });
  }
};
