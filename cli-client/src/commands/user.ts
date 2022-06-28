import type {Arguments, CommandBuilder} from 'yargs';
import * as anchor from "@project-serum/anchor";
import { Nolosslottery } from "../types/nolosslottery";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";

type Options = {
    key: string;
    user: string;
};

const DEVNET = "https://api.devnet.solana.com"

export const builder: CommandBuilder<Options, Options> = (yargs) =>
    yargs
        .positional('key', { type: 'string', demandOption: true })
        .positional('user', { type: 'string', demandOption: true });


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

    const nolosslottery = anchor.workspace.Nolosslottery as anchor.Program<Nolosslottery>;

    console.log("User: ")

    const [userAccount, userAccountBump] =
        await anchor.web3.PublicKey.findProgramAddress(
            [anchor.utils.bytes.utf8.encode("lottery"),
                (new anchor.web3.PublicKey("FzwZWRMc3GCqjSrcpVX3ueJc6UpcV6iWWb7ZMsTXE3Gf")).toBuffer(),
                (new anchor.web3.PublicKey(argv.user)).toBuffer(),],
            nolosslottery.programId
        );

    const user = await nolosslottery.account.userDeposit.fetch(userAccount);

    console.log(userAccount.toString());
    console.log(user.ticketIds.toString());
};
