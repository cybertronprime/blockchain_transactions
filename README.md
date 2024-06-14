### README.md

# Blockchain Transactions Script

This Node.js script provides a unified way to execute transactions on Cosmos SDK-based blockchains, Solana, and Ethereum using a single mnemonic. It supports various types of transactions, including token transfers, staking, governance proposals, and IBC (Inter-Blockchain Communication) transfers.

## Prerequisites

- Node.js (version 12 or higher)
- NPM (Node Package Manager)

## Installation

1. **Clone the repository or create a new project directory:**

   ```sh
   mkdir blockchain-transactions
   cd blockchain-transactions
   ```

2. **Initialize a new Node.js project:**

   ```sh
   npm init -y
   ```

3. **Install the required packages:**

   ```sh
   npm install @cosmjs/stargate @cosmjs/proto-signing @cosmjs/amino @solana/web3.js ethers bip39
   ```

## Configuration

The script uses a configuration object to store RPC endpoints and other constants for different blockchains. The current configuration supports the following chains:

- Cosmos Hub (ATOM)
- Osmosis (OSMO)
- Akash (AKT)
- Solana (SOL)
- Ethereum (ETH)

You can add more chains by updating the `chainConfigs` object.

## Usage

### Script Overview

The script is designed to handle different types of transactions based on user input. It supports the following transaction types:

- `send`: Basic token transfer
- `ibcTransfer`: IBC token transfer (for Cosmos SDK-based chains)
- `delegate`: Delegate tokens to a validator (for Cosmos SDK-based chains)
- `undelegate`: Undelegate tokens from a validator (for Cosmos SDK-based chains)
- `redelegate`: Redelegate tokens from one validator to another (for Cosmos SDK-based chains)
- `submitProposal`: Submit a governance proposal (for Cosmos SDK-based chains)
- `vote`: Vote on a governance proposal (for Cosmos SDK-based chains)

### Running the Script

1. **Update the script with your mnemonic and parameters:**

   Open the `blockchainTransactions.js` file and update the `mnemonic`, `chainName`, `transactionType`, and `params` variables with your values.

2. **Run the script:**

   ```sh
   node blockchainTransactions.js
   ```

### Example

Here is an example usage of the script:

```javascript
const mnemonic = 'your mnemonic here';
const chainName = 'cosmoshub'; // Change to the desired chain name (cosmoshub, osmosis, solana, ethereum, etc.)
const transactionType = 'send'; // Change to the desired transaction type
const params = {
    recipient: 'cosmos1recipientaddress', // Required for send and ibcTransfer
    amount: '1000000', // Required for send, ibcTransfer, delegate, undelegate, and redelegate
    validatorAddress: 'cosmosvaloper1validatoraddress', // Required for delegate and undelegate
    srcValidatorAddress: 'cosmosvaloper1srcvalidatoraddress', // Required for redelegate
    dstValidatorAddress: 'cosmosvaloper1dstvalidatoraddress', // Required for redelegate
    title: 'Proposal Title', // Required for submitProposal
    description: 'Proposal Description', // Required for submitProposal
    deposit: '10000000', // Required for submitProposal
    proposalId: '1', // Required for vote
    option: 1, // Required for vote (1=Yes, 2=Abstain, 3=No, 4=No with veto)
};

executeTransaction(chainName, transactionType, mnemonic, params).catch(console.error);
```

### Adding Support for More Chains

To add support for more blockchains, update the `chainConfigs` object with the chain's RPC endpoint, token denomination, and address prefix:

```javascript
const chainConfigs = {
    cosmoshub: {
        rpcEndpoint: 'https://rpc.cosmos.network',
        denom: 'uatom',
        prefix: 'cosmos',
    },
    osmosis: {
        rpcEndpoint: 'https://rpc-osmosis.blockapsis.com',
        denom: 'uosmo',
        prefix: 'osmo',
    },
    akash: {
        rpcEndpoint: 'https://rpc.akash.forbole.com',
        denom: 'uakt',
        prefix: 'akash',
    },
    solana: {
        rpcEndpoint: 'https://api.mainnet-beta.solana.com',
        denom: 'sol',
    },
    ethereum: {
        rpcEndpoint: 'https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID',
    },
    // Add more chains here
};
```

### Cross-Chain Interaction Between Solana and Cosmos

For cross-chain interaction, typically using a bridge solution like Wormhole is essential. Wormhole allows interoperability between Solana and Cosmos Hub. Setting up a Wormhole bridge involves deploying bridge contracts on both blockchains and configuring relayers to facilitate the token transfers.

The detailed setup of such a bridge is beyond the scope of this script but involves:

1. **Deploying Bridge Contracts**: On both Solana and Cosmos.
2. **Configuring Relayers**: To monitor and relay transactions across chains.
3. **Transferring Tokens**: Using the bridge contract's functionality.

This script provides a structured and chain-agnostic way to execute various types of transactions across different blockchains using a single mnemonic, setting a foundation for further cross-chain interactions and automations.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any bugs, improvements, or new features.

## Acknowledgements

- [CosmJS](https://github.com/cosmos/cosmjs) - JavaScript libraries for the Cosmos ecosystem.
- [Solana Web3.js](https://github.com/solana-labs/solana-web3.js) - JavaScript API for interacting with the Solana blockchain.
- [Ethers.js](https://github.com/ethers-io/ethers.js/) - JavaScript library for interacting with the Ethereum blockchain.

## Contact

For any questions or support, please contact [your-email@example.com].
``` 

This `README.md` provides comprehensive information about the script, including installation instructions, configuration, usage examples, and guidelines for adding support for more chains. It should help users understand how to use and extend the script effectively.