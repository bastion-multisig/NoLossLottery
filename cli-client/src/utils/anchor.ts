/* eslint-disable unicorn/prefer-module */
import * as anchor from "@project-serum/anchor";
import { Cluster, Connection, Keypair } from "@solana/web3.js";
import { getSwitchboardPid } from "./switchboard";


/**
 * Load the devnet Switchboard anchor program to create
 * and interact with Switchboard V2 accounts.
 */
export async function loadSwitchboardProgram(
  payer: Keypair,
  cluster: Cluster,
  rpcUrl: string
): Promise<anchor.Program> {
  const programId = getSwitchboardPid(cluster);
  const connection = new Connection(rpcUrl, {
    commitment: "processed",
  });
  const wallet = new anchor.Wallet(payer);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "processed",
    preflightCommitment: "processed",
  });

  const anchorIdl = await anchor.Program.fetchIdl(programId, provider);
  if (!anchorIdl) {
    throw new Error(`failed to read idl for ${programId}`);
  }

  return new anchor.Program(anchorIdl, programId, provider);
}
