pub mod actions;
pub use actions::*;

use crate::solana_program::entrypoint::ProgramResult;
use crate::solana_program::native_token::LAMPORTS_PER_SOL;
pub use anchor_lang::prelude::*;
use anchor_lang::solana_program;
use anchor_lang::AccountsClose;
use anchor_spl::token::{Mint, Token, TokenAccount};

declare_id!("ACqyU5JmS1a7qWTCP9ckoG7A1GXFofS52nuoiq7bq4JF");

const STATE_SEED: &[u8] = b"STATE";

#[program]
pub mod nolosslottery {
    use super::*;

    pub fn init_lottery(ctx: Context<InitializeLottery>, bump: u8) -> ProgramResult {
        ctx.accounts.lottery_account.bump = bump;
        ctx.accounts.lottery_account.total_tickets = 0;
        Ok(())
    }

    pub fn init_user_deposit(ctx: Context<InitializeDeposit>, bump: u8) -> ProgramResult {
        ctx.accounts.user_deposit_account.bump = bump;
        ctx.accounts.user_deposit_account.ticket_ids = vec![];
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>) -> ProgramResult {
        // deposit to Solend
        solana_program::program::invoke(
            &spl_token::instruction::approve(
                &ctx.accounts.token_program.to_account_info().key.clone(),
                &ctx.accounts.source_liquidity.to_account_info().key.clone(),
                &ctx.accounts.lending_program.to_account_info().key.clone(),
                &ctx.accounts
                    .transfer_authority
                    .to_account_info()
                    .key
                    .clone(),
                &[],
                LAMPORTS_PER_SOL
            )?,
            ToAccountInfos::to_account_infos(ctx.accounts).as_slice(),
        )
        .unwrap();

        solana_program::program::invoke(
            &spl_token_lending::instruction::deposit_reserve_liquidity(
                *ctx.accounts.lending_program.key,
                LAMPORTS_PER_SOL,
                ctx.accounts.source_liquidity.to_account_info().key.clone(),
                ctx.accounts
                    .destination_collateral_account
                    .to_account_info()
                    .key
                    .clone(),
                ctx.accounts.reserve.to_account_info().key.clone(),
                ctx.accounts
                    .reserve_liquidity_supply
                    .to_account_info()
                    .key
                    .clone(),
                ctx.accounts
                    .reserve_collateral_mint
                    .to_account_info()
                    .key
                    .clone(),
                ctx.accounts.lending_market.to_account_info().key.clone(),
                ctx.accounts
                    .transfer_authority
                    .to_account_info()
                    .key
                    .clone(),
            ),
            ToAccountInfos::to_account_infos(ctx.accounts).as_slice(),
        )
        .unwrap();

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

    pub fn withdraw(ctx: Context<Withdraw>) -> ProgramResult {
        // withdraw from Solend
        solana_program::program::invoke(
            &spl_token_lending::instruction::redeem_reserve_collateral(
                *ctx.accounts.lending_program.key,
                1 * (10_u64.pow(ctx.accounts.reserve_collateral_mint.decimals as u32)),
                ctx.accounts
                    .source_collateral_account
                    .to_account_info()
                    .key
                    .clone(),
                ctx.accounts
                    .destination_liquidity_account
                    .to_account_info()
                    .key
                    .clone(),
                ctx.accounts.reserve.to_account_info().key.clone(),
                ctx.accounts
                    .reserve_collateral_mint
                    .to_account_info()
                    .key
                    .clone(),
                ctx.accounts
                    .reserve_liquidity_supply
                    .to_account_info()
                    .key
                    .clone(),
                ctx.accounts.lending_market.to_account_info().key.clone(),
                ctx.accounts
                    .transfer_authority
                    .to_account_info()
                    .key
                    .clone(),
            ),
            ToAccountInfos::to_account_infos(ctx.accounts).as_slice(),
        )
        .unwrap();

        // remove ticket's id from the list of user tickets
        let ticket_index = ctx
            .accounts
            .user_deposit_account
            .ticket_ids
            .iter()
            .position(|&x| x == ctx.accounts.ticket_account.id)
            .unwrap();
        ctx.accounts
            .user_deposit_account
            .ticket_ids
            .remove(ticket_index);

        if ctx.accounts.last_ticket_account.id == ctx.accounts.ticket_account.id {
            // if we need to delete the last ticket
            // than the users are the same
            // and we need to modify both in order for anchor
            // to be able to save tha changes
            ctx.accounts
                .last_ticket_owner_account
                .ticket_ids
                .remove(ticket_index);
        } else {
            // if we have two different user
            // then we must change ticket id data
            let last_ticket_index = ctx
                .accounts
                .last_ticket_owner_account
                .ticket_ids
                .iter()
                .position(|&x| x == ctx.accounts.last_ticket_account.id)
                .unwrap();
            ctx.accounts
                .last_ticket_owner_account
                .ticket_ids
                .remove(last_ticket_index);

            ctx.accounts.ticket_account.owner = ctx.accounts.last_ticket_account.owner;
        }

        // close user's ticket
        ctx.accounts
            .last_ticket_account
            .close(ctx.accounts.sender.to_account_info())?;

        ctx.accounts.lottery_account.total_tickets -= 1;

        Ok(())
    }

    #[access_control(ctx.accounts.validate(&ctx))]
    pub fn init_state(ctx: Context<InitState>) -> Result<()> {
        InitState::actuate(&ctx)
    }

    #[access_control(ctx.accounts.validate(&ctx, &params))]
    pub fn update_result(ctx: Context<UpdateResult>, params: UpdateResultParams) -> ProgramResult {
        UpdateResult::actuate(&ctx, &params)
    }

    #[access_control(ctx.accounts.validate(&ctx, &params))]
    pub fn request_result(
        ctx: Context<RequestResult>,
        params: RequestResultParams,
    ) -> ProgramResult {
        RequestResult::actuate(&ctx, &params)
    }

    pub fn lottery(ctx: Context<LotteryInstruction>) -> ProgramResult {
        if ctx.accounts.lottery_account.total_tickets == 0 {
            return Ok(());
        }

        let mut prize_amount = (ctx.accounts.collateral_account.amount as i64
            / ctx.accounts.collateral_mint.decimals as i64)
            - ctx.accounts.lottery_account.total_tickets as i64;

        if prize_amount < 1 {
            prize_amount = 0;
        }

        // TODO: create a function that generates a real random number
        let winning_ticket_id = 0;

        let winning_ticket = Pubkey::find_program_address(
            &["ticket#".as_ref(), winning_ticket_id.to_string().as_ref()],
            ctx.program_id,
        )
        .0;

        ctx.accounts.lottery_account.winning_ticket = winning_ticket;
        ctx.accounts.lottery_account.prize = prize_amount as u64;

        Ok(())
    }

    pub fn payout(ctx: Context<PayoutInstruction>) -> Result<()> {
        if ctx.accounts.lottery_account.prize < 1 {
            ctx.accounts.lottery_account.winning_ticket = Pubkey::default();
            return err!(LotteryErrorCode::EmptyPrize);
        }
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
        seeds = ["lottery".as_ref()],
        bump,
        payer = signer,
        space = 104 // 8 + 16 + 16 + 16 + 32 + 16
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
    pub winning_ticket: Pubkey,
    pub prize: u64,
}

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct InitializeDeposit<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        init,
        seeds = ["nolosslottery".as_ref(), signer.key().as_ref()],
        bump,
        payer = signer,
        space = 8044 // 8 + 16 + 16 + (4 + 2000 * 4)
    )]
    pub user_deposit_account: Box<Account<'info, UserDeposit>>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(Default)]
pub struct UserDeposit {
    pub bump: u8,
    pub ticket_ids: Vec<u64>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    // solend part
    #[account(mut)]
    pub source_liquidity: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub destination_collateral_account: Box<Account<'info, TokenAccount>>,
    /// CHECK:
    pub lending_program: AccountInfo<'info>,
    /// CHECK:
    #[account(mut)]
    pub reserve: AccountInfo<'info>,
    /// CHECK:
    #[account(mut)]
    pub reserve_liquidity_supply: AccountInfo<'info>,
    #[account(mut)]
    pub reserve_collateral_mint: Account<'info, Mint>,
    /// CHECK:
    pub lending_market: AccountInfo<'info>,
    /// CHECK:
    pub lending_market_authority: AccountInfo<'info>,
    pub transfer_authority: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,

    // lottery part
    #[account(mut)]
    pub user_deposit_account: Box<Account<'info, UserDeposit>>,
    #[account(mut)]
    pub lottery_account: Box<Account<'info, Lottery>>,
    #[account(
        init,
        payer = sender,
        space = 56, // 8 + 16 + 32,
        seeds = ["ticket#".as_ref(), lottery_account.total_tickets.to_string().as_ref()],
        bump
    )]
    pub ticket_account: Box<Account<'info, Ticket>>,

    // authority part
    #[account(mut)]
    pub sender: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(Default)]
pub struct Ticket {
    pub id: u64,
    pub owner: Pubkey,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    // solend part
    #[account(mut)]
    pub destination_liquidity_account: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub source_collateral_account: Box<Account<'info, TokenAccount>>,
    /// CHECK:
    pub lending_program: AccountInfo<'info>,
    /// CHECK:
    #[account(mut)]
    pub reserve: AccountInfo<'info>,
    /// CHECK:
    #[account(mut)]
    pub reserve_liquidity_supply: AccountInfo<'info>,
    #[account(mut)]
    pub reserve_collateral_mint: Account<'info, Mint>,
    /// CHECK:
    pub lending_market: AccountInfo<'info>,
    /// CHECK:
    pub lending_market_authority: AccountInfo<'info>,
    pub transfer_authority: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,

    // lottery part
    #[account(mut)]
    pub lottery_account: Box<Account<'info, Lottery>>,
    #[account(mut)]
    pub user_deposit_account: Box<Account<'info, UserDeposit>>,
    #[account(mut)]
    pub ticket_account: Box<Account<'info, Ticket>>,
    #[account(mut)]
    pub last_ticket_owner_account: Box<Account<'info, UserDeposit>>,
    #[account(mut)]
    pub last_ticket_account: Box<Account<'info, Ticket>>,

    // authority part
    #[account(mut)]
    pub sender: Signer<'info>,
    pub token_program: Program<'info, Token>,
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

#[error_code]
#[derive(Eq, PartialEq)]
pub enum VrfErrorCode {
    #[msg("Not a valid Switchboard VRF account")]
    InvalidSwitchboardVrfAccount,
}

#[error_code]
pub enum LotteryErrorCode {
    #[msg("Empty prize")]
    EmptyPrize,
}
