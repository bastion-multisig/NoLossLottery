pub mod actions;
pub mod errors;
pub mod helpers;
pub mod state;

pub use actions::*;
pub use errors::*;
pub use state::*;

pub use anchor_lang::prelude::*;
use anchor_lang::solana_program;
use anchor_lang::AccountsClose;
use anchor_spl::token::{Mint, Token, TokenAccount};
use solana_program::entrypoint::ProgramResult;
use solana_program::program_pack::Pack;

declare_id!("2jzFdP1ntxFDrNzv4NSe8c28Ycs3hRVko9bcYYGSCFAH");

const STATE_SEED: &[u8] = b"STATE";

#[program]
pub mod nolosslottery {
    use super::*;

    pub fn init_lottery(
        ctx: Context<InitializeLottery>,
        bump: u8,
        ticket_price: u64,
        ctoken_mint: Pubkey,
        vrf_account: Pubkey,
        collateral_account: Pubkey,
    ) -> ProgramResult {
        InitializeLottery::process(ctx, bump, ticket_price, ctoken_mint, vrf_account, collateral_account)
    }

    pub fn init_user_deposit(ctx: Context<InitializeUserDeposit>, bump: u8) -> ProgramResult {
        InitializeUserDeposit::process(ctx, bump)
    }

    #[access_control(ctx.accounts.validate(&ctx))]
    pub fn deposit(mut ctx: Context<Deposit>) -> Result<()> {
        Deposit::process(&mut ctx)
    }

    #[access_control(ctx.accounts.validate(&ctx))]
    pub fn withdraw(mut ctx: Context<Withdraw>) -> Result<()> {
        Withdraw::process(&mut ctx)
    }

    #[access_control(ctx.accounts.validate(&ctx))]
    pub fn init_state(ctx: Context<InitState>, max_result: u64) -> Result<()> {
        InitState::process(&ctx, max_result)
    }

    #[access_control(ctx.accounts.validate(&ctx, &params))]
    pub fn update_result(ctx: Context<UpdateResult>, params: UpdateResultParams) -> ProgramResult {
        UpdateResult::process(&ctx, &params)
    }

    #[access_control(ctx.accounts.validate(&ctx, &params))]
    pub fn request_result(
        ctx: Context<RequestResult>,
        params: RequestResultParams,
    ) -> ProgramResult {
        RequestResult::process(&ctx, &params)
    }

    #[access_control(ctx.accounts.validate(&ctx))]
    pub fn lottery(mut ctx: Context<LotteryInstruction>) -> Result<()> {
        LotteryInstruction::process(&mut ctx)
    }

    #[access_control(ctx.accounts.validate(&ctx))]
    pub fn calculate_prize(mut ctx: Context<CalculatePrizeInstruction>) -> Result<()> {
        CalculatePrizeInstruction::process(&mut ctx)
    }

    #[access_control(ctx.accounts.validate(&ctx))]
    pub fn payout(mut ctx: Context<PayoutInstruction>) -> Result<()> {
        PayoutInstruction::process(&mut ctx)
    }

    #[access_control(ctx.accounts.validate(&ctx))]
    pub fn provide(mut ctx: Context<ProvideInstruction>, amount: u64) -> Result<()> {
        ProvideInstruction::process(&mut ctx, amount)
    }
}

