export function formatCurrency(input: number, maxInteger: number = 13) {
  let inputStr = input.toString();

	if (Number.isInteger(input)) {
		if (inputStr.length > maxInteger) {
			return input.toExponential(2)
		}
		return inputStr
	}

	inputStr = input.toFixed(2).toString()


  // Separate integer and decimal parts
  let parts = inputStr.split(".");
  let integerPart = parts[0];


  if (integerPart.length > (maxInteger - 2)) {
    return Number(integerPart).toExponential(2)
  }

  return inputStr
}
