use anchor_lang::prelude::*;
use anchor_lang::solana_program;
use anchor_spl::token::{self, Burn, Mint, MintTo, Token, TokenAccount};
use spl_token_lending;

pub mod addresses;
use crate::addresses::*;

declare_id!("Ech9R2yButzDURQTTphjBDqgeHXATVutwVCZ1EfPLyLd");

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
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>) -> ProgramResult {
        // deposit to Solend
        solana_program::program::invoke_signed(
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
            &[&[&ctx.accounts.transfer_authority.key.to_bytes()]],
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

        ctx.accounts.user_deposit_account.total += 1;
        ctx.accounts.lottery_account.total += 1;

        ctx.accounts.ticket_account.id = ctx.accounts.lottery_account.total_tickets;
        ctx.accounts.ticket_account.owner = ctx.accounts.user_deposit_account.key();

        ctx.accounts.lottery_account.total_tickets += 1;

        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>) -> ProgramResult {
        // withdraw from Solend
        solana_program::program::invoke_signed(
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
            &[&[&ctx.accounts.transfer_authority.key.to_bytes()]],
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

        // TODO: Close ticket PDA

        ctx.accounts.lottery_account.total_tickets -= 1;

        Ok(())
    }

    pub fn lottery(ctx: Context<LotteryInstruction>) -> ProgramResult {
        let prize_amount =
            ctx.accounts.collateral_account.amount - ctx.accounts.lottery_account.total;
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
        space = 8 + 16 + 16
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
        space = 8 + 16 + 16
    )]
    pub user_deposit_account: Box<Account<'info, UserDeposit>>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(Default)]
pub struct UserDeposit {
    pub bump: u8,
    pub total: u64,
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
    #[account(mut)]
    pub reserve: AccountInfo<'info>,
    #[account(mut)]
    pub reserve_liquidity_supply: AccountInfo<'info>,
    #[account(mut)]
    pub reserve_collateral_mint: AccountInfo<'info>,
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
    #[account(mut)]
    pub reserve: AccountInfo<'info>,
    #[account(mut)]
    pub reserve_liquidity_supply: AccountInfo<'info>,
    #[account(mut)]
    pub reserve_collateral_mint: AccountInfo<'info>,
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
