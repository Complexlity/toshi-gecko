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

import { Context, HonoRequest, Next } from "hono";
import { validateFramesPost } from "@xmtp/frames-validator";


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
  degen: {
    name: "$DEGEN",
    network: "base",
    image:
      "https://pbs.twimg.com/profile_images/1751028059325501440/9jrvP_yG_400x400.jpg",
    address: "0x4ed4e862860bed51a9570b96d89af5e1b0efefed" as `0x${string}`,
  },
};


const xmtpSupport = async (c: Context, next: Next) => {
  await next();

  const isFrame = c.res.headers.get("content-type")?.includes("html");
  if (!isFrame) return;

  if (!(await isXMTP(c.req))) return;

  let html = await c.res.text();

  const state = extractState(html);

  if (state) {
    const stateParams = toSearchParams(state);
    html = addStateToPostUrl(html, stateParams.toString());
    html = addStatesToButtonTargets(html, stateParams.toString());
  }

  const metaTag = '<meta property="of:accepts:xmtp" content="2024-02-01" />';
  html = html.replace(/(<head>)/i, `$1${metaTag}`);

  c.res = new Response(html, {
    headers: {
      "content-type": "text/html",
    },
  });
};

const validateXMTPUser = async (c: Context, next: Next) => {
  if (c.req.method !== "POST") {
    await next();
    return;
  }

  const requestBody = (await c.req.json().catch(() => {})) || {};

  if (requestBody?.clientProtocol?.includes("xmtp")) {
    c.set("client", "xmtp");
    const { verifiedWalletAddress } = await validateFramesPost(requestBody);
    c.set("verifiedWalletAddress", verifiedWalletAddress);
  } else {
    //add farcaster check
    c.set("client", "farcaster");
  }

  await next();
};

async function isXMTP(req: HonoRequest) {
  let requestBody = null;
  requestBody = (await req.json().catch(() => {})) || {};

  return requestBody?.clientProtocol?.includes("xmtp") || false;
}

function addStatesToButtonTargets(html: string, query: string): string {
  const metaTagRegex =
    /<meta property="fc:frame:button:([1-9]):target" content="([^"]+)"/g;
  return html.replace(metaTagRegex, (match, buttonNum, url) => {
    const separator = url.includes("?") ? "&" : "?";
    const updatedUrl = `${url}${separator}${query}`;
    return `<meta property="fc:frame:button:${buttonNum}:target" content="${updatedUrl}"`;
  });
}

function addStateToPostUrl(html: string, query: string): string {
  const metaTagRegex = /<meta property="fc:frame:post_url" content="([^"]+)"/;
  const match = html.match(metaTagRegex);
  if (match && !match[1].includes("?")) {
    const updatedUrl = `${match[1]}?${query}`;
    html = html.replace(
      metaTagRegex,
      `<meta property="fc:frame:post_url" content="${updatedUrl}"`
    );
  }
  return html;
}

function extractState(htmlString: string): object | null {
  const metaTagStart = htmlString.indexOf('<meta property="fc:frame:state"');
  if (metaTagStart === -1) return null;

  const contentStart = htmlString.indexOf('content="', metaTagStart);
  if (contentStart === -1) return null;

  const contentEnd = htmlString.indexOf('"', contentStart + 9);
  if (contentEnd === -1) return null;

  const state = htmlString.substring(contentStart + 9, contentEnd);

  return JSON.parse(decodeURIComponent(state));
}

function toSearchParams(object: object) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(object)) {
    const encoded = (() => {
      if (typeof value === "string") return encodeURIComponent(value);
      if (typeof value === "number") return value.toString();
      if (typeof value === "boolean") return value.toString();
      if (typeof value === "object" && value !== null) {
        return encodeURIComponent(
          Array.isArray(value)
            ? `#A_${value.join(",")}`
            : `#O_${JSON.stringify(value)}`
        );
      }
      return undefined;
    })();
    if (encoded) params.set(key, encoded);
  }
  return params;
}

// app.use(xmtpSupport)

app.use(async (c, next) => {
  console.log("Incoming request:", c.req);

  await next();
  const isFrame = c.res.headers.get("content-type")?.includes("html");

  if (isFrame) {
    let html = await c.res.text();
    const metaTag = '<meta property="of:accepts:xmtp" content="2024-02-01" />';
    html = html.replace(/(<head>)/i, `$1${metaTag}`);
    c.res = new Response(html, {
      headers: {
        "content-type": "text/html",
      },
    });
  }
});
// Uncomment to use Edge Runtime
// export const runtime = 'edge'

app.frame("/", async (c) => {
  const { buttonValue, inputText, status } = c;
  return c.res({
    image: <StartImage />,
    intents: [
      <Button action="/buy">Buy</Button>,
      <Button action="/convert">Rate(USD)</Button>,
      <Button action="/price">Latest Price</Button>,
    ],
  });
});

app.frame("/convert", async (c) => {
  const { inputText } = c;
  let inputTextAsNumber = Number(inputText);
  let toshi: string;
  let usd: string;
  if (isNaN(inputTextAsNumber) || inputTextAsNumber == 0) {
    toshi = "0";
    usd = "0";
  } else {
    let toshiPriceData = await getToshiPrice();
    const amount = inputTextAsNumber * toshiPriceData.usdPrice;
    toshi = formatCurrency(inputTextAsNumber);
    usd = formatCurrency(amount, 11, 4);
  }

  return c.res({
    image: <ConvertImage toshi={toshi} usd={usd} />,
    intents: [
      <TextInput placeholder="TOSHI amount e.g 10000" />,
      <Button>Convert</Button>,
      <Button.Reset>Home</Button.Reset>,
    ],
  });
});

app.frame("/price", async (c) => {
  let toshiPriceData = await getToshiPrice();
  const percentChange = Number(toshiPriceData["24hrPercentChange"]);
  const actualChange = (toshiPriceData.usdPrice * percentChange) / 100;

  return c.res({
    image: (
      <PriceImage
        price={toshiPriceData.usdPrice.toFixed(8)}
        changeP={percentChange.toFixed(2)}
        changeA={actualChange.toFixed(10)}
      />
    ),
    intents: [<Button>Refresh</Button>, <Button.Reset>Home</Button.Reset>],
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "max-age=1",
    },
  });
});

app.frame("/buy", async (c) => {
  return c.res({
    action: "/finish",
    image: <BuyStartImage />,
    intents: [
      <TextInput placeholder="ETH amount(default=0.01)" />,
      <Button.Transaction target="/tx">Confirm</Button.Transaction>,
      <Button.Reset>Back</Button.Reset>,
    ],
  });
});

app.frame("/finish", async (c) => {
  const { transactionId } = c;

  return c.res({
    image: "https://pbs.twimg.com/media/F4M9IOlWwAEgTDf.jpg",
    intents: [
      <Button.Link href={`https://basescan.org/tx/${transactionId}`}>
        View Transaction
      </Button.Link>,
      <Button.Reset>Home</Button.Reset>,
    ],
  });
});

app.transaction("/tx", async (c) => {
  const value = c.inputText || "0.01";

  // prettier-ignore
  const baseUrl = `https://base.api.0x.org/swap/v1/quote?`
  const eth = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
  const degen = "0x4ed4e862860bed51a9570b96d89af5e1b0efefed";
  const toshi = "0xac1bd2486aaf3b5c0fc3fd868558b082a531b2b4";

  // https://0x.org/docs/0x-swap-api/api-references/get-swap-v1-quote#request
  const params = new URLSearchParams({
    buyToken: toshi,
    sellToken: eth,
    sellAmount: parseEther(value).toString(),
    feeRecipient: "0xaf0E8cbb79CFA794abd64BEE25B0001bEdC38a42",
    buyTokenPercentageFee: "0.01",
  }).toString();

  const res = await fetch(baseUrl + params, {
    headers: { "0x-api-key": process.env.ZEROX_API_KEY || "" },
  });

  const order = (await res.json()) as ZeroXSwapQuote;

  return c.send({
    chainId: `eip155:8453`,
    to: order.to,
    data: order.data,
    value: BigInt(order.value),
  });
});

function BuyStartImage() {
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
        backgroundImage: "linear-gradient(to bottom, #dbf4ff, #fff1f1)",
        fontSize: 32,
        fontWeight: 600,
      }}
    >
      <h1 tw="text-center">How Much Are You Buying?</h1>
    </div>
  );
}

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
      <div style={{ marginTop: 40 }}>Preview Transaction</div>
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
      <h1
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgb(121, 40, 202), rgb(255, 0, 128))",
          backgroundClip: "text",
          //@ts-expect-error
          "-webkit-background-clip": "text",
          color: "transparent",
        }}
        tw="m-0 p-0"
      >
        TOSHI GECKO
      </h1>
      <h3 tw="m-0 p-0">Your one stop everything toshi app.</h3>
      <img
        tw={"p-0"}
        src={`${imageUrls[`toshi${curr}`]}`}
        width="300px"
        height={"300px"}
      />

      <p tw={"text-4xl text-center"}>
        Buy TOSHI, Get Rates to USD, and Monitor live market prices.
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
      <p tw="text-6xl font-bold">Converter</p>
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

//   return (
//     <div
//       style={{
//         height: "100%",
//         width: "100%",
//         display: "flex",
//         flexDirection: "column",
//         fontSize: 32,
//         fontWeight: 600,
//         padding: "10px 50px",
//       }}
//       tw="bg-slate-900 text-white"
//     >
//       <span tw="text-6xl my-4">Preview Transaction </span>
//       <div
//         tw="flex items-center  mx-auto justify-between max-w-4/5 w-full flex-col"
//         style={{
//           gap: "10px",
//         }}
//       >
//         <div tw="flex justify-between py-2  w-full">
//           <span tw="text-center text-gray-500 flex">From</span>
//           <span tw="text-center text-gray-500">To</span>
//         </div>
//         <div tw="flex justify-between py-2  w-full">
//           <div tw="rounded-full flex w-[100px] h-[100px] overflow-hidden ">
//             <img
//               // src="https://i.imgur.com/mt3nbeI.jpg"
//               src={viewerData?.userImageUrl}
//               width={"100%"}
//               height={"100%"}
//               style={{
//                 objectFit: "cover",
//               }}
//             />
//           </div>
//           <span>
//             <svg
//               xmlns="http://www.w3.org/2000/svg"
//               width="100"
//               height="100"
//               viewBox="0 0 24 24"
//               fill="none"
//               stroke="currentColor"
//               stroke-width="2"
//               stroke-linecap="round"
//               stroke-linejoin="round"
//             >
//               <path d="M18 8L22 12L18 16" />
//               <path d="M2 12H22" />
//             </svg>{" "}
//           </span>
//           <div tw="rounded-full flex w-[100px] h-[100px] overflow-hidden ">
//             <img
//               // src="https://i.imgur.com/mt3nbeI.jpg"
//               src={userData.userImageUrl}
//               width={"100%"}
//               height={"100%"}
//               style={{
//                 objectFit: "cover",
//               }}
//             />
//           </div>
//         </div>

//         <div tw="flex w-full justify-between">
//           <span>You (@{viewerData?.username})</span>
//           <span>@{userData.username}</span>
//         </div>
//       </div>
//       <hr tw="py-[1px] w-full bg-gray-800" />

//       <div tw="flex justify-between py-2">
//         <div tw="text-gray-400">Token</div>
//         <div tw="flex text-4xl items-center" style={{ gap: "4px" }}>
//         </div>
//       </div>
//       <div tw="flex justify-between py-2">
//         <span tw="text-gray-400">Amount</span>
//         <span tw="text-4xl flex" style={{gap:"10px"}}>
//           <span>(${amountInUsd})</span>
//         </span>
//       </div>

//       <div tw="flex justify-between py-2 items-center">
//         <span tw="text-gray-400">Chain</span>
//         <span style={{ gap: "4px" }} tw="flex items-center">
//           <img src="https://i.ibb.co/kBzGkrL/base.png" width={50} height={50} />
//           <span>Base</span>
//         </span>
//       </div>
//     </div>
//   );
// }

export const GET = handle(app);
export const POST = handle(app);
