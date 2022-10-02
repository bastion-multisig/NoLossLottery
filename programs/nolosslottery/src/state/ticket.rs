use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct Ticket {
    pub id: u64,
    pub owner: Pubkey,
}
