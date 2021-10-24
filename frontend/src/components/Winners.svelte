<script>

</script>


<div class="slot-machine-scoreboard" style="text-align:center;width:80%;margin-top:4rem;">


    <div style="font-size:x-large;font-weight:bold;margin:1rem">
        Top Winners
    </div>

    <div class="scoreboard">
        <div class="winners">
            <div style="border-bottom: 1px solid #adadad;font-weight: 700;margin-bottom:1rem">
                Address
            </div>
            <div>
                Address Link
            </div>
        </div>
        <div class="winnings">
            <div style="border-bottom: 1px solid #adadad;font-weight: 700;margin-bottom:1rem">
                Prize
            </div>
            <div>
                Winnings
            </div>
        </div>
    </div>


</div>


<style>
    .slot-machine-scoreboard {
        font-family: 'Fredericka the Great', cursive;
        color: rgb(255, 255, 255)
    }
    .scoreboard {
        display: grid;
        grid-template-areas: 'winners winnings';
    }
    .winners {
        grid-area: winners;
        border-right: 1px solid #adadad;
    }
    .winnings {
        grid-area: winnings;
    }
</style>