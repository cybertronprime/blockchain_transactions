const { DirectSecp256k1HdWallet } = require('@cosmjs/proto-signing');
const { assertIsBroadcastTxSuccess, SigningStargateClient } = require('@cosmjs/stargate');
const { Connection, Keypair, Transaction, LAMPORTS_PER_SOL, SystemProgram, sendAndConfirmTransaction } = require('@solana/web3.js');
const { ethers } = require('ethers');
const bip39 = require('bip39');

// Configuration for different blockchains
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
    // Add more chains as needed
};

// Derive Solana Keypair from mnemonic
function getSolanaKeypairFromMnemonic(mnemonic) {
    const seed = bip39.mnemonicToSeedSync(mnemonic).slice(0, 32);
    return Keypair.fromSeed(seed);
}

// Derive Ethereum Wallet from mnemonic
function getEthereumWalletFromMnemonic(mnemonic) {
    return ethers.Wallet.fromMnemonic(mnemonic);
}

// Execute transaction on the specified blockchain
async function executeTransaction(chainName, transactionType, mnemonic, params) {
    if (chainName === 'solana') {
        return executeSolanaTransaction(transactionType, mnemonic, params);
    } else if (chainName === 'ethereum') {
        return executeEthereumTransaction(transactionType, mnemonic, params);
    } else {
        return executeCosmosTransaction(chainName, transactionType, mnemonic, params);
    }
}

// Execute Cosmos transaction
async function executeCosmosTransaction(chainName, transactionType, mnemonic, params) {
    const chainConfig = chainConfigs[chainName];
    if (!chainConfig) {
        throw new Error(`Unsupported chain: ${chainName}`);
    }

    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix: chainConfig.prefix });
    const [firstAccount] = await wallet.getAccounts();
    const client = await SigningStargateClient.connectWithSigner(chainConfig.rpcEndpoint, wallet);

    const fee = {
        amount: [{ denom: chainConfig.denom, amount: '5000' }],
        gas: '200000',
    };

    let result;

    switch (transactionType) {
        case 'send':
            const sendAmount = { denom: chainConfig.denom, amount: params.amount };
            result = await client.sendTokens(firstAccount.address, params.recipient, [sendAmount], fee, 'Sending tokens');
            break;
        case 'ibcTransfer':
            const transferAmount = { denom: chainConfig.denom, amount: params.amount };
            const channel = { sourcePort: 'transfer', sourceChannel: 'channel-0' };
            const timeoutHeight = { revisionNumber: 1, revisionHeight: 12345678 };
            result = await client.sendIbcTokens(firstAccount.address, params.recipient, transferAmount, channel, timeoutHeight, fee, 'IBC transfer');
            break;
        case 'delegate':
            const delegateAmount = { denom: chainConfig.denom, amount: params.amount };
            result = await client.delegateTokens(firstAccount.address, params.validatorAddress, delegateAmount, fee, 'Delegating tokens');
            break;
        case 'undelegate':
            const undelegateAmount = { denom: chainConfig.denom, amount: params.amount };
            result = await client.undelegateTokens(firstAccount.address, params.validatorAddress, undelegateAmount, fee, 'Undelegating tokens');
            break;
        case 'redelegate':
            const redelegateAmount = { denom: chainConfig.denom, amount: params.amount };
            result = await client.redelegateTokens(firstAccount.address, params.srcValidatorAddress, params.dstValidatorAddress, redelegateAmount, fee, 'Redelegating tokens');
            break;
        case 'submitProposal':
            const proposalMsg = {
                typeUrl: '/cosmos.gov.v1beta1.MsgSubmitProposal',
                value: {
                    content: {
                        typeUrl: '/cosmos.gov.v1beta1.TextProposal',
                        value: { title: params.title, description: params.description },
                    },
                    initialDeposit: [{ denom: chainConfig.denom, amount: params.deposit }],
                    proposer: firstAccount.address,
                },
            };
            result = await client.signAndBroadcast(firstAccount.address, [proposalMsg], fee, 'Submitting proposal');
            break;
        case 'vote':
            const voteMsg = {
                typeUrl: '/cosmos.gov.v1beta1.MsgVote',
                value: { proposalId: params.proposalId, voter: firstAccount.address, option: params.option },
            };
            result = await client.signAndBroadcast(firstAccount.address, [voteMsg], fee, 'Voting on proposal');
            break;
        default:
            throw new Error('Unsupported transaction type');
    }

    assertIsBroadcastTxSuccess(result);
    console.log('Transaction successful with hash:', result.transactionHash);
}

// Execute Solana transaction
async function executeSolanaTransaction(transactionType, mnemonic, params) {
    const connection = new Connection(chainConfigs.solana.rpcEndpoint, 'confirmed');
    const keypair = getSolanaKeypairFromMnemonic(mnemonic);

    let transaction = new Transaction();
    let result;

    switch (transactionType) {
        case 'send':
            const sendAmount = parseInt(params.amount, 10) * LAMPORTS_PER_SOL;
            transaction.add(SystemProgram.transfer({
                fromPubkey: keypair.publicKey,
                toPubkey: params.recipient,
                lamports: sendAmount,
            }));
            break;
        // Add other Solana transaction types as needed
        default:
            throw new Error('Unsupported transaction type');
    }

    result = await sendAndConfirmTransaction(connection, transaction, [keypair]);
    console.log('Transaction successful with hash:', result);
}

// Execute Ethereum transaction
async function executeEthereumTransaction(transactionType, mnemonic, params) {
    const provider = new ethers.providers.JsonRpcProvider(chainConfigs.ethereum.rpcEndpoint);
    const wallet = getEthereumWalletFromMnemonic(mnemonic).connect(provider);

    let result;

    switch (transactionType) {
        case 'send':
            const sendAmount = ethers.utils.parseEther(params.amount);
            const tx = {
                to: params.recipient,
                value: sendAmount,
                gasLimit: 21000,
                gasPrice: await provider.getGasPrice(),
            };
            result = await wallet.sendTransaction(tx);
            break;
        // Add other Ethereum transaction types as needed
        default:
            throw new Error('Unsupported transaction type');
    }

    console.log('Transaction successful with hash:', result.hash);
}

// Example usage
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
