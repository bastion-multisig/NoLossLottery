"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const token = __importStar(require("@solana/spl-token"));
const anchor = __importStar(require("@project-serum/anchor"));
const process_1 = __importDefault(require("process"));
require("core-js/features/array/at");
describe("nolosslottery", () => {
    const provider = anchor.Provider.env();
    anchor.setProvider(provider);
    const nolosslottery = anchor.workspace.Nolosslottery;
    let source_token;
    let destinationCollateralAccount_token;
    const payer = anchor.web3.Keypair.fromSecretKey(Buffer.from(JSON.parse(require("fs").readFileSync(process_1.default.env.ANCHOR_WALLET, {
        encoding: "utf-8",
    }))));
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
    it('Initializes program state', () => __awaiter(void 0, void 0, void 0, function* () {
        [lending_market_authority, lending_market_authority_bump] = yield anchor.web3.PublicKey.findProgramAddress([lending_market.toBuffer()], lending_program);
        destinationCollateralAccount_token =
            yield token.getOrCreateAssociatedTokenAccount(provider.connection, payer, // fee payer
            reserve_collateral_mint, payer.publicKey // owner,
            );
        yield provider.connection.requestAirdrop(sender_account.publicKey, anchor.web3.LAMPORTS_PER_SOL);
        source_token = yield token.getOrCreateAssociatedTokenAccount(provider.connection, payer, // fee payer
        token.NATIVE_MINT, // mint
        sender_account.publicKey // owner,
        );
        const solTransferTransaction = new anchor.web3.Transaction()
            .add(anchor.web3.SystemProgram.transfer({
            fromPubkey: payer.publicKey,
            toPubkey: source_token.address,
            lamports: anchor.web3.LAMPORTS_PER_SOL * 4
        }), token.createSyncNativeInstruction(source_token.address));
        yield anchor.web3.sendAndConfirmTransaction(provider.connection, solTransferTransaction, [payer]);
        console.log("Destination Account Balance ", (yield provider.connection.getTokenAccountBalance(destinationCollateralAccount_token.address)).value.uiAmount);
        console.log("Source Account Balance ", (yield provider.connection.getTokenAccountBalance(source_token.address)).value.uiAmount);
    }));
    it('Initializes the lottery', () => __awaiter(void 0, void 0, void 0, function* () {
        const [lotteryAccount, lotteryAccountBump] = yield anchor.web3.PublicKey.findProgramAddress([anchor.utils.bytes.utf8.encode("nolosslottery"),
            reserve_collateral_mint.toBuffer(),], nolosslottery.programId);
        try {
            yield nolosslottery.rpc.initLottery(lotteryAccountBump, new anchor.BN(1000000000), reserve_collateral_mint, vrf_account, destinationCollateralAccount_token.address, {
                accounts: {
                    signer: payer.publicKey,
                    lotteryAccount: lotteryAccount,
                    systemProgram: anchor.web3.SystemProgram.programId,
                },
            });
        }
        catch (e) { } // already initialized
        console.log("LOTTERY WINNING TIME: ", (yield nolosslottery.account.lottery.fetch(lotteryAccount)).lastCall.toString());
    }));
    it("Initializes user's state", () => __awaiter(void 0, void 0, void 0, function* () {
        const [userAccount, userAccountBump] = yield anchor.web3.PublicKey.findProgramAddress([anchor.utils.bytes.utf8.encode("lottery"),
            reserve_collateral_mint.toBuffer(),
            sender_account.publicKey.toBuffer(),], nolosslottery.programId);
        const [lotteryAccount] = yield anchor.web3.PublicKey.findProgramAddress([anchor.utils.bytes.utf8.encode("nolosslottery"),
            reserve_collateral_mint.toBuffer(),], nolosslottery.programId);
        try {
            yield nolosslottery.rpc.initUserDeposit(userAccountBump, {
                accounts: {
                    signer: sender_account.publicKey,
                    userDepositAccount: userAccount,
                    lotteryAccount: lotteryAccount,
                    ctokenMint: reserve_collateral_mint,
                    systemProgram: anchor.web3.SystemProgram.programId,
                },
                signers: [sender_account]
            });
        }
        catch (e) { } // already initialized
    }));
    it('Deposits and gets tickets', () => __awaiter(void 0, void 0, void 0, function* () {
        const [userAccount] = yield anchor.web3.PublicKey.findProgramAddress([anchor.utils.bytes.utf8.encode("lottery"),
            reserve_collateral_mint.toBuffer(),
            sender_account.publicKey.toBuffer(),], nolosslottery.programId);
        let [lotteryAccount] = yield anchor.web3.PublicKey.findProgramAddress([anchor.utils.bytes.utf8.encode("nolosslottery"),
            reserve_collateral_mint.toBuffer()], nolosslottery.programId);
        let lottery_state = yield nolosslottery
            .account.lottery.fetch(lotteryAccount);
        const transaction = new anchor.web3.Transaction();
        for (let i in [0, 1, 2]) {
            let [ticketAccount] = yield anchor.web3.PublicKey.findProgramAddress([anchor.utils.bytes.utf8.encode("ticket#"),
                reserve_collateral_mint.toBuffer(),
                anchor.utils.bytes.utf8.encode(lottery_state.totalTickets.add(new anchor.BN(i)).toString())], nolosslottery.programId);
            let tx = yield nolosslottery.instruction.deposit({
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
            });
            transaction.add(tx);
        }
        const hash = yield provider.send(transaction, [sender_account], { commitment: 'confirmed' });
        console.log("TX multiple:", hash);
        console.log("Collateral balance: ", (yield nolosslottery
            .provider.connection.getTokenAccountBalance(destinationCollateralAccount_token.address)).value.uiAmount);
        console.log("User SOL balance: ", (yield nolosslottery
            .provider.connection.getTokenAccountBalance(source_token.address)).value.uiAmount);
        console.log("User deposit state: ", yield nolosslottery
            .account.userDeposit.fetch(userAccount));
        console.log("Lottery state: ", yield nolosslottery
            .account.lottery.fetch(lotteryAccount));
    }));
    it('Provides liquidity', () => __awaiter(void 0, void 0, void 0, function* () {
        let [lotteryAccount] = yield anchor.web3.PublicKey.findProgramAddress([anchor.utils.bytes.utf8.encode("nolosslottery"),
            reserve_collateral_mint.toBuffer()], nolosslottery.programId);
        let lottery_state = yield nolosslottery
            .account.lottery.fetch(lotteryAccount);
        console.log("Lottery state: ", lottery_state);
        let tx = yield nolosslottery.rpc.provide(new anchor.BN(0.5 * anchor.web3.LAMPORTS_PER_SOL), {
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
        });
        console.log("TX:", tx);
        console.log("Collateral balance: ", (yield nolosslottery
            .provider.connection.getTokenAccountBalance(destinationCollateralAccount_token.address)).value.uiAmount);
        console.log("User SOL balance: ", (yield nolosslottery
            .provider.connection.getTokenAccountBalance(source_token.address)).value.uiAmount);
        console.log("Lottery state: ", yield nolosslottery
            .account.lottery.fetch(lotteryAccount));
    }));
    it('Withdraws and burns tickets', () => __awaiter(void 0, void 0, void 0, function* () {
        const [userAccount] = yield anchor.web3.PublicKey.findProgramAddress([anchor.utils.bytes.utf8.encode("lottery"),
            reserve_collateral_mint.toBuffer(),
            sender_account.publicKey.toBuffer(),], nolosslottery.programId);
        const [lotteryAccount] = yield anchor.web3.PublicKey.findProgramAddress([anchor.utils.bytes.utf8.encode("nolosslottery"),
            reserve_collateral_mint.toBuffer()], nolosslottery.programId);
        const transaction = new anchor.web3.Transaction();
        for (var i = 0; i < 2; i++) {
            let lottery_state = yield nolosslottery.account.lottery.fetch(lotteryAccount);
            let user_state = yield nolosslottery
                .account.userDeposit.fetch(userAccount);
            let [ticketAccount] = yield anchor.web3.PublicKey.findProgramAddress([anchor.utils.bytes.utf8.encode("ticket#"),
                reserve_collateral_mint.toBuffer(),
                anchor.utils.bytes.utf8.encode(user_state.ticketIds.at(i).toString())], nolosslottery.programId);
            let [lastTicketAccount] = yield anchor.web3.PublicKey.findProgramAddress([anchor.utils.bytes.utf8.encode("ticket#"),
                reserve_collateral_mint.toBuffer(),
                anchor.utils.bytes.utf8.encode(lottery_state.totalTickets.add(new anchor.BN(-1 - i)).toString())], nolosslottery.programId);
            let lastTicketOwnerAccount = (yield nolosslottery.account.ticket.fetch(lastTicketAccount)).owner;
            let tx = yield nolosslottery.instruction.withdraw({
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
            });
            transaction.add(tx);
        }
        const hash = yield provider.send(transaction, 
        // payer is the owner of the destinationCollateralAccount_token
        [payer], { commitment: 'confirmed' });
        console.log("TX multiple:", hash);
        console.log("Collateral balance: ", (yield nolosslottery
            .provider.connection.getTokenAccountBalance(destinationCollateralAccount_token.address)).value.uiAmount);
        console.log("User SOL balance: ", (yield nolosslottery
            .provider.connection.getTokenAccountBalance(source_token.address)).value.uiAmount);
        console.log("User deposit state: ", yield nolosslottery
            .account.userDeposit.fetch(userAccount));
    }));
    it('Raffles', () => __awaiter(void 0, void 0, void 0, function* () {
        const [lotteryAccount] = yield anchor.web3.PublicKey.findProgramAddress([anchor.utils.bytes.utf8.encode("nolosslottery"),
            reserve_collateral_mint.toBuffer()], nolosslottery.programId);
        let tx = yield nolosslottery.rpc.lottery({
            accounts: {
                lotteryAccount: lotteryAccount,
                collateralMint: reserve_collateral_mint,
                collateralAccount: destinationCollateralAccount_token.address,
                reserve: reserve,
                vrf: vrf_account,
            },
        });
        console.log("TX:", tx);
        let lottery_state = yield nolosslottery
            .account.lottery.fetch(lotteryAccount);
        if (lottery_state.prize.eqn(0)) {
            return;
        }
        console.log("Lottery state: ", lottery_state);
        const [userAccount] = yield anchor.web3.PublicKey.findProgramAddress([anchor.utils.bytes.utf8.encode("lottery"),
            reserve_collateral_mint.toBuffer(),
            sender_account.publicKey.toBuffer(),], nolosslottery.programId);
        console.log("Winning ticket state: ", yield nolosslottery.account.ticket.fetch(lottery_state.winningTicket));
        let [ticketAccount] = yield anchor.web3.PublicKey.findProgramAddress([anchor.utils.bytes.utf8.encode("ticket#"),
            reserve_collateral_mint.toBuffer(),
            anchor.utils.bytes.utf8.encode(lottery_state.totalTickets.toString())], nolosslottery.programId);
        tx = yield nolosslottery.rpc.payout({
            accounts: {
                winningTicket: lottery_state.winningTicket,
                lotteryAccount: lotteryAccount,
                userDepositAccount: userAccount,
                ticketAccount: ticketAccount,
                sender: payer.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            },
        });
        console.log("TX:", tx);
        console.log("Lottery state: ", yield nolosslottery
            .account.lottery.fetch(lotteryAccount));
    }));
});
