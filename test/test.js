const { ethers } = require("hardhat");
const { MerkleTree } = require('merkletreejs')
const keccak256 = require('keccak256')

const leaves = [
  "0xB2Ebc9b3a788aFB1E942eD65B59E9E49A1eE500D","0x5eC5e26D5304EF62310b5bC46A150d15E144e122","0xcc13187AfEf880894a8832b854eFE9816449BC59","0x1d69d3CDEbB5c3E2B8b73cC4D49Aa145ecb7950F","0xDc173B36003a886b3248650206A1fAE7433660A2","0xcAa3a3c852442F06806170D137248bb21ddb0E1B","0xd75135B26b1bC182266B2B22108Cc3cEF2c171D5","0x75448866cEe7A4680dC58FE846446aF71F9f8438","0xAD0e00593C796665b5B44Dc5410c906e09100a67","0x7911670881A81F8410d06053d7B3c237cE77b9B4","0xD02c0b401d1865e87bC4365B0a2621d7d8B78348","0x786c9Fb9494Cc3c82d5a47A62b4392c7004106ca","0xCe2F6F6a51F725049d7D56aB11C09A096360398a","0x03f9bc4648a98CDc61FcA7a177D809edAB2c14fc","0x27F8602E403B6EA18f8711A7858fa4a94ef3269b","0xd6AB094FE02B9D2F5bE7F400D9A06717f95daE9E","0x40F0A3fd9295e2a409F2512Fde438fe6ed8B5ec8","0xA703B1cB89F50939173a124ba76571369cF69953","0x184E2D53a04bC87A6b597703eDcD62d768DA1F27","0xa4A13B3f22BC0e90235e17AE9343B2c7e04e96c8","0x926b8edBef960305cBcAA839b1019c0a54358f2C","0x6D95392544846c0cD6CcEc0342F24534d84393e7",
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
].map(v => keccak256(v))

const tree = new MerkleTree(leaves, keccak256, { sort: true })

/*
uint256 freeSupply,
uint256 airdropSupply,
uint256 _claimPeriodEnds
*/

describe("DD", function () {
  it("Should mint tokens", async function() {
    console.log(' about to deploy ')
    const DD = await hre.ethers.getContractFactory("DD");
    const dd = await DD.deploy(10_000_000, 5_000_000, 1640433346);

    await dd.deployed();
    const contractAddress = dd.address

    const accounts = await hre.ethers.getSigners(); 
    const treasury = accounts[0].address
    console.log('treasury address: ', treasury)

    const supply = await dd.totalSupply()
    console.log('Supply: ', supply.toString())
    let ethValue = ethers.utils.formatEther(supply);
    console.log('Formatted supply: ', ethValue)
    const balance = await dd.balanceOf(treasury)
    console.log('Treasury balance:', ethers.utils.formatEther(balance))

    // test claim
    const tester = accounts[1]
    console.log('tester.address: ', tester.address)
    const root = tree.getHexRoot()
    await dd.setMerkleRoot(root)
    const leaf = keccak256(tester.address)
    const proof = tree.getHexProof(leaf)
    
    await dd.connect(tester).claimTokens(proof);

    const claimerBalance = await dd.balanceOf(tester.address)
    ethValue = ethers.utils.formatEther(claimerBalance);
    console.log('Claimer balance: ', ethValue)

    /* log contract supply after first witdrawal */
    const contractBalance = await dd.balanceOf(contractAddress)
    ethValue = ethers.utils.formatEther(contractBalance);
    console.log('Contract balance: ', contractBalance.toString())

    /* try to claim again */
    await dd.connect(tester).claimTokens(proof);
  })
});
