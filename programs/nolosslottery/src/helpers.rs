use crate::*;

pub fn get_collateral(liquidity_amount: u64, reserve: &AccountInfo) -> Result<u64> {
    let reserve_instance = spl_token_lending::state::Reserve::unpack(&reserve.data.borrow())?;

    // collateral amount that costs `liquidity_amount` tokens
    Ok(reserve_instance
        .collateral_exchange_rate()?
        .liquidity_to_collateral(liquidity_amount)?)
}

pub fn get_liquidity(collateral_amount: u64, reserve: &AccountInfo) -> Result<u64> {
    let reserve_instance = spl_token_lending::state::Reserve::unpack(&reserve.data.borrow())?;

    // collateral amount that costs `liquidity_amount` tokens
    Ok(reserve_instance
        .collateral_exchange_rate()?
        .collateral_to_liquidity(collateral_amount)?)
}

pub fn get_ticket_withdraw_price(
    liquidity_amount: u64,
    reserve: &AccountInfo,
    last_winning_time: i64,
    clock: &AccountInfo,
) -> Result<u64> {
    let mut collateral_amount = get_collateral(liquidity_amount, reserve)?;

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
                .unix_timestamp as i64
                + 7 * 24 * 60 * 60)
}
