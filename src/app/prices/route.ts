import Moralis from "moralis";
import { EvmChain } from "@moralisweb3/common-evm-utils";
import { NextRequest, NextResponse } from "next/server";
import { Frame, getFrameHtml, getFrameHtmlHead } from "frames.js";
import fs from "fs";
import { formatCurrency } from "@/utils/formatCurrency";

// Your code here
const address = "0xAC1Bd2486aAf3B5C0fc3Fd868558b082a531B2B4";

const chain = EvmChain.BASE;
const startImageUrl = `${process.env.HOST}/images/start`;
const initialFrame: Frame = {
  image: startImageUrl,
  version: "vNext",
  buttons: [
    {
      label: "Calculate",
      action: "post",
    },
    {
      label: "Latest Price",
      action: "post",
    },
  ],
  inputText: "TOSHI amount. e.g 100, 30000",
  postUrl: `${process.env.HOST}/prices`,
  ogImage: startImageUrl,
};

export async function GET(request: NextRequest) {
  return new NextResponse(
    getFrameHtml(initialFrame, { htmlBody: `<div>Hello world </div>` }),
    {
      status: 200,
      headers: { "content-type": "text/html" },
    }
  );
}
export async function POST(request: NextRequest) {
  const body = await request.json();
  const buttonId = body.untrustedData.buttonIndex;
  const inputText = body.untrustedData.inputText;
  const returnedFrame = { ...initialFrame };

  const inputTextAsNumber = Number(inputText);

  if (!Moralis.Core.isStarted) {
    console.log("I will start moralis");
    await Moralis.start({
      apiKey:
        "jBo2biMfqlNlXRSaTNSEeJwLSOHs0iToM9O97mWbWz0imjPJxaCYf2DGGHCuxrNF",
      // ...and any other configuration
    });
  }
  try {
    const response = await Moralis.EvmApi.token.getTokenPrice({
      chain,
      include: "percent_change",
      address,
    });

    const toshiPriceData = response.result;

    if (response) console.log("I returned response");
    if (buttonId == 2) {
      const statsImageUrl = `${process.env.HOST}/images/stats?price=${toshiPriceData.usdPrice}&change=${toshiPriceData["24hrPercentChange"]}`;
      returnedFrame.image = returnedFrame.ogImage = statsImageUrl;
      console.log("Here's where I return the stats");
      return new NextResponse(getFrameHtml(returnedFrame), {
        status: 200,
        headers: { "content-type": "text/html" },
      });
    } else {
      if (isNaN(inputTextAsNumber) || inputTextAsNumber == 0) {
        console.log("Invalid input");
        return new NextResponse("Invalid input text", { status: 400 });
      }
      const amount = inputTextAsNumber * toshiPriceData.usdPrice;
      const calculatorImageUrl = `${
        process.env.HOST
      }/images/calculator?toshi=${formatCurrency(
        inputTextAsNumber
      )}&usd=${formatCurrency(amount)}`;
      returnedFrame.image = returnedFrame.ogImage = calculatorImageUrl;
      console.log("Here's where I calculate the price");

      return new NextResponse(getFrameHtml(returnedFrame), {
        status: 200,
        headers: { "content-type": "text/html" },
      });
    }
  } catch (error) {
    console.log({ error });
    return new NextResponse("Something went wrong with api", { status: 500 });
  }
}
