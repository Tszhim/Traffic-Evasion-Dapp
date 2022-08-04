async function main() {
    const escrow = await ethers.getContractFactory("Escrow");
 
    // Start deployment, returning a promise that resolves to a contract object
    const deploy_promise = await escrow.deploy();
    console.log("Contract deployed to address:", deploy_promise.address);
 }
 
 main()
   .then(() => process.exit(0))
   .catch(error => {
     console.error(error);
     process.exit(1);
   });