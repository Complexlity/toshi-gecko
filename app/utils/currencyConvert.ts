import { EvmChain } from "@moralisweb3/common-evm-utils";
import Moralis from "moralis";

const address = "0xAC1Bd2486aAf3B5C0fc3Fd868558b082a531B2B4";

const chain = EvmChain.BASE;


export function formatCurrency(
  input: number,
  maxInteger: number = 13,
  decimalPlaces = 2
) {
  let inputStr = input.toString();

  if (Number.isInteger(input)) {
    if (inputStr.length > maxInteger) {
      return input.toExponential(2);
    }
    return inputStr;
  }

  inputStr = input.toFixed(decimalPlaces).toString();

  // Separate integer and decimal parts
  let parts = inputStr.split(".");
  let integerPart = parts[0];

  if (integerPart.length > maxInteger - decimalPlaces) {
    return Number(integerPart).toExponential(2);
  }

  return inputStr;
}

export async function getToshiPrice() {
const moralisApiKey = process.env.MORALIS_API_KEY;
if (!moralisApiKey) {
  throw new Error("Moralis api key missing");
}
if (!Moralis.Core.isStarted) {
  console.log("I will start moralis");
  await Moralis.start({
    apiKey: moralisApiKey,
    // ...and any other configuration
  });
  }

  const response = await Moralis.EvmApi.token.getTokenPrice({
    chain,
    include: "percent_change",
    address,
  });

  const toshiPriceData = response.result;
  return toshiPriceData
}

export async function ConvertToshiToUSD(toshiPrice: number) {
  const toshiPriceData = await getToshiPrice()
  const amount = toshiPrice * toshiPriceData.usdPrice;
  return amount
}

export async function getEthPrice() {
  
}
