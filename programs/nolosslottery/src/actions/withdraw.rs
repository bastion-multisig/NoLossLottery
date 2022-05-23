use crate::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Withdraw<'info> {
    // solend part
    #[account(mut)]
    pub destination_liquidity_account: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub source_collateral_account: Box<Account<'info, TokenAccount>>,
    /// CHECK:
    pub lending_program: AccountInfo<'info>,
    /// CHECK:
    #[account(mut)]
    pub reserve: AccountInfo<'info>,
    /// CHECK:
    #[account(mut)]
    pub reserve_liquidity_supply: AccountInfo<'info>,
    #[account(mut)]
    pub reserve_collateral_mint: Account<'info, Mint>,
    /// CHECK:
    pub lending_market: AccountInfo<'info>,
    /// CHECK:
    pub lending_market_authority: AccountInfo<'info>,
    pub transfer_authority: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,

    // lottery part
    #[account(mut)]
    pub lottery_account: Box<Account<'info, Lottery>>,
    #[account(mut)]
    pub user_deposit_account: Box<Account<'info, UserDeposit>>,
    #[account(mut)]
    pub ticket_account: Box<Account<'info, Ticket>>,
    #[account(mut)]
    pub last_ticket_owner_account: Box<Account<'info, UserDeposit>>,
    #[account(mut)]
    pub last_ticket_account: Box<Account<'info, Ticket>>,

    // authority part
    #[account(mut)]
    pub sender: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

impl Withdraw<'_> {
    pub fn validate(&self, ctx: &Context<Self>) -> Result<()> {
        if (ctx.accounts.lottery_account.ctoken_mint != ctx.accounts.reserve_collateral_mint.key())
            || ctx.accounts.lottery_account.ctoken_mint
                != (ctx.accounts.user_deposit_account.ctoken_mint)
        {
            return err!(LotteryErrorCode::WrongPool);
        }

        if ctx.accounts.lottery_account.collateral_account
            != ctx.accounts.source_collateral_account.key()
        {
            return err!(LotteryErrorCode::WrongCollateral);
        }

        if ctx.accounts.lottery_account.is_blocked {
            // return err!(LotteryErrorCode::WithdrawBlocked);
        }

        Ok(())
    }

    pub fn process(ctx: &mut Context<Self>) -> Result<()> {
        let collateral_amount = helpers::get_ticket_withdraw_price(
            ctx.accounts.lottery_account.ticket_price,
            &ctx.accounts.reserve,
            ctx.accounts.user_deposit_account.winning_time,
            &ctx.accounts.clock.to_account_info(),
        )
        .unwrap();

        // withdraw from Solend
        solana_program::program::invoke(
            &spl_token_lending::instruction::redeem_reserve_collateral(
                *ctx.accounts.lending_program.key,
                collateral_amount,
                ctx.accounts
                    .source_collateral_account
                    .to_account_info()
                    .key
                    .clone(),
                ctx.accounts
                    .destination_liquidity_account
                    .to_account_info()
                    .key
                    .clone(),
                ctx.accounts.reserve.to_account_info().key.clone(),
                ctx.accounts
                    .reserve_collateral_mint
                    .to_account_info()
                    .key
                    .clone(),
                ctx.accounts
                    .reserve_liquidity_supply
                    .to_account_info()
                    .key
                    .clone(),
                ctx.accounts.lending_market.to_account_info().key.clone(),
                ctx.accounts
                    .transfer_authority
                    .to_account_info()
                    .key
                    .clone(),
            ),
            ToAccountInfos::to_account_infos(ctx.accounts).as_slice(),
        )
        .unwrap();

        // remove ticket's id from the list of user tickets
        let ticket_index = ctx
            .accounts
            .user_deposit_account
            .ticket_ids
            .iter()
            .position(|&x| x == ctx.accounts.ticket_account.id)
            .unwrap();
        ctx.accounts
            .user_deposit_account
            .ticket_ids
            .remove(ticket_index);

        if ctx.accounts.last_ticket_account.id == ctx.accounts.ticket_account.id {
            // if we need to delete the last ticket
            // than the users are the same
            // and we need to modify both in order for anchor
            // to be able to save tha changes
            ctx.accounts
                .last_ticket_owner_account
                .ticket_ids
                .remove(ticket_index);
        } else {
            // if we have two different user
            // then we must change ticket id data
            let last_ticket_index = ctx
                .accounts
                .last_ticket_owner_account
                .ticket_ids
                .iter()
                .position(|&x| x == ctx.accounts.last_ticket_account.id)
                .unwrap();
            ctx.accounts
                .last_ticket_owner_account
                .ticket_ids
                .remove(last_ticket_index);

            ctx.accounts.ticket_account.owner = ctx.accounts.last_ticket_account.owner;
        }

        // close user's ticket
        ctx.accounts
            .last_ticket_account
            .close(ctx.accounts.sender.to_account_info())?;

        // update stats
        ctx.accounts.lottery_account.total_tickets -= 1;
        ctx.accounts.lottery_account.liquidity_amount -= ctx.accounts.lottery_account.ticket_price;

        Ok(())
    }
}
