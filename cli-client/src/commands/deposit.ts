import type {Arguments, CommandBuilder} from 'yargs';
import * as anchor from "@project-serum/anchor";
import { Nolosslottery } from "../types/nolosslottery";
import * as token from "@solana/spl-token";
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

    const lending_program = new anchor.web3.PublicKey("ALend7Ketfx5bxh6ghsCDXAoDrhvEmsXT3cynB6aPLgx");
    const reserve = new anchor.web3.PublicKey("5VVLD7BQp8y3bTgyF5ezm1ResyMTR3PhYsT4iHFU8Sxz");
    const reserve_collateral_mint = new anchor.web3.PublicKey("FzwZWRMc3GCqjSrcpVX3ueJc6UpcV6iWWb7ZMsTXE3Gf");
    const reserve_liquidity_supply = new anchor.web3.PublicKey("furd3XUtjXZ2gRvSsoUts9A5m8cMJNqdsyR2Rt8vY9s");
    const lending_market = new anchor.web3.PublicKey("GvjoVKNjBvQcFaSKUW1gTE7DxhSpjHbE69umVR5nPuQp");
    const destinationCollateralAccount = new anchor.web3.PublicKey("9wBciX5pXv7ttGiHYtuaLAJGnFbLe7JjUtR4ZL4QdC4Z")
    const [lending_market_authority, lending_market_authority_bump] = await anchor.web3.PublicKey.findProgramAddress(
        [lending_market.toBuffer()],
        lending_program
    );

    const sourceLiquidityAccount = await token.getOrCreateAssociatedTokenAccount(
        provider.connection,
        payer,
        token.NATIVE_MINT,
        payer.publicKey
    );

    console.log("Collateral balance: ", (await nolosslottery
        .provider.connection.getTokenAccountBalance(destinationCollateralAccount)).value.uiAmount);
    console.log("User SOL balance: ", (await nolosslottery
        .provider.connection.getTokenAccountBalance(sourceLiquidityAccount.address)).value.uiAmount);

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

    let [ticketAccount, _ticketAccountBump] =
        await anchor.web3.PublicKey.findProgramAddress(
            [anchor.utils.bytes.utf8.encode("ticket#"),
                anchor.utils.bytes.utf8.encode(lottery_state.totalTickets.toString())],
            nolosslottery.programId
        );

    console.log("Depositing....")
    let tx = await nolosslottery.rpc.deposit({
        accounts: {
            sourceLiquidity: sourceLiquidityAccount.address,
            destinationCollateralAccount: destinationCollateralAccount,
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
    console.log("Collateral balance: ", (await nolosslottery
        .provider.connection.getTokenAccountBalance(destinationCollateralAccount)).value.uiAmount);
    console.log("User SOL balance: ", (await nolosslottery
        .provider.connection.getTokenAccountBalance(sourceLiquidityAccount.address)).value.uiAmount);
    console.log("TX: ", tx)
};
