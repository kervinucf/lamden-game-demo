<script>

	import { onMount } from 'svelte';
  import { slot, practiceSlot } from './js/index.js';
  import { Network, Lamden} from 'lamden-js'
  import PrizeBoard  from './components/PrizeBoard.svelte'
  import WalletConnect from './components/WalletConnect.svelte'
  import Console from './components/Console.svelte'
  import WalletBalance from './components/WalletBalance.svelte'
  import Jackpot from './components/Jackpot.svelte'
  import Winners from './components/Winners.svelte'
  import Donate from './components/Donate.svelte'

  let currentNetwork;
  function setNetwork() {
      let network
      if (__myapp.env.isProd == "true") {
        network = {
          "name": 'Lamden Public Mainnet',
          "type": "mainnet",
          "url": "https://masternode-01.lamden.io:443"
        }
        return network
      }
      else {
        network = {
          "name": 'Lamden Public Testnet',
          "type": "testnet",
          "url": "https://testnet-master-1.lamden.io:443"
        }
        return network
      }
    }
  currentNetwork = setNetwork()

  let lamdenNetwork = new Network({
    name: currentNetwork.name,
    type: currentNetwork.type,
    hosts: [currentNetwork.url]
  })

  let tauBalance;
  let wallet;







  let houseVk = __myapp.env.HOUSE_VK

  async function getBalance(wallet) {
        let balance;
        await lamdenNetwork.API.getCurrencyBalance(wallet).then(function(result) {
          balance = result.c[0];
        })
        return balance
  }

  let houseBalance;
  getBalance(houseVk).then(async function(result) {
      houseBalance = await result;
    })

  async function refreshBalance() {
    await getBalance(wallet).then(async function(result) {
      tauBalance = await result;
    })
  }
  async function refreshJackpot() {
    await getBalance(houseVk).then(async function(result) {
      houseBalance = await result;
    })
  }
    
</script>



<main>
  <head>
    <link rel="preconnect" href="https://fonts.gstatic.com">
    <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
    <link rel="preconnect" href="https://fonts.gstatic.com">
    <link href="https://fonts.googleapis.com/css2?family=Fredericka+the+Great&display=swap" rel="stylesheet">
    <link rel="preconnect" href="https://fonts.gstatic.com">
  <link href="https://fonts.googleapis.com/css2?family=VT323&display=swap" rel="stylesheet">
  </head>
  
	<div class="slot-machine-gradient">

    <div class="slot-machine-left">
      <div class="slot-machine-title" style="color:white;font-size:1.75rem;margin:auto;text-shadow: 0 2px 2px #141414c7;">
        Prizes
      </div> 
      <div class="slot-machine-prizes">
        <PrizeBoard bind:houseBalance={houseBalance} />
      </div>
      <div class="slot-machine-wallet">
      <WalletConnect network={lamdenNetwork} bind:tauBalance={tauBalance} bind:wallet={wallet}/>
      </div>
    </div>

    <div class="slot-machine-center">
      <div id="player-balance" on:click={() => refreshBalance()}>
        <WalletBalance bind:tauBalance={tauBalance} />
      </div>
      <Console wallet={wallet} bind:walletStatus={tauBalance} bind:houseBalance={houseBalance} network={lamdenNetwork}/>
      <span id="practice-spin-enabled" style="display:none;"/>
      <span id="spin-enabled" style="display:none;"/>
    </div>

    <div class="slot-machine-right">
      <div id="jackpot-balance" on:click={() => refreshJackpot()} >
        <Jackpot bind:houseBalance={houseBalance} />
      </div>
      <div class="slot-machine-winners" style="visibility:hidden">
        <Winners/>
      </div>
      <div class="slot-machine-donate">
        <Donate/>
      </div>
    </div>
    <span id='test'/>
  </div>

</main>

<style>


  .slot-machine-gradient {
    display: grid;
    grid-template-areas: 'slot-machine-left slot-machine-center slot-machine-right';
    grid-template-columns: 1fr 4fr 1fr;
    background: linear-gradient(543deg, rgb(58, 18, 170) 0%, #1f0853 90%);
    height: 100vh;
  }

  .slot-machine-left {
    grid-area: slot-machine-left;
    display: grid;
    grid-template-areas: 
    'slot-machine-title'
    'slot-machine-prizes'
    'slot-machine-wallet';
    grid-template-rows: 1fr 3fr 1fr;
  }

  .slot-machine-center {
    grid-area: slot-machine-center;

  }

  .slot-machine-right {
    grid-area: slot-machine-right;
  }

  .slot-machine-title {
    grid-area: slot-machine-title;
  }
  .slot-machine-prizes {
    grid-area: slot-machine-prizes;
    margin-top: -1.5rem;
  }
  .slot-machine-wallet {
    margin-top: 5rem;
    grid-area: slot-machine-wallet;
  }







.slot-machine-title {

  color: white;
  display: flex;
  overflow: hidden;
  font-family: 'Bangers', cursive;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  position: relative;
  z-index: 2;
  letter-spacing: 10px;
  text-transform: uppercase;
  transform: rotate(-10deg);
  text-shadow: 1px 1px hsl(0, 0%, 100%),
               2px 2px hsl(0, 0%, 80%),
               3px 3px hsl(0, 0%, 75%),
               4px 4px hsl(0, 0%, 74%),
               5px 5px hsl(0, 0%, 73%),
               6px 6px hsl(0, 0%, 72%),
               7px 7px hsl(0, 0%, 71%),
               8px 8px hsl(0, 0%, 70%),
               9px 9px hsl(0, 0%, 79%),
               10px 10px hsl(0, 0%, 78%),
               10px 10px 30px rgba(255, 255, 255, 0.7),
}
main {
  overflow: hidden;
}
</style>