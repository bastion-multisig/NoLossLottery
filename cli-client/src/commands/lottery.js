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
    console.log("Lottery..........");
    const [userAccount, userAccountBump] = yield anchor.web3.PublicKey.findProgramAddress([anchor.utils.bytes.utf8.encode("lottery"),
        (new anchor.web3.PublicKey("FzwZWRMc3GCqjSrcpVX3ueJc6UpcV6iWWb7ZMsTXE3Gf")).toBuffer(),
        (new anchor.web3.PublicKey("AD31rHMdU6Xyt8oDY5C3njQwkMaQbQgAnK2EvYb1jo3d")).toBuffer(),], nolosslottery.programId);
    console.log(nolosslottery.programId.toString());
    const user = yield nolosslottery.account.userDeposit.fetch(userAccount);
    console.log(userAccount.toString());
    console.log(user.ticketIds.toString());
});
exports.handler = handler;
