anchor build &&
cp target/types/* cli-client/src/types
solana program deploy -u d --program-id 2jzFdP1ntxFDrNzv4NSe8c28Ycs3hRVko9bcYYGSCFAH target/deploy/nolosslottery.so &&
anchor idl upgrade -f ./target/idl/nolosslottery.json 2jzFdP1ntxFDrNzv4NSe8c28Ycs3hRVko9bcYYGSCFAH --provider.cluster devnet
