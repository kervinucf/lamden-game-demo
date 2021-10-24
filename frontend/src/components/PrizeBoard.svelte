<script>
  import Prize from "./Prize.svelte";
  import GrandPrize from "./GrandPrize.svelte";
  export let houseBalance;
  let prizes = "prize";
  function setPrizes(prize) {
    prizes = prize;
  }

  /* 
  on:click={() => setPrizes('grand')}
  */

  function generateWinnings(per, hb) {
    if (hb == "undefined") {
      hb = 0;
    }
    if (hb) {
      return parseInt(hb * per);
    }
  }
</script>

<div class="prizes-outer-bg">
  <div class="prizes-inner-bg">
    {#if prizes == "prize"}
      <Prize
        winnings={generateWinnings(0.02, houseBalance)}
        symbol={"ethereum"}
      />
      <Prize
        winnings={generateWinnings(0.03, houseBalance)}
        symbol={"cherry"}
      />
      <Prize winnings={generateWinnings(0.04, houseBalance)} symbol={"grape"} />
      <Prize winnings={generateWinnings(0.05, houseBalance)} symbol={"seven"} />
      <Prize winnings={generateWinnings(0.06, houseBalance)} symbol={"star"} />
      <Prize
        winnings={generateWinnings(0.07, houseBalance)}
        symbol={"diamond"}
      />
      <Prize winnings={generateWinnings(0.08, houseBalance)} symbol={"rswp"} />
      <Prize
        winnings={generateWinnings(0.09, houseBalance)}
        symbol={"bitcoin"}
      />
      <Prize winnings={generateWinnings(0.1, houseBalance)} symbol={"tau"} />

      <div
        class="prizes"
        style="margin-left:auto;margin-right:auto;margin-top:1rem;text-align:center;cursor:pointer"
      >
        <div style="padding:.2rem;font-weight:bold;font-size:x-small">
          <span>
            All matches -> <span style="color:rgb(238, 234, 28)"
              >{generateWinnings(0.85, houseBalance)}</span
            > Tau
          </span>
        </div>
      </div>
    {:else}
      <GrandPrize num={4} multiplier={5} />
      <GrandPrize num={4} multiplier={5} />
      <GrandPrize num={4} multiplier={5} />
      <GrandPrize num={5} multiplier={10} />
      <GrandPrize num={5} multiplier={10} />
      <GrandPrize num={5} multiplier={10} />
      <div
        class="prizes"
        style="margin-left:auto;margin-right:auto;margin-top:2rem;text-align:center;cursor:pointer"
        on:click={() => setPrizes("prize")}
      >
        <div style="padding:.2rem;font-weight:bold;font-size:x-small">
          <span>
            <img
              alt=""
              src="/assests/left-arrow.png"
              style="width:10px;float:left;margin-left:.75rem;padding-top:.1rem"
            />
            Prizes
          </span>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .prizes {
    background-image: linear-gradient(25deg, #510dee, #0077ff);
    border-radius: 0.2rem;
    width: 80%;
    height: 1.4rem;
    color: white;
    text-shadow: 0 2px 2px #141414c7;
    box-shadow: 0 5px 13px rgba(0, 0, 0, 0.492);
  }
  .prizes-outer-bg {
    max-height: 450px;
    width: 200px;
    margin-left: 0.4rem;
    border-radius: 8px;
    display: grid;
  }

  .prizes-inner-bg {
    height: 450px;
    width: 180px;
    margin-left: auto;
    margin-right: auto;
    border-radius: 6px;
    margin-top: -10px;
  }

  .slot-machine {
    box-shadow: 0px 6px 6px black;
  }
  .prizes-nail {
    background-color: #adadad;
    width: 7px;
    height: 7px;
    border-radius: 99999px;
    margin-left: auto;
    margin-right: auto;
  }
  .prizes-string {
    width: 20px;
    height: 20px;
    border: 1px solid #adadad;
    transform: rotate(45deg);
    border-bottom: none;
    border-right: none;
    margin-left: auto;
    margin-right: auto;
  }
</style>
