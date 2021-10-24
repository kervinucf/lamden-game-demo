<script>

</script>

<div  id="faq">
    <!-- the overlay and horizontal pattern -->
    <div id="crt" class="off" onClick="handleClick(event)"> 
        <!-- slowly moving scanline -->
        <div class="scanline"></div>
        <!-- the input and output -->
        <div class="terminal" style="color:white">
            <div style="margin-top:-.25rem;">
                FAQ (<span style="color:#78FF00">Press A to exit</span>)
            </div>
            <div style="margin-top:1rem;">
                <div class="question">
                    What is A Chance At The Moon?
                </div>
                <div style="margin-top:.25rem;">
                    -> A Chance At The Moon is a slot machine game built using a combination of Svelte & Node.JS, backed by the Lamden Blockchain
                </div>
            </div>
            <div style="margin-top:1rem;">
                <div class="question">
                    What does it mean when the display says "Connect Wallet"?
                </div>
                <div style="margin-top:.25rem;">
                    -> To play A Chance At The Moon, the player must have installed the Lamden Wallet and have a balance of at least 42-44 TAU to cover the transcaction. If these requirements are satisfied please press the On switch located on the bottom left
                </div>
            </div>

            <div style="margin-top:1rem;">
                <div class="question">
                    What does it mean when the display says "Wallet Locked"?
                </div>
                <div style="margin-top:.25rem;">
                    -> The player must unlock the wallet and reload the application. Once this is done, press the on swich and get started
                </div>
            </div>

            <div style="margin-top:1rem;">
                <div class="question">
                    Where can I download the Lamden Wallet?
                </div>
                <div style="margin-top:.25rem;">
                    -> The wallet can be found on the Google Chrome Store or <a href="https://lamden.io/en/" style="color:rgb(85, 244, 255)">https://lamden.io</a>
                </div>
            </div>
            <div style="margin-top:1rem;">
                <div class="question">
                    How much does it cost to play?
                </div>
                <div style="margin-top:.25rem;">
                    -> Each spin will cost 40 TAU before fees, which may come out to be between 1-3 TAU.
                </div>
            </div>
            <div style="margin-top:1rem;">
                <div class="question">
                    How are the odds determined?
                </div>
                <div style="margin-top:.25rem;">
                    -> The odds are based on random chance, generated via the con_slot_machine smart contract on the Lamden Blockchain
                </div>
            </div>

            <div style="margin-top:1rem;">
                <div class="question">
                    Do I have to bet anything for practice mode?
                </div>
                <div style="margin-top:.25rem;">
                    -> NO! Practice mode is completely free to try. Have a spin, it's on the house ;)
                </div>
            </div>
            <div style="margin-top:1rem;">
                <div class="question">
                    Where can I get more information on Lamden?
                </div>
                <div style="margin-top:.25rem;">
                    -> This can be found by visiting the Discord server or the official Lamden Telegram. Join the ever-growing community now!
                </div>
            </div>
            <div style="margin-top:1rem;text-align:center">
                (<span style="color:#78FF00">Press A to exit....</span>)
            </div>
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
    text-shadow: 0.4389924193300864px 0 1px rgba(0, 30, 255, 0.3), -0.4389924193300864px 0 1px rgba(255, 0, 81, 0.178), 0 0 3px;
  }
  5% {
    text-shadow: 2.7928974010788217px 0 1px rgba(0, 30, 255, 0.3), -2.7928974010788217px 0 1px rgba(255, 0, 81, 0.158), 0 0 3px;
  }
  /** etc */
}


@import url("https://fonts.googleapis.com/css?family=VT323&display=swap");

.terminal {
    font-family: "VT323", monospace;
    text-transform: uppercase;
}

.question {
    color:#5951f3
}
</style>