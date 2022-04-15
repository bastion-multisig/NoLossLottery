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

    console.log("Payout....")

    let lottery_state = await nolosslottery
        .account.lottery.fetch(lotteryAccount);

    if (lottery_state.winningTicket === undefined) {
        console.log("No winner!");
        process.exit(1)
    }

    if (lottery_state.prize.toString() === "0" || lottery_state.prize === undefined) {
        console.log("No prize!");
        process.exit(1)
    }

    const [userAccount, _userAccountBump] =
        await anchor.web3.PublicKey.findProgramAddress(
            [anchor.utils.bytes.utf8.encode("nolosslottery"),
                payer.publicKey.toBuffer(),],
            nolosslottery.programId
        );

    let [ticketAccount, _ticketAccountBump] =
        await anchor.web3.PublicKey.findProgramAddress([anchor.utils.bytes.utf8.encode("ticket#"), anchor.utils.bytes.utf8.encode(lottery_state.totalTickets.toString())], nolosslottery.programId);

    let tx = await nolosslottery.rpc.payout({
        accounts: {
            winningTicket: lottery_state.winningTicket,
            lotteryAccount: lotteryAccount,
            userDepositAccount: userAccount,
            ticketAccount: ticketAccount,
            sender: payer.publicKey, // mint authority
            systemProgram: anchor.web3.SystemProgram.programId,
        },
    })

    console.log("Prize: ", lottery_state.prize.toString())
    console.log(`TX: https://explorer.solana.com/tx/${tx}?cluster=devnet`)
};
