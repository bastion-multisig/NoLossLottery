use anchor_lang::prelude::*;

// a struct to save the lottery state
#[account]
#[derive(Default)]
pub struct Lottery {
    pub bump: u8,
    pub total_tickets: u64,

    // winning part
    pub winning_ticket: Pubkey,
    pub winning_time: i64,
    pub prize: u64,

    // parameters
    pub ctoken_mint: Pubkey,
    pub vrf_account: Pubkey,
    pub collateral_account: Pubkey,
    pub ticket_price: u64,

    // info
    pub users: u64,
    pub draw_number: u64,
    pub liquidity_amount: u64,
    pub last_call: i64,
    pub is_blocked: bool,
}
