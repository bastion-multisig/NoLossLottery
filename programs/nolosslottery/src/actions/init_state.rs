use crate::*;

use std::mem;
use anchor_lang::prelude::*;
pub use switchboard_v2::VrfAccountData;

#[derive(Accounts)]
pub struct InitState<'info> {
    #[account(
        init,
        seeds = [
            STATE_SEED,
            vrf.key().as_ref(),
            authority.key().as_ref(),
        ],
        payer = payer,
        space = 8 + mem::size_of::<VrfClient>(),
        bump,
    )]
    pub state: AccountLoader<'info, VrfClient>,
    /// CHECK:
    pub authority: AccountInfo<'info>,
    /// CHECK:
    #[account(mut, signer)]
    pub payer: AccountInfo<'info>,
    /// CHECK:
    pub vrf: AccountInfo<'info>,
    #[account(address = solana_program::system_program::ID)]
    pub system_program: Program<'info, System>,
}

impl InitState<'_> {
    pub fn validate(&self, ctx: &Context<Self>) -> Result<()> {
        let vrf_account_info = &ctx.accounts.vrf;
        let _vrf = VrfAccountData::new(vrf_account_info)
            .map_err(|_| VrfErrorCode::InvalidSwitchboardVrfAccount)?;

        Ok(())
    }

    pub fn process(ctx: &Context<Self>, max_result: u64) -> Result<()> {
        let state = &mut ctx.accounts.state.load_init()?;

        state.vrf = ctx.accounts.vrf.key.clone();
        state.authority = ctx.accounts.authority.key.clone();
        state.bump = ctx.bumps.get("state").unwrap().clone();

        state.max_result = max_result;

        Ok(())
    }
}
