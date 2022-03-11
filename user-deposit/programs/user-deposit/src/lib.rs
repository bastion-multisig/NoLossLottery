use spl_token_lending;
use anchor_lang::solana_program;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

pub mod addresses;
use crate::addresses::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod user_deposit {
    use super::*;

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> ProgramResult {
        let ix = spl_token_lending::instruction::deposit_reserve_liquidity(
            get_pubkey(DEVNET_SOLEND_PROGRAM),
            amount,
            *ctx.accounts.source_liquidity.key,
            *ctx.accounts.destination_collateral_account.key,
            get_pubkey(DEVNET_SOLEND_SOL_RESERVE),
            get_pubkey(DEVNET_SOLEND_CSOL_LIQUIDITY_SUPPLY),
            get_pubkey(DEVNET_SOLEND_CSOL_COLLATERAL_MINT),
            get_pubkey(DEVNET_SOLEND_LENDING_MARKET),
            *ctx.accounts.lending_market_authority.key,
        );

        solana_program::program::invoke(
            &ix,
            &ToAccountInfos::to_account_infos(ctx.accounts),
        )?;

        token::transfer(ctx.accounts.transfer_ctx(), amount)?;
        ctx.accounts.sender_token.reload()?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    pub sender: Signer<'info>,
    #[account(mut)]
    pub sender_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub receiver_token: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,

    // Token account for asset to deposit into reserve
    #[account(mut)]
    /// CHECK: This is not dangerous
    pub source_liquidity: AccountInfo<'info>,
    // Token account for reserve collateral token
    #[account(mut)]
    /// CHECK: This is not dangerous
    pub destination_collateral_account: AccountInfo<'info>,
    // Transfer authority for accounts 1 and 2
    /// CHECK: This is not dangerous
    pub lending_market_authority: AccountInfo<'info>,
 }

impl<'info> Deposit<'info> {
    fn transfer_ctx(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.sender_token.to_account_info(),
                to: self.receiver_token.to_account_info(),
                authority: self.sender.to_account_info(),
            },
        )
    }
}
