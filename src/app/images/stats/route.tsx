import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
// App router includes @vercel/og.
// No need to install it.

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const usdPrice = searchParams.get("price") ?? "42069";
	const percentChange = Number(searchParams.get('changeP')) ?? 0.0000419
	const actualChange = searchParams.get('changeA') ?? 0.666419
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
          <img
            src={`${process.env.HOST}/cyrpto-chart.png`}
          />
        </div>
        <div style={{ gap: "20px" }} tw="flex items-center text-8xl">
          <img
            src="https://toshi-gecko.vercel.app/toshi_icon.png"
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
          <div tw={`flex text-6xl font-semibold ${percentChange > 0 ? "text-green-600" : "text-red-600"}`}>
						<p tw={"p-0 m-0"}>{actualChange}</p>
            <p tw={"p-0 m-0"}>({percentChange})</p>
            <p tw={"p-0 m-0 flex items-center"}>
							{
								percentChange > 0 ?
								<svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
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
									:
              <svg
							xmlns="http://www.w3.org/2000/svg"
							width="54"
							height="54"
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
						}
              today
            </p>
          </div>
        </div>
      </div>
    ),

    {
      width: 1146,
      height: 600,
    }
  );
}
