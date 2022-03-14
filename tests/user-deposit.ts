import * as token from "@solana/spl-token";
import assert from "assert";
import * as anchor from "@project-serum/anchor";
import * as helpers from "./helpers";

describe("nolosslottery",  () => {
  const connection = anchor.Provider.env().connection;

  const provider = helpers.getProvider(
      connection,
      anchor.web3.Keypair.generate(),
  );

  const user_deposit_program = helpers.getProgram(
      provider,
      "../target/idl/user_deposit.json"
  )

  before(async () => {
    await helpers.requestAirdrop(
        connection,
        provider.wallet.publicKey,
    );
  });

  let mint_public_key = new anchor.web3.PublicKey(
      "2cdTq4yUsMLXYSduo4QMd7nrjHzoCLXQsFxWvrj78TSy");
  let sender_token_public_key = new anchor.web3.PublicKey(
      "H32AhNTFN82tikKUK1YdfcY7gXc4PGHsraafPwhnHj9j"
  )
  let receiver;
  let receiver_token;
  let destinationCollateralAccount;
  let destinationCollateralAccount_token;

  it("Creates tickets receiver", async () => {
    receiver = anchor.web3.Keypair.generate();
    receiver_token = anchor.web3.Keypair.generate();
    let create_receiver_token_tx = new anchor.web3.Transaction().add(
        // create tickets account
        anchor.web3.SystemProgram.createAccount({
          fromPubkey: user_deposit_program.provider.wallet.publicKey,
          newAccountPubkey: receiver_token.publicKey,
          space: token.AccountLayout.span,
          lamports: await token.Token.getMinBalanceRentForExemptAccount(connection),
          programId: token.TOKEN_PROGRAM_ID,
        }),
        // init mint account
        token.Token.createInitAccountInstruction(
            token.TOKEN_PROGRAM_ID,
            mint_public_key, // mint
            receiver_token.publicKey, // token account
            receiver.publicKey // owner of token account
        )
    );

    await user_deposit_program.provider.send(create_receiver_token_tx, [receiver_token]);
  });

  it("Creates collateral receiver", async () => {
    destinationCollateralAccount = anchor.web3.Keypair.generate();
    destinationCollateralAccount_token = anchor.web3.Keypair.generate();
    let create_destinationCollateralAccount_token_tx = new anchor.web3.Transaction().add(
        // create collateral account
        anchor.web3.SystemProgram.createAccount({
          fromPubkey: user_deposit_program.provider.wallet.publicKey,
          newAccountPubkey: destinationCollateralAccount_token.publicKey,
          space: token.AccountLayout.span,
          lamports: await token.Token.getMinBalanceRentForExemptAccount(connection),
          programId: token.TOKEN_PROGRAM_ID,
        }),
        // init mint account
        token.Token.createInitAccountInstruction(
            token.TOKEN_PROGRAM_ID,
            mint_public_key, // mint
            destinationCollateralAccount_token.publicKey, // token account
            destinationCollateralAccount.publicKey // owner of token account
        )
    );

    await user_deposit_program.provider.send(create_destinationCollateralAccount_token_tx, [destinationCollateralAccount]);
  });

  it('Deposits and gets tickets', async () => {
    let amount = new anchor.BN(10);
    await user_deposit_program.rpc.deposit(amount, {
      accounts: {
        sender: sender_token_public_key,
        sourceLiquidity: user_deposit_program.provider.wallet.publicKey,
        destinationCollateralAccount: destinationCollateralAccount,
        receiverTicket: receiver_token.publicKey,
        mint: mint_public_key,
        tokenProgram: token.TOKEN_PROGRAM_ID,
      }
    })
    console.log("Collateral balance: ", await user_deposit_program.provider.connection.getTokenAccountBalance(sender_token_public_key));
    console.log("User token balance: ", await user_deposit_program.provider.connection.getTokenAccountBalance(receiver_token.publicKey));
  })
});
