use crate::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Deposit<'info> {
    // solend part
    #[account(mut)]
    pub source_liquidity: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub destination_collateral_account: Box<Account<'info, TokenAccount>>,
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
    pub user_deposit_account: Box<Account<'info, UserDeposit>>,
    #[account(mut)]
    pub lottery_account: Box<Account<'info, Lottery>>,
    #[account(
    init,
    payer = sender,
    space = 56, // 8 + 16 + 32,
    seeds = ["ticket#".as_ref(),
    reserve_collateral_mint.key().as_ref(),
    lottery_account.total_tickets.to_string().as_ref()],
    bump
    )]
    pub ticket_account: Box<Account<'info, Ticket>>,

    // authority part
    #[account(mut)]
    pub sender: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

impl Deposit<'_> {
    pub fn validate(&self, ctx: &Context<Self>) -> Result<()> {
        if (ctx.accounts.lottery_account.ctoken_mint != ctx.accounts.reserve_collateral_mint.key())
            || ctx.accounts.lottery_account.ctoken_mint
                != (ctx.accounts.user_deposit_account.ctoken_mint)
        {
            return err!(LotteryErrorCode::WrongPool);
        }

        if ctx.accounts.lottery_account.is_blocked {
            return err!(LotteryErrorCode::DepositBlocked);
        }

        Ok(())
    }

    pub fn process(ctx: &mut Context<Self>) -> Result<()> {
        // deposit to Solend
        solana_program::program::invoke(
            &spl_token::instruction::approve(
                &ctx.accounts.token_program.to_account_info().key.clone(),
                &ctx.accounts.source_liquidity.to_account_info().key.clone(),
                &ctx.accounts.lending_program.to_account_info().key.clone(),
                &ctx.accounts
                    .transfer_authority
                    .to_account_info()
                    .key
                    .clone(),
                &[],
                TICKET_PRICE,
            )?,
            ToAccountInfos::to_account_infos(ctx.accounts).as_slice(),
        )
        .unwrap();

        solana_program::program::invoke(
            &spl_token_lending::instruction::deposit_reserve_liquidity(
                *ctx.accounts.lending_program.key,
                TICKET_PRICE,
                ctx.accounts.source_liquidity.to_account_info().key.clone(),
                ctx.accounts
                    .destination_collateral_account
                    .to_account_info()
                    .key
                    .clone(),
                ctx.accounts.reserve.to_account_info().key.clone(),
                ctx.accounts
                    .reserve_liquidity_supply
                    .to_account_info()
                    .key
                    .clone(),
                ctx.accounts
                    .reserve_collateral_mint
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

        // change user state
        ctx.accounts
            .user_deposit_account
            .ticket_ids
            .push(ctx.accounts.lottery_account.total_tickets);

        // new ticket
        ctx.accounts.ticket_account.id = ctx.accounts.lottery_account.total_tickets;
        ctx.accounts.ticket_account.owner = ctx.accounts.user_deposit_account.key();

        // count the ticket
        ctx.accounts.lottery_account.total_tickets += 1;

        Ok(())
    }
}
