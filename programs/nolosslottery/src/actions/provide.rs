use crate::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct ProvideInstruction<'info> {
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

    #[account(mut)]
    pub lottery_account: Box<Account<'info, Lottery>>,

    // authority part
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

impl ProvideInstruction<'_> {
    pub fn validate(&self, ctx: &Context<Self>) -> Result<()> {
        if ctx.accounts.lottery_account.ctoken_mint != ctx.accounts.reserve_collateral_mint.key() {
            return err!(LotteryErrorCode::WrongPool);
        }

        if ctx.accounts.lottery_account.is_blocked {
            return err!(LotteryErrorCode::DepositBlocked);
        }

        Ok(())
    }

    pub fn process(ctx: &mut Context<Self>, amount: u64) -> Result<()> {
        // deposit to Solend
        solana_program::program::invoke(
            &spl_token_lending::instruction::deposit_reserve_liquidity(
                *ctx.accounts.lending_program.key,
                amount,
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

        // update stats
        ctx.accounts.lottery_account.total_tickets += 1;
        ctx.accounts.lottery_account.liquidity_amount += ctx.accounts.lottery_account.ticket_price;

        Ok(())
    }
}
