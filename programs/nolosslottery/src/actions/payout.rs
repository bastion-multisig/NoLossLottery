use crate::*;
use anchor_lang::prelude::*;

// an instruction to send the prize to the user
#[derive(Accounts)]
pub struct PayoutInstruction<'info> {
    // lottery part
    #[account(mut)]
    pub user_deposit_account: Box<Account<'info, UserDeposit>>,
    #[account(mut)]
    pub lottery_account: Box<Account<'info, Lottery>>,

    // tickets part
    #[account(mut)]
    pub sender: Signer<'info>,
    #[account(
        init,
        payer = sender,
        space = 8 + 16 + 32,
        seeds = ["ticket#".as_ref(),
                 lottery_account.ctoken_mint.as_ref(),
                 lottery_account.total_tickets.to_string().as_ref()],
        bump
    )]
    pub ticket_account: Box<Account<'info, Ticket>>,
    pub system_program: Program<'info, System>,

    #[account(mut)]
    pub winning_ticket: Account<'info, Ticket>,
}

impl PayoutInstruction<'_> {
    pub fn validate(&self, ctx: &Context<Self>) -> Result<()> {
        // if there is no prize
        if ctx.accounts.lottery_account.prize < ctx.accounts.lottery_account.ticket_price {
            return err!(LotteryErrorCode::EmptyPrize);
        }

        Ok(())
    }

    pub fn process(ctx: &mut Context<Self>) -> Result<()> {
        // set winning time to user's account
        // it's being set only once here
        // but the time captured in the `lottery` endpoint
        if ctx.accounts.lottery_account.winning_time != 0 {
            ctx.accounts.user_deposit_account.winning_time =
                ctx.accounts.lottery_account.winning_time;

            // delete the time of winning
            ctx.accounts.lottery_account.winning_time = 0
        }

        // decrease the prize amount
        ctx.accounts.lottery_account.prize -= ctx.accounts.lottery_account.ticket_price;

        // change user state
        ctx.accounts
            .user_deposit_account
            .ticket_ids
            .push(ctx.accounts.lottery_account.total_tickets);

        // new ticket
        ctx.accounts.ticket_account.id = ctx.accounts.lottery_account.total_tickets;
        ctx.accounts.ticket_account.owner = ctx.accounts.user_deposit_account.key();

        // update stats
        ctx.accounts.lottery_account.total_tickets += 1;
        ctx.accounts.lottery_account.liquidity_amount += ctx.accounts.lottery_account.ticket_price;

        // unlock the lottery if there is no prize
        if ctx.accounts.lottery_account.prize < ctx.accounts.lottery_account.ticket_price {
            ctx.accounts.lottery_account.winning_ticket = Pubkey::default();
            ctx.accounts.lottery_account.is_blocked = false;
        }

        Ok(())
    }
}
