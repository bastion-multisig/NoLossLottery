import * as token from "@solana/spl-token";
import * as anchor from "@project-serum/anchor";
import * as helpers from "./helpers";
import {ConfirmOptions, Connection, Keypair, PublicKey, Signer} from "@solana/web3.js";
import {TOKEN_PROGRAM_ID} from "@solana/spl-token/src/constants";

describe("nolosslottery",  () => {
    const connection = anchor.Provider.env().connection;

    const provider = helpers.getProvider(
        connection,
        anchor.web3.Keypair.generate(),
        );
    const user_deposit_program = helpers.getProgram(
        provider,
        "../target/idl/user_deposit.json",
    )

    const payer = anchor.web3.Keypair.generate();
    const ticketAuthority = anchor.web3.Keypair.generate();
    const receiver = anchor.web3.Keypair.generate();
    const destinationCollateralAccount = anchor.web3.Keypair.generate();
    let ticket;
    let csol;
    let receiver_token;
    let destinationCollateralAccount_token;

    it('Initializes program state', async () => {
        await provider.connection.confirmTransaction(
            await provider.connection.requestAirdrop(
                provider.wallet.publicKey,
                1000000000),
        );

        await provider.send(
            (() => {
                const tx = new anchor.web3.Transaction();
                tx.add(
                    anchor.web3.SystemProgram.transfer({
                        fromPubkey: provider.wallet.publicKey,
                        toPubkey: payer.publicKey,
                        lamports: 900000000,
                    }))
                provider.wallet.signTransaction(tx)
                return tx;
            })(),
        );

        await provider.send(
            (() => {
                const tx = new anchor.web3.Transaction();
                tx.add(
                    anchor.web3.SystemProgram.transfer({
                        fromPubkey: payer.publicKey,
                        toPubkey: receiver.publicKey,
                        lamports: 100000000,
                    }),
                    anchor.web3.SystemProgram.transfer({
                        fromPubkey: payer.publicKey,
                        toPubkey: destinationCollateralAccount.publicKey,
                        lamports: 100000000,
                    })
                );
                return tx;
            })(),
            [payer]
        );

        csol = await token.getMint(
            connection,
            new anchor.web3.PublicKey("FzwZWRMc3GCqjSrcpVX3ueJc6UpcV6iWWb7ZMsTXE3Gf")
        )

        ticket = await token.createMint(
            provider.connection,
            payer,
            ticketAuthority.publicKey,
            null,
            0,
        );

        // = await ticket.createAccount(
        //             receiver.publicKey);
        receiver_token = await token.createAccount(
            connection,
            payer,
            ticket,
            receiver.publicKey,
            null,
            null,
            token.TOKEN_PROGRAM_ID
        )
        destinationCollateralAccount_token = await token.createAccount(
            connection,
            payer,
            ticket,
            destinationCollateralAccount.publicKey,
            null,
            null,
            token.TOKEN_PROGRAM_ID
        )
    });

    it('Deposits and gets tickets', async () => {
        let amount = new anchor.BN(10);
        await user_deposit_program.rpc.deposit(amount, {
            accounts: {
                sender: ticketAuthority.publicKey, // mint authority
                sourceLiquidity: user_deposit_program.provider.wallet.publicKey,
                destinationCollateralAccount: destinationCollateralAccount_token,
                transferAuthority: ticketAuthority.publicKey,
                receiverTicket: receiver_token,
                ticket: ticket, // mint
                tokenProgram: token.TOKEN_PROGRAM_ID,
            },
            signers: [ticketAuthority]
        })
        console.log("Collateral balance: ", await user_deposit_program
            .provider.connection.getTokenAccountBalance(destinationCollateralAccount_token));
        console.log("User token balance: ", await user_deposit_program
            .provider.connection.getTokenAccountBalance(receiver_token));
    })
});
