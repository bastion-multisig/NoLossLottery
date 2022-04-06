use crate::solana_program::entrypoint::ProgramResult;
use anchor_lang::prelude::*;
use anchor_lang::solana_program;
use anchor_spl::token::{self, Burn, Mint, MintTo, Token, TokenAccount};
use spl_token_lending;

declare_id!("AaN5pQRq3nedSysxKgDYsQNmyARsxn7xqjXifXDW4dSY");

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
        ctx.accounts.user_deposit_account.total = 0;
        ctx.accounts.user_deposit_account.ticket_ids = vec![];
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>) -> ProgramResult {
        // deposit to Solend
        solana_program::program::invoke(
            &spl_token_lending::instruction::deposit_reserve_liquidity(
                *ctx.accounts.lending_program.key,
                1,
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

        // mint tickets to user
        token::mint_to(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.ticket.to_account_info(),
                    to: ctx.accounts.receiver_ticket.to_account_info(),
                    authority: ctx.accounts.sender.to_account_info(),
                },
            ),
            1,
        )?;

        // change user state
        ctx.accounts.user_deposit_account.total += 1;
        ctx.accounts
            .user_deposit_account
            .ticket_ids
            .push(ctx.accounts.lottery_account.total_tickets);

        // total tickets count
        ctx.accounts.lottery_account.total += 1;

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
                1,
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

        // burn user's tickets
        token::burn(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Burn {
                    mint: ctx.accounts.ticket.to_account_info(),
                    to: ctx.accounts.sender_ticket.to_account_info(),
                    authority: ctx.accounts.sender.to_account_info(),
                },
            ),
            1,
        )?;

        ctx.accounts.user_deposit_account.total -= 1;
        ctx.accounts.lottery_account.total -= 1;
        ctx.accounts.lottery_account.total_tickets -= 1;

        Ok(())
    }

    pub fn lottery(ctx: Context<LotteryInstruction>) -> ProgramResult {
        let prize_amount =
            ctx.accounts.collateral_account.amount - ctx.accounts.lottery_account.total;

        // TODO: create a function that generates a random number
        let winning_ticket_id = 0;

        let winning_ticket = Pubkey::find_program_address(
            &["ticket#".as_ref(), winning_ticket_id.to_string().as_ref()],
            ctx.program_id,
        )
        .0;

        ctx.accounts.lottery_account.winning_ticket = winning_ticket;
        ctx.accounts.lottery_account.prize = prize_amount;

        Ok(())
    }

    pub fn payout(ctx: Context<PayoutInstruction>) -> ProgramResult {
        let empty_lottery = Lottery::default();
        ctx.accounts.lottery_account.prize = empty_lottery.prize;
        ctx.accounts.lottery_account.winning_ticket = empty_lottery.winning_ticket;

        // TODO: send the prize to the winner

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
        space = 8 + 16 + 16 + 16 + 32 + 16
    )]
    pub lottery_account: Box<Account<'info, Lottery>>,
    pub system_program: Program<'info, System>,
}

// a struct to save the lottery state
#[account]
#[derive(Default)]
pub struct Lottery {
    pub bump: u8,
    pub total: u64,
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
        space = 8 + 16 + 16 + (4 + 2000 * 4)
    )]
    pub user_deposit_account: Box<Account<'info, UserDeposit>>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(Default)]
pub struct UserDeposit {
    pub bump: u8,
    pub total: u64,
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

    // tickets part
    #[account(mut)]
    pub sender: Signer<'info>,
    #[account(mut)]
    pub receiver_ticket: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub ticket: Box<Account<'info, Mint>>,
    #[account(
        init,
        payer = sender,
        space = 8 + 16 + 32,
        seeds = ["ticket#".as_ref(), lottery_account.total_tickets.to_string().as_ref()],
        bump
    )]
    pub ticket_account: Box<Account<'info, Ticket>>,
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
    pub user_deposit_account: Box<Account<'info, UserDeposit>>,
    #[account(mut)]
    pub lottery_account: Box<Account<'info, Lottery>>,

    // tickets part
    #[account(mut)]
    pub sender: Signer<'info>,
    #[account(mut)]
    pub sender_ticket: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub ticket: Box<Account<'info, Mint>>,
    #[account(mut)]
    pub ticket_account: Box<Account<'info, Ticket>>,
    pub token_program: Program<'info, Token>,
}

// an instruction for the `lottery` endpoint
#[derive(Accounts)]
pub struct LotteryInstruction<'info> {
    #[account(mut)]
    pub lottery_account: Account<'info, Lottery>,
    #[account(mut)]
    pub collateral_account: Account<'info, TokenAccount>,
}

// an instruction to send the prize to the user
#[derive(Accounts)]
pub struct PayoutInstruction<'info> {
    #[account(mut)]
    pub winning_ticket: Account<'info, Ticket>,
    #[account(mut)]
    pub lottery_account: Account<'info, Lottery>,
}
