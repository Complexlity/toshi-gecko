import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
// App router includes @vercel/og.
// No need to install it.

export const runtime = "edge";

export async function GET(request: NextRequest)
{
  const { searchParams } = new URL(request.url);
  const toshi = searchParams.get('toshi') ?? "42069"
  const usd = searchParams.get("usd") ?? "42"
  return new ImageResponse(
    (
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
            src={`${process.env.HOST}/calculator_image.png`}
            width={"100%"}
            height={"100%"}
          />
        </div>
        <p tw="text-6xl font-bold underline">Converter</p>
        <div tw={"flex flex-col text-8xl"}>
          <div tw={"flex justify-between items-center  mb-6"}>
            <div tw="flex flex-col items-center w-[20%]">
              <img
                src="https://toshi-gecko.vercel.app/toshi_icon.png"
                height={150}
                width={150}
              />
              <span tw={"text-4xl"}>TOSHI</span>
            </div>
            <span>{toshi}</span>
          </div>
          <div tw={"flex justify-between items-center"}>
            <div tw="flex flex-col items-center w-[20%]">
              <img
                src="https://toshi-gecko.vercel.app/us_flag_icon.png"
                height={150}
                width={200}
              />
              <span tw={"text-4xl"}>USD</span>
            </div>
            <span>{usd}</span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1146,
      height: 600,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "max-age=5",
      },
    }
  );
}
