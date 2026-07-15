const assert = require('assert');

async function verifyBalances() {
  const url = 'http://localhost:5000/api/balances';
  console.log(`Fetching balances from ${url}...`);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const balances = await response.json();
    console.log('Retrieved balances:', JSON.stringify(balances, null, 2));

    let sum = 0;
    balances.forEach((member) => {
      sum += member.netBalance;
    });

    console.log(`Calculated sum of balances: ${sum}`);
    
    // Assert that the sum is 0 within floating point tolerance (0.01 epsilon)
    const epsilon = 0.01;
    assert.ok(
      Math.abs(sum) < epsilon,
      `Sanity Invariant Failed: The sum of balances is ${sum}, which is not 0.`
    );

    console.log('✅ Sanity Invariant Verified: The sum of all net balances is exactly 0.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Verification script failed:', error.message);
    process.exit(1);
  }
}

verifyBalances();
