use crate::*;
use anchor_lang::prelude::*;
pub use switchboard_v2::VrfAccountData;

// an instruction for the `lottery` endpoint
#[derive(Accounts)]
pub struct CalculatePrizeInstruction<'info> {
    #[account(mut)]
    pub lottery_account: Account<'info, Lottery>,
    #[account(mut)]
    pub collateral_mint: Account<'info, Mint>,
    #[account(mut)]
    pub collateral_account: Account<'info, TokenAccount>,
    /// CHECK:
    #[account(mut)]
    pub reserve: AccountInfo<'info>,
}

impl CalculatePrizeInstruction<'_> {
    pub fn validate(&self, ctx: &Context<Self>) -> Result<()> {
        Ok(())
    }

    pub fn process(ctx: &mut Context<Self>) -> Result<()> {
        // if there are not players
        if ctx.accounts.lottery_account.total_tickets == 0 {
            return Ok(());
        }

        let collateral_in_liquidity = helpers::get_liquidity(
            ctx.accounts.collateral_account.amount,
            &ctx.accounts.reserve,
        )?;
        let prize_amount =
            if collateral_in_liquidity >= ctx.accounts.lottery_account.liquidity_amount {
                collateral_in_liquidity - ctx.accounts.lottery_account.liquidity_amount
            } else {
                0
            };

        // save the prize amount
        ctx.accounts.lottery_account.prize = prize_amount;

        Ok(())
    }
}
