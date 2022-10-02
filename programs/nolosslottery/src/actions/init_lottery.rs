use crate::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(
  bump: u8,
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

impl InitializeLottery<'_> {
  pub fn process(
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
}