import * as token from "@solana/spl-token";
import * as anchor from "@project-serum/anchor";
import { UserDeposit } from "../target/types/user_deposit";
import process from "process";

describe("nolosslottery",  () => {
    const provider = anchor.Provider.env();
    anchor.setProvider(provider);
    const user_deposit_program = anchor.workspace.UserDeposit as anchor.Program<UserDeposit>;

    let ticket;
    let receiver_token;
    let destinationCollateralAccount_token =
        new anchor.web3.PublicKey("4hMXQHS7ReThpchXwnKHZhWoai88QGCJRPLiC9Jp57WS");
    const payer = anchor.web3.Keypair.fromSecretKey(
        Buffer.from(
            JSON.parse(
                require("fs").readFileSync(process.env.ANCHOR_WALLET, {
                    encoding: "utf-8",
                })
            )
        )
    );
    console.log(process.env.ANCHOR_WALLET);

    it('Initializes program state', async () => {
        await provider.connection.requestAirdrop(
            payer.publicKey,
            anchor.web3.LAMPORTS_PER_SOL * 10
        )

        await provider.send(
            (() => {
                const tx = new anchor.web3.Transaction();
                tx.add(
                    anchor.web3.SystemProgram.transfer({
                        fromPubkey: payer.publicKey,
                        toPubkey: payer.publicKey,
                        lamports: 950000000,
                    }))
                provider.wallet.signTransaction(tx)
                return tx;
            })(),
        );

        ticket = await token.createMint(
            provider.connection,
            payer, // fee payer
            payer.publicKey, // mint authority
            payer.publicKey, // owner
            8 // decimals
        );

        receiver_token = await token.createAssociatedTokenAccount(
            provider.connection,
            payer, // fee payer
            ticket, // mint
            payer.publicKey // owner,
        );
    });

    it('Deposits and gets tickets', async () => {
        let amount = new anchor.BN(1);
        await user_deposit_program.rpc.deposit(amount, {
            accounts: {
                sender: payer.publicKey, // mint authority
                sourceLiquidity: payer.publicKey,
                destinationCollateralAccount: destinationCollateralAccount_token,
                transferAuthority: payer.publicKey,
                receiverTicket: receiver_token,
                ticket: ticket, // mint
                tokenProgram: user_deposit_program.programId,
            },
        })
        console.log("Collateral balance: ", await user_deposit_program
            .provider.connection.getTokenAccountBalance(destinationCollateralAccount_token));
        console.log("User token balance: ", await user_deposit_program
            .provider.connection.getTokenAccountBalance(receiver_token));
    })
});
