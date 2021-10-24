<script>
    import axios from 'axios'
    import Screw from './Screw.svelte'
    import HelpMenu from './HelpMenu.svelte'
    import ConfirmTransaction from './ConfirmTransaction.svelte'
    import Error from './Error.svelte'
    import Loading from './Loading.svelte'
    import { slot, practiceSlot } from '../js/index.js';
    import { onMount } from 'svelte'
    import { host } from '../js/index'

    export let wallet;
    export let walletStatus;
    export let network;
    export let houseBalance;

    let transactionTime;
    let houseVk = __myapp.env.HOUSE_VK
    let transactionStatus;
    let stampsUsed;
    let txHash;

    onMount(async () => {
        practiceSlot()
        slot()
    });

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

    async function getBalance(wallet) {
      let balance;
      await network.API.getCurrencyBalance(wallet).then(function(result) {
        balance = result.c[0];
      })
      return balance
    }
    let spinBought = false;
    function confirmBuyIn(wallet) {
        let websocket_id = localStorage.getItem('websocket_id');
        axios({
            method: 'post',
            url: host + '/api/confirmBuyIn',
            data: {
                wallet: wallet,
                id: websocket_id
            }
        }).then((result) => {
            spinBought = true;
            return result
        });
    }

    const placeBet = async () => {
            txHash = '';
            transactionTime = '';
            const detail = JSON.stringify({
                //Which Lamden Network to send this to
                //mainnet, practiceSlotLoadednet are the only acceptable values
                contractName: "con_future_games_slots",
                methodName: 'transfer',
                networkType: 'mainnet',
                kwargs: {
                    player: wallet // contract to approve
                },
                //Could you less but won't be allowed to use more
                stampLimit: 100
            });
            document.dispatchEvent(new CustomEvent('lamdenWalletSendTx', {detail}));
            transactionTime = 0
            document.addEventListener('lamdenWalletTxStatus', (response) => {

            var startTx = performance.now();
            if (response.detail.status === 'error') {
                //Handle Errors
            }else{
                
                getBalance(wallet).then(async function(result) {
                    walletStatus = result
                })
                getBalance(houseVk).then(async function(result) {
                    houseBalance = await result;
                })
                transactionStatus = response.detail.status;
                var endTx = performance.now();
                transactionTime = endTx - startTx + transactionTime
                currentDisplay = 'live'
                if (response.detail.data.resultInfo.title == "Transaction Successful") {
                    stampsUsed = response.detail.data.txBlockResult.stamps_used
                    txHash = response.detail.data.txHash;
                    if (!spinBought) {
                        confirmBuyIn(wallet)
                    }
                    let spinRemain = document.getElementById("spin-remain")
                    if (spinRemain) {
                        spinRemain.innerHTML = "1"
                    }

                }
                //Do soemething
            } })
    }


    let currentDisplay = 'loading';
    let betPlaced;

    function setDisplay(display) {
        currentDisplay = display
    }
    var startTime;
    var seconds;
    function setAButton(display) {
        if (display == 'confirm' && typeof walletStatus == 'number') {
            setDisplay("live")
        }
        else if (display == 'not approved') {
            let approved = localStorage.getItem('approval')
            if (approved) {
                setDisplay("live")
            }
            else {
                if (startTime) {
                    let currentTime = new Date();
                    var timeDiff = currentTime - startTime; //in ms
                    // strip the ms
                    timeDiff /= 1000;

                    // get seconds 
                    seconds = Math.round(timeDiff);
                    if (seconds > 4) {
                        initiateApproval()
                        startTime = new Date();
                    }
                    else {
                        let clip = new Audio('/assests/sounds/invalid_button.mp3')
                        var un_mute = document.getElementById('un-mute');

                        if (un_mute) {
                            clip.play()
                        }
                    }
                }
                else {
                    startTime = new Date();
                    initiateApproval()
                }
            }

        }
        else if (currentDisplay == 'practice' || currentDisplay == 'live') {
            return null
        }
        else if (currentDisplay == 'info' || currentDisplay == 'loading') {
            loadPracticeSlots()
        }

    }

    let practiceSpinId = '';
    let spinId = '';
    let liveSlotLoaded;
    let practiceSlotLoaded;
    let practiceSlotSelected;
    async function loadPracticeSlots() {
        liveSlotSelected = false
        liveSlotLoaded = false
        let resetJackpot = document.getElementById("reset-jackpot")
        if (resetJackpot) {
            resetJackpot.click()
        }

        if (!practiceSlotSelected) {
            await setDisplay('practice') 
            document.getElementById('reset-practice-slot').click()
            practiceSlotLoaded = true
            practiceSlotSelected = true
        } 
        else {
            practiceSlotLoaded = true
            practiceSlotSelected = true    
        }
    }

    let liveSlotSelected;
    let spinButton = "Spin";
    async function loadLiveSlots() {

        practiceSlotSelected = false;
        practiceSlotLoaded = false;
        let approved = localStorage.getItem('approval')
        if (approved) {
            if (typeof walletStatus != 'undefined' && walletStatus != 'Wallet Locked' && walletStatus >= 42) {
                currentDisplay = 'live'
                document.getElementById("reset-jackpot").click()

                let slotSpun = document.getElementById("spin");
                if (slotSpun.innerHTML == "Reset") {
                    spinBought = false;
                    document.getElementById('reset-slot').click()
                    slotSpun.innerHTML = "Spin"
                    placeBet();

                }
                else {
                    let spinDisabled = document.getElementById("spin-disabled");
                    if (spinDisabled == null) { 
                        placeBet();

                        spinId = 'spin'
                    }
                }
                liveSlotSelected = true
                liveSlotLoaded = true;
            }
            else {
                currentDisplay = 'confirm'
            }
        }
        else {
            currentDisplay = 'not approved'
        }

        
        }

    
    function getInfo() {
        setDisplay('info')
        practiceSlotSelected = false
        practiceSlotLoaded = false;
        liveSlotSelected = false
    }

    function getTxn() {
        setDisplay('loading')
        practiceSlotSelected = false
        practiceSlotLoaded = false;
        liveSlotSelected = false
    }

    loadPracticeSlots()

    function isVisible(display, currentDisplay) {
        if (display != currentDisplay) {
            return 'display:none'
        }
        else {
            return 'visibility:visible'
        }
    }
    const capitalize = (s) => {
        if (typeof s !== 'string') return ''
        return s.charAt(0).toUpperCase() + s.slice(1)
    };
</script>



<div class="slot-machine-controller">

    <div class="console">
        <div class="console-outer-border">
            <div style="display:grid;position: relative;">
                <div  style="position: absolute; left: 0;margin-left: 1.5rem;margin-top:.4rem;font-weight:700;color:white;font-size:x-small">
                    {#if (currentDisplay == 'practice')}
                    <div>
                        <div style="background-color:#1c162f; border-radius:9999px; width:.5rem;height:.5rem;float:left;margin-top:.1rem;margin-right:.25rem"/>
                        {currentDisplay.toUpperCase()} MODE
                    </div>
                    {:else if (currentDisplay == 'live')}
                    <div>
                        <div style="background-color:red; border-radius:9999px; width:.5rem;height:.5rem;float:left;margin-top:.14rem;margin-right:.25rem"/>
                        {currentDisplay.toUpperCase()}
                    </div>
                    {/if}
                </div>
                <div  style="position: absolute; right: 0;transform: rotate(90deg);">
                    
                </div>
                <div class="console-inner-border">
                    <div class="game">
                            <div style={isVisible('practice', currentDisplay)} id="practice-slot">
                                <div style={isVisible('practice', currentDisplay)} class="slot-machine" >
                                    <div style={isVisible('practice', currentDisplay)} id="reels" >
                                        <div style={isVisible('practice', currentDisplay)} class="practice-reel"></div>
                                        <div style={isVisible('practice', currentDisplay)} class="practice-reel"></div>
                                        <div style={isVisible('practice', currentDisplay)} class="practice-reel"></div>
                                        <div style={isVisible('practice', currentDisplay)} class="practice-reel"></div>
                                        <div style={isVisible('practice', currentDisplay)} class="practice-reel"></div>
                                    </div>
                                </div>     
                            </div>
                            <span style="display:none;" id="reset-practice-slot"/>
                            <div style={isVisible('live', currentDisplay)} id="slot">
                                <div class="slot-machine">
                                    <div style={isVisible('live', currentDisplay)} id="reels">
                                    <div style={isVisible('live', currentDisplay)} class="reel"></div>
                                    <div style={isVisible('live', currentDisplay)} class="reel"></div>
                                    <div style={isVisible('live', currentDisplay)} class="reel"></div>
                                    <div style={isVisible('live', currentDisplay)} class="reel"></div>
                                    <div style={isVisible('live', currentDisplay)} class="reel"></div>
                                    </div>
                                </div>     
                            </div>
                            <span style="display:none;" id="slot-not-spun"/>
                            <span style="display:none;" id="reset-slot"/>
                            <script
                            crossorigin="anonymous"
                            src="https://polyfill.io/v3/polyfill.min.js?features=default%2CWebAnimations">
                            </script>
                        <span id="spin-not-bought" style="display:none;"/>
                        <span id="load-slot" style="display:none;"/>
                    </div>
                    <div class="menus">
                        {#if (practiceSlotLoaded)}
                            <span id="practice-slot-live" /> 
                        {/if}
                        
                        {#if (liveSlotLoaded)}
                            <span id="slot-live" />
                        {/if}
                        {#if (currentDisplay == 'info')}
                            <div class="help-menu"  style="">
                                <HelpMenu/>
                            </div>
                        {:else if (currentDisplay == 'not approved')}
                        <div class="bet-menu" >
                            <ConfirmTransaction walletStatus={'not approved'}/>
                        </div>
                        {:else if (currentDisplay == 'confirm')}
                            <div class="bet-menu" >
                            <ConfirmTransaction walletStatus={walletStatus}/>
                            </div>
                        {:else if (currentDisplay == 'error')}
                            <div class="bet-menu" >
                                <Error/>
                            </div>
                        {:else if (currentDisplay == 'loading')}
                            <div class="bet-menu" >
                                <Loading transactionStatus={transactionStatus} transactionTime={transactionTime} stampsUsed={stampsUsed} txHash={txHash}/>
                            </div>
                        {/if}
                    </div>
                        
                </div>
                <div  style="position: absolute; left: 0; bottom: 0;transform: rotate(50deg);">
                    
                </div>
                <div  style="position: absolute; right: 0; bottom: 0;transform: rotate(180deg);">
                    
                </div>
                </div>

        </div>
    </div>
    <div class="console-controller">
        <div class="buttons">
            <span class='start-btn' id="practice-spin" on:click={() => loadPracticeSlots()}>Practice</span>
            <span class='start-btn spin-button' id="spin" on:click={() => loadLiveSlots()}>{spinButton}</span>
            <span class='okay-game-button' on:click={() => setAButton(currentDisplay)}>A</span>
            <span class='info-game-button' on:click={() => getInfo()}>?</span>
            <span class='lamden-game-button' on:click={() => getTxn()}>
                <img class="tau-logo" alt="" src="assests/symbols/tau-logo.png"/>
            </span>
        </div>
        <span style="display:none;" id="un-mute"/>
        <span style="display:none;" id="failedTxn" on:click={() => setDisplay('error')}/>
    </div>
</div>



<style>

    .spin-button {
        width: 9rem;
    }

    .console-controller {
        grid-area: console-controller;
        display: grid;
        margin-top: 2rem;
        margin-left: auto;
        margin-right: auto;
        height: 5rem;
        box-shadow: 0 5px 10px rgba(0,0,0,0.65);
        border-radius: .5rem;
        width: 85%;
    }
    .buttons {
        grid-area: "buttons";
    }



    
    .help-menu {
        margin: 1rem;
        height: 18.25rem;
    }

    .bet-menu {
        margin: 1rem;
        height: 18rem;
    }

    .gameboard {
        background: -o-linear-gradient(top, rgba(0,0,0,1) 0%,rgba(0,0,0,0.25) 25%,rgba(0,0,0,0) 50%,rgba(0,0,0,0.25) 80%,rgba(0,0,0,1) 100%);
        background: -ms-linear-gradient(top, rgba(0,0,0,1) 0%,rgba(0,0,0,0.25) 25%,rgba(0,0,0,0) 50%,rgba(0,0,0,0.25) 80%,rgba(0,0,0,1) 100%);
        background: linear-gradient(to bottom, rgba(0,0,0,1) 0%,rgba(0,0,0,0.25) 25%,rgba(0,0,0,0) 50%,rgba(0,0,0,0.25) 80%,rgba(0,0,0,1) 100%);
        border-radius: .35rem;
    }

    .slot-machine-controller {
        display: grid;
        grid-template-areas: 
        'console'
        'console-controller';
        grid-template-rows: 4fr 1fr;
        
    }

    .console {
        grid-area: console;
        width: 75%;
        max-width: 700px;
        margin-left: auto;
        margin-right: auto;
        margin-top: 3rem;
    }

    .console-outer-border {
        box-shadow: 0 7px 8px rgba(0,0,0,0.85);
        background-color: #161616d2;
        border-radius: 1rem;
        display: grid;
        
    }
    .console-inner-border {
        background-color: #000000;
        width: 92%;
        margin-top: 1.5rem;
        margin-bottom: 1.5rem;
        margin-left: auto;
        margin-right: auto;
        border-radius: .35rem;
        padding-right: 17px; /* Increase/decrease this value for cross-browser compatibility */
        box-sizing: content-box;
    }
    .game {
        overflow: hidden
    }
    .menus {
        overflow: scroll;
        overflow-x: hidden;
    }
    .console-screws {

    }



    


        @font-face {
    font-family: 'Press Start 2p';
    }
    .buttons {
        grid-area: buttons;
        font-size: 20pt;
        font-family: 'Press Start 2p';
        margin-left: auto;
        margin-right: auto;
        margin-bottom: .5rem;
    }
    .info-game-button {
        text-shadow: 1px 1px pink, -1px -1px maroon;

        line-height: 1.5em;
        text-align: center;
        display: inline-block;
        width: 1.5em;
        -webkit-border-radius: .75em;
        -moz-border-radius: .75em;
        -o-border-radius: .75em;
            border-radius: .75em;
        background-color: red;
        -webkit-box-shadow:  0 .2em maroon;
        -moz-box-shadow:  0 .2em maroon;
        -o-box-shadow:  0 .2em maroon;
        box-shadow:  0 .2em maroon;
        color: red;
        margin: 5px;
        background-color: red;
        background-image: -o-linear-gradient(left top, pink 3%, red 22%, maroon 99%);
        background-image: -moz-linear-gradient(left top, pink 3%, red 22%, maroon 99%);
        background-image: -webkit-linear-gradient(left top, pink 3%, red 22%, maroon 99%);
        background-image: linear-gradient(left top, pink 3%, red 22%, maroon 99%);
        cursor: pointer;
    padding-left: 5px;
    }
    .lamden-game-button {
        text-shadow: 1px 1px rgb(204, 192, 255), -1px -1px rgb(22 11 91);

        line-height: 1.5em;
        text-align: center;
        display: inline-block;
        width: 1.5em;
        -webkit-border-radius: .75em;
        -moz-border-radius: .75em;
        -o-border-radius: .75em;
            border-radius: .75em;
        background-color: rgb(60, 2, 168);
        -webkit-box-shadow:  0 .2em rgb(22 11 91);
        -moz-box-shadow:  0 .2em rgb(22 11 91);
        -o-box-shadow:  0 .2em rgb(22 11 91);
        box-shadow:  0 .2em rgb(22 11 91);
        color: rgb(255, 255, 255);
        margin: 5px;
        background-color: rgb(60, 2, 168);
        background-image: -o-linear-gradient(left top, rgb(204, 192, 255) 3%, rgb(60, 2, 168) 22%, rgb(58, 4, 160) 99%);
        background-image: -moz-linear-gradient(left top, rgb(204, 192, 255) 3%, rgb(60, 2, 168) 22%, rgb(22 11 91) 99%);
        background-image: -webkit-linear-gradient(left top, rgb(204, 192, 255) 3%, rgb(60, 2, 168) 22%, rgb(22 11 91) 99%);
        background-image: linear-gradient(left top, rgb(204, 192, 255) 3%, rgb(60, 2, 168) 22%, rgb(22 11 91) 99%);
        cursor: pointer;
    padding-left: 5px;
    }
    .okay-game-button {
        text-shadow: 1px 1px rgb(192, 255, 197), -1px -1px rgb(58, 128, 0);

        line-height: 1.5em;
        text-align: center;
        display: inline-block;
        width: 1.5em;
        -webkit-border-radius: .75em;
        -moz-border-radius: .75em;
        -o-border-radius: .75em;
            border-radius: .75em;
        background-color: #08e050;
        -webkit-box-shadow:  0 .2em rgb(58, 128, 0);
        -moz-box-shadow:  0 .2em rgb(58, 128, 0);
        -o-box-shadow:  0 .2em rgb(58, 128, 0);
        box-shadow:  0 .2em rgb(58, 128, 0);
        color: #08e050;
        margin: 5px;
        background-color: #08e050;
        background-image: -o-linear-gradient(left top, rgb(192, 255, 197) 3%, #08e050 22%, rgb(58, 128, 0) 99%);
        background-image: -moz-linear-gradient(left top, rgb(192, 255, 197) 3%, #08e050 22%, rgb(58, 128, 0) 99%);
        background-image: -webkit-linear-gradient(left top, rgb(192, 255, 197) 3%, #08e050 22%, rgb(58, 128, 0) 99%);
        background-image: linear-gradient(left top, rgb(192, 255, 197) 3%, #08e050 22%, rgb(58, 128, 0) 99%);
        cursor: pointer;
    padding-left: 5px;
    }
    .start-btn{
        text-align: center;
        display: inline-block;
        margin:10px;
        font-weight: bold;
        padding: 10px 0 10px 10px ;
        background-color: lightgray;
        text-shadow: -1px -1px black, 1px 1px white;
        color: gray;
        -webkit-border-radius: 7px;
        -moz-border-radius: 7px;
        -o-border-radius: 7px;
        border-radius: 7px;
        box-shadow: 0 .2em gray; 
        cursor: pointer;
    }
    .info-game-button:active, .start-btn:active {
        box-shadow: none;
        position: relative;
        top: .2em;
    }
    .okay-game-button:active, .start-btn:active {
        box-shadow: none;
        position: relative;
        top: .2em;
    }
    .lamden-game-button:active, .start-btn:active {
        box-shadow: none;
        position: relative;
        top: .2em;
    }


    .tau-logo {
        width: 1.5rem;
        margin-right: .25rem;
    }
    

</style>