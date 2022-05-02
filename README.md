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
1. ### Initialization
Initializes the user's deposit status

2. ### Deposit
Accepts the user's deposit, lends it to Solend
and creates a ticket for the user

3. ### Output
Takes the user's deposit from Solend, and burns the given ticket

4. ### Lottery
Selects a random ticket number and saves it as the winner

5. ### Payout
Creates a ticket for the user, without a deposit in Solend

6. ### Provide
Creates one ticket for the user, called n times, where n is the size of the prize in tickets
Work in a similar way to a deposit, only without a deposit in Solend

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
