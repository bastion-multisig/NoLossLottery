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

    const reserve_collateral_mint = new anchor.web3.PublicKey("FzwZWRMc3GCqjSrcpVX3ueJc6UpcV6iWWb7ZMsTXE3Gf");

    const nolosslottery = anchor.workspace.Nolosslottery as anchor.Program<Nolosslottery>;

    console.log("Payout..........")

    const [lotteryAccount] =
        await anchor.web3.PublicKey.findProgramAddress(
            [anchor.utils.bytes.utf8.encode("nolosslottery"),
                reserve_collateral_mint.toBuffer()],
            nolosslottery.programId
        );

    let lotteryState = await nolosslottery.account.lottery.fetch(lotteryAccount);
    const winningTicket = await nolosslottery.account.ticket.fetch(lotteryState.winningTicket);

    let transaction = new anchor.web3.Transaction();

    let prize = lotteryState.prize.toNumber();
    let price = lotteryState.ticketPrice.toNumber();
    let i = 0;
    while (prize >= price) {
        let [ticketAccount] =
            await anchor.web3.PublicKey.findProgramAddress(
                [anchor.utils.bytes.utf8.encode("ticket#"),
                    reserve_collateral_mint.toBuffer(),
                    anchor.utils.bytes.utf8.encode(lotteryState.totalTickets.addn(i).toString())],
                nolosslottery.programId);

        transaction.add(
            nolosslottery.instruction.payout({
                accounts: {
                    winningTicket: lotteryState.winningTicket,
                    lotteryAccount: lotteryAccount,
                    userDepositAccount: winningTicket.owner,
                    ticketAccount: ticketAccount,
                    sender: payer.publicKey,
                    systemProgram: anchor.web3.SystemProgram.programId,
                },
            })
        )

        if ((i % 10) == 0) {
            const tx = await anchor.web3.sendAndConfirmTransaction(
                provider.connection,
                transaction,
                [payer],
                { commitment: 'confirmed' }
            );
            console.log("Chunk: ", i)
            console.log("TX:", tx)
            transaction = new anchor.web3.Transaction();
        }

        prize -= price;
        i++;
    }
    console.log("Sent ", i, " tickets")
    console.log("To ", winningTicket.owner.toString())

    const tx = await anchor.web3.sendAndConfirmTransaction(
        provider.connection,
        transaction,
        [payer],
        { commitment: 'confirmed' }
    );
    console.log("TX:", tx)
};
