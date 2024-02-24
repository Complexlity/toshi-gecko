function calculateActualChange(price, percentChange) {
  // Convert percentage change to a decimal
  const decimalChange = percentChange / 100;

  console.log(decimalChange)
  // Calculate the actual change
  const actualChange = price * decimalChange;
  console.log(actualChange)
  return actualChange;
}

// Example usage
const price = 0.000099130412951931; // Example price
const percentChange = 0.5977473749701664; // Example 24-hour percentage change

const actualChange = calculateActualChange(price, percentChange);
console.log("Actual change:",  actualChange.toFixed(9));
