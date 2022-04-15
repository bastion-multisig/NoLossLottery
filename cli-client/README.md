# NoLossLottery CLI Client

### Install
```shell
$ git clone https://github.com/joinpoolparty/NoLossLottery/
$ cd NoLossLottery/cli-client
$ npm install
$ npx tsc
```

### Usage
```shell
$ node ./build/cli.js <COMMAND> --key=<KEYPATH>
```

### Commands
* `deposit` - buys a ticket
* `withdraw` - burns a ticket
* `lottery` - picks the winner
* `payout` - creates a ticket for the winner, decreases the prize amount
* `balance` - shows the balance