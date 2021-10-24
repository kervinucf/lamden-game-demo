<script>
  import axios from "axios";
  import { host } from "../js/index";

  export let houseBalance;
  if (houseBalance == "undefined") {
    houseBalance = 0;
  }

  function numberWithCommas(x) {
    if (typeof x == "string") {
      let num = parseInt(x.split(".")[0]);
      return (
        num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
        "." +
        x.split(".")[1]
      );
    }
    if (typeof x == "number") {
      return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
  }
  let score;
  let userWon;
  let userLost;
  function updateLocalStorage() {
    score = localStorage.getItem("score");
    if (score > 0) {
      userWon = true;
    } else {
      userLost = true;
    }
  }

  let tauUSD;
  let tauEUR;
  let prices;
  async function getPrices() {
    prices = await axios.get(host + __myapp.env.API_PRICE);
  }
  getPrices();
  function returnUSD(hb) {
    if (hb && prices) {
      let value = prices.data.usd * hb;
      return value.toFixed(2);
    }
  }
  function returnEUR(hb) {
    if (hb && prices) {
      let value = prices.data.eur * hb;
      return value.toFixed(2);
    }
  }

  function resetScreen() {
    userWon = null;
    userLost = null;
  }
</script>

<body>
  <pre
    style="margin-top: 1rem;">
        <output>
          <div id="tester" on:click={() => updateLocalStorage()}>
            {#if (userWon)}

            <div style="font-weight:bold;font-size:.95rem;text-align:center; padding:.5rem">
              <div>
                Congratulations!
              </div>
              <div style="font-size:.85rem; margin:-1rem">
                You've won <br><span style="color:white">{score}</span> TAU!
              </div>
            </div>
            {:else if (userLost)}

            <div style="font-weight:bold;font-size:.95rem;text-align:center; padding:.5rem">
              <div style="color:#f91212">
                Sorry!
              </div>
              <div style="font-size:.85rem; margin:-1rem">
                You've lost, <br>try again to win!
              </div>
            </div>
            
            {:else}
            <div style="margin-left: 1.15rem;">
              <div style="padding-top: 14px;">
                  Jackpot: {numberWithCommas(houseBalance)} Tau
              </div>
              <div style="margin-top: -1.5rem;">
                  USD Value: ${numberWithCommas(returnUSD(houseBalance))} 
              </div>
              <div style="margin-top: -1.5rem;">
                  Euro Value: ${numberWithCommas(returnEUR(houseBalance))} 
              </div>
          </div>
            {/if}
          </div>
            <span style="display:none;" id="reset-jackpot" on:click={() => resetScreen()}/>
        </output>
    </pre>
</body>

<style>
  @keyframes textShadow {
    0% {
      text-shadow: 0.4389924193300864px 0 1px rgba(117, 131, 245, 0.3),
        -0.4389924193300864px 0 1px rgba(255, 0, 81, 0.3), 0 0 3px;
    }
    5% {
      text-shadow: 2.7928974010788217px 0 1px rgba(117, 131, 245, 0.3),
        -2.7928974010788217px 0 1px rgba(255, 0, 81, 0.3), 0 0 3px;
    }
    /** etc */
  }
  body {
    background-color: black;
    background-image: radial-gradient(
      rgba(13, 4, 39, 0.75),
      rgb(19, 19, 19) 120%
    );
    margin: 0;
    height: 85px;
    width: 90%;
    color: rgb(238, 234, 28);
    font: 0.9rem Inconsolata, monospace;
    border-radius: 0.25rem;
  }

  ::selection {
    background: #0080ff;
    text-shadow: none;
  }
  pre {
    margin: 0;
  }
</style>
