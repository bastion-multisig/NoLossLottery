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
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.builder = void 0;
const anchor = __importStar(require("@project-serum/anchor"));
const token = __importStar(require("@solana/spl-token"));
const provider_1 = require("@project-serum/anchor/dist/cjs/provider");
const DEVNET = "https://api.devnet.solana.com";
const builder = (yargs) => yargs
    .positional('key', { type: 'string', demandOption: true });
exports.builder = builder;
const handler = (argv) => __awaiter(void 0, void 0, void 0, function* () {
    const payer = anchor.web3.Keypair.fromSecretKey(Buffer.from(JSON.parse(require("fs").readFileSync(argv.key, {
        encoding: "utf-8",
    }))));
    const provider = new anchor.Provider(new anchor.web3.Connection(DEVNET, anchor.Provider.defaultOptions().commitment), new provider_1.NodeWallet(payer), anchor.Provider.defaultOptions());
    anchor.setProvider(provider);
    const nolosslottery = anchor.workspace.Nolosslottery;
    const lending_program = new anchor.web3.PublicKey("ALend7Ketfx5bxh6ghsCDXAoDrhvEmsXT3cynB6aPLgx");
    const reserve = new anchor.web3.PublicKey("5VVLD7BQp8y3bTgyF5ezm1ResyMTR3PhYsT4iHFU8Sxz");
    const reserve_collateral_mint = new anchor.web3.PublicKey("FzwZWRMc3GCqjSrcpVX3ueJc6UpcV6iWWb7ZMsTXE3Gf");
    const reserve_liquidity_supply = new anchor.web3.PublicKey("furd3XUtjXZ2gRvSsoUts9A5m8cMJNqdsyR2Rt8vY9s");
    const lending_market = new anchor.web3.PublicKey("GvjoVKNjBvQcFaSKUW1gTE7DxhSpjHbE69umVR5nPuQp");
    const destinationCollateralAccount = new anchor.web3.PublicKey("9wBciX5pXv7ttGiHYtuaLAJGnFbLe7JjUtR4ZL4QdC4Z");
    const [lending_market_authority, lending_market_authority_bump] = yield anchor.web3.PublicKey.findProgramAddress([lending_market.toBuffer()], lending_program);
    const sourceLiquidityAccount = yield token.getOrCreateAssociatedTokenAccount(provider.connection, payer, token.NATIVE_MINT, payer.publicKey);
    console.log("Collateral balance: ", (yield nolosslottery
        .provider.connection.getTokenAccountBalance(destinationCollateralAccount)).value.uiAmount);
    console.log("User SOL balance: ", (yield nolosslottery
        .provider.connection.getTokenAccountBalance(sourceLiquidityAccount.address)).value.uiAmount);
    const [userAccount, _userAccountBump] = yield anchor.web3.PublicKey.findProgramAddress([anchor.utils.bytes.utf8.encode("nolosslottery"),
        payer.publicKey.toBuffer(),], nolosslottery.programId);
    let [lotteryAccount, _lotteryAccountBump] = yield anchor.web3.PublicKey.findProgramAddress([anchor.utils.bytes.utf8.encode("lottery")], nolosslottery.programId);
    let lottery_state = yield nolosslottery
        .account.lottery.fetch(lotteryAccount);
    let [ticketAccount, _ticketAccountBump] = yield anchor.web3.PublicKey.findProgramAddress([anchor.utils.bytes.utf8.encode("ticket#"),
        anchor.utils.bytes.utf8.encode(lottery_state.totalTickets.toString())], nolosslottery.programId);
    console.log("Depositing....");
    let tx = yield nolosslottery.rpc.deposit({
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
            sender: payer.publicKey,
            tokenProgram: token.TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
        },
    });
    console.log("Collateral balance: ", (yield nolosslottery
        .provider.connection.getTokenAccountBalance(destinationCollateralAccount)).value.uiAmount);
    console.log("User SOL balance: ", (yield nolosslottery
        .provider.connection.getTokenAccountBalance(sourceLiquidityAccount.address)).value.uiAmount);
    console.log("TX: ", tx);
});
exports.handler = handler;
