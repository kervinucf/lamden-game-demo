<script>

    export let tauBalance;
    
    function display(balance) {
        if (typeof balance == 'undefined') {
            return 'Connect Wallet'
        }
        else if (balance == 'Wallet Locked') {
            return balance
        }
        else {
            return balance + ' TAU'
        }
    }

    let muteButton = false;
    function mute(state) {
        if (state) {
            var un_mute = document.getElementById('mute');
            un_mute.setAttribute("id", "un-mute")
            muteButton = false;
        }
        else {
            var un_mute = document.getElementById('un-mute');
            un_mute.setAttribute("id", "mute")
            muteButton = true;
        }
    }

</script>

<div class="wallet-balance">
    <div class="slot-machine-score">
        <div id="slot-display">
            <div id="slot-overlay"/>
            <div id="slot-overlay-line"/>
            <div id="slot-credits">
              {display(tauBalance)}
            </div>
            <div id="slot-zeros">
              00000000000000
            </div>  
          </div>
    </div>
    <div style="float:left;position:absolute;margin-left:8rem;margin-top:.75rem">
        <div class="mute-button" style="background-color:rgb(16 255 254);border-radius:9999px;width:1.25rem;height:1.25rem;display:grid;cursor:pointer;box-shadow: 0 0 10px 5px black;">
            <div style="margin:auto;cursor:pointer;">
                
                {#if (muteButton)}
                    <img style="cursor:pointer;" on:click={() => mute(muteButton)} src="/assests/no-sound.png" title="Mute icon" class="mute">
                {:else}
                    <img style="cursor:pointer;" on:click={() => mute(muteButton)} src="/assests/volume.png" title="Unmute/speaker icon" class="mute">
                {/if}
                
            </div>
        </div>
    </div>
</div>



<style>
    .slot-machine-score {
        margin: auto;
    }

    @font-face{
  font-family: 'Cursed Timer ULiL';
  src: url('/fonts/CursedTimerULiL.woff') format('woff');
}
    

#slot-display {
    background: #1b1b1b;
    background: -moz-linear-gradient(top, #1b1b1b 0%, #383838 8%, #3a3a3a 20%, #0a0a0a 47%, #010101 50%, #0d0d0d 54%, #444444 100%);
    background: -webkit-gradient(linear, left top, left bottom, color-stop(0%,#1b1b1b), color-stop(8%,#383838), color-stop(20%,#3a3a3a), color-stop(47%,#0a0a0a), color-stop(50%,#010101), color-stop(54%,#0d0d0d), color-stop(100%,#444444));
    background: -webkit-linear-gradient(top, #1b1b1b 0%,#383838 8%,#3a3a3a 20%,#0a0a0a 47%,#010101 50%,#0d0d0d 54%,#444444 100%);
    background: -o-linear-gradient(top, #1b1b1b 0%,#383838 8%,#3a3a3a 20%,#0a0a0a 47%,#010101 50%,#0d0d0d 54%,#444444 100%);
    background: -ms-linear-gradient(top, #1b1b1b 0%,#383838 8%,#3a3a3a 20%,#0a0a0a 47%,#010101 50%,#0d0d0d 54%,#444444 100%);
    background: linear-gradient(to bottom, #1b1b1b 0%,#383838 8%,#3a3a3a 20%,#0a0a0a 47%,#010101 50%,#0d0d0d 54%,#444444 100%);
    -moz-border-radius: 6px;
    -webkit-border-radius: 6px;
    border-radius: 6px;
    -moz-box-shadow: 0 0 16px rgba(255, 255, 255, 0.3);
    -webkit-box-shadow: 0 0 16px rgba(255, 255, 255, 0.3);
    box-shadow: 0 0 16px rgba(207, 207, 207, 0.3), 0 1px 1px rgba(158, 158, 158, 0.5), 0 -1px 1px rgba(255, 255, 255, 0.2), inset 0 -2px 15px #000;
    -moz-box-sizing: border-box;
    -webkit-box-sizing: border-box;
    box-sizing: border-box;
    border: 2px solid #2213ac;
    height: 28px;
    left: 63%;
    top: 10px;
    letter-spacing: 3px;
    line-height: 25px;
    margin-left: -85px;
    font-family: 'Cursed Timer ULiL', monospace;
    font-size: 18px;
    text-align: right;
    position: absolute;
    width: 220px;
    z-index: 2;
}

#slot-display div {
    position: absolute;
    right: 4px;
    top: 1px;
}

#slot-credits {
    color: #78FF00;
    text-shadow: 0 0 5px #ffffff8c;
    font-weight: bold;
    z-index: 2;
}

#slot-zeros {
    color: rgba(255, 255, 255, 0.3);
    z-index: 1;
}

#slot-overlay {
    background: -moz-linear-gradient(top, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0) 51%, rgba(0,0,0,0) 100%);
    background: -webkit-gradient(linear, left top, left bottom, color-stop(0%,rgba(0,0,0,0.1)), color-stop(50%,rgba(0,0,0,0.15)), color-stop(51%,rgba(0,0,0,0)), color-stop(100%,rgba(0,0,0,0)));
    background: -webkit-linear-gradient(top, rgba(0,0,0,0.1) 0%,rgba(0,0,0,0.15) 50%,rgba(0,0,0,0) 51%,rgba(0,0,0,0) 100%);
    background: -o-linear-gradient(top, rgba(0,0,0,0.1) 0%,rgba(0,0,0,0.15) 50%,rgba(0,0,0,0) 51%,rgba(0,0,0,0) 100%);
    background: -ms-linear-gradient(top, rgba(0,0,0,0.1) 0%,rgba(0,0,0,0.15) 50%,rgba(0,0,0,0) 51%,rgba(0,0,0,0) 100%);
    background: linear-gradient(to bottom, rgba(0,0,0,0.1) 0%,rgba(0,0,0,0.15) 50%,rgba(0,0,0,0) 51%,rgba(0,0,0,0) 100%);
    height: 100%;
    left: 0;
    position: absolute;
    top: 0;
    width: 100%;
    z-index: 3;
}

#slot-overlay-line {
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
    height: 46%;
    left: 0;
    position: absolute;
    top: 0;
    width: 100%;
    z-index: 3;
}


.mute {
        width: .85rem;
    }


    input#un-mute {
        display: none;
    }

    .unmute img {
        display: none;
    }

    input#un-mute:checked ~ .unmute img {
        display: initial;
    }

    input#un-mute:checked ~ .mute img {
        display: none;
    }
</style>