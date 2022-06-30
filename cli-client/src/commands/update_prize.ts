import type {Arguments, CommandBuilder} from 'yargs';
import * as anchor from "@project-serum/anchor";
import { Nolosslottery } from "../types/nolosslottery";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";

type Options = {
    key: string;
};

const DEVNET = "https://api.devnet.solana.com"

export const builder: CommandBuilder<Options, Options> = (yargs) =>
    yargs
        .positional('key', { type: 'string', demandOption: true })


export const handler = async (argv: Arguments<Options>): Promise<void> => {
    const payer = anchor.web3.Keypair.fromSecretKey(
        Buffer.from(
            JSON.parse(
                require("fs").readFileSync(argv.key, {
                    encoding: "utf-8",
                })
            )
        )
    );

    const provider = new anchor.AnchorProvider(
        new anchor.web3.Connection(DEVNET, anchor.AnchorProvider.defaultOptions().commitment),
        new NodeWallet(payer),
        anchor.AnchorProvider.defaultOptions(),
    );
    anchor.setProvider(provider);

    const reserve = new anchor.web3.PublicKey("5VVLD7BQp8y3bTgyF5ezm1ResyMTR3PhYsT4iHFU8Sxz");
    const reserve_collateral_mint = new anchor.web3.PublicKey("FzwZWRMc3GCqjSrcpVX3ueJc6UpcV6iWWb7ZMsTXE3Gf");

    const nolosslottery = anchor.workspace.Nolosslottery as anchor.Program<Nolosslottery>;

    console.log("Updating prize..........")

    const [lotteryAccount] =
        await anchor.web3.PublicKey.findProgramAddress(
            [anchor.utils.bytes.utf8.encode("nolosslottery"),
                reserve_collateral_mint.toBuffer()],
            nolosslottery.programId
        );

    let lotteryState = await nolosslottery.account.lottery.fetch(lotteryAccount);

    let tx = await nolosslottery.rpc.calculatePrize({
        accounts: {
            lotteryAccount: lotteryAccount,
            collateralMint: reserve_collateral_mint,
            collateralAccount: lotteryState.collateralAccount,
            reserve: reserve,
        },
    })

    lotteryState = await nolosslottery.account.lottery.fetch(lotteryAccount);

    console.log("TX:", tx);
    console.log(
        "Prize: ", lotteryState.prize.toString(),
    )
};
