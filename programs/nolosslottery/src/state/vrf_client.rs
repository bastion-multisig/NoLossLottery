use anchor_lang::prelude::*;

#[repr(packed)]
#[account(zero_copy)]
pub struct VrfClient {
    pub bump: u8,
    pub max_result: u64,
    pub result_buffer: [u8; 32],
    pub result: u128,
    pub last_timestamp: i64,
    pub authority: Pubkey,
    pub vrf: Pubkey,
}
impl Default for VrfClient {
    fn default() -> Self {
        unsafe { std::mem::zeroed() }
    }
}
