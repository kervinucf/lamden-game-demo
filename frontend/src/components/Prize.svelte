<script>

  export let symbol;
  export let winnings;
  import { bitcoin } from '../tiles/tiles.js'


</script>

<div class="prizes" style="cursor:pointer;margin-left:auto;margin-right:auto;margin-top:1rem;; text-align:center;">
  <div style="padding:.2rem;">
    <img alt="" src={"/assests/symbols/" + symbol + ".png"} style="width:11px;margin-left:.25rem;"/>
    <img alt="" src={"/assests/symbols/" + symbol + ".png"} style="width:11px;margin-left:.25rem;"/>
    <img alt="" src={"/assests/symbols/" + symbol + ".png"} style="width:11px;margin-left:.25rem;"/>

    <div style="float:right;margin-top:auto;margin-bottom:auto;font-weight:600;margin-right:.5rem;font-size:small">
      {winnings} TAU
    </div>
  </div>
</div>


<style>

  .prizes {
    background-color: rgba(129, 165, 241, 0.507);
    color: white;
    text-shadow: 0 2px 2px #141414c7;
    border-radius: .2rem;
    max-width: 78%;
    box-shadow: 0 5px 13px rgba(0, 0, 0, 0.692);
  }
</style>