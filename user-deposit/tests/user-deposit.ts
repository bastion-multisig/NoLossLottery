import * as anchor from '@project-serum/anchor';
import {Program, web3} from '@project-serum/anchor';
import { UserDeposit } from '../target/types/user_deposit';
import { clusterApiUrl, Connection, Keypair, Transaction, SystemProgram } from "@solana/web3.js";
import { Token, TOKEN_PROGRAM_ID, MintLayout, AccountLayout } from "@solana/spl-token";
import * as assert from "assert";

describe('User Deposit', () => {
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.UserDeposit as Program<UserDeposit>;

  let mint_public_key = new web3.PublicKey(
      "2cdTq4yUsMLXYSduo4QMd7nrjHzoCLXQsFxWvrj78TSy");
  let sender_token_public_key = new web3.PublicKey(
      "H32AhNTFN82tikKUK1YdfcY7gXc4PGHsraafPwhnHj9j"
  )
  let receiver;
  let receiver_token;

  it("Create receiver", async () => {
    receiver = Keypair.generate();
    receiver_token = Keypair.generate();
    let create_receiver_token_tx = new Transaction().add(
        // create token account
        SystemProgram.createAccount({
          fromPubkey: program.provider.wallet.publicKey,
          newAccountPubkey: receiver_token.publicKey,
          space: AccountLayout.span,
          lamports: await Token.getMinBalanceRentForExemptAccount(program.provider.connection),
          programId: TOKEN_PROGRAM_ID,
        }),
        // init mint account
        Token.createInitAccountInstruction(
            TOKEN_PROGRAM_ID,
            mint_public_key, // mint
            receiver_token.publicKey, // token account
            receiver.publicKey // owner of token account
        )
    );

    await program.provider.send(create_receiver_token_tx, [receiver_token]);

    let mint_tokens_tx = new Transaction().add(
        Token.createMintToInstruction(
            TOKEN_PROGRAM_ID,
            mint_public_key, // mint
            sender_token_public_key, // receiver (should be a token account)
            program.provider.wallet.publicKey, // mint authority
            [],
            100
        )
    );

    await program.provider.send(mint_tokens_tx);

    console.log("token balance: ", await program.provider.connection.getTokenAccountBalance(sender_token_public_key));
  });

  it('Deposit and get tokens', async () => {
    let amount = new anchor.BN(10);
    await program.rpc.deposit(amount, {
      accounts: {
        sender: program.provider.wallet.publicKey,
        senderToken: sender_token_public_key,
        receiverToken: receiver_token.publicKey,
        mint: mint_public_key,
        tokenProgram: TOKEN_PROGRAM_ID,
      }
    })
    console.log("sender token balance: ", await program.provider.connection.getTokenAccountBalance(sender_token_public_key));
    console.log("receiver token balance: ", await program.provider.connection.getTokenAccountBalance(receiver_token.publicKey));

  })

});
