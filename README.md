# NoLossLottery

## Overview
NoLossLottery is a win-win lottery in which the user
deposits X amount of tokens and in a given period of
time can win on top of their deposit. The deposit is
a refundable amount. The winnings are generated using
all the user's deposits, which are transferred
to debt platforms (lent), earning a % return
on this amount. Then this % of profit is played
out among all the users who made a deposit.

## Endpoints
1. ### Initialize
Initializes user's deposit state
2. ### Deposit
Takes the user's deposit, lends it to Solend
and gives the required number of tickets to the user
3. ### Withdraw
Takes the user's deposit from Solend,
returns it to the user and burns their tickets
4. ### Lottery
Main lottery endpoint

## Build, Test and Deploy
First, install dependencies:

```
$ yarn
```

Next, we will build and deploy the program via Anchor.

Get the program ID:

```
$ anchor keys list
{
...
List of program IDs
...
}
```

Here, make sure you update your program IDs in `Anchor.toml` and `lib.rs` of each program.

Build the program:

```
$ anchor build
```

Test the program:

```
$ anchor test
```

Deploy the program:

```
$ anchor deploy
```
