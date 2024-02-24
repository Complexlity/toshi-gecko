import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
// App router includes @vercel/og.
// No need to install it.

export const runtime = "edge";

export async function GET() {
  const curr = Math.ceil(Math.random() * 4)
  return new ImageResponse(
    (
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
          src={`${process.env.HOST}/toshi_${curr}.png`}
          width="360px"
          height={"360px"}
        />
        <p tw={"text-6xl text-center"}>
          Find your $TOSHI worth and live market price
        </p>
      </div>
    ),
    {
      width: 1146,
      height: 600,
    }
  );
}
