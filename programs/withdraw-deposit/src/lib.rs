use anchor_lang::prelude::*;
use anchor_lang::solana_program;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount};
use spl_token_lending;

pub mod addresses;
use crate::addresses::*;

declare_id!("GEpoZx3h32X7caJjFtoNseaN7BCgJgFTKmP53zMm3BkK");

#[program]
pub mod withdraw_deposit {
    use anchor_spl::token::Burn;
    use super::*;

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> ProgramResult {
        // withdraw from Solend
        solana_program::program::invoke(
            &spl_token_lending::instruction::redeem_reserve_collateral(
                get_pubkey(DEVNET_SOLEND_PROGRAM),
                amount,
                *ctx.accounts.source_collateral_account.to_account_info().key,
                *ctx.accounts.destination_liquidity.to_account_info().key,
                get_pubkey(DEVNET_SOLEND_SOL_RESERVE),
                get_pubkey(DEVNET_SOLEND_CSOL_COLLATERAL_MINT),
                get_pubkey(DEVNET_SOLEND_CSOL_LIQUIDITY_SUPPLY),
                get_pubkey(DEVNET_SOLEND_LENDING_MARKET),
                *ctx.accounts.transfer_authority.to_account_info().key,
            ),
            &ToAccountInfos::to_account_infos(ctx.accounts),
        )?;

        // burn user's tickets
        token::burn(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Burn {
                    mint: ctx.accounts.ticket.to_account_info(),
                    to: ctx.accounts.sender_ticket.to_account_info(),
                    authority: ctx.accounts.sender.to_account_info(),
                }),
            amount,
        )?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    // solend part
    #[account(mut)]
    pub destination_liquidity: Account<'info, TokenAccount>,
    #[account(mut)]
    pub source_collateral_account: Account<'info, TokenAccount>,
    /// CHECK: Safe because `transfer_authority` is not modified in the handler
    pub transfer_authority: AccountInfo<'info>,

    // tickets part
    pub sender: Signer<'info>,
    #[account(mut)]
    pub sender_ticket: Account<'info, TokenAccount>,
    pub ticket: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
}
