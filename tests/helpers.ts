import * as anchor from "@project-serum/anchor";
import { UserDeposit } from "../target/types/user_deposit";

export function getProgram(
    provider: anchor.Provider,
    idl_path: string
): anchor.Program {
    const idl = require(idl_path);
    const programID = new anchor.web3.PublicKey(idl.metadata.address);

    return new anchor.Program(idl, programID, provider);
}

export function getProvider(
    connection: anchor.web3.Connection,
    keypair: anchor.web3.Keypair,
): anchor.Provider {
    const wallet = new anchor.Wallet(keypair);

    return new anchor.Provider(
        connection,
        wallet,
        anchor.Provider.defaultOptions()
    );
}
