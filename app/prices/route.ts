import { formatCurrency } from "@/app/utils/currencyConvert";
import { EvmChain } from "@moralisweb3/common-evm-utils";
import Moralis from "moralis";
import { Frame, getFrameHtml } from "frames.js";
import { NextRequest, NextResponse } from "next/server";

// Opt out of caching for all data requests in the route segment
export const dynamic = 'force-dynamic'


const address = "0xAC1Bd2486aAf3B5C0fc3Fd868558b082a531B2B4";

const chain = EvmChain.BASE;
const curr = Math.ceil(
  Math.random() * 4
)
const startImageUrl = `${process.env.HOST}/images/start?curr=${curr}`;

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
  const curr = Math.ceil(Math.random() * 4);
  const startImageUrl = `${process.env.HOST}/images/start?curr=${curr}`;
  initialFrame.image = initialFrame.ogImage = startImageUrl
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
  const moralisApiKey = process.env.MORALIS_API_KEY
  if (!moralisApiKey) {
    return new NextResponse("Api Key Missing",{
      status: 500
    })
  }
  if (!Moralis.Core.isStarted) {
    console.log("I will start moralis");
    await Moralis.start({
      apiKey:
       moralisApiKey,
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

    if (buttonId == 2) {
      const percentChange = Number(toshiPriceData["24hrPercentChange"])
      const actualChange = (toshiPriceData.usdPrice * percentChange / 100)
      const statsImageUrl = `${process.env.HOST}/images/stats?price=${toshiPriceData.usdPrice.toFixed(8)}&changeP=${percentChange.toFixed(2)}&changeA=${actualChange.toFixed(10)}`;
      returnedFrame.image = returnedFrame.ogImage = statsImageUrl;
      return new NextResponse(getFrameHtml(returnedFrame), {
        status: 200,
        headers: { "content-type": "text/html" },
      });
    } else {
      if (isNaN(inputTextAsNumber) || inputTextAsNumber == 0) {
        const curr = Math.ceil(Math.random() * 4);
        const startImageUrl = `${process.env.HOST}/images/start?curr=${curr}`;
        initialFrame.image = initialFrame.ogImage = startImageUrl;
        return new NextResponse(
          getFrameHtml(initialFrame, { htmlBody: `<div>Hello world </div>` }),
          {
            status: 200,
            headers: { "content-type": "text/html" },
          }
        );
      }
      const amount = inputTextAsNumber * toshiPriceData.usdPrice;
      const calculatorImageUrl = `${
        process.env.HOST
      }/images/calculator?toshi=${formatCurrency(
        inputTextAsNumber
      )}&usd=${formatCurrency(amount, 11, 4)}`;
      returnedFrame.image = returnedFrame.ogImage = calculatorImageUrl;


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
