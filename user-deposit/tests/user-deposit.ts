import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { UserDeposit } from '../target/types/user_deposit';
import { clusterApiUrl, Connection, Keypair, Transaction, SystemProgram } from "@solana/web3.js";
import { Token, TOKEN_PROGRAM_ID, MintLayout, AccountLayout } from "@solana/spl-token";

describe('User Deposit', () => {
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.UserDeposit as Program<UserDeposit>;

  let mint;
  let sender_token;
  let receiver;
  let receiver_token;

  it('Setup mints and token accounts', async () => {
    mint = Keypair.generate();

    let create_mint_tx = new Transaction().add(
        // create mint account
        SystemProgram.createAccount({
          fromPubkey: program.provider.wallet.publicKey,
          newAccountPubkey: mint.publicKey,
          space: MintLayout.span,
          lamports: await Token.getMinBalanceRentForExemptMint(program.provider.connection),
          programId: TOKEN_PROGRAM_ID,
        }),
        // init mint account
        Token.createInitMintInstruction(
            TOKEN_PROGRAM_ID, // always TOKEN_PROGRAM_ID
            mint.publicKey, // mint pubkey
            0, // decimals
            program.provider.wallet.publicKey, // mint authority
            program.provider.wallet.publicKey // freeze authority (if you don't need it, you can set `null`)
        )
    );

    await program.provider.send(create_mint_tx, [mint]);

    // more test here

    sender_token = Keypair.generate();
    let create_sender_token_tx = new Transaction().add(
        // create token account
        SystemProgram.createAccount({
          fromPubkey: program.provider.wallet.publicKey,
          newAccountPubkey: sender_token.publicKey,
          space: AccountLayout.span,
          lamports: await Token.getMinBalanceRentForExemptAccount(program.provider.connection),
          programId: TOKEN_PROGRAM_ID,
        }),
        // init mint account
        Token.createInitAccountInstruction(
            TOKEN_PROGRAM_ID, // always TOKEN_PROGRAM_ID
            mint.publicKey, // mint
            sender_token.publicKey, // token account
            program.provider.wallet.publicKey // owner of token account
        )
    );

    await program.provider.send(create_sender_token_tx, [sender_token]);

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
            mint.publicKey, // mint
            receiver_token.publicKey, // token account
            receiver.publicKey // owner of token account
        )
    );

    await program.provider.send(create_receiver_token_tx, [receiver_token]);

    let mint_tokens_tx = new Transaction().add(
        Token.createMintToInstruction(
            TOKEN_PROGRAM_ID,
            mint.publicKey, // mint
            sender_token.publicKey, // receiver (should be a token account)
            program.provider.wallet.publicKey, // mint authority
            [],
            100
        )
    );

    await program.provider.send(mint_tokens_tx);

    console.log("token balance: ", await program.provider.connection.getTokenAccountBalance(sender_token.publicKey));
  });

  it('Deposit and get tokens', async () => {
    let amount = new anchor.BN(10);
    await program.rpc.deposit(amount, {
      accounts: {
        sender: program.provider.wallet.publicKey,
        senderToken: sender_token.publicKey,
        receiverToken: receiver_token.publicKey,
        mint: mint.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      }
    })
    console.log("sender token balance: ", await program.provider.connection.getTokenAccountBalance(sender_token.publicKey));
    console.log("receiver token balance: ", await program.provider.connection.getTokenAccountBalance(receiver_token.publicKey));

  })

});
