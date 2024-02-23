export function formatCurrency(input: number, maxInteger: number = 13, decimalPlaces=2) {
  let inputStr = input.toString();

	if (Number.isInteger(input)) {
		if (inputStr.length > maxInteger) {
			return input.toExponential(2)
		}
		return inputStr
	}

	inputStr = input.toFixed(decimalPlaces).toString()


  // Separate integer and decimal parts
  let parts = inputStr.split(".");
  let integerPart = parts[0];


  if (integerPart.length > (maxInteger - decimalPlaces)) {
    return Number(integerPart).toExponential(2)
  }

  return inputStr
}
