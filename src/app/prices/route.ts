import Moralis from "moralis";
import { EvmChain } from "@moralisweb3/common-evm-utils";
import { NextRequest, NextResponse } from "next/server";

// Your code here
const address = "0xAC1Bd2486aAf3B5C0fc3Fd868558b082a531B2B4";

const chain = EvmChain.BASE;

export async function GET(request: NextRequest) {
	await Moralis.start({
		apiKey: "jBo2biMfqlNlXRSaTNSEeJwLSOHs0iToM9O97mWbWz0imjPJxaCYf2DGGHCuxrNF",
		// ...and any other configuration
	});
  const response = await Moralis.EvmApi.token.getTokenPrice({
    chain,
    include: "percent_change",
    address,
  });

  console.log(response.toJSON());
	return NextResponse.json(response.toJSON())

}
