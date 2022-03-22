use anchor_lang::prelude::*;
use anchor_lang::solana_program;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount};
use spl_token_lending;

pub mod addresses;
use crate::addresses::*;

declare_id!("GEpoZx3h32X7caJjFtoNseaN7BCgJgFTKmP53zMm3BkK");

#[program]
pub mod user_deposit {
    use super::*;

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> ProgramResult {
        msg!("{:?}", ctx.accounts.lending_market_authority.key);
        // deposit to Solend
        solana_program::program::invoke(
            &spl_token_lending::instruction::deposit_reserve_liquidity(
                ctx.accounts.lending_program.key.clone(),
                amount,
                ctx.accounts.source_liquidity.key().clone(),
                ctx.accounts.destination_collateral_account.key().clone(),
                ctx.accounts.reserve.key.clone(),
                ctx.accounts.reserve_liquidity_supply.key.clone(),
                ctx.accounts.reserve_collateral_mint.key.clone(),
                ctx.accounts.lending_market.key.clone(),
                ctx.accounts.transfer_authority.key().clone(),
            ),
            &ToAccountInfos::to_account_infos(ctx.accounts),
        )?;

        // mint tickets to user
        token::mint_to(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.ticket.to_account_info(),
                    to: ctx.accounts.receiver_ticket.to_account_info(),
                    authority: ctx.accounts.sender.to_account_info(),
                }),
            amount,
        )?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    // solend part
    /// CHECK: Safe because `lending_program` is not modified in the handler
    pub lending_program: AccountInfo<'info>,
    #[account(mut)]
    pub source_liquidity: Account<'info, TokenAccount>,
    #[account(mut)]
    pub destination_collateral_account: Account<'info, TokenAccount>,
    /// CHECK: Safe because `reserve` is not modified in the handler
    pub reserve: AccountInfo<'info>,
    // Token mint for reserve collateral token
    /// CHECK: Safe because `reserve_collateral_mint` is not modified in the handler
    pub reserve_collateral_mint: AccountInfo<'info>,
    // Reserve liquidity supply SPL token account
    /// CHECK: Safe because `reserve_liquidity_supply` is not modified in the handler
    pub reserve_liquidity_supply: AccountInfo<'info>,
    // Lending market account
    /// CHECK: Safe because `lending_market` is not modified in the handler
    pub lending_market: AccountInfo<'info>,
    // Lending market authority (PDA)
    /// CHECK: Safe because `lending_market_authority` is not modified in the handler
    pub lending_market_authority: AccountInfo<'info>,
    // Transfer authority for accounts 1 and 2
    // Clock
    pub clock: Sysvar<'info, Clock>,
    /// CHECK: Safe because `transfer_authority` is not modified in the handler
    pub transfer_authority: AccountInfo<'info>,

    // tickets part
    pub sender: Signer<'info>,
    #[account(mut)]
    pub receiver_ticket: Account<'info, TokenAccount>,
    #[account(mut)]
    pub ticket: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
}
