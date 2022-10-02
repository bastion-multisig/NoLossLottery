use crate::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct InitializeUserDeposit<'info> {
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

impl InitializeUserDeposit<'_> {
  pub fn process(ctx: Context<InitializeUserDeposit>, bump: u8) -> ProgramResult {
    ctx.accounts.user_deposit_account.bump = bump;
    ctx.accounts.user_deposit_account.ticket_ids = vec![];
    ctx.accounts.user_deposit_account.ctoken_mint = ctx.accounts.ctoken_mint.key().clone();

    ctx.accounts.lottery_account.users += 1;

    Ok(())
  }
}