use crate::*;

pub fn get_collateral(
    liquidity_amount: u64,
    reserve: &AccountInfo,
    last_winning_time: i64,
    clock: &AccountInfo,
) -> Result<u64> {
    let reserve_instance = spl_token_lending::state::Reserve::unpack(&reserve.data.borrow())?;

    // collateral amount that costs 1 SOL
    let mut collateral_amount = reserve_instance
        .collateral_exchange_rate()?
        .liquidity_to_collateral(liquidity_amount)?;

    // withdraw lockup
    if less_than_week(last_winning_time, clock) {
        collateral_amount = (collateral_amount as f64 * 0.85) as u64;
    }

    // our fee (0.2%)
    collateral_amount = (collateral_amount as f64 * 0.998) as u64;

    Ok(collateral_amount)
}

pub fn less_than_week(time: i64, clock: &AccountInfo) -> bool {
    time > 0
        && time
            < (Clock::from_account_info(&clock.to_account_info())
                .unwrap()
                .epoch as i64
                + 7 * 24 * 60 * 60)
}

pub fn calculate_prize(collateral_amount: u64, collateral_decimal: u8, total_tickets: u64) -> i64 {
    collateral_amount as i64
        / 10_i32.pow(collateral_decimal as u32) as i64
        / TICKET_PRICE_IN_COLLATERAL as i64
        - total_tickets as i64
}
