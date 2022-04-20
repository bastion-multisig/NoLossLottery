import * as token from "@solana/spl-token";
import * as anchor from "@project-serum/anchor";
import { Nolosslottery } from "../target/types/nolosslottery";
import process from "process";
import * as assert from "assert";
import 'core-js/features/array/at';

describe("nolosslottery",  () => {
    const provider = anchor.Provider.env();
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
    const lending_program = new anchor.web3.PublicKey("ALend7Ketfx5bxh6ghsCDXAoDrhvEmsXT3cynB6aPLgx");
    const reserve = new anchor.web3.PublicKey("5VVLD7BQp8y3bTgyF5ezm1ResyMTR3PhYsT4iHFU8Sxz");
    const reserve_collateral_mint = new anchor.web3.PublicKey("FzwZWRMc3GCqjSrcpVX3ueJc6UpcV6iWWb7ZMsTXE3Gf");
    const reserve_liquidity_supply = new anchor.web3.PublicKey("furd3XUtjXZ2gRvSsoUts9A5m8cMJNqdsyR2Rt8vY9s");
    const lending_market = new anchor.web3.PublicKey("GvjoVKNjBvQcFaSKUW1gTE7DxhSpjHbE69umVR5nPuQp");
    let lending_market_authority;
    let lending_market_authority_bump;

    it('Initializes program state', async () => {
        [lending_market_authority, lending_market_authority_bump] = await anchor.web3.PublicKey.findProgramAddress(
            [lending_market.toBuffer()],
            lending_program
        );

        destinationCollateralAccount_token =
            await token.getOrCreateAssociatedTokenAccount(
                provider.connection,
                payer, // fee payer
                new anchor.web3.PublicKey("FzwZWRMc3GCqjSrcpVX3ueJc6UpcV6iWWb7ZMsTXE3Gf"), // mint
                payer.publicKey // owner,
            );

        source_token = await token.getOrCreateAssociatedTokenAccount(
                provider.connection,
                payer, // fee payer
                token.NATIVE_MINT, // mint
                payer.publicKey // owner,
            );

        const solTransferTransaction = new anchor.web3.Transaction()
            .add(
                anchor.web3.SystemProgram.transfer({
                    fromPubkey: payer.publicKey,
                    toPubkey: source_token.address,
                    lamports: anchor.web3.LAMPORTS_PER_SOL
                }),
                token.createSyncNativeInstruction(
                    source_token.address
                )
            )

        await anchor.web3.sendAndConfirmTransaction(
            provider.connection,
            solTransferTransaction,
            [payer]);

        console.log("Source Account Balance ",
            (await provider.connection.getTokenAccountBalance(source_token.address)).value.uiAmount)
    });

    it('Initializes', async () => {
        const [userAccount, userAccountBump] =
            await anchor.web3.PublicKey.findProgramAddress(
                [anchor.utils.bytes.utf8.encode("nolosslottery"),
                    payer.publicKey.toBuffer(),],
                nolosslottery.programId
            );

        try {
            await nolosslottery.rpc.initUserDeposit(
                userAccountBump,
                {
                    accounts: {
                        signer: payer.publicKey,
                        userDepositAccount: userAccount,
                        systemProgram: anchor.web3.SystemProgram.programId,
                    },
                });
        } catch (e) { } // already initialized

        const [lotteryAccount, lotteryAccountBump] =
            await anchor.web3.PublicKey.findProgramAddress(
                [anchor.utils.bytes.utf8.encode("lottery")],
                nolosslottery.programId
            );
        try {
            await nolosslottery.rpc.initLottery(
                lotteryAccountBump,
                {
                    accounts: {
                        signer: payer.publicKey,
                        lotteryAccount: lotteryAccount,
                        systemProgram: anchor.web3.SystemProgram.programId,
                    },
                });
        } catch (e) { } // already initialized
    });

    it('Deposits and gets tickets', async () => {
        const [userAccount, _userAccountBump] =
            await anchor.web3.PublicKey.findProgramAddress(
                [anchor.utils.bytes.utf8.encode("nolosslottery"),
                    payer.publicKey.toBuffer(),],
                nolosslottery.programId
            );
        let [lotteryAccount, _lotteryAccountBump] =
            await anchor.web3.PublicKey.findProgramAddress(
                [anchor.utils.bytes.utf8.encode("lottery")],
                nolosslottery.programId
            );

        let lottery_state = await nolosslottery
            .account.lottery.fetch(lotteryAccount);
        console.log("Lottery state: ", lottery_state);
        let [ticketAccount, _ticketAccountBump] =
            await anchor.web3.PublicKey.findProgramAddress(
                [anchor.utils.bytes.utf8.encode("ticket#"),
                    anchor.utils.bytes.utf8.encode(lottery_state.totalTickets.toString())],
                nolosslottery.programId
            );

        await nolosslottery.rpc.deposit({
            accounts: {
                sourceLiquidity: source_token.address,
                destinationCollateralAccount: destinationCollateralAccount_token.address,
                lendingProgram: lending_program,
                lendingMarket: lending_market,
                reserve: reserve,
                reserveCollateralMint: reserve_collateral_mint,
                reserveLiquiditySupply: reserve_liquidity_supply,
                lendingMarketAuthority: lending_market_authority,
                transferAuthority: payer.publicKey,
                clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,

                userDepositAccount: userAccount,
                lotteryAccount: lotteryAccount,
                ticketAccount: ticketAccount,

                sender: payer.publicKey, // mint authority
                tokenProgram: token.TOKEN_PROGRAM_ID,
                systemProgram: anchor.web3.SystemProgram.programId,
            },
        })

        lottery_state = await nolosslottery
            .account.lottery.fetch(lotteryAccount);
        console.log("Lottery state: ", lottery_state);
        [ticketAccount, _ticketAccountBump] =
            await anchor.web3.PublicKey.findProgramAddress(
                [anchor.utils.bytes.utf8.encode("ticket#"),
                    anchor.utils.bytes.utf8.encode(lottery_state.totalTickets.toString())],
                nolosslottery.programId
            );

        await nolosslottery.rpc.deposit({
            accounts: {
                sourceLiquidity: source_token.address,
                destinationCollateralAccount: destinationCollateralAccount_token.address,
                lendingProgram: lending_program,
                lendingMarket: lending_market,
                reserve: reserve,
                reserveCollateralMint: reserve_collateral_mint,
                reserveLiquiditySupply: reserve_liquidity_supply,
                lendingMarketAuthority: lending_market_authority,
                transferAuthority: payer.publicKey,
                clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,

                userDepositAccount: userAccount,
                lotteryAccount: lotteryAccount,

                sender: payer.publicKey, // mint authority
                ticketAccount: ticketAccount,
                tokenProgram: token.TOKEN_PROGRAM_ID,
                systemProgram: anchor.web3.SystemProgram.programId,
            },
        })

        console.log("Collateral balance: ", (await nolosslottery
            .provider.connection.getTokenAccountBalance(destinationCollateralAccount_token.address)).value.uiAmount);
        console.log("User SOL balance: ", (await nolosslottery
            .provider.connection.getTokenAccountBalance(source_token.address)).value.uiAmount);
        console.log("User deposit state: ", await nolosslottery
            .account.userDeposit.fetch(userAccount));
        console.log("Lottery state: ", await nolosslottery
            .account.lottery.fetch(lotteryAccount));
        console.log("Ticket state: ", await nolosslottery
            .account.ticket.fetch(ticketAccount));
    })

    it('Withdraws and burns tickets', async () => {
        const [userAccount, _userAccountBump] =
            await anchor.web3.PublicKey.findProgramAddress(
                [anchor.utils.bytes.utf8.encode("nolosslottery"),
                    payer.publicKey.toBuffer(),],
                nolosslottery.programId
            );
        const [lotteryAccount, _lotteryAccountBump] =
            await anchor.web3.PublicKey.findProgramAddress(
                [anchor.utils.bytes.utf8.encode("lottery")],
                nolosslottery.programId
            );
        let lottery_state = await nolosslottery.account.lottery.fetch(lotteryAccount);

        let user_state = await nolosslottery
            .account.userDeposit.fetch(userAccount);
        let [ticketAccount, _ticketAccountBump] =
            await anchor.web3.PublicKey.findProgramAddress(
                [anchor.utils.bytes.utf8.encode("ticket#"),
                    anchor.utils.bytes.utf8.encode(
                        user_state.ticketIds.at(0).toString())],
                nolosslottery.programId
            );
        let [lastTicketAccount, _lastTicketAccountBump] =
            await anchor.web3.PublicKey.findProgramAddress(
                [anchor.utils.bytes.utf8.encode("ticket#"),
                    anchor.utils.bytes.utf8.encode(
                        lottery_state.totalTickets.add(new anchor.BN(-1)).toString())],
                nolosslottery.programId
            );
        let lastTicketOwnerAccount = (await nolosslottery.account.ticket.fetch(lastTicketAccount)).owner

        await nolosslottery.rpc.withdraw({
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

                sender: payer.publicKey, // mint authority
                tokenProgram: token.TOKEN_PROGRAM_ID,
            },
        })
        console.log("Collateral balance: ", (await nolosslottery
            .provider.connection.getTokenAccountBalance(destinationCollateralAccount_token.address)).value.uiAmount);
        console.log("User SOL balance: ", (await nolosslottery
            .provider.connection.getTokenAccountBalance(source_token.address)).value.uiAmount);
        console.log("User deposit state: ", await nolosslottery
            .account.userDeposit.fetch(userAccount));

        lottery_state = await nolosslottery
            .account.lottery.fetch(lotteryAccount);
        console.log("Winning time: ", lottery_state.winningTime.toString());
        console.log("Prize: ", lottery_state.prize.toString());
        console.log("Total tickets: ", lottery_state.totalTickets.toString());
    })

    it('Raffles', async () => {
        const [lotteryAccount, _lotteryAccountBump] =
            await anchor.web3.PublicKey.findProgramAddress(
                [anchor.utils.bytes.utf8.encode("lottery")],
                nolosslottery.programId
            );

        await nolosslottery.rpc.lottery({
            accounts: {
                lotteryAccount: lotteryAccount,
                collateralMint: new anchor.web3.PublicKey("FzwZWRMc3GCqjSrcpVX3ueJc6UpcV6iWWb7ZMsTXE3Gf"), // mint
                collateralAccount: destinationCollateralAccount_token.address,
                clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
            },
        })
        let lottery_state = await nolosslottery
            .account.lottery.fetch(lotteryAccount);

        if (lottery_state.prize.eqn(0)) {
            return;
        }

        console.log("Lottery state: ", lottery_state);
        const [userAccount, _userAccountBump] =
            await anchor.web3.PublicKey.findProgramAddress(
                [anchor.utils.bytes.utf8.encode("nolosslottery"),
                    payer.publicKey.toBuffer(),],
                nolosslottery.programId
            );

        console.log("Winning ticket state: ",
            await nolosslottery.account.ticket.fetch(lottery_state.winningTicket));
        let [ticketAccount, _ticketAccountBump] =
            await anchor.web3.PublicKey.findProgramAddress([anchor.utils.bytes.utf8.encode("ticket#"), anchor.utils.bytes.utf8.encode(lottery_state.totalTickets.toString())], nolosslottery.programId);
        await nolosslottery.rpc.payout({
            accounts: {
                winningTicket: lottery_state.winningTicket,
                lotteryAccount: lotteryAccount,
                userDepositAccount: userAccount,
                ticketAccount: ticketAccount,
                sender: payer.publicKey, // mint authority
                systemProgram: anchor.web3.SystemProgram.programId,
            },
        })
    console.log("Lottery state: ", await nolosslottery
        .account.lottery.fetch(lotteryAccount));
    })
});
