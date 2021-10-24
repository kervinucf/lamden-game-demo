<script>
  import io from 'socket.io-client';
  import { host } from '../js/index'
  export let tauBalance;
  export let network;
  export let wallet;

  function initiateApproval() {
    const detail = JSON.stringify({
      contractName: 'currency',
      methodName: 'approve',
      networkType: 'mainnet',
      kwargs: {
        amount: 999999999,  // amount of TAU to approve
        to: "con_future_games_slots",
     },
     stampLimit: 100, //Max stamps to be used. Could use less, won't use more.
    });
    document.dispatchEvent(new CustomEvent('lamdenWalletSendTx', {detail}));
    document.addEventListener('lamdenWalletTxStatus', (response) => {
    if (response.detail.status === 'error') {
      //Handle Errors///
    }
    else if (response.detail.data.status == "Transaction Cancelled") {

    }
    else {
      if (response.detail.data.resultInfo.title  && response.detail.data.resultInfo.title == "Transaction Successful") {
        localStorage.setItem('approval', 'true')
      }
    } 
  });
  }


  function initiateSocketConnection(wallet) {
        const socket = io();

        socket.on('initialize', function (data) { 

            let websocket_id = data;
            localStorage.setItem('websocket_id', websocket_id);

            let playerInfo = {
              wallet: wallet,
              id: websocket_id
            }
            socket.emit('register', playerInfo);

          })

    }
  
  async function getBalance(wallet) {
      let balance;
      await network.API.getCurrencyBalance(wallet).then(function(result) {
        balance = parseInt(result.c[0]);
        if (balance > 10000000000) {
          balance = 0
        }
        
      })
      return balance
  }

  const detail = JSON.stringify({
      appName: 'A Chance At The Moon',
      version: '1.0.0',
      logo: '/half-moon.svg', //or whatever the location of your logo
      contractName: "con_future_games_slots",
      networkType: 'mainnet', // other option is 'mainnet'
  })
  let walletConnected;
  function connectWallet() {
      if (walletConnected) {
        walletConnected = false;
        tauBalance = undefined;
      }
      else {
        document.dispatchEvent(new CustomEvent('lamdenWalletConnect', {detail}));
        document.addEventListener('lamdenWalletInfo', (response) => {
        if (response.detail.errors && response.detail.errors[0] == "User rejected connection request") {
          document.getElementById("on-off").click()
        }
        if (response.detail.approvals) {

        }
        else if (response.detail.data && response.detail.data.status == "Transaction Cancelled") {
                                        /**
                     * Do something to 
                     * **/
          document.getElementById("on-off").click()
        }

        if (response.detail.errors && response.detail.errors.length > 0){
            //Respond to Errors
            if (document.getElementById("on-off")) {
              document.getElementById("on-off").click()
            }

        if (response.detail.errors[0] == 'Wallet is Locked'){
            //Prompt user to unlock wallet
            tauBalance = 'Wallet Locked'
          }
        }
        else{
            //Get user's account address
            let playerWallet = response.detail.wallets[0];
            wallet = response.detail.wallets[0]
            initiateSocketConnection(wallet)
            getBalance(playerWallet).then(async function(result) {
              tauBalance = await result;
              walletConnected = true;
            })
            localStorage.setItem('wallet', response.detail.wallets[0])
        } 
      });
      }
    }
</script>

<div class="wallet-switch-wrapper">
    <div class="wallet-switch">
        <label class="rocker">
            {#if (walletConnected)}
              <input type="checkbox" checked on:click={() => connectWallet()}>
            {:else}
              <input type="checkbox" on:click={() => connectWallet()}>
            {/if}
            <span class="switch-left">On</span>
            <span class="switch-right">Off</span>
        </label>
    </div>
    <span id="refreshBalance" on:click={() => getBalance(wallet)}/>
</div>


<style>

  .wallet-switch-wrapper {
    position: absolute;
    bottom: 0;
    margin-bottom: .5rem;
    margin-left: .5rem;
    }

div {
  box-sizing: border-box;

}
*, *:before, *:after {
  box-sizing: inherit;

}

.wallet-switch {
    width: 120px;
    margin: auto;


}

/* Switch starts here */
.rocker {
  display: block;
  position: relative;
  /*
  SIZE OF SWITCH
  ==============
  All sizes are in em - therefore
  changing the font-size here
  will change the size of the switch.
  See .rocker-small below as example.
  */
  font-size: 1em;
  font-weight: bold;
  text-align: center;
  text-transform: uppercase;
  color: #888;
  width: 7em;
  height: 4em;
  overflow: hidden;
  border-bottom: 0.5em solid rgba(26, 4, 58, 0.822);
}

.rocker-small {
  font-size: 0.75em; /* Sizes the switch */
  margin: 1em;
}

.rocker::before {
  content: "";
  position: absolute;
  top: 0.5em;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgb(0, 0, 0);
  border: 0.5em solid rgba(52, 17, 109, 0.5);
  border-bottom: 0;
}

.rocker input {
  opacity: 0;
  width: 0;
  height: 0;
}

.switch-left,
.switch-right {
  cursor: pointer;
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 2.5em;
  width: 3em;
  transition: 0.2s;
}

.switch-left {
  height: 2.4em;
  width: 2.75em;
  left: 0.85em;
  bottom: 0.4em;
  background-color: #ddd;
  transform: rotate(15deg) skewX(15deg);
}

.switch-right {
  right: 0.5em;
  bottom: 0;
  background-color: #ec1111;
  color: #fff;
}

.switch-left::before,
.switch-right::before {
  content: "";
  position: absolute;
  width: 0.4em;
  height: 2.45em;
  bottom: -0.45em;
  background-color: #ccc;
  transform: skewY(-65deg);
}

.switch-left::before {
  left: -0.4em;
}

.switch-right::before {
  right: -0.375em;
  background-color: transparent;
  transform: skewY(65deg);
}

input:checked + .switch-left {
  background-color: #08e050;
  color: #fff;
  bottom: 0px;
  left: 0.5em;
  height: 2.5em;
  width: 3em;
  transform: rotate(0deg) skewX(0deg);
}

input:checked + .switch-left::before {
  background-color: transparent;
  width: 3.0833em;
}

/** off background*/
input:checked + .switch-left + .switch-right {
  background-color: #ddd;
  color: #888;
  bottom: 0.4em;
  right: 0.8em;
  height: 2.4em;
  width: 2.75em;
  transform: rotate(-15deg) skewX(-15deg);
}

input:checked + .switch-left + .switch-right::before {
  background-color: rgb(114, 114, 114);
}

/* Keyboard Users */
input:focus + .switch-left {
  color: #333;
}

input:checked:focus + .switch-left {
  color: #fff;
}

input:focus + .switch-left + .switch-right {
  color: #fff;
}

input:checked:focus + .switch-left + .switch-right {
  color: #333;
}

</style>