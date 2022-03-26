import * as token from "@solana/spl-token";
import * as anchor from "@project-serum/anchor";
import { UserDeposit } from "../target/types/user_deposit";
import process from "process";
import * as assert from "assert";

describe("nolosslottery",  () => {
    const provider = anchor.Provider.env();
    anchor.setProvider(provider);
    const user_deposit_program = anchor.workspace.UserDeposit as anchor.Program<UserDeposit>;

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

    const lending_program = new anchor.web3.PublicKey("ALend7Ketfx5bxh6ghsCDXAoDrhvEmsXT3cynB6aPLgx");
    const reserve = new anchor.web3.PublicKey("5VVLD7BQp8y3bTgyF5ezm1ResyMTR3PhYsT4iHFU8Sxz");
    const reserve_collateral_mint = new anchor.web3.PublicKey("FzwZWRMc3GCqjSrcpVX3ueJc6UpcV6iWWb7ZMsTXE3Gf");
    const reserve_liquidity_supply = new anchor.web3.PublicKey("furd3XUtjXZ2gRvSsoUts9A5m8cMJNqdsyR2Rt8vY9s");
    const lending_market = new anchor.web3.PublicKey("GvjoVKNjBvQcFaSKUW1gTE7DxhSpjHbE69umVR5nPuQp");
    let lending_market_authority;
    let _;
    it('Initializes program accounts', async () => {
        await provider.connection.requestAirdrop(
            payer.publicKey,
            anchor.web3.LAMPORTS_PER_SOL * 10
        );

        [lending_market_authority, _] = await anchor.web3.PublicKey.findProgramAddress(
            [lending_market.toBuffer()],
            lending_program
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
        console.log("ACC ", receiver_token)
        console.log("ACC ", destinationCollateralAccount_token)
    });

    it('Initializes', async () => {
        const [userAccount, userAccountBump] =
            await anchor.web3.PublicKey.findProgramAddress(
                [anchor.utils.bytes.utf8.encode("nolosslottery"),
                    payer.publicKey.toBuffer(),],
                user_deposit_program.programId
            );

        try {
            await user_deposit_program.rpc.initUserDeposit(
                userAccountBump,
                {
                    accounts: {
                        signer: payer.publicKey,
                        userDepositAccount: userAccount,
                        systemProgram: anchor.web3.SystemProgram.programId,
                    },
                });

            const userState = await user_deposit_program.account.userDeposit.fetch(userAccount);
            assert.ok(userState.total.toString() == "0");
        } catch (e) { } // already initialized
    });

    it('Deposits and gets tickets', async () => {
        const [userAccount, userAccountBump] =
            await anchor.web3.PublicKey.findProgramAddress(
                [anchor.utils.bytes.utf8.encode("nolosslottery"),
                    payer.publicKey.toBuffer(),],
                user_deposit_program.programId
            );

        let amount = new anchor.BN(1);

        await user_deposit_program.rpc.deposit(amount, {
            accounts: {
                sourceLiquidity: source_token.address,
                destinationCollateralAccount: destinationCollateralAccount_token.address,
                transferAuthority: payer.publicKey,

                userDepositAccount: userAccount,

                sender: payer.publicKey, // mint authority
                receiverTicket: receiver_token,
                ticket: ticket, // mint
                tokenProgram: token.TOKEN_PROGRAM_ID,
            },
        })
        console.log("Collateral balance: ", await user_deposit_program
            .provider.connection.getTokenAccountBalance(destinationCollateralAccount_token.address));
        console.log("User token balance: ", await user_deposit_program
            .provider.connection.getTokenAccountBalance(receiver_token));
        console.log("User deposit state: ", await user_deposit_program
            .account.userDeposit.fetch(userAccount));
    })

    it('Withdraws and burns tickets', async () => {
        const [userAccount, userAccountBump] =
            await anchor.web3.PublicKey.findProgramAddress(
                [anchor.utils.bytes.utf8.encode("nolosslottery"),
                    payer.publicKey.toBuffer(),],
                user_deposit_program.programId
            );

        let amount = new anchor.BN(1);

        await user_deposit_program.rpc.withdraw(amount, {
            accounts: {
                sourceCollateralAccount: destinationCollateralAccount_token.address,
                destinationLiquidity: source_token.address,
                transferAuthority: payer.publicKey,

                userDepositAccount: userAccount,

                sender: payer.publicKey, // mint authority
                senderTicket: receiver_token,
                ticket: ticket, // mint
                tokenProgram: token.TOKEN_PROGRAM_ID,
            },
        })
        console.log("Collateral balance: ", await user_deposit_program
            .provider.connection.getTokenAccountBalance(destinationCollateralAccount_token.address));
        console.log("User token balance: ", await user_deposit_program
            .provider.connection.getTokenAccountBalance(receiver_token));
        console.log("User deposit state: ", await user_deposit_program
            .account.userDeposit.fetch(userAccount));
    })
});
