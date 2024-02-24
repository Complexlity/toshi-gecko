import { Frame, getFrameFlattened } from "frames.js";
import type { Metadata } from "next";

// Opt out of caching for all data requests in the route segment
export const dynamic = "force-dynamic";

const curr = Math.ceil(Math.random() * 4);
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

export const metadata: Metadata = {
  title: "Track your $TOSHI worth",
  description: "Calculate your toshi worth and get live market price",
  openGraph: {
    images: [
      {
        url: startImageUrl,
      },
    ],
  },
  other: getFrameFlattened(initialFrame),
};

export default async function Home() {
  return <div></div>;
}
