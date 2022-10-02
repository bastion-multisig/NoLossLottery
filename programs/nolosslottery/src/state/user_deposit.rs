use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct UserDeposit {
    pub bump: u8,
    pub ticket_ids: Vec<u64>,

    // winning part
    pub winning_time: i64,
    pub total_prize: u64,

    // parameters
    pub ctoken_mint: Pubkey,
}
