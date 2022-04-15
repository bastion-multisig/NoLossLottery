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

    const [userAccount, _userAccountBump] =
        await anchor.web3.PublicKey.findProgramAddress(
            [anchor.utils.bytes.utf8.encode("nolosslottery"),
                payer.publicKey.toBuffer(),],
            nolosslottery.programId
        );
    let user_state =
        await nolosslottery.account.userDeposit.fetch(userAccount);

    console.log("Balance: ", user_state.ticketIds.length, "tickets");
};
