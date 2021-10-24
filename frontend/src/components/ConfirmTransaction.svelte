<script>

    export let walletStatus;

    let approved = localStorage.getItem('approval')

</script>

<div id="bezel">
    <!-- the overlay and horizontal pattern -->
    <div id="crt" class="off" onClick="handleClick(event)"> 
        <!-- slowly moving scanline -->
        <div class="scanline"></div>
        <!-- the input and output -->
        <div class="terminal" style="color:white;font-size:2rem;text-align:center">

            {#if (typeof walletStatus == 'undefined')}
            <div>
                <span class="error">Please connect your wallet <br/> to continue</span>
            </div>
            {:else if (walletStatus == 'not approved')}
            <div>
                Please approve spending
            </div>
            <div>
                <span style="color:#78FF00">Press A to continue</span>
            </div>
            {:else if (walletStatus == 'Wallet Locked')}
            <div>
                Please connect your wallet to continue
            </div>
            {:else if (walletStatus < 42)}
            <div>
            <span class="error">Not enough funds to play! <br/> Please add more {42 - walletStatus} Tau to continue</span>
            </div>
            {:else}
            <div>
                Wallet connected. 
            </div>
            <div>
                <span style="color:#78FF00">Press A to continue</span>
            </div>
            {/if}
        </div>
    </div>
</div>

<style>
#crt:before {
    content: " ";
    display: block;
    position: absolute;

    background: linear-gradient(
        to bottom,
        rgba(83, 83, 83, 0) 50%,
        rgba(124, 124, 124, 0.25) 50%
    );
    background-size: 100% 8px;
    z-index: 2;
    pointer-events: none;
}
@keyframes textShadow {
  0% {
    text-shadow: 0.4389924193300864px 0 1px rgba(0, 30, 255, 0.2), -0.4389924193300864px 0 1px rgba(255, 0, 81, 0.178), 0 0 3px;
  }
  5% {
    text-shadow: 2.7928974010788217px 0 1px rgba(0, 30, 255, 0.2), -2.7928974010788217px 0 1px rgba(255, 0, 81, 0.158), 0 0 3px;
  }
  /** etc */
}


@import url("https://fonts.googleapis.com/css?family=VT323&display=swap");

.terminal {
    font-family: "VT323", monospace;
    text-transform: uppercase;
    animation: textShadow 2s linear infinite;
}

.error {
    color:#e41313
}
</style>