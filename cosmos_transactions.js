const { DirectSecp256k1HdWallet } = require('@cosmjs/proto-signing');
const { assertIsBroadcastTxSuccess, SigningStargateClient } = require('@cosmjs/stargate');

// Configuration for different Cosmos SDK-based chains
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
    // Add more chains as needed
};

async function executeTransaction(chainName, transactionType, mnemonic, params) {
    // Retrieve chain configuration
    const chainConfig = chainConfigs[chainName];
    if (!chainConfig) {
        throw new Error(`Unsupported chain: ${chainName}`);
    }

    // Create wallet and client for the specified chain
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix: chainConfig.prefix });
    const [firstAccount] = await wallet.getAccounts();
    const client = await SigningStargateClient.connectWithSigner(chainConfig.rpcEndpoint, wallet);

    // Common fee structure for transactions
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

    // Ensure the transaction was successful
    assertIsBroadcastTxSuccess(result);
    console.log('Transaction successful with hash:', result.transactionHash);
}

// Example usage
const mnemonic = 'your mnemonic here';
const chainName = 'cosmoshub'; // Change to the desired chain name
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
    option: 1 // Required for vote (1=Yes, 2=Abstain, 3=No, 4=No with veto)
};

executeTransaction(chainName, transactionType, mnemonic, params).catch(console.error);
