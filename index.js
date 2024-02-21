console.clear();
require("dotenv").config();
const {
	AccountId,
	PrivateKey,
	Client,
	ContractDeleteTransaction,
	ContractFunctionParameters,
	ContractExecuteTransaction,
	ContractCallQuery,
	ContractCreateFlow,
} = require("@hashgraph/sdk");
const fs = require("fs");

// Configure accounts and client
const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
const operatorKey = PrivateKey.fromStringED25519(process.env.OPERATOR_PVKEY);

const client = Client.forTestnet().setOperator(operatorId, operatorKey);

async function main() {
	// Import the compiled contract bytecode
	const contractBytecode = fs.readFileSync("LookupContract_sol_LookupContract.bin");

	// Instantiate the smart contract
	let contractInstantiateTx = new ContractCreateFlow()
	.setAdminKey(operatorKey)
		.setBytecode(contractBytecode)
		.setGas(200000)
		.setConstructorParameters(new ContractFunctionParameters().addString("Alice").addUint256(111111));
	const contractInstantiateSubmit = await contractInstantiateTx.execute(client);
	const contractInstantiateRx = await contractInstantiateSubmit.getReceipt(client);
	const contractId = contractInstantiateRx.contractId;
	const contractAddress = contractId.toSolidityAddress();
	console.log(`- The smart contract ID is: ${contractId} \n`);
	console.log(`- The smart contract ID in Solidity format is: ${contractAddress} \n`);

	// Query the contract to check changes in state variable
	const contractQueryTx = new ContractCallQuery()
		.setContractId(contractId)
		.setGas(100000)
		.setFunction("getMobileNumber", new ContractFunctionParameters().addString("Alice"));
	const contractQuerySubmit = await contractQueryTx.execute(client);
	const contractQueryResult = contractQuerySubmit.getUint256(0);
	console.log(`- Here's the phone number that you asked for: ${contractQueryResult} \n`);

	// Call contract function to update the state variable
	let contractExecuteTx = new ContractExecuteTransaction()
		.setContractId(contractId)
		.setGas(100000)
		.setFunction("setMobileNumber", new ContractFunctionParameters().addString("Bob").addUint256(222222));
	let contractExecuteSubmit = await contractExecuteTx.execute(client);
	let contractExecuteRx = await contractExecuteSubmit.getReceipt(client);
	console.log(`- Contract function call status: ${contractExecuteRx.status} \n`);

	// Query the contract to check changes in state variable
	let contractQueryTx1 = new ContractCallQuery()
		.setContractId(contractId)
		.setGas(100000)
		.setFunction("getMobileNumber", new ContractFunctionParameters().addString("Bob"));
	const contractQuerySubmit1 = await contractQueryTx1.execute(client);
	const contractQueryResult1 = contractQuerySubmit1.getUint256(0);
	console.log(`- Here's the phone number that you asked for: ${contractQueryResult1} \n`);

	console.log(`- Deleting the smart contract... \n`);

	const contractDeleteTx = new ContractDeleteTransaction()
    .setContractId(contractId)
    .setTransferAccountId(operatorId)
    .freezeWith(client);

    // Sign the transaction with the client operator private key
    const signedTx = await contractDeleteTx.sign(operatorKey);

    // Submit the transaction to the Hedera network
    const txResponse = await signedTx.execute(client);

    // Request the receipt of the transaction
    const receipt = await txResponse.getReceipt(client);

    // Log the transaction status
    console.log("The transaction status is:", receipt.status.toString()); 

	console.log(`- The smart contract has been deleted. \n`);
	console.log(`- The smart contract ID is: ${contractId} \n`);
	console.log(`- The smart contract ID in Solidity format is: ${contractAddress} \n`);
	console.log(`- About to update phone number \n`);

	// Call contract function to update the state variable
	contractExecuteTx = new ContractExecuteTransaction()
		.setContractId(contractId)
		.setGas(100000)
		.setFunction("setMobileNumber", new ContractFunctionParameters().addString("Jim").addUint256(333333));
	contractExecuteSubmit = await contractExecuteTx.execute(client);
	contractExecuteRx = await contractExecuteSubmit.getReceipt(client);
	console.log(`- Contract function call status: ${contractExecuteRx.status} \n`);

	// Query the contract to check changes in state variable
	contractQueryTx1 = new ContractCallQuery()
		.setContractId(contractId)
		.setGas(100000)
		.setFunction("getMobileNumber", new ContractFunctionParameters().addString("Bob"));
	contractQuerySubmit1 = await contractQueryTx1.execute(client);
	contractQueryResult1 = contractQuerySubmit1.getUint256(0);
	console.log(`- Here's the phone number that you asked for: ${contractQueryResult1} \n`);
}

main();
