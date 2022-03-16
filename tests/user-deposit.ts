import * as token from "@solana/spl-token";
import * as anchor from "@project-serum/anchor";
import { UserDeposit } from "../target/types/user_deposit";

describe("nolosslottery",  () => {
    const provider = anchor.Provider.env()
    anchor.setProvider(provider);
    const user_deposit_program = anchor.workspace.UserDeposit as anchor.Program<UserDeposit>;

    const ticket = anchor.web3.Keypair.generate();
    const receiver_token = anchor.web3.Keypair.generate();
    const destinationCollateralAccount_token = anchor.web3.Keypair.generate();

    it('Initializes program state', async () => {
        let tx = new anchor.web3.Transaction().add(
            anchor.web3.SystemProgram.createAccount({
                fromPubkey: user_deposit_program.provider.wallet.publicKey,
                newAccountPubkey: ticket.publicKey,
                space: token.MintLayout.span,
                lamports: await token.getMinimumBalanceForRentExemptAccount(provider.connection),
                programId: token.TOKEN_PROGRAM_ID,
            }),
            await token.createInitializeMintInstruction(
                ticket.publicKey,
                0,
                provider.wallet.publicKey,
                provider.wallet.publicKey,
            )
        )
        await provider.send(tx, [ticket])

        tx = new anchor.web3.Transaction();
        tx.add(
            await token.createInitializeAccountInstruction(
                receiver_token.publicKey,
                ticket.publicKey,
                provider.wallet.publicKey,
                null,
            )
        )
        await provider.send(tx, [receiver_token])

        tx = new anchor.web3.Transaction();
        tx.add(
            await token.createInitializeAccountInstruction(
                destinationCollateralAccount_token.publicKey,
                // CSOL
                new anchor.web3.PublicKey("FzwZWRMc3GCqjSrcpVX3ueJc6UpcV6iWWb7ZMsTXE3Gf"),
                provider.wallet.publicKey,
                null,
            )
        )
        await provider.send(tx, [destinationCollateralAccount_token])

    });

    it('Deposits and gets tickets', async () => {
        let amount = new anchor.BN(10);
        await user_deposit_program.rpc.deposit(amount, {
            accounts: {
                sender: provider.wallet.publicKey, // mint authority
                sourceLiquidity: user_deposit_program.provider.wallet.publicKey,
                destinationCollateralAccount: destinationCollateralAccount_token,
                transferAuthority: provider.wallet.publicKey,
                receiverTicket: receiver_token,
                ticket: ticket, // mint
                tokenProgram: token.TOKEN_PROGRAM_ID,
            },
        })
        console.log("Collateral balance: ", await user_deposit_program
            .provider.connection.getTokenAccountBalance(destinationCollateralAccount_token.publicKey));
        console.log("User token balance: ", await user_deposit_program
            .provider.connection.getTokenAccountBalance(receiver_token.publicKey));
    })
});
