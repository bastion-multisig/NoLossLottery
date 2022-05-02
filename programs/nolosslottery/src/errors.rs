use crate::*;

#[error_code]
#[derive(Eq, PartialEq)]
pub enum VrfErrorCode {
    #[msg("Not a valid Switchboard VRF account!")]
    InvalidSwitchboardVrfAccount,
}

#[error_code]
pub enum LotteryErrorCode {
    #[msg("Empty prize!")]
    EmptyPrize,
    #[msg("Wrong pool!")]
    WrongPool,
    #[msg("The lottery is blocked!")]
    LotteryBlocked,
    #[msg("Depositing is blocked! Payout the prize to be able to deposit!")]
    DepositBlocked,
    #[msg("Withdrawing is blocked! Payout the prize to be able to withdraw!")]
    WithdrawBlocked,
    #[msg("Wrong VRF account provided!")]
    WrongVrf,
    #[msg("Wrong collateral account provided!")]
    WrongCollateral,
}
