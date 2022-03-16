import * as token from "@solana/spl-token";
import * as anchor from "@project-serum/anchor";
import { UserDeposit } from "../target/types/user_deposit";
import { WithdrawDeposit } from "../target/types/withdraw_deposit";

describe("nolosslottery",  () => {
    const provider = anchor.Provider.env()
    anchor.setProvider(provider);
    const user_deposit_program = anchor.workspace.UserDeposit as anchor.Program<UserDeposit>;
    const withdraw_deposit_program = anchor.workspace.WithdrawDeposit as anchor.Program<WithdrawDeposit>;

    // tests here
});
