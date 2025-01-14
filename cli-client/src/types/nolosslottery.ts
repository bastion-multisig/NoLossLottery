export type Nolosslottery = {
  "version": "0.1.0",
  "name": "nolosslottery",
  "instructions": [
    {
      "name": "initLottery",
      "accounts": [
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "lotteryAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bump",
          "type": "u8"
        },
        {
          "name": "ticketPrice",
          "type": "u64"
        },
        {
          "name": "ctokenMint",
          "type": "publicKey"
        },
        {
          "name": "vrfAccount",
          "type": "publicKey"
        },
        {
          "name": "collateralAccount",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "initUserDeposit",
      "accounts": [
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "userDepositAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lotteryAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "ctokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "deposit",
      "accounts": [
        {
          "name": "sourceLiquidity",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "destinationCollateralAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lendingProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "reserve",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveLiquiditySupply",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveCollateralMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lendingMarket",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "lendingMarketAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "transferAuthority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userDepositAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lotteryAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "ticketAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "withdraw",
      "accounts": [
        {
          "name": "destinationLiquidityAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sourceCollateralAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lendingProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "reserve",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveLiquiditySupply",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveCollateralMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lendingMarket",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "lendingMarketAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "transferAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "lotteryAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userDepositAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "ticketAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lastTicketOwnerAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lastTicketAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sender",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "initState",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "vrf",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "maxResult",
          "type": "u64"
        }
      ]
    },
    {
      "name": "updateResult",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vrf",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": "UpdateResultParams"
          }
        }
      ]
    },
    {
      "name": "requestResult",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "switchboardProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vrf",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "oracleQueue",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "queueAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "dataBuffer",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "permission",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payerWallet",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payerAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "recentBlockhashes",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "programState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": "RequestResultParams"
          }
        }
      ]
    },
    {
      "name": "lottery",
      "accounts": [
        {
          "name": "lotteryAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "collateralMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "collateralAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserve",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vrf",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "calculatePrize",
      "accounts": [
        {
          "name": "lotteryAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "collateralMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "collateralAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserve",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "payout",
      "accounts": [
        {
          "name": "userDepositAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lotteryAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sender",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "ticketAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "winningTicket",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "provide",
      "accounts": [
        {
          "name": "sourceLiquidity",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "destinationCollateralAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lendingProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "reserve",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveLiquiditySupply",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveCollateralMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lendingMarket",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "lendingMarketAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "transferAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "lotteryAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "lottery",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "totalTickets",
            "type": "u64"
          },
          {
            "name": "winningTicket",
            "type": "publicKey"
          },
          {
            "name": "winningTime",
            "type": "i64"
          },
          {
            "name": "prize",
            "type": "u64"
          },
          {
            "name": "ctokenMint",
            "type": "publicKey"
          },
          {
            "name": "vrfAccount",
            "type": "publicKey"
          },
          {
            "name": "collateralAccount",
            "type": "publicKey"
          },
          {
            "name": "ticketPrice",
            "type": "u64"
          },
          {
            "name": "users",
            "type": "u64"
          },
          {
            "name": "drawNumber",
            "type": "u64"
          },
          {
            "name": "liquidityAmount",
            "type": "u64"
          },
          {
            "name": "lastCall",
            "type": "i64"
          },
          {
            "name": "isBlocked",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "ticket",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "id",
            "type": "u64"
          },
          {
            "name": "owner",
            "type": "publicKey"
          }
        ]
      }
    },
    {
      "name": "userDeposit",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "ticketIds",
            "type": {
              "vec": "u64"
            }
          },
          {
            "name": "winningTime",
            "type": "i64"
          },
          {
            "name": "totalPrize",
            "type": "u64"
          },
          {
            "name": "ctokenMint",
            "type": "publicKey"
          }
        ]
      }
    },
    {
      "name": "vrfClient",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "maxResult",
            "type": "u64"
          },
          {
            "name": "resultBuffer",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "result",
            "type": "u128"
          },
          {
            "name": "lastTimestamp",
            "type": "i64"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "vrf",
            "type": "publicKey"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "RequestResultParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "permissionBump",
            "type": "u8"
          },
          {
            "name": "switchboardStateBump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "UpdateResultParams",
      "type": {
        "kind": "struct",
        "fields": []
      }
    },
    {
      "name": "LotteryErrorCode",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "EmptyPrize"
          },
          {
            "name": "WrongPool"
          },
          {
            "name": "LotteryBlocked"
          },
          {
            "name": "DepositBlocked"
          },
          {
            "name": "WithdrawBlocked"
          },
          {
            "name": "WrongVrf"
          },
          {
            "name": "WrongCollateral"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidSwitchboardVrfAccount",
      "msg": "Not a valid Switchboard VRF account!"
    }
  ]
};

export const IDL: Nolosslottery = {
  "version": "0.1.0",
  "name": "nolosslottery",
  "instructions": [
    {
      "name": "initLottery",
      "accounts": [
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "lotteryAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bump",
          "type": "u8"
        },
        {
          "name": "ticketPrice",
          "type": "u64"
        },
        {
          "name": "ctokenMint",
          "type": "publicKey"
        },
        {
          "name": "vrfAccount",
          "type": "publicKey"
        },
        {
          "name": "collateralAccount",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "initUserDeposit",
      "accounts": [
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "userDepositAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lotteryAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "ctokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "deposit",
      "accounts": [
        {
          "name": "sourceLiquidity",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "destinationCollateralAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lendingProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "reserve",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveLiquiditySupply",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveCollateralMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lendingMarket",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "lendingMarketAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "transferAuthority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userDepositAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lotteryAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "ticketAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "withdraw",
      "accounts": [
        {
          "name": "destinationLiquidityAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sourceCollateralAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lendingProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "reserve",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveLiquiditySupply",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveCollateralMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lendingMarket",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "lendingMarketAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "transferAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "lotteryAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userDepositAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "ticketAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lastTicketOwnerAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lastTicketAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sender",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "initState",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "vrf",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "maxResult",
          "type": "u64"
        }
      ]
    },
    {
      "name": "updateResult",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vrf",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": "UpdateResultParams"
          }
        }
      ]
    },
    {
      "name": "requestResult",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "switchboardProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vrf",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "oracleQueue",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "queueAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "dataBuffer",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "permission",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payerWallet",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payerAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "recentBlockhashes",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "programState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": "RequestResultParams"
          }
        }
      ]
    },
    {
      "name": "lottery",
      "accounts": [
        {
          "name": "lotteryAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "collateralMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "collateralAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserve",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vrf",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "calculatePrize",
      "accounts": [
        {
          "name": "lotteryAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "collateralMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "collateralAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserve",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "payout",
      "accounts": [
        {
          "name": "userDepositAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lotteryAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sender",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "ticketAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "winningTicket",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "provide",
      "accounts": [
        {
          "name": "sourceLiquidity",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "destinationCollateralAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lendingProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "reserve",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveLiquiditySupply",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveCollateralMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lendingMarket",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "lendingMarketAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "transferAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "lotteryAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "lottery",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "totalTickets",
            "type": "u64"
          },
          {
            "name": "winningTicket",
            "type": "publicKey"
          },
          {
            "name": "winningTime",
            "type": "i64"
          },
          {
            "name": "prize",
            "type": "u64"
          },
          {
            "name": "ctokenMint",
            "type": "publicKey"
          },
          {
            "name": "vrfAccount",
            "type": "publicKey"
          },
          {
            "name": "collateralAccount",
            "type": "publicKey"
          },
          {
            "name": "ticketPrice",
            "type": "u64"
          },
          {
            "name": "users",
            "type": "u64"
          },
          {
            "name": "drawNumber",
            "type": "u64"
          },
          {
            "name": "liquidityAmount",
            "type": "u64"
          },
          {
            "name": "lastCall",
            "type": "i64"
          },
          {
            "name": "isBlocked",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "ticket",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "id",
            "type": "u64"
          },
          {
            "name": "owner",
            "type": "publicKey"
          }
        ]
      }
    },
    {
      "name": "userDeposit",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "ticketIds",
            "type": {
              "vec": "u64"
            }
          },
          {
            "name": "winningTime",
            "type": "i64"
          },
          {
            "name": "totalPrize",
            "type": "u64"
          },
          {
            "name": "ctokenMint",
            "type": "publicKey"
          }
        ]
      }
    },
    {
      "name": "vrfClient",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "maxResult",
            "type": "u64"
          },
          {
            "name": "resultBuffer",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "result",
            "type": "u128"
          },
          {
            "name": "lastTimestamp",
            "type": "i64"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "vrf",
            "type": "publicKey"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "RequestResultParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "permissionBump",
            "type": "u8"
          },
          {
            "name": "switchboardStateBump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "UpdateResultParams",
      "type": {
        "kind": "struct",
        "fields": []
      }
    },
    {
      "name": "LotteryErrorCode",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "EmptyPrize"
          },
          {
            "name": "WrongPool"
          },
          {
            "name": "LotteryBlocked"
          },
          {
            "name": "DepositBlocked"
          },
          {
            "name": "WithdrawBlocked"
          },
          {
            "name": "WrongVrf"
          },
          {
            "name": "WrongCollateral"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidSwitchboardVrfAccount",
      "msg": "Not a valid Switchboard VRF account!"
    }
  ]
};
