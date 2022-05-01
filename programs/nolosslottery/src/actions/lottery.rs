use crate::*;
use anchor_lang::prelude::*;
pub use switchboard_v2::VrfAccountData;

// an instruction for the `lottery` endpoint
#[derive(Accounts)]
pub struct LotteryInstruction<'info> {
    #[account(mut)]
    pub lottery_account: Account<'info, Lottery>,
    #[account(mut)]
    pub collateral_mint: Account<'info, Mint>,
    #[account(mut)]
    pub collateral_account: Account<'info, TokenAccount>,
    /// CHECK:
    #[account(mut)]
    pub reserve: AccountInfo<'info>,
    /// CHECK:
    pub vrf: AccountInfo<'info>,
    pub clock: Sysvar<'info, Clock>,
}

impl LotteryInstruction<'_> {
    pub fn validate(&self, ctx: &Context<Self>) -> Result<()> {
        if !LotteryInstruction::can_be_called(ctx) {
            return err!(LotteryErrorCode::LotteryBlocked);
        }

        Ok(())
    }

    fn can_be_called(ctx: &Context<Self>) -> bool {
        if ctx.accounts.lottery_account.last_call != 0
            && helpers::less_than_week(
                ctx.accounts.lottery_account.last_call,
                &ctx.accounts.clock.to_account_info(),
            )
        {
            return false;
        }

        true
    }

    pub fn process(ctx: &mut Context<Self>) -> Result<()> {
        // if there are not players
        if ctx.accounts.lottery_account.total_tickets == 0 {
            return Ok(());
        }

        let collateral_in_liquidity = helpers::get_liquidity(
            ctx.accounts.collateral_account.amount,
            &ctx.accounts.reserve,
        )?;
        let prize_amount =
            if collateral_in_liquidity >= ctx.accounts.lottery_account.liquidity_amount {
                collateral_in_liquidity - ctx.accounts.lottery_account.liquidity_amount
            } else {
                0
            };

        if prize_amount < ctx.accounts.lottery_account.ticket_price {
            return Ok(());
        }

        let current_time = Clock::from_account_info(&ctx.accounts.clock.to_account_info())
            .unwrap()
            .unix_timestamp as i64;

        let vrf_account_info = &ctx.accounts.vrf;
        let vrf = VrfAccountData::new(vrf_account_info)?;
        let result_buffer = vrf.get_result()?;
        if result_buffer == [0u8; 32] {
            return Ok(());
        }

        let value: &[u128] = bytemuck::cast_slice(&result_buffer[..]);
        let winning_ticket_id =
            value[0] % ((ctx.accounts.lottery_account.total_tickets - 1) as u128);
        msg!("Current winning_ticket_id = {}", winning_ticket_id);

        let winning_ticket = Pubkey::find_program_address(
            &[
                "ticket#".as_ref(),
                ctx.accounts.lottery_account.ctoken_mint.as_ref(),
                winning_ticket_id.to_string().as_ref(),
            ],
            ctx.program_id,
        )
        .0;

        // this field will be used for the validation of lottery call
        ctx.accounts.lottery_account.winning_time = current_time;

        ctx.accounts.lottery_account.winning_ticket = winning_ticket;

        // save last call time
        ctx.accounts.lottery_account.last_call = current_time;

        // block the lottery
        ctx.accounts.lottery_account.is_blocked = true;

        // save the prize amount
        ctx.accounts.lottery_account.prize = prize_amount;

        Ok(())
    }
}
