import * as token from "@solana/spl-token";
import * as anchor from "@project-serum/anchor";
import { Nolosslottery } from "../target/types/nolosslottery";
import process from "process";
import 'core-js/features/array/at';

describe("nolosslottery",  () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    const nolosslottery = anchor.workspace.Nolosslottery as anchor.Program<Nolosslottery>;
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
    const sender_account = anchor.web3.Keypair.generate();
    const lending_program = new anchor.web3.PublicKey("ALend7Ketfx5bxh6ghsCDXAoDrhvEmsXT3cynB6aPLgx");
    const reserve = new anchor.web3.PublicKey("5VVLD7BQp8y3bTgyF5ezm1ResyMTR3PhYsT4iHFU8Sxz");
    const reserve_collateral_mint = new anchor.web3.PublicKey("FzwZWRMc3GCqjSrcpVX3ueJc6UpcV6iWWb7ZMsTXE3Gf");
    const reserve_liquidity_supply = new anchor.web3.PublicKey("furd3XUtjXZ2gRvSsoUts9A5m8cMJNqdsyR2Rt8vY9s");
    const lending_market = new anchor.web3.PublicKey("GvjoVKNjBvQcFaSKUW1gTE7DxhSpjHbE69umVR5nPuQp");
    let lending_market_authority;
    let lending_market_authority_bump;

    const vrf_account = new anchor.web3.PublicKey("6w5aF8BWXokuWGGrENUmDeTcgBxtGm3AWwHJi9HJ19W3");
    const sender = new anchor.web3.PublicKey("AD31rHMdU6Xyt8oDY5C3njQwkMaQbQgAnK2EvYb1jo3d");
    it('Initializes program state', async () => {
        [lending_market_authority, lending_market_authority_bump] = await anchor.web3.PublicKey.findProgramAddress(
            [lending_market.toBuffer()],
            lending_program
        );

        destinationCollateralAccount_token =
            await token.getOrCreateAssociatedTokenAccount(
                provider.connection,
                payer, // fee payer
                reserve_collateral_mint,
                payer.publicKey // owner,
            );

        await provider.connection.requestAirdrop(sender_account.publicKey, anchor.web3.LAMPORTS_PER_SOL)

        source_token = await token.getOrCreateAssociatedTokenAccount(
                provider.connection,
                payer, // fee payer
                token.NATIVE_MINT, // mint
                sender_account.publicKey // owner,
            );

        const solTransferTransaction = new anchor.web3.Transaction()
            .add(
                anchor.web3.SystemProgram.transfer({
                    fromPubkey: payer.publicKey,
                    toPubkey: source_token.address,
                    lamports: anchor.web3.LAMPORTS_PER_SOL * 4
                }),
                token.createSyncNativeInstruction(
                    source_token.address
                )
            )

        await anchor.web3.sendAndConfirmTransaction(
            provider.connection,
            solTransferTransaction,
            [payer]);

        console.log("Destination Account Balance ",
            (await provider.connection.getTokenAccountBalance(destinationCollateralAccount_token.address)).value.uiAmount)
        console.log("Source Account Balance ",
            (await provider.connection.getTokenAccountBalance(source_token.address)).value.uiAmount)
    });

    it('Initializes the lottery', async () => {
        const [lotteryAccount, lotteryAccountBump] =
            await anchor.web3.PublicKey.findProgramAddress(
                [anchor.utils.bytes.utf8.encode("nolosslottery"),
                    reserve_collateral_mint.toBuffer(),],
                nolosslottery.programId
            );
        try {
            await nolosslottery.rpc.initLottery(
                lotteryAccountBump,
                new anchor.BN(1_000_000_000),
                reserve_collateral_mint,
                vrf_account,
                destinationCollateralAccount_token.address,
                {
                    accounts: {
                        signer: payer.publicKey,
                        lotteryAccount: lotteryAccount,
                        systemProgram: anchor.web3.SystemProgram.programId,
                    },
                });
        } catch (e) { } // already initialized
        console.log("LOTTERY WINNING TIME: ", (await nolosslottery.account.lottery.fetch(lotteryAccount)).lastCall.toString())
    })

    it("Initializes user's state", async () => {
        const [userAccount, userAccountBump] =
            await anchor.web3.PublicKey.findProgramAddress(
                [anchor.utils.bytes.utf8.encode("lottery"),
                    reserve_collateral_mint.toBuffer(),
                    sender_account.publicKey.toBuffer(),],
                nolosslottery.programId
            );
        const [lotteryAccount] =
            await anchor.web3.PublicKey.findProgramAddress(
                [anchor.utils.bytes.utf8.encode("nolosslottery"),
                    reserve_collateral_mint.toBuffer(),],
                nolosslottery.programId
            );
        try {
            await nolosslottery.rpc.initUserDeposit(
                userAccountBump,
                {
                    accounts: {
                        signer: sender_account.publicKey,
                        userDepositAccount: userAccount,
                        lotteryAccount: lotteryAccount,
                        ctokenMint: reserve_collateral_mint,
                        systemProgram: anchor.web3.SystemProgram.programId,
                    },

                    signers: [sender_account]
                });
        } catch (e) { } // already initialized
    });

    it('Deposits and gets tickets', async () => {
        const [userAccount] =
            await anchor.web3.PublicKey.findProgramAddress(
                [anchor.utils.bytes.utf8.encode("lottery"),
                    reserve_collateral_mint.toBuffer(),
                    sender_account.publicKey.toBuffer(),],
                nolosslottery.programId
            );
        let [lotteryAccount] =
            await anchor.web3.PublicKey.findProgramAddress(
                [anchor.utils.bytes.utf8.encode("nolosslottery"),
                    reserve_collateral_mint.toBuffer()],
                nolosslottery.programId
            );

        let lottery_state = await nolosslottery
            .account.lottery.fetch(lotteryAccount);

        const transaction = new anchor.web3.Transaction();

        for (let i in [0, 1, 2]) {
            let [ticketAccount] =
                await anchor.web3.PublicKey.findProgramAddress(
                    [anchor.utils.bytes.utf8.encode("ticket#"),
                        reserve_collateral_mint.toBuffer(),
                        anchor.utils.bytes.utf8.encode(
                            lottery_state.totalTickets.add(new anchor.BN(i)).toString()
                        )],
                    nolosslottery.programId
                );

            let tx = await nolosslottery.instruction.deposit({
                accounts: {
                    sourceLiquidity: source_token.address,
                    destinationCollateralAccount: destinationCollateralAccount_token.address,
                    lendingProgram: lending_program,
                    lendingMarket: lending_market,
                    reserve: reserve,
                    reserveCollateralMint: reserve_collateral_mint,
                    reserveLiquiditySupply: reserve_liquidity_supply,
                    lendingMarketAuthority: lending_market_authority,
                    transferAuthority: sender_account.publicKey,
                    clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,

                    userDepositAccount: userAccount,
                    lotteryAccount: lotteryAccount,

                    ticketAccount: ticketAccount,
                    tokenProgram: token.TOKEN_PROGRAM_ID,
                    systemProgram: anchor.web3.SystemProgram.programId,
                },
            })

            transaction.add(tx);
        }

        const hash = await provider.send(transaction, [sender_account], { commitment: 'confirmed' });
        console.log("TX multiple:", hash)

        console.log("Collateral balance: ", (await nolosslottery
            .provider.connection.getTokenAccountBalance(destinationCollateralAccount_token.address)).value.uiAmount);
        console.log("User SOL balance: ", (await nolosslottery
            .provider.connection.getTokenAccountBalance(source_token.address)).value.uiAmount);
        console.log("User deposit state: ", await nolosslottery
            .account.userDeposit.fetch(userAccount));
        console.log("Lottery state: ", await nolosslottery
            .account.lottery.fetch(lotteryAccount));
    })

    it('Provides liquidity', async () => {
        let [lotteryAccount] =
            await anchor.web3.PublicKey.findProgramAddress(
                [anchor.utils.bytes.utf8.encode("nolosslottery"),
                    reserve_collateral_mint.toBuffer()],
                nolosslottery.programId
            );

        let lottery_state = await nolosslottery
            .account.lottery.fetch(lotteryAccount);
        console.log("Lottery state: ", lottery_state);

        let tx = await nolosslottery.rpc.provide(
            new anchor.BN(0.5 * anchor.web3.LAMPORTS_PER_SOL),
            {
                accounts: {
                    sourceLiquidity: source_token.address,
                    destinationCollateralAccount: destinationCollateralAccount_token.address,
                    lendingProgram: lending_program,
                    lendingMarket: lending_market,
                    reserve: reserve,
                    reserveCollateralMint: reserve_collateral_mint,
                    reserveLiquiditySupply: reserve_liquidity_supply,
                    lendingMarketAuthority: lending_market_authority,
                    transferAuthority: sender_account.publicKey,
                    clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,

                    lotteryAccount: lotteryAccount,

                    tokenProgram: token.TOKEN_PROGRAM_ID,
                    systemProgram: anchor.web3.SystemProgram.programId,
                },
                signers: [sender_account]
            }
        )
        console.log("TX:", tx)

        console.log("Collateral balance: ", (await nolosslottery
            .provider.connection.getTokenAccountBalance(destinationCollateralAccount_token.address)).value.uiAmount);
        console.log("User SOL balance: ", (await nolosslottery
            .provider.connection.getTokenAccountBalance(source_token.address)).value.uiAmount);
        console.log("Lottery state: ", await nolosslottery
            .account.lottery.fetch(lotteryAccount));
    })

    it('Withdraws and burns tickets', async () => {
        const [userAccount] =
            await anchor.web3.PublicKey.findProgramAddress(
                [anchor.utils.bytes.utf8.encode("lottery"),
                    reserve_collateral_mint.toBuffer(),
                    sender_account.publicKey.toBuffer(),],
                nolosslottery.programId
            );
        const [lotteryAccount] =
            await anchor.web3.PublicKey.findProgramAddress(
                [anchor.utils.bytes.utf8.encode("nolosslottery"),
                    reserve_collateral_mint.toBuffer()],
                nolosslottery.programId
            );

        const transaction = new anchor.web3.Transaction();

        for (var i = 0; i < 2; i++) {
            let lottery_state = await nolosslottery.account.lottery.fetch(lotteryAccount);

            let user_state = await nolosslottery
                .account.userDeposit.fetch(userAccount);
            let [ticketAccount] =
                await anchor.web3.PublicKey.findProgramAddress(
                    [anchor.utils.bytes.utf8.encode("ticket#"),
                        reserve_collateral_mint.toBuffer(),
                        anchor.utils.bytes.utf8.encode(
                            user_state.ticketIds.at(i).toString())],
                    nolosslottery.programId
                );
            let [lastTicketAccount] =
                await anchor.web3.PublicKey.findProgramAddress(
                    [anchor.utils.bytes.utf8.encode("ticket#"),
                        reserve_collateral_mint.toBuffer(),
                        anchor.utils.bytes.utf8.encode(
                            lottery_state.totalTickets.add(new anchor.BN(-1 - i)).toString())],
                    nolosslottery.programId
                );
            let lastTicketOwnerAccount = (await nolosslottery.account.ticket.fetch(lastTicketAccount)).owner


            let tx = await nolosslottery.instruction.withdraw({
                accounts: {
                    destinationLiquidityAccount: source_token.address,
                    sourceCollateralAccount: destinationCollateralAccount_token.address,
                    lendingProgram: lending_program,
                    lendingMarket: lending_market,
                    reserve: reserve,
                    reserveCollateralMint: reserve_collateral_mint,
                    reserveLiquiditySupply: reserve_liquidity_supply,
                    lendingMarketAuthority: lending_market_authority,
                    transferAuthority: payer.publicKey,
                    clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,

                    lotteryAccount: lotteryAccount,
                    userDepositAccount: userAccount,
                    ticketAccount: ticketAccount,
                    lastTicketOwnerAccount: lastTicketOwnerAccount,
                    lastTicketAccount: lastTicketAccount,

                    sender: sender,
                    tokenProgram: token.TOKEN_PROGRAM_ID,
                },
            })

            transaction.add(tx);
        }

        const hash = await provider.send(transaction,
            // payer is the owner of the destinationCollateralAccount_token
            [payer],
            { commitment: 'confirmed' });

        console.log("TX multiple:", hash)

        console.log("Collateral balance: ", (await nolosslottery
            .provider.connection.getTokenAccountBalance(destinationCollateralAccount_token.address)).value.uiAmount);
        console.log("User SOL balance: ", (await nolosslottery
            .provider.connection.getTokenAccountBalance(source_token.address)).value.uiAmount);
        console.log("User deposit state: ", await nolosslottery
            .account.userDeposit.fetch(userAccount));
    })

    it('Raffles', async () => {
        const [lotteryAccount] =
            await anchor.web3.PublicKey.findProgramAddress(
                [anchor.utils.bytes.utf8.encode("nolosslottery"),
                    reserve_collateral_mint.toBuffer()],
                nolosslottery.programId
            );

        let tx = await nolosslottery.rpc.lottery({
            accounts: {
                lotteryAccount: lotteryAccount,
                collateralMint: reserve_collateral_mint,
                collateralAccount: destinationCollateralAccount_token.address,
                reserve: reserve,
                vrf: vrf_account,
            },
        })
        console.log("TX:", tx);
        let lottery_state = await nolosslottery
            .account.lottery.fetch(lotteryAccount);

        if (lottery_state.prize.eqn(0)) {
            return;
        }

        console.log("Lottery state: ", lottery_state);
        const [userAccount] =
            await anchor.web3.PublicKey.findProgramAddress(
                [anchor.utils.bytes.utf8.encode("lottery"),
                    reserve_collateral_mint.toBuffer(),
                    sender_account.publicKey.toBuffer(),],
                nolosslottery.programId
            );

        console.log("Winning ticket state: ",
            await nolosslottery.account.ticket.fetch(lottery_state.winningTicket));
        let [ticketAccount] =
            await anchor.web3.PublicKey.findProgramAddress(
                [anchor.utils.bytes.utf8.encode("ticket#"),
                    reserve_collateral_mint.toBuffer(),
                    anchor.utils.bytes.utf8.encode(lottery_state.totalTickets.toString())], nolosslottery.programId);
        tx = await nolosslottery.rpc.payout({
            accounts: {
                winningTicket: lottery_state.winningTicket,
                lotteryAccount: lotteryAccount,
                userDepositAccount: userAccount,
                ticketAccount: ticketAccount,
                sender: payer.publicKey, // mint authority
                systemProgram: anchor.web3.SystemProgram.programId,
            },
        })
        console.log("TX:", tx)
        console.log("Lottery state: ", await nolosslottery
        .account.lottery.fetch(lotteryAccount));
    })
});
