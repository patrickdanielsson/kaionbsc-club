const connect = document.querySelectorAll(".connect");

const mint = document.querySelectorAll(".mint");

const claim = document.querySelectorAll(".claim");



const EvmChains = window.evmChains;
const Web3Modal = window.Web3Modal.default;
const WalletConnectProvider = window.WalletConnectProvider.default;
let web3Modal;
let provider;
let balance;
let userAddress;

const contractAddress = "0xA02d33F34a377f27441d9d32C8697608B9B90847";

function init() {
  const providerOptions = {
    walletconnect: {
      package: WalletConnectProvider,
      options: {
        rpc: {
          56: "https://bsc-dataseed.binance.org/", //mainnet
        },
        network: "binance",
      },
    },
  };

  web3Modal = new Web3Modal({
    network: "mainnet",
    cacheProvider: false,
    providerOptions,
  });
}

async function onConnect() {
  try {
    provider = await web3Modal.connect();
  } catch (e) {
    console.log("Could not get a wallet connection", e);
    return;
  }
  provider.on("accountsChanged", (accounts) => {
    fetchAccountData();
  });
  provider.on("chainChanged", (chainId) => {
    fetchAccountData();
  });

  provider.on("networkChanged", (networkId) => {
    fetchAccountData();
  });
  await fetchAccountData();
  await currentSupply();
  await weiConvert();
  await displaydApes();
  await claimBalance();


}
//current supply
async function currentSupply(){
      const web3 = new Web3(provider);
      let Contract = web3.eth.Contract;
      let contract = new Contract(abi, contractAddress);
      const totalSupply = await contract.methods.totalSupply().call();
      console.log("supply",totalSupply);
    document.getElementById("totalSupply").innerHTML = totalSupply;
     document.getElementById("viewNFT2").innerHTML = '<h2 class="title-site text-center">Not loading? <a href="https://tofunft.com/user/'+selectedAccount+'/items/in-wallet">View them HERE</a></h2>';
      return totalSupply;
}

async function fetchAccountData() {

  const web3 = new Web3(provider);
  const chainId = await web3.eth.getChainId();
  console.log(chainId);
  const chainData = await EvmChains.getChain(chainId);
  console.log(chainData.name);
  if (chainId !== 56) return alert("Connect wallet to a Binance Smart Chain");
  const accounts = await web3.eth.getAccounts();
  selectedAccount = accounts[0];
  userAddress = selectedAccount;
  showAddress(selectedAccount);
  Balance(selectedAccount);
  console.log("selected-account", selectedAccount);
}

//show claimable balance
async function claimBalance(){
    const web3 = new Web3(provider);
    let Contract = web3.eth.Contract;
    let contract = new Contract(abi, contractAddress);
    let pendingTotal = 0;

    const getTokenId = await contract.methods.tokensOfOwner(userAddress).call();
    console.log(getTokenId);
    for (let x in getTokenId) {
      console.log(getTokenId)

      const getTokenIdBalance = await contract.methods.pendingForToken(getTokenId[x]).call();
      const etherPendingValueTotal = web3.utils.fromWei(getTokenIdBalance, 'ether');
      pendingTotal = Number(etherPendingValueTotal) + pendingTotal;

    }

    //const claimBal = await contract.methods.getredBalances(userAddress).call();
    const claimRBalance = pendingTotal.toFixed(6);
    document.getElementById("claimBalance").innerHTML = '<span class="cpink">'+claimRBalance+'</span><span class="cyellow"> BNB</span>';

    return claimRBalance;
}

const Balance = async (address) => {
  const web3 = new Web3(provider);
  const bal = await web3.eth.getBalance(address);
  balance = (bal / 10 ** 18).toFixed(3);
  let Address = showAddress(address);
  connect_bt.classList.add("connect_btn");
  connect_bt.innerHTML = `<span color="cpurple">${balance} BNB</span>`;
};

function showAddress(num) {
  const firstAddressPart = shortener(num, 0, 6);
  const lastAddressPart = shortener(num, 36, 42);
  return `${firstAddressPart}...${lastAddressPart}`;
}

const shortener = (_data, _start, _end) => {
  let result = "";
  for (let i = _start; i < _end; i++) result = [...result, _data[i]];

  return result.join("");
};

//convert price to readible interger to display on page.

async function weiConvert(){
    const web3 = new Web3(provider);
    let Contract = web3.eth.Contract;
    let contract = new Contract(abi, contractAddress);
    let currentPriceWei = await contract.methods.currentPrice().call();
    console.log("Current Price Wei",currentPriceWei);
    const etherValue = web3.utils.fromWei(currentPriceWei, 'ether');
    console.log("ether value",etherValue);
    document.getElementById("mintPrice").innerHTML = etherValue;
    return currentPriceWei;


}

async function etherConvert(weidigit){
  const web3 = new Web3(provider);
  let Contract = web3.eth.Contract;
  let contract = new Contract(abi, contractAddress);
  let currentPriceWei = await contract.methods.priceTier().call();
  console.log("Current Price Wei",currentPriceWei);
  const etherValue = web3.utils.fromWei(weidigit, 'ether');
  console.log("ether value",etherValue);
  document.getElementById("mintPrice").innerHTML = etherValue;
  return etherValue;


}

// Claim rewards
const Claim = async () => {
  const web3 = new Web3(provider);
  let Contract = web3.eth.Contract;
  let contract = new Contract(abi, contractAddress);
  let value = 0; //claim
  let currentClaimBalance = await claimBalance();

  if (currentClaimBalance > 0) {
    let sendTX = contract.methods.claimForTokens().send({
      from: userAddress,
    });
    if(await sendTX){
      Swal.fire({
        icon: 'success',
        title: 'Rewards Claimed',
        text: 'Come back later to get more.',
        footer: '<a href="https://t.me/doodleapes"><span class="cpink">ROYALTIES ANNOUNCEMENTS</span></a>'
      })
    }

  } else {
    window.alert("You do not have any rewards to claim.");
  }
};


// mint
const Mint = async () => {
  const web3 = new Web3(provider);
  let Contract = web3.eth.Contract;
  let contract = new Contract(abi, contractAddress);
  let amount = document.querySelector(".amount").value;
  amount = parseInt(amount);

  //get current mint price
  let mintPriceWei = await weiConvert();
  console.log(mintPriceWei);
  let value = amount * mintPriceWei;


  //gas limit set to 285,000 wei per token.
  let gasLimit = amount * 285000;

  if (amount) {
    let sendTX;
    sendTX = contract.methods.mint(amount).send({
      from: userAddress,
      value: value,
      gas: gasLimit,
    });
    if(await sendTX)
    {
      Swal.fire({
        icon: 'success',
        title: '<font size="7">'+amount + '<span class="cgreen"> D</span><span class="cpink">O</span><span class="cpurple">O</span><span class="cyellow">D</span><span class="cblue">L</span><span class="cpyellow">E </span>'+
        '<span class="cblue">A</span><span class="cgreen">P</span><span class="cpink">E</span></font>',
        text: 'have been minted!',
        footer: '<a href="#MydApes"><span class="cpink">VIEW HERE</span></a>'
      })
    }
    else{
      Swal.fire({
        icon: 'error',
        title: 'Transaction Failed',
        text: 'Check to see if the quantity you selected would change the mint price.',
        footer: '<a href="https://t.me/doodleapes">Support</a>'
      })
    }
  } else {
    Swal.fire({
      icon: 'error',
      title: 'Invalid Entry',
      text: 'Please enter a valid token quantity!',
    })
  }
};



window.addEventListener("load", () => {
  init();
  localStorage.clear()
  sessionStorage.clear()
});

connect.forEach(function(el,index){
el.addEventListener("click", function () {
  if (!balance) {
    onConnect();
  }
});
})


mint.forEach(function(el,index){
el.addEventListener("click", () => {
  if (balance) {
    Mint();
  } else {
    onConnect();
  }
});
})

claim.forEach(function(el,index){
el.addEventListener("click", () => {
  if (balance) {
    Claim();
  } else {
    onConnect();
  }
});
})
