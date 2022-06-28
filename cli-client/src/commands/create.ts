import type {Arguments, CommandBuilder} from 'yargs';
import * as anchor from "@project-serum/anchor";
import { Nolosslottery, IDL } from "../types/nolosslottery";
import { VrfClient } from "../utils/types";
import {buffer2string, loadSwitchboardProgram, toAccountString, toPermissionString} from "../utils";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import {Idl} from "@project-serum/anchor";
import {PublicKey, SystemProgram} from "@solana/web3.js";
import {
    Callback,
    OracleQueueAccount,
    PermissionAccount,
    SwitchboardPermission,
    VrfAccount
} from "@switchboard-xyz/switchboard-v2";
import fs from "fs";
import path from "path";

type Options = {
    key: string;
    queue: string;
};

const DEVNET = "https://api.devnet.solana.com"

export const builder: CommandBuilder<Options, Options> = (yargs) =>
    yargs
        .positional('key', { type: 'string', demandOption: true })
        .positional('queue', { type: 'string', demandOption: true })


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

    const queueKey = argv.queue;
    const max = new anchor.BN(100000000);
    const switchboardProgram = await loadSwitchboardProgram(
        payer,
        "devnet",
        DEVNET
    );
    const vrfclientProgram = anchor.workspace.Nolosslottery as anchor.Program<Idl>;

    const vrfSecret = anchor.web3.Keypair.generate();

    // create state account but dont send instruction
    // need public key for VRF CPI
    const [clientAccount, clientBump] = VrfClient.fromSeed(
        vrfclientProgram,
        vrfSecret.publicKey,
        payer.publicKey // client state authority
    );
    try {
        await clientAccount.loadData();
    } catch {}

    console.log("######## CREATE VRF ACCOUNT ########");

    const queue = new OracleQueueAccount({
        program: switchboardProgram,
        publicKey: new PublicKey(queueKey),
    });
    const { unpermissionedVrfEnabled, authority } = await queue.loadData();

    const ixCoder = new anchor.BorshInstructionCoder(vrfclientProgram.idl);

    const callback: Callback = {
        programId: vrfclientProgram.programId,
        accounts: [
            // ensure all accounts in updateResult are populated
            { pubkey: clientAccount.publicKey, isSigner: false, isWritable: true },
            { pubkey: vrfSecret.publicKey, isSigner: false, isWritable: false },
        ],
        ixData: ixCoder.encode("updateResult", ""), // pass any params for instruction here
    };

    console.log(
        toAccountString(
            "Callback",
            JSON.stringify(
                callback,
                (key, value) => {
                    if (value instanceof PublicKey) {
                        return value.toString();
                    }
                    if (key === "ixData" || value instanceof Buffer) {
                        return buffer2string(value);
                    }
                    return value;
                },
                2
            )
        )
    );

    const vrfAccount = await VrfAccount.create(switchboardProgram, {
        queue,
        callback,
        authority: clientAccount.publicKey, // vrf authority
        keypair: vrfSecret,
    });
    console.log(toAccountString(`VRF Account`, vrfAccount.publicKey));

    const permissionAccount = await PermissionAccount.create(switchboardProgram, {
        authority: (await queue.loadData()).authority,
        granter: queue.publicKey,
        grantee: vrfAccount.publicKey,
    });
    console.log(toAccountString(`VRF Permission`, permissionAccount.publicKey));

    if (!unpermissionedVrfEnabled) {
        if (!payer.publicKey.equals(authority)) {
            throw new Error(
                `queue requires PERMIT_VRF_REQUESTS and wrong queue authority provided`
            );
        }
        await permissionAccount.set({
            authority: payer,
            permission: SwitchboardPermission.PERMIT_VRF_REQUESTS,
            enable: true,
        });
    }
    const permissionData = await permissionAccount.loadData();

    console.log(
        toAccountString(
            `     Permissions`,
            toPermissionString(permissionData.permissions)
        )
    );

    console.log("######## INIT PROGRAM STATE ########");

    await vrfclientProgram.rpc.initState(
        max,
        {
            accounts: {
                state: clientAccount.publicKey,
                vrf: vrfAccount.publicKey,
                payer: payer.publicKey,
                authority: payer.publicKey,
                systemProgram: SystemProgram.programId,
            },
        }
    );
    console.log(toAccountString("Program State", clientAccount.publicKey));
    const state = await clientAccount.loadData();
    const permission = await permissionAccount.loadData();

    fs.writeFileSync(
            path.join(
                process.cwd(),
                `./secrets/vrf_account_${vrfSecret.publicKey}-keypair.json`
            ),
            `[${vrfSecret.secretKey}]`
    );

    const outFile = path.join(
        process.cwd(),
        `state_${clientAccount.publicKey}.json`
    );
    fs.writeFileSync(
        outFile,
        JSON.stringify(
            {
                programState: clientAccount.publicKey.toString(),
                maxResult: state.maxResult.toString(),
                vrf: {
                    publicKey: vrfAccount.publicKey.toString(),
                    authority: state.authority.toString(),
                    permissionPubkey: permissionAccount.publicKey.toString(),
                    permissions: toPermissionString(permission.permissions),
                },
            },
            undefined,
            2
        )
    );
};
