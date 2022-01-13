const fs = require("fs");
const chalk = require("chalk");
const bre = require("@nomiclabs/buidler");
/*
 redeploy NiftyMediator, update NiftyRegistry and reset the mediatorContractOnOtherSide on NiftyMain
 */
async function main() {
  console.log("📡 Deploy \n");

  console.log("🪐 DEPLOYING ON NETWORK: ", bre.network.name);

  if (bre.network.name.indexOf("xdai") >= 0) {
    //const Liker = await deploy("Liker")
    //const NiftyRegistry = await deploy("NiftyRegistry")
    //const NiftyInk = await deploy("NiftyInk")
    //const NiftyToken = await deploy("NiftyToken")
    //const NiftyMediator = await deploy("NiftyMediator")

    console.log("💽Loading contracts that are already deployed...");
    const Liker = await ethers.getContractAt(
      "Liker",
      "0xBD0621dcb64e1EEd503f709422b019B2fA197aF6"
    );
    const NiftyRegistry = await ethers.getContractAt(
      "NiftyRegistry",
      "0x63d6151DC9aAf6AD66DfFc42ad1eA65A6a2EFC68"
    );
    const NiftyInk = await ethers.getContractAt(
      "NiftyInk",
      "0x49dE55fbA08af88f55EB797a456fdf76B151c8b0"
    );
    const NiftyToken = await ethers.getContractAt(
      "NiftyToken",
      "0xCF964c89f509a8c0Ac36391c5460dF94B91daba5"
    );
    const NiftyMediator = await ethers.getContractAt(
      "NiftyMediator",
      "0x73cA9C4e72fF109259cf7374F038faf950949C51"
    );

    let trustedForwarder = "0x7eEae829DF28F9Ce522274D5771A6Be91d00E5ED"; //"0xb851b09efe4a5021e9a4ecddbc5d9c9ce2640ccb"

    const SimplePaymaster = await deploy("SimplePaymaster");

    console.log("deployed Paymaster", SimplePaymaster.address);

    console.log("setting relay hub");
    await SimplePaymaster.setRelayHub(
      "0x727862794bdaa3b8Bc4E3705950D4e9397E3bAfd"
    );

    function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    await sleep(2000);

    console.log("setting target addresses");
    let tx;
    tx = await SimplePaymaster.setTarget(NiftyInk.address, true);
    console.log(`NiftyInk set as target`);
    await sleep(2000);
    tx = await SimplePaymaster.setTarget(NiftyToken.address, true);
    console.log(`NiftyToken set as target`);
    await sleep(2000);
    tx = await SimplePaymaster.setTarget(Liker.address, true);
    console.log(`Liker set as target`);
    await sleep(2000);

    console.log("setting trusted forwarder");
    //tx = await SimplePaymaster.setTrustedForwarder(trustedForwarder);
    //console.log(`Paymaster setTrustedForward`)
    tx = await NiftyInk.setTrustedForwarder(trustedForwarder);
    console.log(`NiftyInk setTrustedForward`);
    await sleep(2000);
    tx = await NiftyToken.setTrustedForwarder(trustedForwarder);
    console.log(`NiftyToken setTrustedForward`);
    await sleep(2000);
    tx = await Liker.setTrustedForwarder(trustedForwarder);
    console.log(`Liker setTrustedForward`);
    await sleep(2000);
  }
}
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

async function deploy(name, _args) {
  let args = [];
  if (_args) {
    args = _args;
  }
  console.log("📄 " + name);
  const contractArtifacts = artifacts.require(name);
  //console.log("contractArtifacts",contractArtifacts)
  //console.log("args",args)

  const promise = contractArtifacts.new(...args);

  promise.on("error", e => {
    console.log("ERROR:", e);
  });

  let contract = await promise;

  console.log(
    chalk.cyan(name),
    "deployed to:",
    chalk.magenta(contract.address)
  );
  fs.writeFileSync("artifacts/" + name + ".address", contract.address);
  console.log("\n");
  return contract;
}
