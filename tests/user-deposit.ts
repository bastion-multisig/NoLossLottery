import * as token from "@solana/spl-token";
import * as anchor from "@project-serum/anchor";
import { UserDeposit } from "../target/types/user_deposit";
import { WithdrawDeposit } from "../target/types/withdraw_deposit";
import process from "process";

describe("nolosslottery",  () => {
    const provider = anchor.Provider.env();
    anchor.setProvider(provider);
    const user_deposit_program = anchor.workspace.UserDeposit as anchor.Program<UserDeposit>;
    const withdraw_deposit_program = anchor.workspace.WithdrawDeposit as anchor.Program<WithdrawDeposit>;

    let ticket;
    let receiver_token;
    let source_token;
    let destinationCollateralAccount_token;
    const payer = anchor.web3.Keypair.fromSecretKey(
        Buffer.from(
            JSON.parse(
                require("fs").readFileSync(process.env.ANCHOR_WALLET, {
                    encoding: "utf-8",
                })
            )
        )
    );

    it('Initializes program state', async () => {
        await provider.connection.requestAirdrop(
            payer.publicKey,
            anchor.web3.LAMPORTS_PER_SOL * 10
        )

        ticket = await token.createMint(
            provider.connection,
            payer, // fee payer
            payer.publicKey, // mint authority
            payer.publicKey, // owner
            0 // decimals
        );

        receiver_token = await token.createAssociatedTokenAccount(
            provider.connection,
            payer, // fee payer
            ticket, // mint
            payer.publicKey // owner,
        );
        source_token =
            await token.getOrCreateAssociatedTokenAccount(
                provider.connection,
                payer, // fee payer
                token.NATIVE_MINT, // mint
                payer.publicKey // owner,
        );
        destinationCollateralAccount_token =
            await token.getOrCreateAssociatedTokenAccount(
                provider.connection,
                payer, // fee payer
                new anchor.web3.PublicKey("FzwZWRMc3GCqjSrcpVX3ueJc6UpcV6iWWb7ZMsTXE3Gf"), // mint
                payer.publicKey // owner,
        );
        console.log("ACC ", source_token)
        console.log("ACC ", typeof receiver_token)
    });

    it('Deposits and gets tickets', async () => {
        let amount = new anchor.BN(1);

        await user_deposit_program.rpc.deposit(amount, {
            accounts: {
                sender: payer.publicKey, // mint authority
                sourceLiquidity: source_token.address,
                destinationCollateralAccount: destinationCollateralAccount_token.address,
                transferAuthority: payer.publicKey,
                receiverTicket: receiver_token,
                ticket: ticket, // mint
                tokenProgram: token.TOKEN_PROGRAM_ID,
            },
        })
        console.log("Collateral balance: ", await user_deposit_program
            .provider.connection.getTokenAccountBalance(destinationCollateralAccount_token.address));
        console.log("User token balance: ", await user_deposit_program
            .provider.connection.getTokenAccountBalance(receiver_token));
    })

    it('Withdraws and burns tickets', async () => {
        let amount = new anchor.BN(1);

        await withdraw_deposit_program.rpc.withdraw(amount, {
            accounts: {
                sender: payer.publicKey, // mint authority
                destinationLiquidity: source_token.address,
                sourceCollateralAccount: destinationCollateralAccount_token.address,
                transferAuthority: payer.publicKey,
                senderTicket: receiver_token,
                ticket: ticket, // mint
                tokenProgram: token.TOKEN_PROGRAM_ID,
            },
        })
        console.log("Collateral balance: ", await user_deposit_program
            .provider.connection.getTokenAccountBalance(destinationCollateralAccount_token.address));
        console.log("User token balance: ", await user_deposit_program
            .provider.connection.getTokenAccountBalance(receiver_token));
    })
});
