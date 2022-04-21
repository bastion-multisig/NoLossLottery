use crate::*;

#[error_code]
#[derive(Eq, PartialEq)]
pub enum VrfErrorCode {
    #[msg("Not a valid Switchboard VRF account")]
    InvalidSwitchboardVrfAccount,
}

#[error_code]
pub enum LotteryErrorCode {
    #[msg("Empty prize")]
    EmptyPrize,
    #[msg("Wrong pool")]
    WrongPool,
}
