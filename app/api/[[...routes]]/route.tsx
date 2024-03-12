/** @jsxImportSource frog/jsx */

import { formatCurrency, getToshiPrice } from "@/app/utils/currencyConvert";
import { Button, Frog, TextInput } from "frog";
// import { neynar } from 'frog/hubs'
import { handle } from "frog/next";
import { imageUrls } from "@/app/utils/images";
import { Address, parseAbi, parseEther, parseUnits } from "viem";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { env } from "hono/adapter";
import { ZeroXSwapQuote } from "@/app/utils/types";
// import fs from 'fs'

const baseClient = createPublicClient({
  chain: base,
  transport: http(),
});

const app = new Frog({
  assetsPath: "/",
  basePath: "/api",
  imageOptions: {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "max-age=5",
    },
  },
  // Supply a Hub to enable frame verification.
  // hub: neynar({ apiKey: 'NEYNAR_FROG_FM' })
});

const assets = {
  toshi: {
    name: "$TOSHI",
    network: "base",
    image: "https://i.ibb.co/JHDfxTV/toshi.png",
    address: "0xAC1Bd2486aAf3B5C0fc3Fd868558b082a531B2B4" as `0x${string}`,
  },
  eth: {
    name: "ETH",
    network: "base",
    image: "https://i.ibb.co/JHDfxTV/toshi.png",
    address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" as `0x${string}`,
  },
  usdc: {
    name: "USDC",
    network: "base",
    image: "https://i.ibb.co/JHDfxTV/toshi.png",
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as `0x${string}`,
  },
};

// Uncomment to use Edge Runtime
// export const runtime = 'edge'

app.frame("/", async (c) => {
  const { buttonValue, inputText, status } = c;
  const inputTextAsNumber = Number(inputText);
  if (buttonValue == "convert") {
    if (isNaN(inputTextAsNumber) || inputTextAsNumber == 0) {
      throw new Error("Invalid input");
    }
  }
  let toshiPriceData = await getToshiPrice();
  const percentChange = Number(toshiPriceData["24hrPercentChange"]);
  const actualChange = (toshiPriceData.usdPrice * percentChange) / 100;
  const amount = inputTextAsNumber * toshiPriceData.usdPrice;
  const toshi = formatCurrency(inputTextAsNumber);
  const usd = formatCurrency(amount, 11, 4);

  return c.res({
    image:
      status === "initial" ? (
        <StartImage />
      ) : buttonValue == "price" ? (
        <PriceImage
          price={toshiPriceData.usdPrice.toFixed(8)}
          changeP={percentChange.toFixed(2)}
          changeA={actualChange.toFixed(10)}
        />
      ) : (
        <ConvertImage toshi={toshi} usd={usd} />
      ),
    intents: [
      <TextInput placeholder="TOSHI amount. e.g 100, 30000" />,
      <Button action="/buy">Buy</Button>,
      <Button value="convert">Convert(USD)</Button>,
      <Button value="price">Latest Price</Button>,
    ],
  });
});

app.frame("/buy", async (c) => {
  // let symbol = await baseClient.readContract({
  //   address: assets.toshi.address,
  //   abi: parseAbi(["function symbol() view returns (string)"]),
  //   functionName: "symbol",
  // });

  //  const baseUrl = "https://base.api.0x.org/swap/v1/quote?";

  // const value = c.inputText || "1";
  // const takerAmount = "1000000000000000000";
  // const amount = Number(value) * 100000;
  // // const amount = parseEther(value).toString();
  //  // https://0x.org/docs/0x-swap-api/api-references/get-swap-v1-quote#request
  //  const params = new URLSearchParams({
  //    buyToken: assets.toshi.address,
  //    sellToken: assets.usdc.address,
  //    sellAmount: `${amount}`,
  //    // sellAmount: parseEther(value).toString(),
  //    feeRecipient: "0xaf0E8cbb79CFA794abd64BEE25B0001bEdC38a42",
  //    buyTokenPercentageFee: "0.01",
  //  }).toString();

  // console.log("Fetching...")
  //  const res = await fetch(baseUrl + params, {
  //    headers: { "0x-api-key": process.env.ZEROX_API_KEY || "" },
  //  });

  // const order = (await res.json()) as ZeroXSwapQuote;
  // fs.writeFileSync('order.json', JSON.stringify(order, null, 2))



  return c.res({
    action: "/finish",
    image: <TradeImage />,
    intents: [
      <Button.Transaction target="/tx">Confirm</Button.Transaction>,
      <Button.Reset>Back</Button.Reset>,
    ],
  });
});

app.frame("/finish", async (c) => {
  const { transactionId } = c;

  return c.res({
    image: "https://i.ibb.co/f8VCgBC/thankyou.png",
    intents: [
      <Button.Link href={`https://basescan.org/tx/${transactionId}`}>
        View Transaction
      </Button.Link>,
      <Button.Reset>Home</Button.Reset>,
    ],
  });
});

app.transaction("/tx", async (c) => {
  const baseUrl = "https://base.api.0x.org/swap/v1/quote?";

  const value = c.inputText || "0.01";
  // const amount = Number(value) * 1000000;
  const amount = parseUnits(value, 6).toString()
  // https://0x.org/docs/0x-swap-api/api-references/get-swap-v1-quote#request
  const params = new URLSearchParams({
    buyToken: assets.toshi.address,
    sellToken: assets.usdc.address,
    sellAmount: amount,
    // sellAmount: parseEther(value).toString(),
    feeRecipient: "0xaf0E8cbb79CFA794abd64BEE25B0001bEdC38a42",
    buyTokenPercentageFee: "0.01",
  }).toString();

  const res = await fetch(baseUrl + params, {
    headers: { "0x-api-key": process.env.ZEROX_API_KEY || "" },
  });

  const order = (await res.json()) as ZeroXSwapQuote;
  console.log({order})

  return c.send({
    chainId: `eip155:8453`,
    to: order.to,
    data: order.data,
    value: BigInt(order.value),
  });
});

function TradeImage() {
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
        fontSize: 32,
        fontWeight: 600,
      }}
    >
      <svg
        width="75"
        viewBox="0 0 75 65"
        fill="#000"
        style={{ margin: "0 75px" }}
      >
        <path d="M37.59.25l36.95 64H.64l36.95-64z"></path>
      </svg>
      <div style={{ marginTop: 40 }}>Hello, World</div>
    </div>
  );
}

function StartImage() {
  const curr = Math.ceil(Math.random() * 4) as 1 | 2 | 3 | 4;
  console.log({ curr });
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
        fontSize: 32,
        fontWeight: 600,
        backgroundImage: "linear-gradient(to bottom, #dbf4ff, #fff1f1)",
      }}
      tw={"p-0"}
    >
      <img
        tw={"p-0"}
        src={`${imageUrls[`toshi${curr}`]}`}
        width="360px"
        height={"360px"}
      />
      <p tw={"text-6xl text-center"}>
        Track your $TOSHI worth and live market price
      </p>
    </div>
  );
}

function PriceImage({
  price,
  changeP,
  changeA,
}: {
  price: string;
  changeP: string;
  changeA: string;
}) {
  const usdPrice = price ?? "42069";
  const percentChange = Number(changeP) ?? 0.0000419;
  const actualChange = changeA ?? 0.666419;

  console.log({ percentChange, actualChange });
  console.log({ usdPrice });
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
        fontSize: 32,
        fontWeight: 600,
        gap: "40px",
      }}
      tw={"p-0"}
    >
      <div
        style={{
          display: "flex",
          position: "absolute",
          opacity: 0.2,
          height: "100%",
          width: "100%",
        }}
      >
        <img src={`${imageUrls.cryptoChart}`} width={"100%"} height={"100%"} />
      </div>
      <div style={{ gap: "20px" }} tw="flex items-center text-8xl">
        <img
          src={`${process.env.HOST}/toshi_icon.png`}
          height={150}
          width={150}
        />
        <span>Toshi</span>
      </div>
      <div style={{ gap: "10px" }} tw={"flex flex-col p-0 m-0"}>
        <div style={{ gap: "10px" }} tw="flex items-end">
          <p tw={"text-9xl p-0 m-0"}>{usdPrice}</p>
          <p tw={"font-normal text-7xl p-4 m-0"}>USD</p>
        </div>
        <div
          style={{ gap: "10px" }}
          tw={`flex text-6xl font-semibold ${
            percentChange > 0 ? "text-green-600" : "text-red-600"
          }`}
        >
          <p tw={"p-0 m-0"}>{actualChange}</p>
          <p tw={"p-0 m-0"}>({percentChange}%)</p>
          <p tw={"p-0 m-0 flex items-center"}>
            {percentChange > 0 ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="60"
                height="60"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m5 12 7-7 7 7" />
                <path d="M12 19V5" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="60"
                height="60"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14" />
                <path d="m19 12-7 7-7-7" />
              </svg>
            )}
            today
          </p>
        </div>
      </div>
    </div>
  );
}

function ConvertImage({ toshi, usd }: { toshi: string; usd: string }) {
  usd = usd ?? "42";
  toshi = toshi ?? "42069";
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: "#fff",
        fontSize: 32,
        fontWeight: 600,
      }}
      tw={"p-0"}
    >
      <div
        style={{
          display: "flex",
          position: "absolute",
          opacity: 0.2,
          height: "100%",
          width: "100%",
        }}
      >
        <img
          src={`${imageUrls.calculatorImage}`}
          width={"100%"}
          height={"100%"}
        />
      </div>
      <p tw="text-6xl font-bold underline">Converter</p>
      <div tw={"flex flex-col text-8xl"}>
        <div tw={"flex justify-between items-center  mb-6"}>
          <div tw="flex flex-col items-center w-[20%]">
            <img src={`${imageUrls.toshiIcon}`} height={150} width={150} />
            <span tw={"text-4xl"}>TOSHI</span>
          </div>
          <span>{toshi}</span>
        </div>
        <div tw={"flex justify-between items-center"}>
          <div tw="flex flex-col items-center w-[20%]">
            <img src={`${imageUrls.usFlagIcon}`} height={150} width={200} />
            <span tw={"text-4xl"}>USD</span>
          </div>
          <span>{usd}</span>
        </div>
      </div>
    </div>
  );
}

export const GET = handle(app);
export const POST = handle(app);
