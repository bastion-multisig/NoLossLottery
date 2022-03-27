use anchor_lang::prelude::*;
use anchor_lang::solana_program;
use anchor_spl::token::{self, Burn, Mint, MintTo, Token, TokenAccount};
use spl_token_lending;

pub mod addresses;
use crate::addresses::*;

declare_id!("4Qhq8k5JJC5P36mjN2m37gyGHKigyaGZ8bY1PRP2hJGY");

#[program]
pub mod nolosslottery {
    use super::*;

    pub fn init_lottery(ctx: Context<InitializeLottery>, bump: u8) -> ProgramResult {
        ctx.accounts.lottery_account.bump = bump;
        Ok(())
    }

    pub fn init_user_deposit(ctx: Context<InitializeDeposit>, bump: u8) -> ProgramResult {
        ctx.accounts.user_deposit_account.bump = bump;
        ctx.accounts.user_deposit_account.total = 0;
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> ProgramResult {
        // deposit to Solend
        // solana_program::program::invoke(
        //     &spl_token_lending::instruction::deposit_reserve_liquidity(
        //         get_pubkey(DEVNET_SOLEND_PROGRAM),
        //         amount,
        //         *ctx.accounts.source_liquidity.to_account_info().key,
        //         *ctx.accounts.destination_collateral_account.to_account_info().key,
        //         get_pubkey(DEVNET_SOLEND_SOL_RESERVE),
        //         get_pubkey(DEVNET_SOLEND_CSOL_COLLATERAL_MINT),
        //         get_pubkey(DEVNET_SOLEND_CSOL_LIQUIDITY_SUPPLY),
        //         get_pubkey(DEVNET_SOLEND_LENDING_MARKET),
        //         *ctx.accounts.transfer_authority.to_account_info().key,
        //     ),
        //     &ToAccountInfos::to_account_infos(ctx.accounts),
        // )?;

        // mint tickets to user
        token::mint_to(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.ticket.to_account_info(),
                    to: ctx.accounts.receiver_ticket.to_account_info(),
                    authority: ctx.accounts.sender.to_account_info(),
                },
            ),
            amount,
        )?;

        ctx.accounts.user_deposit_account.total += amount;
        ctx.accounts.lottery_account.total += amount;

        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> ProgramResult {
        // // withdraw from Solend
        // solana_program::program::invoke(
        //     &spl_token_lending::instruction::redeem_reserve_collateral(
        //         get_pubkey(DEVNET_SOLEND_PROGRAM),
        //         amount,
        //         *ctx.accounts.source_collateral_account.to_account_info().key,
        //         *ctx.accounts.destination_liquidity.to_account_info().key,
        //         get_pubkey(DEVNET_SOLEND_SOL_RESERVE),
        //         get_pubkey(DEVNET_SOLEND_CSOL_COLLATERAL_MINT),
        //         get_pubkey(DEVNET_SOLEND_CSOL_LIQUIDITY_SUPPLY),
        //         get_pubkey(DEVNET_SOLEND_LENDING_MARKET),
        //         *ctx.accounts.transfer_authority.to_account_info().key,
        //     ),
        //     &ToAccountInfos::to_account_infos(ctx.accounts),
        // )?;

        // burn user's tickets
        token::burn(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Burn {
                    mint: ctx.accounts.ticket.to_account_info(),
                    to: ctx.accounts.sender_ticket.to_account_info(),
                    authority: ctx.accounts.sender.to_account_info(),
                },
            ),
            amount,
        )?;

        ctx.accounts.user_deposit_account.total -= amount;
        ctx.accounts.lottery_account.total -= amount;

        Ok(())
    }

    pub fn lottery(ctx: Context<LotteryInstruction>) -> ProgramResult {
        let prize_amount =
            ctx.accounts.collateral_account.amount - ctx.accounts.lottery_account.total;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeLottery<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        init,
        seeds = ["lottery".as_ref()],
        bump,
        payer = signer,
        space = 8 + 16 + 16
    )]
    pub lottery_account: Account<'info, Lottery>,
    pub system_program: Program<'info, System>,
}

// a struct to save the lottery state
#[account]
#[derive(Default)]
pub struct Lottery {
    pub bump: u8,
    pub total: u64,
}

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct InitializeDeposit<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        init,
        seeds = ["nolosslottery".as_ref(), signer.key().as_ref()],
        bump,
        payer = signer,
        space = 8 + 16 + 16
    )]
    pub user_deposit_account: Account<'info, UserDeposit>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(Default)]
pub struct UserDeposit {
    pub bump: u8,
    pub total: u64,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    // solend part
    #[account(mut)]
    pub source_liquidity: Account<'info, TokenAccount>,
    #[account(mut)]
    pub destination_collateral_account: Account<'info, TokenAccount>,
    /// CHECK: Safe because `transfer_authority` is not modified in the handler
    pub transfer_authority: AccountInfo<'info>,

    // lottery part
    #[account(mut)]
    pub user_deposit_account: Account<'info, UserDeposit>,
    #[account(mut)]
    pub lottery_account: Account<'info, Lottery>,

    // tickets part
    pub sender: Signer<'info>,
    #[account(mut)]
    pub receiver_ticket: Account<'info, TokenAccount>,
    #[account(mut)]
    pub ticket: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    // solend part
    #[account(mut)]
    pub destination_liquidity: Account<'info, TokenAccount>,
    #[account(mut)]
    pub source_collateral_account: Account<'info, TokenAccount>,
    /// CHECK: Safe because `transfer_authority` is not modified in the handler
    pub transfer_authority: AccountInfo<'info>,

    // lottery part
    #[account(mut)]
    pub user_deposit_account: Account<'info, UserDeposit>,
    #[account(mut)]
    pub lottery_account: Account<'info, Lottery>,

    // tickets part
    pub sender: Signer<'info>,
    #[account(mut)]
    pub sender_ticket: Account<'info, TokenAccount>,
    #[account(mut)]
    pub ticket: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
}

// an instruction for the `lottery` endpoint
#[derive(Accounts)]
pub struct LotteryInstruction<'info> {
    #[account(mut)]
    pub lottery_account: Account<'info, Lottery>,
    #[account(mut)]
    pub collateral_account: Account<'info, TokenAccount>,
}
