import type {Arguments, CommandBuilder} from 'yargs';
import * as anchor from "@project-serum/anchor";
import * as token from "@solana/spl-token";
import { Nolosslottery } from "../types/nolosslottery";
import {loadSwitchboardProgram, toPermissionString} from "../utils";
import {
    OracleAccount,
    OracleQueueAccount,
    PermissionAccount,
    ProgramStateAccount, SwitchboardPermission
} from "@switchboard-xyz/switchboard-v2";
import path from "path";
import fs from "fs";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";

type Options = {
    key: string;
};

const DEVNET = "https://api.devnet.solana.com"

export const builder: CommandBuilder<Options, Options> = (yargs) =>
    yargs
        .positional('key', { type: 'string', demandOption: true })


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

    const provider = new anchor.AnchorProvider(
        new anchor.web3.Connection(DEVNET, anchor.AnchorProvider.defaultOptions().commitment),
        new NodeWallet(payer),
        anchor.AnchorProvider.defaultOptions(),
    );
    anchor.setProvider(provider);

    const nolosslottery = anchor.workspace.Nolosslottery as anchor.Program<Nolosslottery>;

    const switchboardV2: anchor.Program = await loadSwitchboardProgram(
        payer,
        "devnet",
        DEVNET
    );

    const [switchboardV2ProgramStateAccount] = ProgramStateAccount.fromSeed(switchboardV2);
    const switchTokenMint = await switchboardV2ProgramStateAccount.getTokenMint();
    const tokenAccount = await switchTokenMint.createAccount(
        payer.publicKey
    );

    // Oracle Queue
    const queueAccount = await OracleQueueAccount.create(switchboardV2,
        {
        name: Buffer.from("Queue-1"),
        slashingEnabled: false,
        reward: new anchor.BN(0), // no token account needed
        minStake: new anchor.BN(0),
        authority: payer.publicKey,
        // Change to true to skip oraclePermission.set step
        unpermissionedVrf: false,
        unpermissionedFeeds: false,
        queueSize: 50,
        mint: token.NATIVE_MINT,
    });
    console.log("Oracle Queue", queueAccount.publicKey.toString());

    // Oracle
    const oracleAccount = await OracleAccount.create(switchboardV2, {
        name: Buffer.from("Oracle"),
        queueAccount,
    });
    console.log("Oracle", oracleAccount.publicKey.toString());
    const oraclePermission = await PermissionAccount.create(switchboardV2, {
        authority: payer.publicKey,
        granter: queueAccount.publicKey,
        grantee: oracleAccount.publicKey,
    });
    await oraclePermission.set({
        authority: payer,
        permission: SwitchboardPermission.PERMIT_ORACLE_HEARTBEAT,
        enable: true,
    });
    console.log(`  Permission`, oraclePermission.publicKey.toString());
    await oracleAccount.heartbeat(payer);

    console.log("Switchboard setup complete");

    const permission = await oraclePermission.loadData();

    const outFile = path.join(
        process.cwd(),
        `queue_${queueAccount.publicKey.toString()}.json`
    );
    fs.writeFileSync(
        outFile,
        JSON.stringify(
            {
                queue: queueAccount.publicKey.toString(),
                queueAuthority: payer.publicKey.toString(),
                oracle: {
                    publicKey: oracleAccount.publicKey.toString(),
                    oracleAuthority: payer.publicKey.toString(),
                    permissionPubkey: oraclePermission.publicKey.toString(),
                    permissions: toPermissionString(permission.permissions),
                },
            },
            undefined,
            2
        )
    );

    console.log(
        `Run the following command to create a new VRF Account:
        \n\tts-node 
        src create ${queueAccount.publicKey.toString()} --payer ${payer.publicKey.toString()} --rpcUrl ${DEVNET} --cluster devnet`
    );

};
