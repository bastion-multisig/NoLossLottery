pub mod actions;
pub mod errors;
pub mod helpers;

pub use actions::*;
pub use errors::*;

pub use anchor_lang::prelude::*;
use anchor_lang::solana_program;
use anchor_lang::AccountsClose;
use anchor_spl::token::{Mint, Token, TokenAccount};
use solana_program::entrypoint::ProgramResult;
use solana_program::program_pack::Pack;

declare_id!("9Xkddq3xMaiiYwSEsduAhJ22aTPEie9PpWmyWDjrQf2L");

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
        ctx.accounts.lottery_account.bump = bump;
        ctx.accounts.lottery_account.ticket_price = ticket_price;
        ctx.accounts.lottery_account.ctoken_mint = ctoken_mint;
        ctx.accounts.lottery_account.vrf_account = vrf_account;
        ctx.accounts.lottery_account.collateral_account = collateral_account;
        ctx.accounts.lottery_account.last_call =
            helpers::now();

        msg!("Data stored");
        Ok(())
    }

    pub fn init_user_deposit(ctx: Context<InitializeDeposit>, bump: u8) -> ProgramResult {
        ctx.accounts.user_deposit_account.bump = bump;
        ctx.accounts.user_deposit_account.ticket_ids = vec![];
        ctx.accounts.user_deposit_account.ctoken_mint = ctx.accounts.ctoken_mint.key().clone();

        ctx.accounts.lottery_account.users += 1;

        Ok(())
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

#[derive(Accounts)]
#[instruction(bump: u8,
ticket_price: u64,
ctoken_mint: Pubkey,
vrf_account: Pubkey,
collateral_account: Pubkey
)]
pub struct InitializeLottery<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
    init,
    seeds = ["nolosslottery".as_ref(), ctoken_mint.key().as_ref()],
    bump,
    payer = signer,
    space = 8 + 1 + 8 + 32 + 8 + 8 + 32 + 32 + 32 + 8 + 8 + 8 + 8 + 8 + 1,
    )]
    pub lottery_account: Box<Account<'info, Lottery>>,
    pub system_program: Program<'info, System>,
}

// a struct to save the lottery state
#[account]
#[derive(Default)]
pub struct Lottery {
    pub bump: u8,
    pub total_tickets: u64,

    // winning part
    pub winning_ticket: Pubkey,
    pub winning_time: i64,
    pub prize: u64,

    // parameters
    pub ctoken_mint: Pubkey,
    pub vrf_account: Pubkey,
    pub collateral_account: Pubkey,
    pub ticket_price: u64,

    // info
    pub users: u64,
    pub draw_number: u64,
    pub liquidity_amount: u64,
    pub last_call: i64,
    pub is_blocked: bool,
}

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct InitializeDeposit<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
    init,
    seeds = ["lottery".as_ref(), ctoken_mint.key().as_ref(), signer.key().as_ref()],
    bump,
    payer = signer,
    space = 8 + 1 + (4 + 2000 * 4) + 16 + 32
    )]
    pub user_deposit_account: Box<Account<'info, UserDeposit>>,
    #[account(mut)]
    pub lottery_account: Box<Account<'info, Lottery>>,
    pub ctoken_mint: Box<Account<'info, Mint>>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(Default)]
pub struct UserDeposit {
    pub bump: u8,
    pub ticket_ids: Vec<u64>,

    // winning part
    pub winning_time: i64,
    pub total_prize: u64,

    // parameters
    pub ctoken_mint: Pubkey,
}

#[account]
#[derive(Default)]
pub struct Ticket {
    pub id: u64,
    pub owner: Pubkey,
}

#[repr(packed)]
#[account(zero_copy)]
pub struct VrfClient {
    pub bump: u8,
    pub max_result: u64,
    pub result_buffer: [u8; 32],
    pub result: u128,
    pub last_timestamp: i64,
    pub authority: Pubkey,
    pub vrf: Pubkey,
}
impl Default for VrfClient {
    fn default() -> Self {
        unsafe { std::mem::zeroed() }
    }
}
