import type {Arguments, CommandBuilder} from 'yargs';
import * as anchor from "@project-serum/anchor";
import { Nolosslottery } from "../types/nolosslottery";
import {NodeWallet} from "@project-serum/anchor/dist/cjs/provider";

type Options = {
    key: string;
};

const DEVNET = "https://api.devnet.solana.com"

export const builder: CommandBuilder<Options, Options> = (yargs) =>
    yargs
        .positional('key', { type: 'string', demandOption: true });

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
    const provider = new anchor.Provider(
        new anchor.web3.Connection(DEVNET, anchor.Provider.defaultOptions().commitment),
        new NodeWallet(payer),
        anchor.Provider.defaultOptions(),
    );
    anchor.setProvider(provider);

    const nolosslottery = anchor.workspace.Nolosslottery as anchor.Program<Nolosslottery>;

    const sourceCollateralAccount = new anchor.web3.PublicKey("9wBciX5pXv7ttGiHYtuaLAJGnFbLe7JjUtR4ZL4QdC4Z")
    let [lotteryAccount, _lotteryAccountBump] =
        await anchor.web3.PublicKey.findProgramAddress(
            [anchor.utils.bytes.utf8.encode("lottery")],
            nolosslottery.programId
        );

    console.log("Lottery....")

    const tx = await nolosslottery.rpc.lottery({
        accounts: {
            lotteryAccount: lotteryAccount,
            collateralMint: new anchor.web3.PublicKey("FzwZWRMc3GCqjSrcpVX3ueJc6UpcV6iWWb7ZMsTXE3Gf"), // mint
            collateralAccount: sourceCollateralAccount,
        },
    })

    let lottery_state = await nolosslottery.account.lottery.fetch(
        lotteryAccount);
    let ticket = await nolosslottery.account.ticket.fetch(lottery_state.winningTicket);

    console.log("Winner: ", ticket.owner.toJSON());
    console.log("Prize: ", lottery_state.prize.toString(), "tickets");

    console.log("TX: ", tx)
};
