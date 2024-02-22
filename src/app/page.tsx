import Moralis from "moralis";
import { EvmChain } from "@moralisweb3/common-evm-utils";

// Your code here
const address = "0xAC1Bd2486aAf3B5C0fc3Fd868558b082a531B2B4";

const chain = EvmChain.BASE;

export default async function Home() {


  await Moralis.start({
    apiKey: "jBo2biMfqlNlXRSaTNSEeJwLSOHs0iToM9O97mWbWz0imjPJxaCYf2DGGHCuxrNF",
    // ...and any other configuration
  });

  const response = await Moralis.EvmApi.token.getTokenPrice({
    chain,
     include: "percent_change",
     address
   });


   console.log(response.toJSON());



   return <div>{JSON.stringify(response.toJSON(), null, 2)}</div>;
}
