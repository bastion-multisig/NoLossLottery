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
use solana_program::native_token::LAMPORTS_PER_SOL;
use solana_program::program_pack::Pack;

declare_id!("8NJvNXYdVvUm4CGCC96CJ6mr2WKNw38caPtQnYxSbVMD");

const STATE_SEED: &[u8] = b"STATE";
pub const TICKET_PRICE: u64 = (1_u64 * LAMPORTS_PER_SOL) as u64;
pub const TICKET_PRICE_IN_COLLATERAL: u64 = (1_u64 * 1_000_000_000) as u64;

#[program]
pub mod nolosslottery {
    use super::*;

    pub fn init_lottery(ctx: Context<InitializeLottery>, bump: u8) -> ProgramResult {
        ctx.accounts.lottery_account.bump = bump;
        ctx.accounts.lottery_account.total_tickets = 0;
        ctx.accounts.lottery_account.ctoken_mint = ctx.accounts.ctoken_mint.key().clone();
        Ok(())
    }

    pub fn init_user_deposit(ctx: Context<InitializeDeposit>, bump: u8) -> ProgramResult {
        ctx.accounts.user_deposit_account.bump = bump;
        ctx.accounts.user_deposit_account.ticket_ids = vec![];
        ctx.accounts.user_deposit_account.ctoken_mint = ctx.accounts.ctoken_mint.key().clone();
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
    pub fn init_state(ctx: Context<InitState>) -> Result<()> {
        InitState::process(&ctx)
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

    pub fn lottery(ctx: Context<LotteryInstruction>) -> ProgramResult {
        if ctx.accounts.lottery_account.total_tickets == 0 {
            return Ok(());
        }

        let prize_amount = helpers::calculate_prize(
            ctx.accounts.collateral_account.amount,
            ctx.accounts.collateral_mint.decimals,
            ctx.accounts.lottery_account.total_tickets,
        );

        if prize_amount < 1 {
            return Ok(());
        }

        // TODO: create a function that generates a real random number
        let winning_ticket_id = 0;

        let winning_ticket = Pubkey::find_program_address(
            &["ticket#".as_ref(), winning_ticket_id.to_string().as_ref()],
            ctx.program_id,
        )
        .0;
        ctx.accounts.lottery_account.winning_time =
            Clock::from_account_info(&ctx.accounts.clock.to_account_info())
                .unwrap()
                .epoch as i64;
        ctx.accounts.lottery_account.winning_ticket = winning_ticket;
        ctx.accounts.lottery_account.prize = prize_amount as u64;

        Ok(())
    }

    pub fn payout(ctx: Context<PayoutInstruction>) -> Result<()> {
        // set winning time to user's account
        // it's being set only once here
        // but the time captured in the `lottery` endpoint
        if ctx.accounts.lottery_account.winning_time != 0 {
            ctx.accounts.user_deposit_account.winning_time =
                ctx.accounts.lottery_account.winning_time;

            // delete the time of winning
            ctx.accounts.lottery_account.winning_time = 0
        }

        // if there is no prize
        if ctx.accounts.lottery_account.prize < 1 {
            ctx.accounts.lottery_account.winning_ticket = Pubkey::default();
            return err!(LotteryErrorCode::EmptyPrize);
        }

        // decrease the prize amount
        ctx.accounts.lottery_account.prize -= 1;

        // change user state
        ctx.accounts
            .user_deposit_account
            .ticket_ids
            .push(ctx.accounts.lottery_account.total_tickets);

        // new ticket
        ctx.accounts.ticket_account.id = ctx.accounts.lottery_account.total_tickets;
        ctx.accounts.ticket_account.owner = ctx.accounts.user_deposit_account.key();

        // count the ticket
        ctx.accounts.lottery_account.total_tickets += 1;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeLottery<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        init,
        seeds = ["nolosslottery".as_ref(), ctoken_mint.key().as_ref()],
        bump,
        payer = signer,
        space = 8 + 16 + 16 + 16 + 32 + 16 + 16 + 16
    )]
    pub lottery_account: Box<Account<'info, Lottery>>,
    pub ctoken_mint: Box<Account<'info, Mint>>,
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

    // parameters
    pub ctoken_mint: Pubkey,
}

#[account]
#[derive(Default)]
pub struct Ticket {
    pub id: u64,
    pub owner: Pubkey,
}

// an instruction for the `lottery` endpoint
#[derive(Accounts)]
pub struct LotteryInstruction<'info> {
    #[account(mut)]
    pub lottery_account: Account<'info, Lottery>,
    #[account(mut)]
    pub collateral_mint: Account<'info, Mint>,
    #[account(mut)]
    pub collateral_account: Account<'info, TokenAccount>,
    pub clock: Sysvar<'info, Clock>,
}

// an instruction to send the prize to the user
#[derive(Accounts)]
pub struct PayoutInstruction<'info> {
    // lottery part
    #[account(mut)]
    pub user_deposit_account: Box<Account<'info, UserDeposit>>,
    #[account(mut)]
    pub lottery_account: Box<Account<'info, Lottery>>,

    // tickets part
    #[account(mut)]
    pub sender: Signer<'info>,
    #[account(
        init,
        payer = sender,
        space = 56, // 8 + 16 + 32,
        seeds = ["ticket#".as_ref(), lottery_account.total_tickets.to_string().as_ref()],
        bump
    )]
    pub ticket_account: Box<Account<'info, Ticket>>,
    pub system_program: Program<'info, System>,

    #[account(mut)]
    pub winning_ticket: Account<'info, Ticket>,
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
